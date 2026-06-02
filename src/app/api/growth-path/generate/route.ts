export const dynamic = 'force-static';

/**
 * API：生成智能动态成长路径 v3.0
 * 
 * v3.0 重构：
 * 1. 支持新模式：接收 grade + currentSkills + targetJobId（用户实时输入）
 * 2. 年级感知：根据年级生成差异化路径
 * 3. AI 差距分析：调用大模型生成详细的差距分析报告
 * 4. 兼容旧模式：userProfile + targetJob 直接传递
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt';
import { GrowthPathEngine } from '@/lib/growth-path-engine';
import { UserProfile, JobBenchmark, GrowthPath, CareerStage, DegreeType } from '@/data/growth-path-models';
import { getGrowthPathStore } from '../route';

// ============================================
// 年级 → 学历/职业阶段 映射
// ============================================

function gradeToProfile(grade: string): Pick<UserProfile['basicInfo'], 'grade' | 'degree' | 'careerStage' | 'workYears'> {
  const mapping: Record<string, { degree: DegreeType; careerStage: CareerStage; workYears: number }> = {
    '大一': { degree: 'bachelor', careerStage: 'freshman_sophomore', workYears: 0 },
    '大二': { degree: 'bachelor', careerStage: 'freshman_sophomore', workYears: 0 },
    '大三': { degree: 'bachelor', careerStage: 'junior_senior', workYears: 0 },
    '大四': { degree: 'bachelor', careerStage: 'junior_senior', workYears: 0 },
    '硕士在读一年级': { degree: 'master', careerStage: 'master', workYears: 0 },
    '硕士在读二年级': { degree: 'master', careerStage: 'master', workYears: 1 },
    '博士在读': { degree: 'phd', careerStage: 'phd', workYears: 0 },
  };
  const m = mapping[grade] || { degree: 'bachelor' as DegreeType, careerStage: 'junior_senior' as CareerStage, workYears: 0 };
  return { grade, ...m };
}

// ============================================
// 解析用户技能文本 → 技能数组
// ============================================

function parseSkillsFromText(text: string): Array<{ name: string; level: number; yearsOfExperience: number }> {
  const lines = text.split(/[\n,;，；、•·\-\*]+/).map(s => s.trim()).filter(Boolean);
  return lines.map(line => {
    const cleaned = line
      .replace(/^(掌握|了解|精通|熟练|熟悉|学过|会用|正在学)\s*/i, '')
      .replace(/\s*(基础|入门|进阶|高级|中等)\s*/g, '')
      .trim();
    return {
      name: cleaned || line,
      level: 60,
      yearsOfExperience: 0,
    };
  });
}

// ============================================
// 获取岗位基准数据
// ============================================

async function fetchJobBenchmark(jobId: string, jobTitle: string): Promise<JobBenchmark> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // 先尝试按 id 精确匹配（直接读取内存数据），再按 title 模糊搜索
    const res = await fetch(`${baseUrl}/api/job-benchmarks?id=${encodeURIComponent(jobId)}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        return data.data[0];
      }
    }

    // 按 title 搜索
    const res2 = await fetch(`${baseUrl}/api/job-benchmarks?title=${encodeURIComponent(jobTitle)}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.success && data2.data && data2.data.length > 0) {
        return data2.data[0];
      }
    }
  } catch (e) {
    console.warn('[成长路径生成] 获取岗位基准失败，使用默认值:', e);
  }

  // 默认岗位基准（fallback）
  return {
    id: jobId,
    jobTitle: jobTitle,
    companyLevel: '大厂',
    department: '技术',
    requiredSkills: [
      { name: 'JavaScript', minLevel: 80, weight: 0.25, isRequired: true },
      { name: 'TypeScript', minLevel: 75, weight: 0.20, isRequired: true },
      { name: 'React', minLevel: 75, weight: 0.20, isRequired: true },
      { name: 'CSS', minLevel: 80, weight: 0.15, isRequired: true },
      { name: '性能优化', minLevel: 70, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '沟通协作', minLevel: 70, weight: 0.3 },
      { name: '学习能力', minLevel: 75, weight: 0.3 },
    ],
    dimensionRequirements: { professional: 75, communication: 65, leadership: 55, innovation: 70, resilience: 65 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: [] },
    experienceRequirement: { minYears: 1, preferredCompanies: [] },
    salaryRange: { min: 15000, max: 35000, currency: 'CNY' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };
}

