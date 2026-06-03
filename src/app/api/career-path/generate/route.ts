
/**
 * 动态成长路径规划 - 生成API
 * 
 * 功能：
 * 1. 接收用户画像与目标岗位
 * 2. 调用AI进行差距分析（Gap Analysis）
 * 3. 生成时间轴规划（Timeline Nodes + Task Cards）
 * 4. 返回结构化的成长路径数据
 */

import { UserProfileSnapshot, GapAnalysisResult, TimelineNode, TaskCard, TaskPriority } from '@/types/career-path';
import { JobPosition } from '@/lib/job-matching';
import { z } from 'zod';

// ============================================
// 类型定义
// ============================================

interface GenerateRequest {
  userId: string;
  targetJobId: string;
  userProfileSnapshot: UserProfileSnapshot;
  forceRegenerate?: boolean;
}

// ============================================
// 后端直接拼接 userProfileSummary / userOwnedConditions / skillGaps（100% 无幻觉）
// AI 只负责生成 timeline + summary
// ============================================

function buildProfileSummaryFromInput(profile: UserProfileSnapshot): string {
  const parts: string[] = [];
  parts.push(`基于用户提供的技能：${profile.skills.length > 0 ? profile.skills.join('、') : '未提供'}`);
  parts.push(`项目经历：${profile.projects.length > 0 ? profile.projects.map(p => p.name).join('、') : '未提供'}`);
  parts.push(`实习经历：${profile.internships.length > 0 ? profile.internships.map(i => `${i.company}(${i.position})`).join('、') : '未提供'}`);
  parts.push(`当前年级：${profile.grade}，专业：${profile.major}，期望岗位：${profile.expectedPosition}`);
  return parts.join('。') + '。';
}

function buildConditionsFromInput(profile: UserProfileSnapshot): string[] {
  const conditions: string[] = [];
  for (const skill of profile.skills) {
    conditions.push(`掌握 ${skill}`);
  }
  for (const p of profile.projects) {
    conditions.push(`有项目经历：${p.name}（${p.role}，使用${p.technologies.join('/')}）`);
  }
  for (const i of profile.internships) {
    conditions.push(`有实习经历：${i.company}（${i.position}，${i.duration}）`);
  }
  return conditions;
}

function buildSkillGapsFromInput(
  profile: UserProfileSnapshot,
  targetJob: JobPosition
): Array<{ skillName: string; currentLevel: string; targetLevel: string; importance: string; learningPath: string }> {
  const userSkillSet = new Set(profile.skills.map(s => s.toLowerCase()));
  return targetJob.requirements.skills
    .filter(skill => !userSkillSet.has(skill.toLowerCase()))
    .map(skill => ({
      skillName: skill,
      currentLevel: '未掌握',
      targetLevel: '熟练',
      importance: 'must',
      learningPath: `系统学习 ${skill}，通过项目实践巩固`,
    }));
}

function buildDimensionGapsFromInput(
  profile: UserProfileSnapshot,
  targetJob: JobPosition
): Array<{ dimension: string; currentScore: number; targetScore: number; gap: number; suggestions: string[] }> {
  const dims = [
    { key: 'professional', label: 'professional', target: 85 },
    { key: 'communication', label: 'communication', target: targetJob.softRequirements?.communication || 70 },
    { key: 'leadership', label: 'leadership', target: targetJob.softRequirements?.leadership || 60 },
    { key: 'innovation', label: 'innovation', target: targetJob.softRequirements?.innovation || 70 },
    { key: 'resilience', label: 'resilience', target: targetJob.softRequirements?.resilience || 70 },
  ];
  return dims.map(d => {
    const current = (profile.dimensionScores as any)[d.key] || 50;
    const gap = Math.max(0, d.target - current);
    return {
      dimension: d.label,
      currentScore: current,
      targetScore: d.target,
      gap,
      suggestions: gap > 20 ? [`提升${d.label}能力，目标达到${d.target}分`] : [],
    };
  }).filter(d => d.gap > 10);
}

// ============================================
// AI 调用（只生成 timeline）
// ============================================

const AITimelineSchema = z.object({
  timeline: z.array(z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    semester: z.string(),
    isCurrent: z.boolean(),
    isCompleted: z.boolean(),
    tasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      relatedGap: z.string(),
      priority: z.string(),
      status: z.string(),
      estimatedTime: z.string(),
      actionLink: z.object({
        label: z.string(),
        href: z.string(),
        module: z.string(),
      }).optional(),
    })),
  })),
  summary: z.string(),
});

