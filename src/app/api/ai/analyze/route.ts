
import { NextRequest, NextResponse } from 'next/server';

/**

 * AI 智能画像分析 API
 * 
 * 核心功能：
 * 1. 防幻觉：严格基于用户提供的简历原文和测评数据进行分析
 * 2. 引用溯源：关键评价必须关联到简历原文片段
 * 3. 负面约束：信息不足时引导用户补充，而非虚构
 */

// ============================================
// System Prompt - 防幻觉核心约束（v2.0 强化版）
// ============================================
const SYSTEM_PROMPT = `# 角色定义
你是一个严谨的简历信息提取助手和职业分析师。

# 最高原则（红线，违反即失败）
你的所有分析、评分和建议，必须**严格且仅能**基于用户提供的「简历原文」和「测评数据」进行提取和推导。
- **严禁**脑补、联想、推断或生成简历中未提及的任何技能、经历、奖项或能力。
- **严禁**对模糊描述进行"合理推测"。
- 如果简历中未包含某项信息，必须返回 null 或 "暂无相关数据支撑"。

# 事实校验规则
1. **技能提取**：只能列出简历原文中明确出现的技能名称。
   - 简历写了"使用 React + TypeScript" → 输出 React 和 TypeScript
   - 简历只写了"了解前端开发" → 只能输出"了解前端开发"，**不能**自动推断出 React/Vue/Angular
   - 简历**未提及** Docker → skillsAnalysis 中**不得出现** Docker 条目（不是"缺失"，而是直接不输出）

2. **经历提取**：只能列出简历中明确描述的项目或工作经历。
   - 简历写了"参与电商系统开发" → 提取该条
   - 简历**未提及**任何实习 → projectReview 返回空数组 []，competitiveness.dimensions.experience 给 0

3. **量化数据**：只能使用简历原文中的具体数字。
   - 简历写了"用户量达到10万" → 量化成果填写 "用户量: 10万"
   - 简历**未提及**具体数字 → quantifiedResults 返回空数组 []

# 双源数据融合分析（简历 + 能力测试）
- 你收到了两部分数据：简历原文（硬技能证据）和能力测试结果（软实力量化得分）
- 分析时必须同时参考两方数据，不能只分析简历而忽略测试数据
- 如果测试数据显示某软实力得分低（如"抗压能力：30分"），在竞争力评分和推荐岗位时必须相应扣分
- 能力测试中每个维度的得分必须原样引用，不可修改

# 输出格式（严格 JSON）
输出一个 JSON 对象，结构如下：

{
  "competitiveness": {
    "overall": <0-100综合得分>,
    "percentile": <0-100市场百分位>,
    "dimensions": {
      "education": <0-100 学历匹配>,
      "experience": <0-100 经验匹配>,
      "skills": <0-100 技能匹配>
    }
  },
  "skillsAnalysis": [
    {
      "name": "<技能名称，必须来自简历原文>",
      "mastery": "<精通|熟练|了解>",
      "evidence": "<简历中的原文证据，必须是直接引用>"
    }
  ],
  "projectReview": [
    {
      "name": "<项目名称>",
      "contributions": ["<从原文提取的贡献，不加修饰>"],
      "quantifiedResults": [{"metric": "<指标>", "value": "<原文中的值>", "impact": "<原文中的影响>"}]
    }
  ],
  "advice": [
    {
      "problem": "<具体问题，引用事实>",
      "actions": ["<具体行动建议，引用具体数据>"],
      "outcome": "<预期效果>"
    }
  ]
}

# 关键规则
- skillsAnalysis 数组中**只包含**简历原文中明确出现的技能，一个不多一个不少
- 如果简历原文为空或极其简短，skillsAnalysis 返回 []
- projectReview 数组中**只包含**简历中明确描述的项目
- advice 中的每条建议都必须引用"简历原文片段"或"测试得分"作为依据
- competitiveness.overall 必须基于 skillsAnalysis 数组的实际内容动态计算，不得预设固定值
`;

// ============================================
// 主 API 处理函数
// ============================================
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { resumeText, userProfile, assessmentResults } = body;

    // 验证必需参数
    if (!resumeText && !userProfile) {
      return NextResponse.json(
        { error: '缺少必需参数：resumeText 或 userProfile' },
        { status: 400 }
      );
    }

    // 构建用户消息（包含简历原文和测评数据）
    const userMessage = buildUserMessage(resumeText, userProfile, assessmentResults);

    // 调用 AI API（这里使用 OpenAI 作为示例，你可以替换为其他 LLM）
    const aiResponse = await callAIAPI(SYSTEM_PROMPT, userMessage);

    // 返回分析结果
    return NextResponse.json({
      success: true,
      data: aiResponse,
    });

  } catch (error: any) {
    console.error('AI 分析 API 错误：', error);
    return NextResponse.json(
      { error: error.message || 'AI 分析失败' },
      { status: 500 }
    );
  }
}