// ============================================
// AI 差距分析（调用大模型）
// ============================================

async function generateAIAnalysis(
  grade: string,
  currentSkills: string,
  targetJob: JobBenchmark,
  skillGaps: Array<{ skillName: string; currentLevel: number; requiredLevel: number; gapScore: number; gapLevel: string }>
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'deepseek-chat';

  if (!apiKey) {
    return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps);
  }

  const systemPrompt = `你是一位资深的职业发展顾问和 AI 导师。请根据用户当前的年级、技能状态和目标岗位要求，生成一份详细的个人化分析报告。

分析报告要求：
1. 先用1-2句话总结用户当前的定位和目标
2. 逐一分析关键技能差距（结合年级特点给出具体的学习建议）
3. 根据年级给出阶段性的时间规划建议
4. 用鼓励但务实的语气

注意：
- 分析必须具体，不要泛泛而谈
- 结合年级特点：大一大二侧重基础，大三大四侧重实战和求职，研究生侧重深度和科研
- 每个建议要可执行`;

  const userMessage = `用户年级：${grade}
用户当前技能：${currentSkills || '（未提供）'}
目标岗位：${targetJob.jobTitle}（${targetJob.companyLevel} · ${targetJob.department}）
岗位要求技能：${targetJob.requiredSkills.map(s => `${s.name}(${s.minLevel}分${s.isRequired ? ',必须' : ''})`).join('、')}
技能差距分析结果：
${skillGaps.map(g => `- ${g.skillName}：当前${g.currentLevel}分，要求${g.requiredLevel}分，差距${g.gapScore}分（${g.gapLevel}）`).join('\n')}

请生成详细的分析报告。`;

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.warn('[成长路径生成] AI API 调用失败:', response.status);
      return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps);
    }

    const data = await response.json();
    return data.choices[0].message.content || generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps);
  } catch (error) {
    console.warn('[成长路径生成] AI 分析异常:', error);
    return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps);
  }
}

// ============================================
// 规则引擎兜底（无 AI Key 时使用）
// ============================================

function generateRuleBasedAnalysis(
  grade: string,
  currentSkills: string,
  targetJob: JobBenchmark,
  skillGaps: Array<{ skillName: string; currentLevel: number; requiredLevel: number; gapScore: number; gapLevel: string }>
): string {
  const criticalGaps = skillGaps.filter(g => g.gapLevel === 'critical' || g.gapLevel === 'high');
  const masteredSkills = skillGaps.filter(g => g.gapScore <= 0);

  let analysis = `## 分析总结\n\n`;
  analysis += `你目前是一名${grade}学生，目标是成为${targetJob.companyLevel}${targetJob.jobTitle}。\n\n`;

  if (masteredSkills.length > 0) {
    analysis += `**已掌握的技能：**${masteredSkills.map(g => g.skillName).join('、')}。这是你的优势基础。\n\n`;
  }

  if (criticalGaps.length > 0) {
    analysis += `**急需补齐的关键差距：**${criticalGaps.map(g => `${g.skillName}（差距${g.gapScore}分）`).join('、')}。`;
    analysis += `这些是${targetJob.jobTitle}岗位的硬性要求，需要优先攻克。\n\n`;
  }

  // 年级差异化建议
  if (['大一', '大二'].includes(grade)) {
    analysis += `作为${grade}学生，你有充足的时间打好基础。建议先从编程语言核心概念和数据结构入手，逐步参与课设和小型项目，积累实战经验。\n`;
  } else if (['大三', '大四'].includes(grade)) {
    analysis += `作为${grade}学生，时间相对紧迫。建议制定紧凑的学习计划，同时着手准备面试（算法题、项目介绍、八股文），争取在求职季前补齐关键差距。\n`;
  } else if (grade.includes('硕士')) {
    analysis += `作为硕士在读，建议结合研究方向与目标岗位的技能要求，在科研项目中刻意练习相关技术栈，同时关注工业界的最新技术趋势。\n`;
  } else if (grade.includes('博士')) {
    analysis += `作为博士在读，建议将学术研究成果与工业应用场景结合，展现技术深度和落地能力，同时培养技术视野和团队协作经验。\n`;
  }

  analysis += `\n系统已为你生成了一份个性化的学习路径，请参考下方的时间轴逐步推进。`;

  return analysis;
}

// ============================================
// 辅助：获取 AI API Key 状态
// ============================================

