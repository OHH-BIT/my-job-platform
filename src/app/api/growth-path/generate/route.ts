
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

async function fetchJobBenchmark(jobId: string, jobTitle: string): Promise<JobBenchmark | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // 先尝试按 id 精确匹配
    const res = await fetch(`${baseUrl}/api/job-benchmarks?id=${encodeURIComponent(jobId)}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        console.log(`[成长路径生成] 按 id 匹配到岗位: ${data.data[0].jobTitle}`);
        return data.data[0];
      }
    }

    // 按 title 模糊搜索
    const res2 = await fetch(`${baseUrl}/api/job-benchmarks?title=${encodeURIComponent(jobTitle)}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.success && data2.data && data2.data.length > 0) {
        console.log(`[成长路径生成] 按 title 匹配到岗位: ${data2.data[0].jobTitle}`);
        return data2.data[0];
      }
    }

    console.warn(`[成长路径生成] 未找到岗位基准: jobId=${jobId}, jobTitle=${jobTitle}`);
    return null;
  } catch (e) {
    console.error('[成长路径生成] 获取岗位基准异常:', e);
    return null;
  }
}

// ============================================
// AI 差距分析（调用大模型）
// ============================================

// ============================================
// 核心策略：后端拼接 userProfileSummary 和 userOwnedConditions（100% 杜绝幻觉）
// AI 只负责生成 gapAnalysis 和 learningPath（规划建议类）
// ============================================

/**
 * 从用户原始输入直接拼接 userProfileSummary（不经 AI）
 */
function buildUserProfileSummary(grade: string, currentSkills: string, targetJob: JobBenchmark): string {
  const userSkills = currentSkills
    ? currentSkills.split(/[\n,;，；、•·\-\*]+/).map(s => s.trim()).filter(Boolean)
    : [];

  let summary = `基于用户提供的`;
  if (userSkills.length > 0) {
    summary += `技能：${userSkills.join('、')}`;
  } else {
    summary += `技能：未提供`;
  }
  summary += `。当前年级：${grade}，目标岗位：${targetJob.companyLevel}${targetJob.jobTitle}（${targetJob.department}）。`;
  return summary;
}

/**
 * 从差距引擎结果直接拼接 userOwnedConditions（不经 AI）
 */
function buildUserOwnedConditions(
  currentSkills: string,
  skillGaps: Array<{ skillName: string; currentLevel: number; requiredLevel: number; gapScore: number; gapLevel: string }>
): string[] {
  const userSkills = currentSkills
    ? currentSkills.split(/[\n,;，；、•·\-\*]+/).map(s => s.trim()).filter(Boolean)
    : [];

  if (userSkills.length === 0) return [];

  // 只列出用户声明了的技能（基于差距引擎：gapScore <= 0 说明达到岗位要求）
  const masteredSkills = skillGaps
    .filter(g => g.gapScore <= 0 && userSkills.some(s => s.toLowerCase().includes(g.skillName.toLowerCase())))
    .map(g => g.skillName);

  // 加上用户声明但差距引擎没有匹配到的技能（用户自报的技能直接信任）
  for (const skill of userSkills) {
    const cleanSkill = skill.replace(/^(掌握|了解|精通|熟练|熟悉|学过|会用|正在学)\s*/i, '').trim();
    if (cleanSkill && !masteredSkills.some(m => m.toLowerCase() === cleanSkill.toLowerCase())) {
      masteredSkills.push(cleanSkill);
    }
  }

  return masteredSkills.map(s => `掌握 ${s}`);
}

/**
 * 从差距引擎结果直接拼接 gapAnalysis（不经 AI，纯数值计算）
 */
function buildGapAnalysis(
  skillGaps: Array<{ skillName: string; currentLevel: number; requiredLevel: number; gapScore: number; gapLevel: string }>,
  targetJob: JobBenchmark
): string[] {
  return skillGaps
    .filter(g => g.gapScore > 0)
    .map(g => {
      const req = targetJob.requiredSkills.find(s => s.name === g.skillName);
      const tag = req?.isRequired ? '必需' : '建议';
      return `${g.skillName} 当前${g.currentLevel}分，要求${g.requiredLevel}分，差距${g.gapScore}分（${tag}）`;
    });
}

