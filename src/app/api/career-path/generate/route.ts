
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
// AI Prompt构建器
// ============================================

/**
 * 构建AI Prompt（差距分析 + 时间轴生成）
 * v2.0：强化防幻觉 + 结构化 JSON + 输入不足处理
 */
function buildGapAnalysisPrompt(
  userProfile: UserProfileSnapshot,
  targetJob: JobPosition,
  currentTime: string,
  currentSemester: string
): string {
  // 判断输入是否过少
  const hasSkills = userProfile.skills.length > 0;
  const hasProjects = userProfile.projects.length > 0;
  const hasMinimalInput = !hasSkills && !hasProjects;

  return `你是一位资深的大学生职业规划顾问和AI算法专家。你的核心原则是**严格基于事实，杜绝一切幻觉**。

## 绝对规则（必须遵守）
1. 你只能基于"用户画像"中列出的数据进行差距分析和规划。
2. 如果用户缺少某项技能或经历，绝对不能假设用户已经具备，更不能凭空捏造虚假信息。
3. 必须严格区分"用户已具备的条件"和"建议补充的路径"。
4. 输出必须是严格的 JSON 格式，不要包含任何 Markdown 代码块标记或解释性文字。

## 输入数据

### 用户画像（User Profile）—— 这是你唯一的信息来源
- **年级**：'${userProfile.grade}'
- **专业**：'${userProfile.major}'
- **期望岗位**：'${userProfile.expectedPosition}'
- **已掌握技能**：'${userProfile.skills.join(', ') || '（未提供）'}'
- **项目经历**：
${userProfile.projects.length > 0 ? userProfile.projects.map(p => `  - ${p.name}（${p.role}，${p.duration}）：使用${p.technologies.join('/')}，${p.description}`).join('\n') : '  - 无项目经历'}
- **实习经历**：
${userProfile.internships.length > 0 ? userProfile.internships.map(i => `  - ${i.company}（${i.position}，${i.duration}）：${i.description}`).join('\n') : '  - 无实习经历'}
- **能力维度得分**（0-100）：
  - 专业技能：${userProfile.dimensionScores.professional}
  - 沟通协作：${userProfile.dimensionScores.communication}
  - 领导力：${userProfile.dimensionScores.leadership}
  - 创新思维：${userProfile.dimensionScores.innovation}
  - 抗压能力：${userProfile.dimensionScores.resilience}

### 目标岗位（Target Job）
- **岗位名称**：'${targetJob.title}'
- **部门**：'${targetJob.department}'
- **岗位描述**：'${targetJob.description}'
- **技能要求**：'${targetJob.requirements.skills.join(', ')}'
- **经验要求**：'${targetJob.requirements.experience}'
- **学历要求**：'${targetJob.requirements.education}'
- **软性素质要求**（0-100）：
  - 沟通能力：${targetJob.softRequirements?.communication || 70}
  - 抗压能力：${targetJob.softRequirements?.resilience || 70}
  - 领导力：${targetJob.softRequirements?.leadership || 60}
  - 创新思维：${targetJob.softRequirements?.innovation || 70}

### 当前时间信息
- **当前时间**：'${currentTime}'
- **当前学期**：'${currentSemester}'

${hasMinimalInput ? `## 特殊注意：用户输入不足
用户只选择了目标岗位，未提供任何技能或项目经历。你必须：
1. 将 isInsufficientInput 设为 true
2. 在 insufficientHint 中提醒用户补充技能标签以获得精准分析
3. 提供该岗位的通用基础建议即可，不要编造用户的技能或经历
` : ''}

---

## 你的任务

### 第一步：差距分析（Gap Analysis）

对比用户画像（A）与目标岗位（B），识别具体差距：

1. **技能差距**：目标岗位要求的技能中，用户画像里列出的有哪些？缺失哪些？
   - 只分析用户画像中明确提到的技能，不要假设用户掌握了其他技能
2. **经历差距**：目标岗位要求的经验，用户是否具备？
3. **能力差距**：目标岗位要求的软性素质，用户得分是否达标？

### 第二步：时间轴规划生成（Timeline Generation）

基于差距分析结果，结合用户当前学期，按时间顺序向后推演，生成成长地图。

**时间节点规则**：
1. 从"当前学期"开始，向后推演至"大四秋招"（或"研三秋招"）
2. 每个学期/暑假/寒假作为一个时间节点
3. 每个时间节点下挂载2-5个任务卡片

**任务卡片规则**：
- **行动标题**：简明扼要（如"参加互联网+大赛"、"学习SQL并考取证书"）
- **关联差距**：明确告诉用户为什么要做这件事
- **优先级**：P0（必须完成/红色）、P1（建议完成/橙色）、P2（可选完成/蓝色）

---

## 输出 JSON 结构（严格遵守）

{
  "overallGapScore": 65,
  "userProfileSummary": "基于用户提供的：[技能A]、[项目B]...",
  "userOwnedConditions": ["用户实际已具备的条件1", "条件2"],
  "dimensionGaps": [
    {
      "dimension": "professional",
      "currentScore": 60,
      "targetScore": 85,
      "gap": 25,
      "suggestions": ["建议1", "建议2"]
    }
  ],
  "skillGaps": [
    {
      "skillName": "Python",
      "currentLevel": "未掌握",
      "targetLevel": "熟练",
      "importance": "must",
      "learningPath": "学习路径建议"
    }
  ],
  "experienceGaps": [
    {
      "experienceType": "大厂实习",
      "currentCount": 0,
      "targetCount": 1,
      "description": "目标岗位要求的经历描述",
      "howToFill": "具体建议"
    }
  ],
  "timeline": [
    {
      "id": "node_1",
      "title": "大二下（当前）",
      "date": "2024-03",
      "semester": "大二下",
      "isCurrent": true,
      "isCompleted": false,
      "tasks": [
        {
          "id": "task_1_1",
          "title": "具体任务",
          "description": "详细描述",
          "relatedGap": "关联的差距说明",
          "priority": "P0",
          "status": "pending",
          "estimatedTime": "6周",
          "actionLink": {
            "label": "去学习",
            "href": "/chat?q=xxx",
            "module": "chat"
          }
        }
      ]
    }
  ],
  "summary": "分析总结",
  "isInsufficientInput": false,
  "insufficientHint": "可选，仅在输入不足时提供"

## 开始分析

请基于以上输入数据，输出完整的 JSON 结果。记住：只使用用户提供的数据，绝不编造。`;
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

// ============================================
// OpenAI API调用
// ============================================

/**
 * 调用AI大模型（使用统一环境变量配置）
 * v2.0：强化防幻觉 + response_format JSON + Zod 校验
 */
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'deepseek-chat';
  const apiUrl = `${baseURL}/chat/completions`;
  
  if (!apiKey) {
    console.warn('[Career Path] 未配置 OPENAI_API_KEY，使用演示模式');
    return getDemoGapAnalysisResult();
  }
  
  console.log(`[Career Path] 调用AI服务 (model=${model}, baseURL=${baseURL})...`);
  
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
          {
            role: 'system',
            content: '你是一位资深的大学生职业规划顾问。你必须输出严格的JSON格式，不要添加任何Markdown代码块标记或解释性文字。你只能基于用户提供的输入数据进行分析，绝对不能凭空捏造用户不具备的技能或经历。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
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

    // Zod 校验
    try {
      let parsed = JSON.parse(rawContent);
      const result = GapAnalysisResponseSchema.safeParse(parsed);
      if (result.success) {
        return rawContent; // 校验通过，返回原始 JSON 字符串
      }
      // 校验失败但可以尝试修复部分字段
      console.warn('[Career Path] Zod 校验部分不匹配，尝试容错解析:', JSON.stringify(result.error.issues.slice(0, 3)));
      return rawContent; // 仍然返回，让后续解析层做兜底
    } catch (parseErr) {
      // 兼容 ```json ... ``` 代码块格式
      const codeBlockMatch = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlockMatch) {
        return codeBlockMatch[1];
      }
      throw new Error('AI 返回的内容无法解析为 JSON');
    }
  } catch (error: any) {
    console.error('[Career Path] AI调用异常:', error.message);
    throw error;
  }
}

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
    
    // 1. 获取目标岗位数据（从job-matching.ts导入）
    // TODO: 在实际项目中，应该从数据库或API获取岗位数据
    const { JOB_POSITIONS } = await import('@/lib/job-matching');
    const targetJob = JOB_POSITIONS.find(job => job.id === targetJobId);
    
    if (!targetJob) {
      return Response.json({ error: 'Target job not found' }, { status: 404 });
    }
    
    // 2. 构建AI Prompt
    const currentTime = new Date().toISOString().slice(0, 7);  // "2024-03"
    const currentSemester = calculateCurrentSemester(userProfileSnapshot.grade);
    const prompt = buildGapAnalysisPrompt(userProfileSnapshot, targetJob, currentTime, currentSemester);
    
    // 3. 调用AI生成差距分析结果
    const aiResponse = await callOpenAI(prompt);
    
    // 4. 解析AI响应（JSON格式 + Zod 校验）
    let gapAnalysisResult: any;
    try {
      gapAnalysisResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // 回退到演示数据
      gapAnalysisResult = JSON.parse(getDemoGapAnalysisResult());
    }

    // 5. Zod 格式校验
    const zodResult = GapAnalysisResponseSchema.safeParse(gapAnalysisResult);
    if (!zodResult.success) {
      console.warn('[Career Path] Zod 校验失败，使用兜底默认值:', JSON.stringify(zodResult.error.issues.slice(0, 3)));
      // 保留 AI 返回的核心字段，缺失字段使用默认值
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
    
    // 6. 构建完整的GapAnalysisResult对象
    const result: GapAnalysisResult = {
      userId: userId,
      targetJobId: targetJobId,
      targetJobTitle: targetJob.title,
      analyzedAt: new Date().toISOString(),
      overallGapScore: gapAnalysisResult.overallGapScore,
      userProfileSummary: gapAnalysisResult.userProfileSummary,
      userOwnedConditions: gapAnalysisResult.userOwnedConditions,
      dimensionGaps: gapAnalysisResult.dimensionGaps,
      skillGaps: gapAnalysisResult.skillGaps,
      experienceGaps: gapAnalysisResult.experienceGaps,
      timeline: gapAnalysisResult.timeline,
      summary: gapAnalysisResult.summary,
      isInsufficientInput: gapAnalysisResult.isInsufficientInput,
      insufficientHint: gapAnalysisResult.insufficientHint,
    };
    
    // 6. 保存到数据库（TODO: 实际项目中应该保存到数据库）
    // await saveGapAnalysisResult(result);
    
    // 7. 返回结果
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
