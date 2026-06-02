// AI 服务模块 - 封装大模型调用
// 支持 OpenAI、DeepSeek、通义千问等兼容 OpenAI 协议的大模型

import OpenAI from "openai";

// ============================================
// 类型定义
// ============================================

interface AIServiceConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
}

interface GenerateTextOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
}

// ============================================
// 环境变量获取
// ============================================

/** 获取 AI 服务配置 */
function getAIConfig(): { apiKey: string; baseURL: string | undefined; model: string } {
  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
    "";

  const baseURL =
    process.env.OPENAI_BASE_URL ||
    process.env.AI_BASE_URL ||
    undefined;

  const model =
    process.env.AI_MODEL ||
    process.env.OPENAI_MODEL ||
    "deepseek-chat";

  return { apiKey, baseURL, model };
}

// ============================================
// 配置与初始化
// ============================================

/**
 * 获取 AI 服务实例
 */
function getAIInstance(config?: Partial<AIServiceConfig>): OpenAI {
  const { apiKey, baseURL, model: defaultModel } = getAIConfig();

  const effectiveApiKey = config?.apiKey || apiKey;

  if (!effectiveApiKey) {
    const configInfo = `OPENAI_API_KEY=${apiKey ? '***已配置' : '未配置'}, BASE_URL=${baseURL || '未配置'}, MODEL=${defaultModel}`;
    throw new Error(
      `未配置 AI API Key。请在 .env 文件中设置 OPENAI_API_KEY。当前配置: ${configInfo}`
    );
  }

  return new OpenAI({
    apiKey: effectiveApiKey,
    baseURL: config?.baseURL || baseURL,
  });
}

// ============================================
// 核心调用函数
// ============================================

/**
 * 调用 AI 生成文本（非流式）
 */