// ============================================
// AI 差距分析（AI 只生成 learningPath）
// ============================================

const AILearningPathSchema = z.object({
  learningPath: z.array(z.object({
    phase: z.number().min(1),
    title: z.string(),
    tasks: z.array(z.string()),
  })),
});

async function generateAIAnalysis(
  grade: string,
  currentSkills: string,
  targetJob: JobBenchmark,
  skillGaps: Array<{ skillName: string; currentLevel: number; requiredLevel: number; gapScore: number; gapLevel: string }>
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'deepseek-chat';

  const hasMinimalInput = !currentSkills || currentSkills.trim().length === 0;

  // ========== 后端拼接 userProfileSummary / userOwnedConditions / gapAnalysis（100% 无幻觉） ==========
  const userProfileSummary = buildUserProfileSummary(grade, currentSkills, targetJob);
  const userOwnedConditions = buildUserOwnedConditions(currentSkills, skillGaps);
  const gapAnalysis = buildGapAnalysis(skillGaps, targetJob);

  if (!apiKey) {
    // 无 API Key 时直接用规则引擎生成 learningPath
    return buildFinalOutput(userProfileSummary, userOwnedConditions, gapAnalysis, hasMinimalInput, null, grade, currentSkills, targetJob, skillGaps);
  }

  // ========== AI 只负责生成 learningPath ==========
  const systemPrompt = `你是一个职业规划学习路径设计专家。你的唯一任务是：根据用户当前的技能差距，设计一个可执行的学习路径。

## 严格规则
1. 你只需要输出一个 JSON，只包含 learningPath 字段。
2. 每个阶段的学习任务必须具体可执行，不要泛泛而谈。
3. 结合年级特点：大一大二侧重基础，大三大四侧重实战和求职，研究生侧重深度和科研。
4. 任务中的技能名称必须严格来自"需要补齐的差距"列表，不要引入新的技能。
5. 输出严格的 JSON 格式。

## 输出格式
{
  "learningPath": [
    {"phase": 1, "title": "阶段名", "tasks": ["具体任务1", "具体任务2"]}
  ]
}

${hasMinimalInput ? `注意：用户输入信息不足，请生成该岗位的通用基础学习路径。` : ''}`;

  const userMessage = `用户年级：${grade}
目标岗位：${targetJob.jobTitle}（${targetJob.companyLevel} · ${targetJob.department}）

需要补齐的差距：
${gapAnalysis.length > 0 ? gapAnalysis.map(g => `- ${g}`).join('\n') : '- 无明确差距（用户未提供技能信息）'}

请设计学习路径，只输出 JSON。`;

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
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn('[成长路径生成] AI API 调用失败:', response.status);
      return buildFinalOutput(userProfileSummary, userOwnedConditions, gapAnalysis, hasMinimalInput, null, grade, currentSkills, targetJob, skillGaps);
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;
    if (!rawContent) {
      return buildFinalOutput(userProfileSummary, userOwnedConditions, gapAnalysis, hasMinimalInput, null, grade, currentSkills, targetJob, skillGaps);
    }

    // 解析 JSON
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const codeBlockMatch = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlockMatch) {
        try { parsed = JSON.parse(codeBlockMatch[1]); } catch { parsed = null; }
      }
    }

    let aiLearningPath: AILearningPathSchema['_type'] | null = null;
    if (parsed) {
      const result = AILearningPathSchema.safeParse(parsed);
      if (result.success) {
        aiLearningPath = result.data.learningPath;
      } else {
        console.warn('[成长路径生成] AI learningPath Zod 校验失败:', JSON.stringify(result.error.issues));
      }
    }

    return buildFinalOutput(userProfileSummary, userOwnedConditions, gapAnalysis, hasMinimalInput, aiLearningPath, grade, currentSkills, targetJob, skillGaps);
  } catch (error) {
    console.warn('[成长路径生成] AI 分析异常:', error);
    return buildFinalOutput(userProfileSummary, userOwnedConditions, gapAnalysis, hasMinimalInput, null, grade, currentSkills, targetJob, skillGaps);
  }
}