async function callOpenAIForTimeline(
  userProfile: UserProfileSnapshot,
  targetJob: JobPosition,
  skillGaps: Array<{ skillName: string; currentLevel: string; targetLevel: string; importance: string; learningPath: string }>,
  currentTime: string,
  currentSemester: string
): Promise<{ timeline: any[]; summary: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'deepseek-chat';

  if (!apiKey) {
    console.warn('[Career Path] 未配置 API Key，使用演示 timeline');
    return null;
  }

  const systemPrompt = `你是一个职业规划时间轴设计专家。你的唯一任务是根据用户的技能差距，设计一个可执行的时间轴规划。

规则：
1. 只输出 JSON，包含 timeline 和 summary 两个字段。
2. timeline 从当前学期开始，每个学期/暑假一个节点，每个节点 2-5 个任务。
3. 每个任务必须具体可执行，relatedGap 引用差距列表中的技能。
4. 输出严格 JSON 格式。

输出格式：
{
  "timeline": [{"id":"node_1","title":"大二下（当前）","date":"2024-03","semester":"大二下","isCurrent":true,"isCompleted":false,"tasks":[{"id":"task_1_1","title":"任务名","description":"描述","relatedGap":"差距说明","priority":"P0","status":"pending","estimatedTime":"6周"}]}],
  "summary": "一句话总结规划方向"
}`;

  const userMessage = `年级：${userProfile.grade}
目标岗位：${targetJob.title}（${targetJob.department}）
当前学期：${currentSemester}
当前时间：${currentTime}

技能差距：
${skillGaps.length > 0 ? skillGaps.map(s => `- ${s.skillName}（${s.currentLevel} → ${s.targetLevel}，${s.importance}）`).join('\n') : '- 用户未提供技能信息，生成通用基础路径'}

请设计时间轴规划，只输出 JSON。`;

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;
    if (!rawContent) return null;

    let parsed: any;
    try { parsed = JSON.parse(rawContent); } catch {
      const m = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (m) try { parsed = JSON.parse(m[1]); } catch { return null; }
    }

    if (!parsed) return null;

    const result = AITimelineSchema.safeParse(parsed);
    if (result.success) {
      return { timeline: result.data.timeline, summary: result.data.summary };
    }
    console.warn('[Career Path] AI timeline Zod 校验失败:', JSON.stringify(result.error.issues));
    return null;
  } catch (error: any) {
    console.error('[Career Path] AI timeline 生成异常:', error.message);
    return null;
  }
}

// ============================================
// Zod Schema：完整响应格式校验
// ============================================

const GapAnalysisResponseSchema = z.object({
  overallGapScore: z.number().min(0).max(100),
  userProfileSummary: z.string(),
  userOwnedConditions: z.array(z.string()).default([]),
  dimensionGaps: z.array(z.object({
    dimension: z.string(),
    currentScore: z.number(),
    targetScore: z.number(),
    gap: z.number(),
    suggestions: z.array(z.string()),
  })).default([]),
  skillGaps: z.array(z.object({
    skillName: z.string(),
    currentLevel: z.string(),
    targetLevel: z.string(),
    importance: z.string(),
    learningPath: z.string(),
  })).default([]),
  experienceGaps: z.array(z.object({
    experienceType: z.string(),
    currentCount: z.number(),
    targetCount: z.number(),
    description: z.string(),
    howToFill: z.string(),
  })).default([]),
  timeline: z.array(z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    semester: z.string(),
    isCurrent: z.boolean(),
    isCompleted: z.boolean(),
    tasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      relatedGap: z.string(),
      priority: z.string(),
      status: z.string(),
      estimatedTime: z.string(),
      actionLink: z.object({
        label: z.string(),
        href: z.string(),
        module: z.string(),
      }).optional(),
    })),
  })).default([]),
  summary: z.string(),
  isInsufficientInput: z.boolean().default(false),
  insufficientHint: z.string().optional(),
});

/**
 * 演示模式 timeline
 */
function getDemoTimeline(): Array<{ id: string; title: string; date: string; semester: string; isCurrent: boolean; isCompleted: boolean; tasks: any[] }> {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    { id: 'node_1', title: '当前学期', date: `${y}-${String(m+1).padStart(2,'0')}`, semester: '当前', isCurrent: true, isCompleted: false, tasks: [
      { id: 't1', title: '学习目标岗位核心技能', description: '系统学习岗位要求的核心技术栈', relatedGap: '技能基础薄弱', priority: 'P0', status: 'pending', estimatedTime: '8周' },
      { id: 't2', title: '完成一个实战项目', description: '将学到的技能应用到实际项目中', relatedGap: '缺乏项目经验', priority: 'P0', status: 'pending', estimatedTime: '4周' },
    ]},
    { id: 'node_2', title: '下学期', date: `${y}-${String(Math.min(m+6,12)).padStart(2,'0')}`, semester: '下学期', isCurrent: false, isCompleted: false, tasks: [
      { id: 't3', title: '参加实习/竞赛', description: '通过实习或竞赛积累实战经验', relatedGap: '缺乏实践经历', priority: 'P1', status: 'pending', estimatedTime: '3个月' },
    ]},
  ];
}

