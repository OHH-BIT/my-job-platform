

import { NextRequest, NextResponse } from 'next/server';
import { generateText, getAIServiceStatus } from '@/lib/ai-service';
import { searchKnowledgeBase, getFallbackResponse, TENCENT_KNOWLEDGE_BASE } from '@/lib/tencent-knowledge-base';
import { webSearch, needsWebSearch, isSearchAvailable, WebSearchResponse, SearchResult } from '@/lib/web-search';

/**
 * 问答科普聊天 API
 * v2.0：集成网页搜索 + 防幻觉机制 + 诚实回答
 * 
 * 架构：网页搜索 → 知识库 RAG → AI 大模型 → 本地兜底
 */

const SYSTEM_PROMPT = `你是腾讯及互联网大厂求职领域的AI顾问。你的核心原则是**严格基于事实，杜绝一切幻觉**。

## 绝对规则（必须遵守）
1. 你只能基于以下三种信息来源回答问题：
   - 用户提供的上下文信息
   - 系统提供的"搜索结果"中的真实内容
   - 系统提供的"参考知识"中的内容
2. **绝对禁止**凭空捏造或编造虚假信息。如果你不确定某个事实，必须明确告知用户。
3. 如果搜索不到相关信息，或者你无法确定答案，请直接如实告诉用户"未找到相关答案"，并建议用户通过官方渠道核实。
4. 对于不确定的信息（如薪资范围、时间安排、政策变化等），必须主动标注"此信息可能有变动，建议通过官方渠道确认"。
5. 引用搜索结果中的具体内容时，要标注信息来源。

## 回答风格
- 严谨专业，使用数据和事实说话
- 简洁有条理，善用小标题和列表
- 对于不确定的内容要主动提示用户核实
- 不要过度自信地给出你不确定的结论

## 超出知识范围时的处理
如果问题完全超出你的知识范围且搜索无果，诚实回复：
"抱歉，我目前未找到与该问题相关的确切信息。建议你通过以下渠道获取最新信息：
1. 腾讯招聘官网：https://careers.tencent.com
2. 腾讯官方公众号
3. 相关领域的专业网站"`;

/**
 * 将搜索结果格式化为 AI 可理解的上下文
 */
function formatSearchContext(searchResponse: WebSearchResponse): string {
  if (!searchResponse.results || searchResponse.results.length === 0) {
    return '搜索结果：未找到相关信息。';
  }

  let context = '以下是联网搜索到的相关结果：\n\n';
  searchResponse.results.forEach((result, index) => {
    context += `【来源${index + 1}】${result.title}\n`;
    context += `  内容摘要：${result.snippet}\n`;
    context += `  链接：${result.url}\n\n`;
  });

  return context;
}

/**
 * 从搜索结果中提取来源列表（用于前端展示）
 */
function extractSources(searchResponse: WebSearchResponse): string[] {
  if (!searchResponse.results || searchResponse.results.length === 0) {
    return [];
  }
  return searchResponse.results
    .filter(r => r.url && r.title)
    .slice(0, 3)
    .map(r => r.title);
}

/**
 * 获取智能兜底回复（基于关键词模糊匹配，比精确匹配更宽松）
 */
