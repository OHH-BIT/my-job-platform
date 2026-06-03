
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
// 后校验：对比 AI 输出与用户原始输入，截断幻觉内容
// ============================================

/**
 * 提取用户输入中的所有标签关键词（技能名、经历名等）
 */
function extractUserKeywords(currentSkills: string): string[] {
  if (!currentSkills || !currentSkills.trim()) return [];
  return currentSkills
    .split(/[\n,;，；、•·\-\*]+/)
    .map(s => s.trim().replace(/^(掌握|了解|精通|熟练|熟悉|学过|会用|正在学)\s*/i, '').replace(/\s*(基础|入门|进阶|高级|中等)\s*/g, '').trim())
    .filter(Boolean);
}

/**
 * 校验 AI 输出的 userProfileSummary 是否包含用户未提供的技能名
 * 如果检测到幻觉技能，强制截断并返回修正后的文本
 */
function sanitizeUserProfileSummary(summary: string, userKeywords: string[]): { text: string; hallucinated: string[] } {
  const hallucinated: string[] = [];
  let cleaned = summary;

  // 构建常见技能词库（用于检测 AI 可能编造的技能）
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
    'Jenkins', 'CI/CD', 'TDD', 'BDD', 'Agile', 'Scrum', 'DevOps', '产品经理',
    '项目管理', '沟通能力', '团队协作', '领导力', '创新', '抗压', '学习能力强',
    'Figma', 'Sketch', 'Photoshop', 'Illustrator', 'UI设计', 'UX设计',
    'Hadoop', 'Spark', 'Flink', 'Kafka', 'RabbitMQ', 'Elasticsearch',
    'Oracle', 'PostgreSQL', 'SQLite', 'DynamoDB', 'Cassandra',
  ];

  // 检测：summary 中出现的技能名如果不在 userKeywords 中，视为幻觉
  for (const skill of commonTechSkills) {
    if (userKeywords.some(k => k.toLowerCase() === skill.toLowerCase())) continue;
    const regex = new RegExp(`(?:具备?|掌握|精通|熟悉|了解|会|熟练使用?|擅长|运用)\\s*${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (regex.test(cleaned)) {
      hallucinated.push(skill);
      cleaned = cleaned.replace(regex, '');
    }
  }

  // 额外检测中英文括号包裹的技能名，如"具备 Python 和 Java 能力"
  for (const skill of commonTechSkills) {
    if (userKeywords.some(k => k.toLowerCase() === skill.toLowerCase())) continue;
    const regex2 = new RegExp(`(?:和|与|、|,|，)?\\s*${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:能力|技能|技术|开发|编程|语言)?`, 'gi');
    // 只在 "具备/掌握/拥有...能力" 的语境中才视为幻觉
    const possessMatch = new RegExp(`(?:具备?|掌握|精通|熟悉|了解|有|拥有|已|含)[^。！？]*${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (possessMatch.test(cleaned) && !hallucinated.includes(skill)) {
      hallucinated.push(skill);
      // 移除包含该技能的整句
      cleaned = cleaned.replace(possessMatch, (match) => {
        return match.replace(new RegExp(`[^，。、；]*${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^。]*`, 'i'), '').trim();
      }).trim();
    }
  }

  // 清理多余标点
  cleaned = cleaned.replace(/[,，、]{2,}/g, '、').replace(/\s{2,}/g, ' ').replace(/^[，。、\s]+/, '').replace(/[，。、\s]+$/, '');

  return { text: cleaned || summary, hallucinated };
}

/**
 * 校验 userOwnedConditions 数组，过滤掉包含用户未提供技能的条目
 */
function sanitizeUserOwnedConditions(conditions: string[], userKeywords: string[]): { items: string[]; removed: string[] } {
  const removed: string[] = [];
  const items = conditions.filter(condition => {
    // 提取条件中可能包含的技能名
    for (const kw of userKeywords) {
      if (condition.toLowerCase().includes(kw.toLowerCase())) return true; // 包含用户标签，保留
    }
    // 如果条件中声称用户具备某种具体技能但用户没填过，移除
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
// AI 差距分析（调用大模型）
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
  const userKeywords = extractUserKeywords(currentSkills);

  if (!apiKey) {
    return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps, hasMinimalInput);
  }

  // ========== 零容忍防幻觉 System Prompt ==========
  const systemPrompt = `# 🔒 身份与绝对红线

你是一个**绝对严谨的数据分析师**。你没有任何主观推断的权利。

## 🚫 零容忍防幻觉指令（违反任何一条 = 输出作废）

1. **你的输入只有且仅有用户提供的 JSON 数据。** 这是你唯一被允许使用的信息来源。
2. **严禁、绝对禁止、无论如何都不能在输出中添加任何用户输入中不存在的技能、经历或标签。**
3. **如果用户没填某项内容，你的输出中绝对不能出现它。** 缺失就是缺失，写"未提供"即可。
4. **禁止推断用户的隐性能力。** 即使用户选了"Python"，你也不能推断用户"一定懂 NumPy"或"应该会用 Flask"。
5. **禁止美化用户画像。** 不要用"具备良好的XX能力"这类模糊表述来掩盖信息缺失。

## 📐 输入输出强绑定规则

### userProfileSummary 生成规则：
- 必须逐字引用用户提供的标签，不得添加任何用户未提供的词汇。
- 格式严格限定为："基于用户提供的：[标签A]、[标签B]。当前年级：[年级]。"
- ❌ 错误示例（用户只选了 Python）："具备 Python 和 Java 能力，前端基础扎实"
- ✅ 正确示例（用户只选了 Python）："基于用户提供的：Python。当前年级：大三。"
- ❌ 错误示例（用户没有任何技能）："具备一定编程基础，学习能力较强"
- ✅ 正确示例（用户没有任何技能）："用户未提供任何技能标签。当前年级：大三。"

### userOwnedConditions 生成规则：
- 只能列出用户输入中**明确存在**的技能/标签
- 如果用户什么都没填，此数组必须为空 []
- 绝对禁止出现"具备良好的学习能力""有团队合作精神"等未经用户声明的软技能

### gapAnalysis 生成规则：
- 只能基于"岗位要求技能 - 用户已提供技能"的差集
- 不要编造用户"隐含掌握"的技能来缩小差距

## 📋 输出 JSON 结构（严格遵守）

{
  "userProfileSummary": "基于用户提供的：[精确引用用户标签]。当前年级：[年级]。",
  "userOwnedConditions": ["仅列出用户输入中明确存在的条件"],
  "gapAnalysis": ["仅列出岗位要求中用户不具备的"],
  "learningPath": [
    {"phase": 1, "title": "阶段名", "tasks": ["具体任务"]}
  ],
  "isInsufficientInput": false,
  "insufficientHint": "仅在输入不足时填写"
}

## ⚠️ 输入不足处理
如果用户未提供任何技能标签：
- isInsufficientInput 必须为 true
- userProfileSummary 必须明确写"用户未提供任何技能标签"
- userOwnedConditions 必须为空数组 []
- 不要为用户编造任何技能或经历`;

  const userMessage = `## 用户实际数据（这是你唯一的信息来源，绝对不可添加任何未列出的内容）

**用户年级**：${grade}
**用户当前技能**：${currentSkills || '（未提供任何技能）'}
**目标岗位**：${targetJob.jobTitle}（${targetJob.companyLevel} · ${targetJob.department}）
**岗位要求技能**：${targetJob.requiredSkills.map(s => `${s.name}(${s.minLevel}分${s.isRequired ? ',必须' : ''})`).join('、')}

**差距引擎数值结果（仅供你参考差距大小，不代表用户拥有这些技能）**：
${skillGaps.map(g => `- ${g.skillName}：用户当前${g.currentLevel}分，岗位要求${g.requiredLevel}分，差距${g.gapScore}分（${g.gapLevel}）`).join('\n')}

---
**再次强调：你只能使用上面"用户当前技能"中列出的内容。如果该栏为空或写着"未提供"，你绝对不能在输出中声称用户具备任何技能。**`;

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
        temperature: 0.1,
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

    if (!parsed) {
      return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps, hasMinimalInput);
    }

    // Zod 校验
    const result = AIAnalysisSchema.safeParse(parsed);
    if (!result.success) {
      console.warn('[成长路径生成] Zod 校验失败:', JSON.stringify(result.error.issues));
      return generateRuleBasedAnalysis(grade, currentSkills, targetJob, skillGaps, hasMinimalInput);
    }

    const r = result.data;

    // ========== 后校验：对比 AI 输出与用户原始输入 ==========
    const { text: sanitizedSummary, hallucinated: hallucinatedSkills } = sanitizeUserProfileSummary(r.userProfileSummary, userKeywords);
    const { items: sanitizedConditions, removed: removedConditions } = sanitizeUserOwnedConditions(r.userOwnedConditions, userKeywords);

    if (hallucinatedSkills.length > 0 || removedConditions.length > 0) {
      console.warn(`[成长路径生成-防幻觉] 检测到幻觉内容已截断！幻觉技能: [${hallucinatedSkills.join(', ')}], 移除条件: [${removedConditions.join(', ')}]`);
    }

    // 使用校验后的数据构建输出
    let output = `## 分析总结\n\n`;
    output += `${sanitizedSummary}\n\n`;
    if (sanitizedConditions.length > 0) {
      output += `**已具备的条件：**${sanitizedConditions.map(c => `\n- ${c}`).join('')}\n\n`;
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