export async function generateText(
  systemPrompt: string,
  userMessage: string,
  options: GenerateTextOptions = {}
): Promise<string> {
  try {
    const openai = getAIInstance();
    const { model: defaultModel } = getAIConfig();

    const response = await openai.chat.completions.create({
      model: options?.model || defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      ...(options?.responseFormat ? { response_format: options.responseFormat } : {}),
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    logAIError("generateText", error);
    throw error;
  }
}

/**
 * 调用 AI 生成文本（流式）
 */
export async function generateTextStream(
  systemPrompt: string,
  userMessage: string,
  onChunk: (chunk: string) => void,
  options: GenerateTextOptions = {}
): Promise<string> {
  try {
    const openai = getAIInstance();
    const { model: defaultModel } = getAIConfig();

    const stream = await openai.chat.completions.create({
      model: options?.model || defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      stream: true,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullContent += content;
        onChunk(content);
      }
    }

    return fullContent;
  } catch (error: any) {
    logAIError("generateTextStream", error);
    throw error;
  }
}

/**
 * 调用 AI 生成文本（SSE 格式，用于 API 路由）
 */
export async function generateTextSSE(
  systemPrompt: string,
  userMessage: string,
  onChunk: (chunk: string) => void,
  options: GenerateTextOptions = {}
): Promise<string> {
  try {
    const openai = getAIInstance();
    const { model: defaultModel } = getAIConfig();

    const stream = await openai.chat.completions.create({
      model: options?.model || defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      stream: true,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullContent += content;
        onChunk(content);
      }
    }

    return fullContent;
  } catch (error: any) {
    logAIError("generateTextSSE", error);
    throw error;
  }
}

/**
 * 检查 AI 服务是否可用
 */
export async function checkAIAvailable(): Promise<boolean> {
  try {
    const { apiKey } = getAIConfig();

    if (!apiKey) {
      return false;
    }

    const openai = getAIInstance();
    const { model: defaultModel } = getAIConfig();
    await openai.chat.completions.create({
      model: defaultModel,
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5,
    });

    return true;
  } catch (error) {
    logAIError("checkAIAvailable", error);
    return false;
  }
}

/**
 * 获取当前 AI 配置信息（用于调试）
 */
export function getAIServiceStatus(): {
  configured: boolean;
  baseURL: string | undefined;
  model: string;
} {
  const { apiKey, baseURL, model } = getAIConfig();
  return {
    configured: !!apiKey,
    baseURL,
    model,
  };
}

// ============================================
// 详细错误日志
// ============================================

/**
 * 统一记录 AI 调用错误，输出详细诊断信息
 */
function logAIError(functionName: string, error: any): void {
  const { apiKey, baseURL, model } = getAIConfig();

  console.error(`[${functionName}] AI 调用失败`);
  console.error(`  - API Key: ${apiKey ? '***' + apiKey.slice(-4) : '未配置'}`);
  console.error(`  - Base URL: ${baseURL || '默认(https://api.openai.com/v1)'}`);
  console.error(`  - Model: ${model}`);
  console.error(`  - 错误名称: ${error.name}`);
  console.error(`  - 错误消息: ${error.message}`);
  console.error(`  - HTTP 状态码: ${error.status || error.statusCode || 'N/A'}`);
  console.error(`  - 错误类型: ${error.code || error.type || 'N/A'}`);

  // 打印 OpenAI SDK 返回的结构化错误
  if (error.error) {
    console.error('  - 服务端错误详情:', JSON.stringify(error.error, null, 2));
  }
  // 打印原始响应体（如果有）
  if (error.data) {
    console.error('  - 原始响应体:', typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2));
  }
  // 部分场景下 OpenAI SDK 的错误嵌套在 cause 中
  if (error.cause) {
    console.error('  - 根因:', error.cause);
  }
  if (error.stack) {
    console.error(`  - 堆栈: ${error.stack}`);
  }
}

// ============================================
// Prompt 构建函数
// ============================================

/**
 * 构建面试官 System Prompt
 */
export function buildInterviewerPrompt(
  config: any,
  userProfile: any,
  targetJob: any
): string {
  const interviewTypeLabel =
    config.type === "behavioral" ? "行为面试" : "技术面试";
  const difficultyLabel =
    config.difficulty === "easy"
      ? "初级（友好宽松）"
      : config.difficulty === "medium"
      ? "中级（标准难度）"
      : "压力面（高压挑战）";

  return `### 角色设定
你是一位经验丰富的腾讯${targetJob.title}岗位面试官，正在进行${interviewTypeLabel}（难度：${difficultyLabel}）。

### 面试背景
- **候选人简历原文**：
${userProfile.resumeText || "（未提供简历）"}

- **候选人基础信息**：
  - 年级：${userProfile.basicInfo.grade}
  - 专业：${userProfile.basicInfo.major}
  - 学校：${userProfile.basicInfo.school}
  - 目标岗位：${userProfile.basicInfo.targetPosition}

- **候选人技能标签**：${userProfile.skills.join("、") || "（未提供）"}

- **候选人项目经历**：
${
  userProfile.projects.length > 0
    ? userProfile.projects.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")
    : "（未提供项目经历）"
}

- **目标岗位 JD**：
  - 岗位：${targetJob.title}
  - 部门：${targetJob.department}
  - 描述：${targetJob.description}
  - 要求技能：${targetJob.requirements.skills.join("、")}
  - 经验要求：${targetJob.requirements.experience}
  - 学历要求：${targetJob.requirements.education}

### 核心指令（必须遵守）

#### 1. 基于画像追问（最重要！）
- **绝不能只问通用题库！** 你必须盯着候选人的简历和经历提问。
- 例如："我在你的简历中看到你负责过校园社团的招新活动，请具体讲讲你当时是如何制定推广策略的？遇到了什么困难？"
- 每次提问都要引用简历中的具体内容（项目、技能、经历）。

#### 2. 遵循 STAR 法则引导
- 当候选人回答模糊时，你必须进行引导性追问。
- 例如："你刚才提到了结果很好，那么具体的量化数据是多少呢？"（引导Situation）
- 例如："你当时在这个项目中具体承担了什么角色？"（引导Task）
- 例如："你是如何解决这个问题的？"（引导Action）
- 例如："最终的成果是什么？有量化指标吗？"（引导Result）

#### 3. 控制节奏
- **每次只问一个问题**，等待候选人回答完毕后再进行下一个环节。
- 不要一次性抛出多个问题。
- 模拟真实的一来一回对话节奏。

#### 4. 难度适配
- **初级（easy）**：友好宽松，多鼓励，问题较为简单。
- **中级（medium）**：标准难度，正常追问，还原真实面试场景。
- **压力面（stress）**：高压挑战，适度质疑候选人的回答，考验抗压与应变能力。

#### 5. 面试流程
- 第1题：自我介绍（暖场）
- 第2-4题：基于简历经历的深度追问（行为/技术问题）
- 第5题：职业规划与岗位匹配度（收尾）
- 如果候选人表现优秀，可以适当增加追问；如果表现不佳，及时调整难度。

### 输出格式
- 直接输出你的问题或追问，不要添加"面试官："前缀。
- 语气要自然、专业，符合真实面试官的风格。
- 如果是压力面，可以适当加入挑战性语句（如"你确定吗？""这似乎不太符合预期"）。
`;
}

/**
 * 构建报告生成 Prompt
 */
export function buildReportPrompt(conversationText: string): string {
  return `你是专业的面试评估专家。请根据面试对话，生成详细的复盘报告。

### 输出要求
你必须返回严格的JSON格式，包含以下字段：
1. "overallScore": 综合得分 (0-100)
2. "dimensionScores": 五个维度得分 (0-100)
   - "logicalThinking": 逻辑思维
   - "languageExpression": 语言表达
   - "professionalSkills": 专业技能
   - "jobMatch": 岗位匹配度
   - "stressResistance": 抗压能力
3. "questionReviews": 逐题点评数组，每个元素包含：
   - "questionIndex": 题目索引
   - "question": 面试官的问题
   - "answer": 候选人的回答
   - "score": 该题得分 (0-100)
   - "highlights": 回答亮点数组
   - "gaps": 回答不足数组
   - "suggestedAnswer": 优化话术示范（满分参考回答）
4. "overallFeedback": 总体反馈（字符串）
5. "improvementSuggestions": 改进建议数组

### 评分标准
- 逻辑思维：回答是否有条理、有逻辑
- 语言表达：表达是否清晰、流畅
- 专业技能：专业技能是否符合岗位要求
- 岗位匹配度：经历与岗位JD的匹配程度
- 抗压能力：面对压力问题时的表现

### 优化话术示范（最重要！）
针对回答不足的问题，你必须结合候选人的真实经历，重新生成一段"满分参考回答"。
例如："建议将刚才的回答优化为：'我通过XX渠道进行了推广，覆盖了XX人，最终转化率提升了15%...'"

只返回JSON，不要添加任何解释性文字。

### 面试对话
${conversationText}
`;
}

// ============================================
// 动态出题引擎 - Prompt 构建
// ============================================

/**
 * 构建动态出题引擎的 System Prompt
 * 根据岗位JD、简历、面试类型、难度生成定制化面试题
 */
export function buildQuestionGeneratorPrompt(
  params: {
    jobPosition: string;
    interviewType: string;
    difficultyLevel: string;
    resumeText: string;
    questionCount: number;
    jobDescription?: string;
    jobRequirements?: string[];
  }
): string {
  const { jobPosition, interviewType, difficultyLevel, resumeText, questionCount, jobDescription, jobRequirements } = params;
  
  const difficultyMap: Record<string, string> = {
    easy: "初级（侧重基础概念、学习态度、潜力评估）",
    medium: "中级（侧重实战经验、问题解决能力、技术深度）",
    hard: "高级（侧重系统设计、架构思维、复杂场景决策）",
    stress: "压力面（侧重抗压能力、临场应变、极端情况处理）",
  };

  const typeMap: Record<string, string> = {
    technical: "技术面试（重点考察专业技能、编程能力、技术深度）",
    behavioral: "行为面试（重点考察团队协作、沟通能力、职业素养）",
  };

  return `你是一位资深的互联网行业面试官，目前正在进行腾讯【${jobPosition}】岗位的面试出题工作。

## 候选人简历
${resumeText || '（候选人未提供简历，请基于岗位要求出通用题目）'}

${jobDescription ? `## 岗位描述\n${jobDescription}` : ''}

${jobRequirements && jobRequirements.length > 0 ? `## 岗位技能要求\n${jobRequirements.join('、')}` : ''}

## 出题要求

### 核心约束（必须遵守）
1. 面试类型：${typeMap[interviewType] || interviewType}
2. 难度等级：${difficultyMap[difficultyLevel] || difficultyLevel}
3. 题目数量：${questionCount} 题

### 出题策略
- **如果简历中有相关项目经历，必须针对该项目进行深度追问**（例如："你在XX项目中提到的难点是如何解决的？"）。
- **如果简历中有技能列表，题目要覆盖候选人声称掌握的核心技能**。
- **如果简历为空或信息不足，则基于岗位JD要求出题，重点考察候选人是否具备岗位所需能力**。
- 题目必须符合设定的难度等级（初级侧重基础概念，高级侧重系统设计与场景解决）。
- 题目之间要有递进关系：从自我介绍/基础 → 项目深挖 → 进阶挑战 → 职业规划。

### 题目分类参考
- 技术面：基础概念、编码能力、项目经验、系统设计、场景题
- 行为面：自我介绍、团队协作、冲突处理、领导力、职业规划

### 输出格式
严格以 JSON 数组格式返回题目，每个题目包含 question（问题内容）和 type（考察点分类）。
例如：
[
  {"question": "请先做一个简短的自我介绍，重点谈谈你为什么对${jobPosition}岗位感兴趣。", "type": "自我介绍"},
  {"question": "你在简历中提到参与过XX项目，请详细描述你在其中的角色、遇到的最大挑战以及你的解决方案。", "type": "项目深挖"}
]

只返回 JSON 数组，不要添加任何其他文字或 markdown 代码块标记。`;
}

/**
 * 构建追问判断的 System Prompt
 * 判断是否需要对用户的回答进行追问
 */
export function buildFollowUpPrompt(
  question: string,
  userAnswer: string,
  difficultyLevel: string
): string {
  return `你是一位经验丰富的面试官，正在评估候选人的回答。

## 当前面试题目
${question}

## 候选人回答
${userAnswer}

## 你的任务
请分析候选人的回答，判断是否需要进行追问。

### 追问条件（满足任一即追问）
1. 候选人提到了某个技术名词/概念但没有展开说明
2. 候选人的回答过于笼统，缺乏具体细节（数据、方法、工具）
3. 回答中存在明显漏洞或可质疑的点
4. 候选人有有趣的经历值得进一步挖掘

### 不追问条件
- 回答已经非常完整、具体、有量化数据
- 已经是追问后的回答，信息已充分
- 当前难度为初级(easy)且回答基本合格

## 难度等级：${difficultyLevel}
- 初级(easy)：宽松，只在明显遗漏时追问
- 中级(medium)：标准，合理追问细节
- 高级(hard)：严格，积极追问和质疑
- 压力面(stress)：极度严格，每个回答都要追问或质疑

## 输出格式
严格以 JSON 格式返回：
{
  "shouldFollowUp": true/false,
  "followUpQuestion": "追问内容（shouldFollowUp为false时为空字符串）",
  "reason": "追问/不追问的原因"
}

只返回 JSON，不要添加任何其他文字。`;
}

/**
 * 解析 AI 返回的 JSON（兼容 markdown 代码块格式）
 */
export function parseAIJSON(raw: string): any {
  let text = raw.trim();
  // 兼容 ```json ... ``` 格式
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    text = jsonMatch[1].trim();
  }
  // 兼容前导 [ 或 { 后的内容
  const bracketStart = text.indexOf('[');
  const braceStart = text.indexOf('{');
  if (bracketStart >= 0 || braceStart >= 0) {
    const start = bracketStart >= 0 && braceStart >= 0 
      ? Math.min(bracketStart, braceStart) 
      : Math.max(bracketStart, braceStart);
    text = text.slice(start);
  }
  return JSON.parse(text);
}

// ============================================
// 默认导出（兼容旧代码）
// ============================================

export default {
  generateText,
  generateTextStream,
  generateTextSSE,
  checkAIAvailable,
  buildInterviewerPrompt,
  buildReportPrompt,
  getAIServiceStatus,
};
