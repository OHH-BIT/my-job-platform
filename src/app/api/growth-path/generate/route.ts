
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
import { z } from 'zod';

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

// ============================================
// Zod Schema：AI 返回结果格式校验
// ============================================

const AIAnalysisSchema = z.object({
  userProfileSummary: z.string().describe('基于用户实际标签的客观总结'),
  userOwnedConditions: z.array(z.string()).describe('用户已具备的条件（仅来自用户实际输入）'),
  gapAnalysis: z.array(z.string()).describe('缺失的技能/经历（基于岗位要求减去用户现有标签）'),
  learningPath: z.array(z.object({
    phase: z.number().min(1),
    title: z.string(),
    tasks: z.array(z.string()),
  })),
  isInsufficientInput: z.boolean().default(false).describe('输入信息是否过少'),
  insufficientHint: z.string().optional().describe('当输入不足时的提示语'),
});

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

  // 判断用户输入是否过少
  const hasMinimalInput = !currentSkills || currentSkills.trim().length === 0;

  if (!apiKey) {
    return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps, hasMinimalInput);
  }

  const systemPrompt = `你是一位资深的职业发展顾问和 AI 导师。你的核心原则是**严格基于事实，杜绝一切幻觉**。

## 绝对规则（必须遵守）
1. 你只能基于用户提供的标签进行分析和规划。
2. 如果用户缺少某项技能或经历，绝对不能假设用户已经具备，更不能凭空捏造虚假信息。
3. 必须严格区分"用户已具备的条件"和"建议补充的路径"。
4. 输出必须是严格的 JSON 格式，不要包含任何 Markdown 标记、代码块或闲聊文本。

## 输出要求
返回一个 JSON 对象，结构如下：
{
  "userProfileSummary": "基于用户提供的：[用户实际标签A]、[用户实际标签B]...",
  "userOwnedConditions": ["用户实际具备的条件1", "用户实际具备的条件2"],
  "gapAnalysis": ["缺失技能1（目标岗位要求，用户不具备）", "缺失经历2"],
  "learningPath": [
    {"phase": 1, "title": "基础巩固", "tasks": ["具体可执行的任务..."]}
  ],
  "isInsufficientInput": false,
  "insufficientHint": "可选，仅在输入不足时提供"
}

## 输入不足处理
如果用户只填了目标岗位但没有任何技能标签：
- 将 isInsufficientInput 设为 true
- 在 insufficientHint 中提示用户补充更多标签
- learningPath 提供该岗位的通用基础建议即可
- 不要为用户编造任何技能或经历

## 分析原则
- 结合年级特点：大一大二侧重基础，大三大四侧重实战和求职，研究生侧重深度和科研
- 每个建议要具体可执行，不要泛泛而谈`;

  const userMessage = `## 用户实际数据（这是唯一的信息来源，不可添加任何未列出的内容）

用户年级：${grade}
用户当前技能：${currentSkills || '（未提供任何技能）'}
目标岗位：${targetJob.jobTitle}（${targetJob.companyLevel} · ${targetJob.department}）
岗位要求技能：${targetJob.requiredSkills.map(s => `${s.name}(${s.minLevel}分${s.isRequired ? ',必须' : ''})`).join('、')}

## 差距分析引擎结果（基于用户实际技能 vs 岗位要求的数值对比）
${skillGaps.map(g => `- ${g.skillName}：当前${g.currentLevel}分，要求${g.requiredLevel}分，差距${g.gapScore}分（${g.gapLevel}）`).join('\n')}

请基于以上数据生成 JSON 分析结果。记住：只使用用户提供的数据，绝不编造。`;

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
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn('[成长路径生成] AI API 调用失败:', response.status);
      return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps, hasMinimalInput);
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;
    if (!rawContent) {
      return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps, hasMinimalInput);
    }

    // Zod 校验 + 兼容性 JSON 解析
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // 兼容：尝试提取 ```json ... ``` 代码块
      const codeBlockMatch = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlockMatch) {
        try { parsed = JSON.parse(codeBlockMatch[1]); } catch { parsed = null; }
      }
    }

    if (parsed) {
      const result = AIAnalysisSchema.safeParse(parsed);
      if (result.success) {
        const r = result.data;
        let output = `## 分析总结\n\n`;
        output += `${r.userProfileSummary}\n\n`;
        if (r.userOwnedConditions.length > 0) {
          output += `**已具备的条件：**${r.userOwnedConditions.map(c => `\n- ${c}`).join('')}\n\n`;
        }
        if (r.gapAnalysis.length > 0) {
          output += `**需要补齐的差距：**${r.gapAnalysis.map(g => `\n- ${g}`).join('')}\n\n`;
        }
        if (r.isInsufficientInput && r.insufficientHint) {
          output += `> ⚠️ ${r.insufficientHint}\n\n`;
        }
        output += `## 学习路径\n\n`;
        r.learningPath.forEach(p => {
          output += `### 阶段${p.phase}：${p.title}\n`;
          p.tasks.forEach(t => { output += `- ${t}\n`; });
          output += '\n';
        });
        return output;
      }
      // Zod 校验失败，回退
      console.warn('[成长路径生成] AI 返回的 JSON 格式校验失败:', result.error);
    }

    return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps, hasMinimalInput);
  } catch (error) {
    console.warn('[成长路径生成] AI 分析异常:', error);
    return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps, hasMinimalInput);
  }
}