function hasApiKey(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY);
}

// ============================================
// 主 API 处理函数
// ============================================

export const POST = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    const userId = user.uid;
    const body = await request.json();

    console.log(`[成长路径生成 v3] userId=${userId}`, JSON.stringify(body).slice(0, 200));

    // ========== 判断模式 ==========
    const isLegacyMode = !!(body.userProfile && body.targetJob);

    let userProfile: UserProfile;
    let targetJob: JobBenchmark;
    let targetJobId: string;

    if (isLegacyMode) {
      // ========== 兼容模式 ==========
      if (!body.targetJobId || !body.userProfile || !body.targetJob) {
        return NextResponse.json(
          { success: false, error: '兼容模式缺少参数：targetJobId, userProfile, targetJob' },
          { status: 400 }
        );
      }
      userProfile = body.userProfile;
      targetJob = body.targetJob;
      targetJobId = body.targetJobId;

    } else {
      // ========== 新模式 ==========
      const { grade, currentSkills, targetJobId: newTargetJobId, targetJobTitle } = body;
      if (!grade || !newTargetJobId || !targetJobTitle) {
        return NextResponse.json(
          { success: false, error: '请填写完整的表单信息：grade, targetJobId, targetJobTitle' },
          { status: 400 }
        );
      }
      targetJobId = newTargetJobId;

      // 1. 获取岗位基准数据
      targetJob = await fetchJobBenchmark(targetJobId, targetJobTitle);

      // 2. 根据年级+技能文本构建用户画像
      const gradeInfo = gradeToProfile(grade);
      const parsedSkills = parseSkillsFromText(currentSkills || '');

      userProfile = {
        id: `profile_${userId}`,
        userId,
        basicInfo: {
          ...gradeInfo,
          major: '未设置',
          expectedPosition: targetJobTitle,
          currentRank: '初级',
        },
        skills: parsedSkills,
        dimensionScores: {
          professional: 55,
          communication: 55,
          leadership: 45,
          innovation: 55,
          resilience: 55,
        },
        careerValues: {
          workLifeBalance: 3,
          challenge: 4,
          stability: 3,
          growth: 4,
          salary: 3,
        },
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. 执行差距分析
      const engine = new GrowthPathEngine(userProfile, targetJob);
      const matchResult = engine.calculateMatchScore();

      // 4. 生成路径
      const growthPath = engine.generateGrowthPath(matchResult);

      // 5. AI 分析
      const aiAnalysis = await generateAIAnalysis(grade, currentSkills || '', targetJob, matchResult.skillGaps);

      // 6. 附加 AI 分析到路径
      const result = { ...growthPath, aiAnalysis };

      // 7. 保存
      const store = getGrowthPathStore();
      const existIdx = store.findIndex(p => p.userId === userId && p.targetJobId === targetJobId);
      if (existIdx >= 0) {
        store[existIdx] = result;
      } else {
        store.push(result);
      }

      return NextResponse.json({
        success: true,
        message: '成长路径生成成功',
        data: result,
        debug: {
          userId,
          mode: 'new',
          grade,
          skillCount: parsedSkills.length,
          overallMatchScore: matchResult.overallScore,
          skillGapCount: matchResult.skillGaps.length,
          pathNodeCount: growthPath.pathNodes.length,
          aiAnalysisUsed: hasApiKey(),
        }
      });
    }

    // ========== 兼容模式处理（紧跟上面的 if-else） ==========
    const engine = new GrowthPathEngine(userProfile, targetJob);
    const matchResult = engine.calculateMatchScore();
    const growthPath = engine.generateGrowthPath(matchResult);

    const store = getGrowthPathStore();
    const existIdx = store.findIndex(p => p.userId === userId && p.targetJobId === targetJobId);
    if (existIdx >= 0) {
      store[existIdx] = growthPath;
    } else {
      store.push(growthPath);
    }

    return NextResponse.json({
      success: true,
      message: '成长路径生成成功',
      data: growthPath,
      debug: {
        userId,
        mode: 'legacy',
        overallMatchScore: matchResult.overallScore,
        skillGapCount: matchResult.skillGaps.length,
        pathNodeCount: growthPath.pathNodes.length,
      }
    });

  } catch (error: any) {
    console.error('生成成长路径失败:', error);
    return NextResponse.json(
      { success: false, error: '生成成长路径失败', details: error.message },
      { status: 500 }
    );
  }
});