// ============================================
// 构建用户消息
// ============================================
function buildUserMessage(
  resumeText: string | null,
  userProfile: any,
  assessmentResults: any | null
): string {
  let message = '';

  // 1. 简历原文（最重要，必须提供）
  if (resumeText) {
    message += `## 简历原文\n\n${resumeText}\n\n`;
  }

  // 2. 用户画像数据（补充信息）
  if (userProfile) {
    message += `## 用户画像数据\n\n`;
    message += `- 年级：${userProfile.grade || '未填写'}\n`;
    message += `- 专业：${userProfile.major || '未填写'}\n`;
    message += `- 学校：${userProfile.school || '未填写'}\n`;
    message += `- 目标岗位：${userProfile.targetPosition || '未填写'}\n`;
    message += `- 技能列表：${userProfile.skills || '未填写'}\n`;
    message += `- 项目经历：${userProfile.projects || '未填写'}\n\n`;
  }

  // 3. 能力测试结果（软实力与职业驱动力量化评估）
  if (assessmentResults) {
    message += `## 能力测试结果\n\n`;
    message += `### 综合得分：${assessmentResults.overallScore || '未测评'}/100\n`;
    message += `### 各维度得分：\n`;
    if (assessmentResults.dimensions) {
      message += `- 组织协调：${assessmentResults.dimensions.orgCoordination || '未测评'}分\n`;
      message += `- 竞赛抗压：${assessmentResults.dimensions.competitionStress || '未测评'}分\n`;
      message += `- 团队协作：${assessmentResults.dimensions.teamCollaboration || '未测评'}分\n`;
      message += `- 职业价值观：${assessmentResults.dimensions.careerValues || '未测评'}分\n\n`;
    }
    if (assessmentResults.highlights && assessmentResults.highlights.length > 0) {
      message += `### 亮点：${assessmentResults.highlights.join("、")}\n\n`;
    }
    if (assessmentResults.gaps && assessmentResults.gaps.length > 0) {
      message += `### 待提升维度：${assessmentResults.gaps.join("、")}\n\n`;
    }
  }

  // 4. 分析要求
  message += `## 分析要求\n\n`;
  message += `请严格按照 System Prompt 中的约束进行分析。\n`;
  message += `你的所有分析必须基于上述简历原文和用户数据，严禁虚构或脑补。\n`;
  message += `如果信息不足，请明确说明"暂无相关数据支撑"，并引导用户补充。\n\n`;
  
  message += `请输出以下结构化分析结果（JSON 格式）：\n`;
  message += `{\n`;
  message += `  "competitiveness": { "overall": number, "percentile": number, "dimensions": { "education": number, "experience": number, "skills": number } },\n`;
  message += `  "skillsAnalysis": [ { "name": string, "mastery": "精通|熟练|了解|缺失", "evidence": "原文证据" } ],\n`;
  message += `  "projectReview": [ { "name": string, "contributions": string[], "quantifiedResults": [ { "metric": string, "value": string, "impact": string } ] } ],\n`;
  message += `  "advice": [ { "problem": string, "actions": string[], "outcome": string } ]\n`;
  message += `}\n`;

  return message;
}

// ============================================
// 调用 AI API（示例：OpenAI）
// ============================================
async function callAIAPI(systemPrompt: string, userMessage: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'deepseek-chat';
  const apiUrl = `${baseURL}/chat/completions`;

  if (!apiKey) {
    console.warn('[AI Analyze] 未配置 OPENAI_API_KEY，无法进行AI分析');
    return NextResponse.json(
      { success: false, error: 'AI服务未配置，请联系管理员配置 OPENAI_API_KEY' },
      { status: 503 }
    );
  }

  console.log(`[AI Analyze] 调用AI服务 (model=${model}, baseURL=${baseURL})...`);

  try {
    const response = await fetch(apiUrl, {
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
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Analyze] API返回错误: ${response.status} ${errorText}`);
      throw new Error(`AI API 调用失败 (${response.status}): ${errorText.slice(0, 500)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('[AI Analyze] AI响应解析失败，原始内容:', content?.slice(0, 1000));
      throw new Error('AI 响应格式错误，无法解析为 JSON');
    }
  } catch (error: any) {
    console.error('[AI Analyze] 调用异常:', error.message);
    throw error;
  }
}