// ============================================
// 规则引擎兜底（无 AI Key 时使用）
// ============================================

function generateRuleBasedAnalysis(
  grade: string,
  currentSkills: string,
  targetJob: JobBenchmark,
  skillGaps: Array<{ skillName: string; currentLevel: number; requiredLevel: number; gapScore: number; gapLevel: string }>,
  hasMinimalInput?: boolean
): string {
  const criticalGaps = skillGaps.filter(g => g.gapLevel === 'critical' || g.gapLevel === 'high');
  const masteredSkills = skillGaps.filter(g => g.gapScore <= 0);
  const userSkills = currentSkills ? currentSkills.split(/[\n,;，；、•·\-\*]+/).map(s => s.trim()).filter(Boolean) : [];

  let analysis = `## 分析总结\n\n`;
  analysis += `基于用户提供的：${userSkills.length > 0 ? userSkills.join('、') : '（未提供任何技能标签）'}。\n`;
  analysis += `当前年级：${grade}，目标岗位：${targetJob.companyLevel}${targetJob.jobTitle}。\n\n`;

  if (hasMinimalInput) {
    analysis += `> ⚠️ 你目前只选择了目标岗位，尚未填写任何技能标签。以下是基于该岗位的通用基础建议，建议你补充技能标签以获得更精准的个性化分析。\n\n`;
  }

  if (masteredSkills.length > 0) {
    analysis += `**已具备的条件：**${masteredSkills.map(g => g.skillName).join('、')}（达到岗位要求）。\n\n`;
  }

  if (criticalGaps.length > 0) {
    analysis += `**需要补齐的差距：**\n`;
    criticalGaps.forEach(g => { analysis += `- ${g.skillName}（差距${g.gapScore}分，${targetJob.jobTitle}岗位${g.gapScore >= 50 ? '硬性要求' : '建议掌握'}）\n`; });
    analysis += '\n';
  }

  analysis += `## 学习路径\n\n`;

  // 年级差异化建议
  if (['大一', '大二'].includes(grade)) {
    analysis += `### 阶段1：基础巩固\n`;
    analysis += `- 系统学习${criticalGaps.length > 0 ? criticalGaps.slice(0, 3).map(g => g.skillName).join('和') : '核心编程语言'}的基础知识\n`;
    analysis += `- 完成至少1个课堂项目或课设\n`;
    analysis += `### 阶段2：实践提升\n`;
    analysis += `- 参加学科竞赛或开源项目\n`;
    analysis += `- 开始刷算法题（LeetCode 简单+中等）\n`;
  } else if (['大三', '大四'].includes(grade)) {
    analysis += `### 阶段1：技能冲刺\n`;
    analysis += `- 优先攻克${criticalGaps.length > 0 ? criticalGaps.slice(0, 2).map(g => g.skillName).join('和') : '目标岗位核心技能'}\n`;
    analysis += `- 准备面试八股文和算法\n`;
    analysis += `### 阶段2：求职准备\n`;
    analysis += `- 优化简历，突出已有项目经历\n`;
    analysis += `- 投递实习/校招岗位\n`;
  } else if (grade.includes('硕士')) {
    analysis += `### 阶段1：深度研究\n`;
    analysis += `- 结合研究方向练习${criticalGaps.length > 0 ? criticalGaps.slice(0, 2).map(g => g.skillName).join('和') : '工业界核心技术栈'}\n`;
    analysis += `- 参与实际项目提升工程能力\n`;
    analysis += `### 阶段2：就业准备\n`;
    analysis += `- 关注工业界最新技术趋势\n`;
    analysis += `- 建立技术影响力（博客/开源）\n`;
  } else if (grade.includes('博士')) {
    analysis += `### 阶段1：学术与工程结合\n`;
    analysis += `- 将研究成果转化为工程实践能力\n`;
    analysis += `- 培养技术视野和团队协作经验\n`;
    analysis += `### 阶段2：求职冲刺\n`;
    analysis += `- 展现技术深度和落地能力\n`;
    analysis += `- 投递对应方向的高级岗位\n`;
  } else {
    analysis += `### 阶段1：基础学习\n`;
    analysis += `- 学习目标岗位核心技能\n`;
    analysis += `- 积累项目经验\n`;
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