// ============================================
// POST请求处理
// ============================================

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json();
    const { userId, targetJobId, userProfileSnapshot, forceRegenerate } = body;

    if (!userId || !targetJobId || !userProfileSnapshot) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. 获取目标岗位数据
    const { JOB_POSITIONS } = await import('@/lib/job-matching');
    const targetJob = JOB_POSITIONS.find(job => job.id === targetJobId);

    if (!targetJob) {
      return Response.json({ error: 'Target job not found' }, { status: 404 });
    }

    // ========== 后端直接拼接（100% 无幻觉） ==========
    const isInsufficientInput = userProfileSnapshot.skills.length === 0 && userProfileSnapshot.projects.length === 0;
    const userProfileSummary = buildProfileSummaryFromInput(userProfileSnapshot);
    const userOwnedConditions = buildConditionsFromInput(userProfileSnapshot);
    const skillGaps = buildSkillGapsFromInput(userProfileSnapshot, targetJob);
    const dimensionGaps = buildDimensionGapsFromInput(userProfileSnapshot, targetJob);
    const experienceGaps = [
      ...(userProfileSnapshot.internships.length === 0 ? [{
        experienceType: '实习经历',
        currentCount: 0,
        targetCount: 1,
        description: '目标岗位通常要求至少1段实习经历',
        howToFill: '大三/大四开始投递实习岗位，积累实战经验',
      }] : []),
      ...(userProfileSnapshot.projects.length < 2 ? [{
        experienceType: '项目经历',
        currentCount: userProfileSnapshot.projects.length,
        targetCount: 3,
        description: '目标岗位通常要求2-3个项目经历',
        howToFill: '参加学科竞赛（互联网+、挑战杯）或独立完成 Side Project',
      }] : []),
    ];

    // 计算综合差距分数
    const avgDimGap = dimensionGaps.length > 0
      ? dimensionGaps.reduce((sum, d) => sum + d.gap, 0) / dimensionGaps.length
      : 0;
    const overallGapScore = Math.min(100, Math.round(40 + skillGaps.length * 10 + avgDimGap * 0.3 + experienceGaps.length * 5));

    // ========== AI 只负责生成 timeline + summary ==========
    const currentTime = new Date().toISOString().slice(0, 7);
    const currentSemester = calculateCurrentSemester(userProfileSnapshot.grade);

    const aiResult = await callOpenAIForTimeline(userProfileSnapshot, targetJob, skillGaps, currentTime, currentSemester);

    const timeline = aiResult?.timeline || getDemoTimeline();
    const summary = aiResult?.summary || `根据分析，你需要重点补齐${skillGaps.length > 0 ? skillGaps.slice(0, 3).map(s => s.skillName).join('、') : '核心技能'}，同时积累${experienceGaps.length > 0 ? experienceGaps.map(e => e.experienceType).join('和') : '实践经验'}。`;

    // ========== 组装最终结果 ==========
    const result: GapAnalysisResult = {
      userId,
      targetJobId,
      targetJobTitle: targetJob.title,
      analyzedAt: new Date().toISOString(),
      overallGapScore,
      userProfileSummary,
      userOwnedConditions,
      dimensionGaps,
      skillGaps,
      experienceGaps,
      timeline,
      summary,
      isInsufficientInput,
      insufficientHint: isInsufficientInput ? '你目前只选择了目标岗位，建议补充技能和项目经历以获得更精准的个性化分析。' : undefined,
    };

    return Response.json({ success: true, data: result });

  } catch (error) {
    console.error('Generate career path error:', error);
    return Response.json(
      { success: false, error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * 计算当前学期（简化版）
 */
function calculateCurrentSemester(grade: string): string {
  const month = new Date().getMonth() + 1;  // 1-12
  const isSpring = month >= 3 && month <= 8;  // 3-8月为下学期
  
  if (grade === '大一') {
    return isSpring ? '大一下' : '大一上';
  } else if (grade === '大二') {
    return isSpring ? '大二下' : '大二上';
  } else if (grade === '大三') {
    return isSpring ? '大三下' : '大三上';
  } else if (grade === '大四') {
    return isSpring ? '大四下' : '大四上';
  } else {
    return '未知学期';
  }
}
