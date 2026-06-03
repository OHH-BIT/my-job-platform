
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
// 后校验：对比 AI 输出与用户原始输入，截断幻觉内容
// ============================================

/**
 * 提取用户输入中的所有标签关键词
 */
function extractUserKeywordsFromProfile(profile: UserProfileSnapshot): string[] {
  const keywords: string[] = [];
  // 技能
  keywords.push(...profile.skills.map(s => s.toLowerCase()));
  // 项目名和技术栈
  for (const p of profile.projects) {
    keywords.push(p.name.toLowerCase());
    keywords.push(...p.technologies.map(t => t.toLowerCase()));
  }
  // 实习公司名
  for (const i of profile.internships) {
    keywords.push(i.company.toLowerCase());
    keywords.push(i.position.toLowerCase());
  }
  // 专业
  keywords.push(profile.major.toLowerCase());
  return [...new Set(keywords.filter(Boolean))];
}

/**
 * 校验 userProfileSummary 是否包含用户未提供的内容
 */
function sanitizeProfileSummary(summary: string, userKeywords: string[]): { text: string; hallucinated: string[] } {
  const hallucinated: string[] = [];
  let cleaned = summary;

  const commonTechSkills = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
    'SQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'K8s', 'Git',
    'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Flutter',
    'Spring', 'Django', 'Flask', 'Express', 'Next.js', 'Nuxt', 'Webpack', 'Vite',
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
    'AWS', 'Azure', 'GCP', 'Linux', 'Nginx', 'GraphQL', 'REST', 'API',
    '机器学习', '深度学习', '自然语言处理', 'NLP', '计算机视觉', '数据分析',
    '数据挖掘', '算法', '数据结构', '设计模式', '微服务', '分布式',
    '前端', '后端', '全栈', 'iOS', 'Android', 'HTML', 'CSS', 'Sass', 'Tailwind',
    'Figma', 'Sketch', 'UI设计', 'UX设计',
    'Hadoop', 'Spark', 'Flink', 'Kafka', 'Elasticsearch',
    'Oracle', 'PostgreSQL',
    'LeetCode', '竞赛', '论文', '专利',
  ];

  for (const skill of commonTechSkills) {
    if (userKeywords.some(k => k === skill.toLowerCase())) continue;
    const possessMatch = new RegExp(`(?:具备?|掌握|精通|熟悉|了解|有|拥有|已|含|擅长|熟练)[^。！？]*${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (possessMatch.test(cleaned)) {
      hallucinated.push(skill);
      cleaned = cleaned.replace(possessMatch, (match) => {
        return match.replace(new RegExp(`[^，。、；]*${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^。]*`, 'i'), '').trim();
      }).trim();
    }
  }

  cleaned = cleaned.replace(/[,，、]{2,}/g, '、').replace(/\s{2,}/g, ' ').replace(/^[，。、\s]+/, '').replace(/[，。、\s]+$/, '');
  return { text: cleaned || summary, hallucinated };
}

/**
 * 校验 userOwnedConditions，过滤掉包含用户未提供技能的条目
 */
function sanitizeConditions(conditions: string[], userKeywords: string[]): { items: string[]; removed: string[] } {
  const removed: string[] = [];
  const items = conditions.filter(condition => {
    for (const kw of userKeywords) {
      if (condition.toLowerCase().includes(kw.toLowerCase())) return true;
    }
    const skillClaim = condition.match(/(?:掌握|精通|熟悉|了解|会|熟练|具备|拥有)\s*(.+)/);
    if (skillClaim) {
      const claimedSkill = skillClaim[1].trim();
      const isUserKeyword = userKeywords.some(k => claimedSkill.toLowerCase().includes(k.toLowerCase()));
      if (!isUserKeyword) {
        removed.push(condition);
        return false;
      }
    }
    return true;
  });
  return { items, removed };
}

// ============================================
// AI Prompt构建器（v3.0 零容忍防幻觉）
// ============================================

/**
 * 构建AI Prompt（差距分析 + 时间轴生成）
 * v3.0：零容忍防幻觉 + 输入输出强绑定 + 后校验机制
 */
function buildGapAnalysisPrompt(
  userProfile: UserProfileSnapshot,
  targetJob: JobPosition,
  currentTime: string,
  currentSemester: string
): string {
  const hasSkills = userProfile.skills.length > 0;
  const hasProjects = userProfile.projects.length > 0;
  const hasMinimalInput = !hasSkills && !hasProjects;

  // 将用户所有标签序列化为禁止超越的边界
  const userSkillList = userProfile.skills.length > 0
    ? userProfile.skills.map(s => `"${s}"`).join('、')
    : '（无）';
  const userProjectList = userProfile.projects.length > 0
    ? userProfile.projects.map(p => `"${p.name}"`).join('、')
    : '（无）';
  const userInternList = userProfile.internships.length > 0
    ? userProfile.internships.map(i => `"${i.company} - ${i.position}"`).join('、')
    : '（无）';

  return `# 🔒 身份与绝对红线

你是一个**绝对严谨的数据分析师**。你没有任何主观推断的权利。

## 🚫 零容忍防幻觉指令（违反任何一条 = 输出作废）

1. **你的输入只有且仅有下方"用户画像"中列出的数据。** 这是你唯一被允许使用的信息来源。
2. **严禁、绝对禁止、无论如何都不能在输出中添加任何用户输入中不存在的技能、经历或标签。**
3. **如果用户没填某项内容，你的输出中绝对不能出现它。** 缺失就是缺失，写"未提供"即可。
4. **禁止推断用户的隐性能力。** 即使用户填了一个项目用了"Python"，你也不能推断用户"精通 Python"。
5. **禁止美化用户画像。** 不要用"具备良好的XX能力""有一定XX经验"这类模糊表述来掩盖信息缺失。
6. **禁止在 userProfileSummary 中列出"学习能力""沟通能力""团队协作"等用户未明确声明的软技能。**

## 📐 输入输出强绑定规则

### userProfileSummary 生成规则：
- 必须逐字引用用户提供的标签，不得添加任何用户未提供的词汇。
- 格式："基于用户提供的技能：[精确引用]、项目经历：[精确引用]。当前年级：[年级]，专业：[专业]。"
- ❌ 错误（用户技能只有 Python）："具备 Python 和 Java 能力，前端基础扎实，有良好的学习能力"
- ✅ 正确（用户技能只有 Python）："基于用户提供的技能：Python。当前年级：大二，专业：计算机。"
- ❌ 错误（用户无项目）："有一定的项目经验，参与过校内竞赛"
- ✅ 正确（用户无项目）："基于用户提供的技能：Python。项目经历：未提供。"

### userOwnedConditions 生成规则：
- 只能列出用户输入中**明确存在**的技能/项目/实习
- 如果用户什么都没填，此数组必须为空 []
- 绝对禁止出现"具备良好的学习能力""有团队合作精神"等未经用户声明的软技能

### skillGaps 中的 currentLevel 规则：
- 如果用户技能列表中有该技能：currentLevel 可以写"已掌握"或"入门"
- 如果用户技能列表中没有该技能：currentLevel 必须写"未掌握"，绝对禁止写"有一定了解"

## 📋 用户画像（你唯一被允许使用的信息）

- **年级**：'${userProfile.grade}'
- **专业**：'${userProfile.major}'
- **期望岗位**：'${userProfile.expectedPosition}'
- **已掌握技能（精确列表，绝对不可添加）**：${userSkillList}
- **项目经历（精确列表，绝对不可添加）**：${userProjectList}
- **实习经历（精确列表，绝对不可添加）**：${userInternList}
- **能力维度得分**：专业${userProfile.dimensionScores.professional}、沟通${userProfile.dimensionScores.communication}、领导${userProfile.dimensionScores.leadership}、创新${userProfile.dimensionScores.innovation}、抗压${userProfile.dimensionScores.resilience}

## 📋 目标岗位

- **岗位名称**：'${targetJob.title}'
- **部门**：'${targetJob.department}'
- **技能要求**：'${targetJob.requirements.skills.join(', ')}'
- **经验要求**：'${targetJob.requirements.experience}'
- **学历要求**：'${targetJob.requirements.education}'
- **软性素质要求**：沟通${targetJob.softRequirements?.communication || 70}、抗压${targetJob.softRequirements?.resilience || 70}、领导${targetJob.softRequirements?.leadership || 60}、创新${targetJob.softRequirements?.innovation || 70}

- **当前时间**：'${currentTime}'
- **当前学期**：'${currentSemester}'

${hasMinimalInput ? `
## ⚠️ 特殊注意：用户输入严重不足
用户只选择了目标岗位，未提供任何技能或项目经历。你必须：
1. isInsufficientInput 设为 true
2. userProfileSummary 中必须明确写"用户未提供任何技能标签和项目经历"
3. userOwnedConditions 必须为空数组 []
4. 提供该岗位的通用基础建议，不要编造用户的技能或经历
` : ''}

## 输出 JSON 结构（严格遵守，不要添加任何额外字段）

{
  "overallGapScore": 65,
  "userProfileSummary": "基于用户提供的技能：[精确引用]。项目经历：[精确引用]。当前年级：[年级]，专业：[专业]。",
  "userOwnedConditions": ["仅列出用户输入中明确存在的条件"],
  "dimensionGaps": [{"dimension": "professional", "currentScore": 60, "targetScore": 85, "gap": 25, "suggestions": ["建议1"]}],
  "skillGaps": [{"skillName": "Python", "currentLevel": "未掌握", "targetLevel": "熟练", "importance": "must", "learningPath": "学习路径"}],
  "experienceGaps": [{"experienceType": "大厂实习", "currentCount": 0, "targetCount": 1, "description": "描述", "howToFill": "建议"}],
  "timeline": [
    {"id": "node_1", "title": "大二下（当前）", "date": "2024-03", "semester": "大二下", "isCurrent": true, "isCompleted": false, "tasks": [{"id": "task_1_1", "title": "任务", "description": "描述", "relatedGap": "差距说明", "priority": "P0", "status": "pending", "estimatedTime": "6周"}]}
  ],
  "summary": "分析总结",
  "isInsufficientInput": false,
  "insufficientHint": "可选"
}

**再次强调：你的输出中的每一个技能名、项目名、经历描述都必须能在上方"用户画像"中找到原文。找不到的内容就是幻觉，绝对禁止出现。**`;
}

// ============================================
// OpenAI API调用
// ============================================

/**
 * 调用AI大模型（v3.0：零容忍防幻觉 + 输入输出强绑定 + 后校验）
 */
async function callOpenAI(prompt: string): Promise<{ rawContent: string; userProfileKeywords: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'deepseek-chat';
  const apiUrl = `${baseURL}/chat/completions`;

  if (!apiKey) {
    console.warn('[Career Path] 未配置 OPENAI_API_KEY，使用演示模式');
    return { rawContent: getDemoGapAnalysisResult(), userProfileKeywords: [] };
  }

  console.log(`[Career Path] 调用AI服务 (model=${model}, baseURL=${baseURL})...`);

  const systemPrompt = `你是一个绝对严谨的数据分析师。你只能基于用户输入中明确列出的数据进行分析。
严禁在输出中添加用户输入中不存在的任何技能、经历或标签。
如果用户没填某项内容，写"未提供"即可，绝对禁止编造。
输出必须是严格的 JSON 格式，不要包含任何 Markdown 代码块标记或解释性文字。
temperature 设为 0.1，这意味着你应该完全基于事实，不做任何发散。`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Career Path] API返回错误: ${response.status} ${errorText}`);
      throw new Error(`AI API 调用失败 (${response.status}): ${errorText.slice(0, 500)}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    if (!rawContent) throw new Error('AI 返回了空内容');

    return { rawContent, userProfileKeywords: [] };
  } catch (error: any) {
    console.error('[Career Path] AI调用异常:', error.message);
    throw error;
  }
}

// ============================================
// Zod Schema：AI 差距分析结果格式校验
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
 * 演示模式：返回模拟差距分析结果
 */
function getDemoGapAnalysisResult(): string {
  // 返回预置的模拟数据（简化版）
  return JSON.stringify({
    overallGapScore: 65,
    dimensionGaps: [
      {
        dimension: 'professional',
        currentScore: 60,
        targetScore: 85,
        gap: 25,
        suggestions: ['学习Python数据分析', '参加Kaggle竞赛', '完成3个项目']
      },
      {
        dimension: 'communication',
        currentScore: 70,
        targetScore: 80,
        gap: 10,
        suggestions: ['参加社团活动', '做项目汇报练习']
      }
    ],
    skillGaps: [
      {
        skillName: 'Python',
        currentLevel: '入门',
        targetLevel: '熟练',
        importance: 'must',
        learningPath: '学习《Python编程：从入门到实践》→ 完成3个项目 → 参加Kaggle入门赛'
      },
      {
        skillName: 'SQL',
        currentLevel: '未掌握',
        targetLevel: '熟练',
        importance: 'must',
        learningPath: '学习《SQL必知必会》→ 完成LeetCode SQL 50题 → 做一个数据库项目'
      }
    ],
    experienceGaps: [
      {
        experienceType: '大厂实习',
        currentCount: 0,
        targetCount: 1,
        description: '目标岗位要求至少1段大厂实习经历',
        howToFill: '大三暑期开始投递实习，优先投递腾讯/字节/阿里的日常实习岗位'
      },
      {
        experienceType: '项目经历',
        currentCount: 1,
        targetCount: 3,
        description: '目标岗位要求有2-3个高质量项目经历',
        howToFill: '参加竞赛（互联网+、挑战杯）或自己做Side Project'
      }
    ],
    timeline: [
      {
        id: 'node_1',
        title: '大二下（当前）',
        date: '2024-03',
        semester: '大二下',
        isCurrent: true,
        isCompleted: false,
        tasks: [
          {
            id: 'task_1_1',
            title: '学习Python数据分析',
            description: '完成《Python数据分析》课程，掌握Pandas、NumPy库，完成3个实战项目',
            relatedGap: '弥补技能差距：目标岗位要求Python熟练，当前仅入门',
            priority: 'P0',
            status: 'pending',
            estimatedTime: '6周',
            actionLink: {
              label: '去学习',
              href: '/chat?q=Python数据分析教程',
              module: 'chat'
            }
          },
          {
            id: 'task_1_2',
            title: '参加互联网+大赛',
            description: '组队参加互联网+大赛，做一个完整的项目，弥补项目经历空白',
            relatedGap: '弥补经历差距：目标岗位要求2-3个项目，当前仅1个',
            priority: 'P0',
            status: 'pending',
            estimatedTime: '3个月',
            actionLink: {
              label: '了解更多',
              href: '/chat?q=互联网+大赛如何准备',
              module: 'chat'
            }
          }
        ]
      },
      {
        id: 'node_2',
        title: '大二暑假',
        date: '2024-07',
        semester: '大二暑假',
        isCurrent: false,
        isCompleted: false,
        tasks: [
          {
            id: 'task_2_1',
            title: '学习SQL并做项目',
            description: '学习SQL基础，完成LeetCode SQL 50题，做一个数据库项目',
            relatedGap: '弥补技能差距：目标岗位要求SQL熟练，当前未掌握',
            priority: 'P0',
            status: 'pending',
            estimatedTime: '4周',
            actionLink: {
              label: '去学习',
              href: '/chat?q=SQL入门教程',
              module: 'chat'
            }
          },
          {
            id: 'task_2_2',
            title: '准备简历并投递实习',
            description: '撰写简历，投递大厂日常实习岗位（腾讯/字节/阿里）',
            relatedGap: '弥补经历差距：目标岗位要求大厂实习，需提前准备',
            priority: 'P1',
            status: 'pending',
            estimatedTime: '2周',
            actionLink: {
              label: '去找实习',
              href: '/intern-jobs',
              module: 'intern-jobs'
            }
          }
        ]
      },
      {
        id: 'node_3',
        title: '大三上',
        date: '2024-09',
        semester: '大三上',
        isCurrent: false,
        isCompleted: false,
        tasks: [
          {
            id: 'task_3_1',
            title: '开始大厂日常实习',
            description: '入职大厂实习（腾讯/字节/阿里），积累实战经验',
            relatedGap: '弥补经历差距：目标岗位要求大厂实习经历',
            priority: 'P0',
            status: 'pending',
            estimatedTime: '6个月',
            actionLink: {
              label: '去找实习',
              href: '/intern-jobs',
              module: 'intern-jobs'
            }
          },
          {
            id: 'task_3_2',
            title: '刷算法题（LeetCode 300+）',
            description: '每天刷2-3道LeetCode题，准备秋招笔试',
            relatedGap: '弥补技能差距：目标岗位要求算法能力强',
            priority: 'P0',
            status: 'pending',
            estimatedTime: '持续进行',
            actionLink: {
              label: '去刷题',
              href: '/chat?q=LeetCode刷题计划',
              module: 'chat'
            }
          }
        ]
      }
    ],
    summary: '根据你的画像分析，你与目标岗位（后端开发工程师）的主要差距在于：1）Python和SQL技能不足；2）缺乏大厂实习经历；3）项目经历较少（仅1个，需2-3个）。建议从大二下开始，优先学习Python和SQL，参加互联网+大赛弥补项目空白；大二暑假学习SQL并准备简历；大三上开始大厂日常实习并刷算法题。整体时间线规划至大四秋招，预计总体差距得分可从65分提升至85分。'
  });
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

    // 2. 提取用户关键词用于后校验
    const userKeywords = extractUserKeywordsFromProfile(userProfileSnapshot);

    // 3. 构建AI Prompt
    const currentTime = new Date().toISOString().slice(0, 7);
    const currentSemester = calculateCurrentSemester(userProfileSnapshot.grade);
    const prompt = buildGapAnalysisPrompt(userProfileSnapshot, targetJob, currentTime, currentSemester);

    // 4. 调用AI生成差距分析结果
    const { rawContent: aiResponse } = await callOpenAI(prompt);

    // 5. 解析AI响应（JSON格式）
    let gapAnalysisResult: any;
    try {
      gapAnalysisResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('[Career Path] Failed to parse AI response as JSON:', parseError);
      gapAnalysisResult = JSON.parse(getDemoGapAnalysisResult());
    }

    // 6. Zod 格式校验
    const zodResult = GapAnalysisResponseSchema.safeParse(gapAnalysisResult);
    if (!zodResult.success) {
      console.warn('[Career Path] Zod 校验失败，使用兜底默认值:', JSON.stringify(zodResult.error.issues.slice(0, 3)));
      gapAnalysisResult = {
        ...gapAnalysisResult,
        overallGapScore: gapAnalysisResult.overallGapScore || 65,
        userProfileSummary: gapAnalysisResult.userProfileSummary || '基于用户提供的信息进行差距分析',
        userOwnedConditions: gapAnalysisResult.userOwnedConditions || [],
        dimensionGaps: gapAnalysisResult.dimensionGaps || [],
        skillGaps: gapAnalysisResult.skillGaps || [],
        experienceGaps: gapAnalysisResult.experienceGaps || [],
        timeline: gapAnalysisResult.timeline || [],
        summary: gapAnalysisResult.summary || '分析完成',
        isInsufficientInput: gapAnalysisResult.isInsufficientInput || false,
      };
    } else {
      gapAnalysisResult = zodResult.data;
    }

    // 7. 后校验：对比 AI 输出与用户原始输入
    const { text: sanitizedSummary, hallucinated: hallucinatedSummary } = sanitizeProfileSummary(
      gapAnalysisResult.userProfileSummary, userKeywords
    );
    const { items: sanitizedConditions, removed: removedConditions } = sanitizeConditions(
      gapAnalysisResult.userOwnedConditions, userKeywords
    );

    if (hallucinatedSummary.length > 0 || removedConditions.length > 0) {
      console.warn(`[Career Path-防幻觉] 检测到幻觉内容已截断！幻觉技能: [${hallucinatedSummary.join(', ')}], 移除条件: [${removedConditions.join(', ')}]`);
    }

    // 8. 校验 skillGaps 中的 currentLevel
    const sanitizedSkillGaps = gapAnalysisResult.skillGaps.map(sg => {
      if (userKeywords.some(k => sg.skillName.toLowerCase() === k.toLowerCase())) {
        return sg; // 用户有此技能，保留 AI 判断的 currentLevel
      }
      // 用户没有此技能，强制 currentLevel 为"未掌握"
      if (sg.currentLevel !== '未掌握') {
        console.warn(`[Career Path-防幻觉] 技能 ${sg.skillName} 用户未提供，强制 currentLevel 为"未掌握"（原值: ${sg.currentLevel}）`);
        return { ...sg, currentLevel: '未掌握' };
      }
      return sg;
    });

    // 9. 构建最终结果（使用校验后的数据）
    const result: GapAnalysisResult = {
      userId: userId,
      targetJobId: targetJobId,
      targetJobTitle: targetJob.title,
      analyzedAt: new Date().toISOString(),
      overallGapScore: gapAnalysisResult.overallGapScore,
      userProfileSummary: sanitizedSummary,
      userOwnedConditions: sanitizedConditions,
      dimensionGaps: gapAnalysisResult.dimensionGaps,
      skillGaps: sanitizedSkillGaps,
      experienceGaps: gapAnalysisResult.experienceGaps,
      timeline: gapAnalysisResult.timeline,
      summary: gapAnalysisResult.summary,
      isInsufficientInput: gapAnalysisResult.isInsufficientInput,
      insufficientHint: gapAnalysisResult.insufficientHint,
    };

    return Response.json({
      success: true,
      data: result
    });

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