/**
 * 组装最终输出（userProfileSummary/userOwnedConditions/gapAnalysis 由后端拼接，learningPath 由 AI 生成或规则兜底）
 */
function buildFinalOutput(
  userProfileSummary: string,
  userOwnedConditions: string[],
  gapAnalysis: string[],
  hasMinimalInput: boolean,
  aiLearningPath: Array<{ phase: number; title: string; tasks: string[] }> | null,
  grade: string,
  currentSkills: string,
  targetJob: JobBenchmark,
  skillGaps: Array<{ skillName: string; currentLevel: number; requiredLevel: number; gapScore: number; gapLevel: string }>
): string {
  const criticalGaps = skillGaps.filter(g => g.gapLevel === 'critical' || g.gapLevel === 'high');

  let output = `## 分析总结\n\n`;
  output += `${userProfileSummary}\n\n`;

  if (hasMinimalInput) {
    output += `> 你目前只选择了目标岗位，尚未填写任何技能标签，建议补充技能以获得更精准的分析。\n\n`;
  }

  if (userOwnedConditions.length > 0) {
    output += `## 已具备条件\n\n`;
    userOwnedConditions.forEach(c => { output += `- ${c}\n`; });
    output += '\n';
  }

  if (gapAnalysis.length > 0) {
    output += `## 需要补齐的差距\n\n`;
    gapAnalysis.forEach(g => { output += `- ${g}\n`; });
    output += '\n';
  }

  output += `## 学习路径\n\n`;

  if (aiLearningPath && aiLearningPath.length > 0) {
    aiLearningPath.forEach(p => {
      output += `### ${p.title}\n`;
      p.tasks.forEach(t => { output += `- ${t}\n`; });
      output += '\n';
    });
  } else {
    if (['大一', '大二'].includes(grade)) {
      output += `### 基础巩固\n`;
      output += `- 系统学习${criticalGaps.length > 0 ? criticalGaps.slice(0, 3).map(g => g.skillName).join('和') : '核心编程语言'}的基础知识\n`;
      output += `- 完成至少1个课堂项目或课设\n`;
      output += `### 实践提升\n`;
      output += `- 参加学科竞赛或开源项目\n`;
      output += `- 开始刷算法题\n`;
    } else if (['大三', '大四'].includes(grade)) {
      output += `### 技能冲刺\n`;
      output += `- 优先攻克${criticalGaps.length > 0 ? criticalGaps.slice(0, 2).map(g => g.skillName).join('和') : '目标岗位核心技能'}\n`;
      output += `- 准备面试八股文和算法\n`;
      output += `### 求职准备\n`;
      output += `- 优化简历，突出已有项目经历\n`;
      output += `- 投递实习或校招岗位\n`;
    } else if (grade.includes('硕士')) {
      output += `### 深度研究\n`;
      output += `- 结合研究方向练习${criticalGaps.length > 0 ? criticalGaps.slice(0, 2).map(g => g.skillName).join('和') : '工业界核心技术栈'}\n`;
      output += `- 参与实际项目提升工程能力\n`;
      output += `### 就业准备\n`;
      output += `- 关注工业界最新技术趋势\n`;
      output += `- 建立技术影响力\n`;
    } else if (grade.includes('博士')) {
      output += `### 学术与工程结合\n`;
      output += `- 将研究成果转化为工程实践能力\n`;
      output += `- 培养技术视野和团队协作经验\n`;
      output += `### 求职冲刺\n`;
      output += `- 展现技术深度和落地能力\n`;
      output += `- 投递对应方向的高级岗位\n`;
    } else {
      output += `### 基础学习\n`;
      output += `- 学习目标岗位核心技能\n`;
      output += `- 积累项目经验\n`;
    }
    output += '\n';
  }

  return output;
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

      if (!targetJob) {
        return NextResponse.json(
          { success: false, error: `未找到目标岗位「${targetJobTitle}」的能力模型数据。请尝试重新选择岗位，或选择其他方向。` },
          { status: 404 }
        );
      }

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