function getSmartFallback(query: string): string {
  const lowerQuery = query.toLowerCase();

  // 匹配不严格的情况下，尽量给出有用的建议
  const topicMap: Record<string, string> = {
    '简历': '关于简历撰写，我有以下建议：\n\n📝 **简历核心原则**\n- 一页纸原则（校招/实习）\n- STAR法则描述项目经历\n- 量化成果（用数字说话）\n\n📋 **结构建议**\n1. 基本信息（姓名、学校、专业、联系方式）\n2. 教育背景（学校、专业、GPA、主修课程）\n3. 实习经历（STAR法则描述）\n4. 项目经历（GitHub链接）\n5. 技能标签（按熟练度排列）\n6. 荣誉奖项（相关优先）\n\n💡 **腾讯HR看重的点**：项目深度 > 项目数量，技术广度 > 课程成绩',
    '面试': '关于面试准备，我有以下建议：\n\n🎯 **面试流程**（技术岗）\n- 笔试 → 技术一面 → 技术二面 → HR面\n\n📝 **准备重点**\n1. **算法**：LeetCode 中等难度为主（200题+）\n2. **项目深挖**：每个项目都要能讲清楚细节\n3. **STAR法则**：准备3-5个行为面试案例\n4. **系统设计**：了解常见架构模式\n\n💡 **面试技巧**：先思考再回答，不会的坦诚说但展示思考过程',
    '转正': '关于腾讯实习转正：\n\n✅ **转正流程**\n- 实习期结束前1-2个月进行转正评审\n- 需要完成转正答辩（PPT汇报）\n- 直属Leader + 部门总监评审\n\n📊 **转正率参考**\n- 暑期实习转正率约60-80%\n- 表现优秀者转正概率更高\n\n💡 **提升转正率**：主动承担责任、积极沟通、定期汇报进度',
    '事业群': '腾讯主要事业群介绍：\n\n📱 **WXG（微信事业群）**：微信、小程序、微信支付\n🎮 **IEG（互动娱乐）**：王者荣耀、和平精英等游戏\n📺 **PCG（平台与内容）**：QQ、腾讯视频、腾讯新闻\n☁️ **CSIG（云与智慧产业）**：腾讯云、企业微信、腾讯会议\n🔧 **TEG（技术工程）**：基础技术平台、运维、安全\n💰 **CDG（企业发展）**：金融科技、广告、投资\n\n💡 **如何选择**：根据你的技术方向和兴趣，每个BG有不同的技术栈和氛围',
  };

  for (const [keyword, response] of Object.entries(topicMap)) {
    if (lowerQuery.includes(keyword)) return response;
  }

  return '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, sessionId, userProfile } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数：messages' },
        { status: 400 }
      );
    }

    // 获取用户最新问题
    const userMessage = messages[messages.length - 1];
    if (!userMessage || !userMessage.content) {
      return NextResponse.json(
        { success: false, error: '消息内容不能为空' },
        { status: 400 }
      );
    }
    
    // ========== 第一层：网页搜索（实时信息） ==========
    const shouldSearch = needsWebSearch(userMessage.content);
    let searchResponse: WebSearchResponse = { success: false, results: [], query: userMessage.content, searchUsed: false };
    
    if (shouldSearch && isSearchAvailable()) {
      try {
        console.log(`[Chat API] 执行联网搜索，query: "${userMessage.content.slice(0, 50)}..."`);
        searchResponse = await webSearch(userMessage.content);
        if (searchResponse.searchUsed) {
          console.log(`[Chat API] 搜索完成，找到 ${searchResponse.results.length} 条结果`);
        }
      } catch (searchError: any) {
        console.warn('[Chat API] 网页搜索失败:', searchError.message);
      }
    }

    // ========== 第二层：本地知识库 RAG ==========
    const knowledgeItem = searchKnowledgeBase(userMessage.content);
    
    let systemPrompt = SYSTEM_PROMPT;
    let userPrompt = userMessage.content;
    
    // 拼接搜索结果到 System Prompt
    if (searchResponse.searchUsed && searchResponse.results.length > 0) {
      systemPrompt += `\n\n${formatSearchContext(searchResponse)}`;
      systemPrompt += `\n请基于以上搜索结果回答用户问题。如果搜索结果中没有相关信息，请如实告知用户"未找到相关信息"。`;
    } else if (shouldSearch && !searchResponse.searchUsed) {
      systemPrompt += `\n\n系统尝试了联网搜索，但未找到相关结果。请基于你已有的知识谨慎回答，并明确提示用户：该信息可能不是最新的，建议通过官方渠道核实。`;
    }
    
    // 拼接知识库内容到 System Prompt
    if (knowledgeItem) {
      systemPrompt += `\n\n参考知识：\n${knowledgeItem.answer}\n\n请结合以上知识回答用户问题，可以补充更多信息。`;
    }

    // 追加用户画像做个性化回答
    if (userProfile?.basicInfo) {
      systemPrompt += `\n\n当前用户信息：\n- 年级：${userProfile.basicInfo.grade || '未知'}\n- 专业：${userProfile.basicInfo.major || '未知'}\n- 意向岗位：${userProfile.basicInfo.expectedPosition || '未知'}\n\n请结合用户背景给出更有针对性的建议。`;
    }

    // ========== 第三层：AI 大模型生成 ==========
    let aiResponse: string | null = null;
    let usedAI = false;
    
    const aiStatus = getAIServiceStatus();
    if (aiStatus.configured) {
      try {
        console.log(`[Chat API] 调用AI服务 (model=${aiStatus.model}, baseURL=${aiStatus.baseURL || '默认'})...`);
        aiResponse = await generateText(systemPrompt, userPrompt, {
          temperature: 0.3,  // 降低温度减少幻觉
          maxTokens: 1500,
        });
        usedAI = true;
        console.log('[Chat API] AI服务调用成功，响应长度:', aiResponse.length);
      } catch (aiError: any) {
        console.error('[Chat API] AI调用失败，切换兜底模式');
        console.error(`[Chat API] 错误详情: ${aiError.message}`);
        if (aiError.status) console.error(`[Chat API] HTTP状态码: ${aiError.status}`);
        aiResponse = null;
      }
    } else {
      console.log('[Chat API] AI服务未配置 (OPENAI_API_KEY 为空)，使用知识库模式');
    }
    
    // ========== 第四层：本地兜底 ==========
    if (!aiResponse) {
      console.log('[Chat API] 使用本地知识库回复');
      if (knowledgeItem) {
        aiResponse = knowledgeItem.answer;
      } else if (searchResponse.searchUsed && searchResponse.results.length > 0) {
        // 搜索有结果但 AI 不可用：直接返回搜索摘要
        let fallbackContent = `以下是从网上搜索到的相关信息：\n\n`;
        searchResponse.results.forEach((r, i) => {
          fallbackContent += `**${r.title}**\n${r.snippet}\n${r.url ? `[查看原文](${r.url})` : ''}\n\n`;
        });
        fallbackContent += `> ⚠️ AI 服务当前未配置，以上为搜索结果摘要。如需更详细的分析，请联系管理员配置 AI 大模型。`;
        aiResponse = fallbackContent;
      } else {
        const smartFallback = getSmartFallback(userMessage.content);
        aiResponse = smartFallback || getFallbackResponse();
      }
    }

    // ========== 构建返回结果 ==========
    const knowledgeSources: string[] = [];
    if (knowledgeItem) {
      knowledgeSources.push(knowledgeItem.source || '腾讯知识库');
    }
    // 添加搜索来源
    const webSources = extractSources(searchResponse);
    webSources.forEach(s => {
      if (!knowledgeSources.includes(s)) {
        knowledgeSources.push(s);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        content: aiResponse,
        followUpQuestions: knowledgeItem?.followUpQuestions || [],
        knowledgeSources,
        usedAI,
        searchUsed: searchResponse.searchUsed,
        searchResultCount: searchResponse.results.length,
      },
    });

  } catch (error: any) {
    console.error('[Chat API] 未知错误:', error.message);
    console.error('[Chat API] 错误堆栈:', error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: '服务暂时繁忙，请稍后再试~',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
