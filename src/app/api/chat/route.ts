export const dynamic = 'force-static';

import { NextRequest, NextResponse } from 'next/server';
import { generateText, getAIServiceStatus } from '@/lib/ai-service';
import { searchKnowledgeBase, getFallbackResponse, TENCENT_KNOWLEDGE_BASE } from '@/lib/tencent-knowledge-base';

/**
 * 问答科普聊天 API
 * 支持 RAG（检索增强生成）+ 大模型
 */

const SYSTEM_PROMPT = `你是腾讯及互联网大厂求职领域的AI顾问。
你的任务是帮助用户解答关于求职、面试、职业发展等方面的问题。

回答要求：
1. 基于腾讯及互联网行业的真实情况回答
2. 如果涉及具体数据，尽量提供准确的数字和事实
3. 回答要专业、友好、有帮助
4. 如果问题超出你的知识范围，建议用户访问腾讯招聘官网：https://careers.tencent.com
5. 回答应简洁有条理，善用小标题和列表，避免过于冗长
`;

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
    
    // RAG：先从知识库检索
    const knowledgeItem = searchKnowledgeBase(userMessage.content);
    
    let systemPrompt = SYSTEM_PROMPT;
    let userPrompt = userMessage.content;
    
    if (knowledgeItem) {
      systemPrompt += `\n\n参考知识：\n${knowledgeItem.answer}\n\n请基于以上知识回答用户问题，可以补充更多信息。`;
    }

    // 如果用户有画像，追加到 system prompt 中个性化回答
    if (userProfile?.basicInfo) {
      systemPrompt += `\n\n当前用户信息：\n- 年级：${userProfile.basicInfo.grade || '未知'}\n- 专业：${userProfile.basicInfo.major || '未知'}\n- 意向岗位：${userProfile.basicInfo.expectedPosition || '未知'}\n\n请结合用户背景给出更有针对性的建议。`;
    }

    // 调用AI生成回答
    let aiResponse: string | null = null;
    let usedAI = false;
    
    // 检查 AI 服务是否配置
    const aiStatus = getAIServiceStatus();
    if (aiStatus.configured) {
      try {
        console.log(`[Chat API] 调用AI服务 (model=${aiStatus.model}, baseURL=${aiStatus.baseURL || '默认'})...`);
        aiResponse = await generateText(systemPrompt, userPrompt, {
          temperature: 0.7,
          maxTokens: 1500,
        });
        usedAI = true;
        console.log('[Chat API] AI服务调用成功，响应长度:', aiResponse.length);
      } catch (aiError: any) {
        console.error('[Chat API] AI调用失败，切换兜底模式');
        console.error(`[Chat API] 错误详情: ${aiError.message}`);
        if (aiError.status) console.error(`[Chat API] HTTP状态码: ${aiError.status}`);
        // AI调用失败时，使用知识库兜底
        aiResponse = null;
      }
    } else {
      console.log('[Chat API] AI服务未配置 (OPENAI_API_KEY 为空)，使用知识库模式');
    }
    
    // 如果不使用AI或AI调用失败，使用知识库兜底
    if (!aiResponse) {
      console.log('[Chat API] 使用本地知识库回复');
      if (knowledgeItem) {
        aiResponse = knowledgeItem.answer;
      } else {
        // 尝试智能兜底匹配
        const smartFallback = getSmartFallback(userMessage.content);
        aiResponse = smartFallback || getFallbackResponse();
      }
    }

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        content: aiResponse,
        followUpQuestions: knowledgeItem?.followUpQuestions || [],
        knowledgeSources: knowledgeItem ? [knowledgeItem.source || '腾讯知识库'] : [],
        usedAI: usedAI,
      },
    });

  } catch (error: any) {
    console.error('[Chat API] 未知错误:', error.message);
    console.error('[Chat API] 错误堆栈:', error.stack);
    
    // 返回标准JSON错误格式
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
