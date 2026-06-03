
import { NextRequest, NextResponse } from "next/server";
import { globalMockInterviews } from "../start/route";
import { generateText, generateTextSSE } from "@/lib/ai-service";

// ============================================
// AI 模拟面试舱 - 回答面试问题 API
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, isVoice, stream } = body;

    // 验证参数
    if (!sessionId || !message) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数：sessionId 或 message" },
        { status: 400 }
      );
    }

    // 获取面试会话
    const session = globalMockInterviews[sessionId];
    if (!session) {
      return NextResponse.json(
        { success: false, error: "未找到面试会话" },
        { status: 404 }
      );
    }

    // 检查面试是否已结束
    if (session.status === "completed") {
      return NextResponse.json(
        { success: false, error: "面试已结束" },
        { status: 400 }
      );
    }

    // 添加候选人消息到会话
    session.messages.push({
      id: `msg_${Date.now()}`,
      role: "candidate",
      content: message,
      timestamp: Date.now(),
      isVoice,
    });

    // 检查是否达到题目数量上限
    const isCompleted = session.currentQuestionIndex + 1 >= (session.config.questionCount ?? 5);

    if (isCompleted) {
      // 面试结束
      session.status = "completed";
      session.endTime = Date.now();

      return NextResponse.json({
        success: true,
        nextQuestion: "面试已结束，感谢你的参与！正在生成复盘报告...",
        isCompleted: true,
      });
    }

    // 如果请求流式响应
    if (stream) {
      return handleStreamResponse(session);
    }

    // 生成AI面试官的下一个问题（非流式）
    const nextQuestion = await generateNextQuestion(session);

    // 添加面试官消息到会话
    session.messages.push({
      id: `msg_${Date.now() + 1}`,
      role: "interviewer",
      content: nextQuestion,
      timestamp: Date.now(),
    });

    // 更新当前问题索引
    session.currentQuestionIndex += 1;

    return NextResponse.json({
      success: true,
      nextQuestion,
      isCompleted: false,
    });
  } catch (error: any) {
    console.error("回答面试问题失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "回答面试问题失败" },
      { status: 500 }
    );
  }
}

// ============================================
// 处理流式响应
// ============================================

async function handleStreamResponse(session: any): Promise<NextResponse> {
  // 构建对话历史
  const conversationHistory = session.messages.map((msg: any) => ({
    role: msg.role === "interviewer" ? "assistant" : "user",
    content: msg.content,
  }));

  // 构建系统提示词
  const systemPrompt = `你是腾讯面试官，正在面试候选人。请根据对话历史，提出下一个面试问题。

重要规则：
1. 基于候选人简历和回答提问，不要问通用问题
2. 使用STAR法则引导（Situation、Task、Action、Result）
3. 每次只问一个问题
4. 当前是第${session.currentQuestionIndex + 2}题，总共${session.config.questionCount}题

直接输出问题，不要添加"面试官："前缀。`;

  // 创建 SSE 流
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // 启动 AI 生成（异步）
  generateTextSSE(
    systemPrompt,
    "请根据上面的对话，提出下一个面试问题。",
    async (chunk: string) => {
      // 发送 SSE 事件
      const data = JSON.stringify({ chunk });
      await writer.write(encoder.encode(`data: ${data}\n\n`));
    },
    {
      temperature: 0.7,
      maxTokens: 500,
    }
  )
    .then(async (fullContent) => {
      // 生成完成，发送完整内容和结束标志
      const data = JSON.stringify({ done: true, fullContent });
      await writer.write(encoder.encode(`data: ${data}\n\n`));
      await writer.close();
    })
    .catch(async (error) => {
      console.error("流式生成失败:", error);
      const data = JSON.stringify({ error: error.message });
      await writer.write(encoder.encode(`data: ${data}\n\n`));
      await writer.close();
    });

  // 返回 SSE 响应
  return new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ============================================
// 生成下一个问题（调用AI，非流式）
// ============================================

async function generateNextQuestion(session: any): Promise<string> {
  try {
    // 构建对话历史
    const conversationHistory = session.messages.map((msg: any) => ({
      role: msg.role === "interviewer" ? "assistant" : "user",
      content: msg.content,
    }));

    // 构建系统提示词
    const systemPrompt = `你是腾讯面试官，正在面试候选人。请根据对话历史，提出下一个面试问题。

重要规则：
1. 基于候选人简历和回答提问，不要问通用问题
2. 使用STAR法则引导（Situation、Task、Action、Result）
3. 每次只问一个问题
4. 当前是第${session.currentQuestionIndex + 2}题，总共${session.config.questionCount}题

直接输出问题，不要添加"面试官："前缀。`;

    // 调用 AI 服务
    const nextQuestion = await generateText(
      systemPrompt,
      "请根据上面的对话，提出下一个面试问题。",
      {
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    return nextQuestion.trim();
  } catch (error) {
    console.error("生成下一个问题失败:", error);
    // 返回兜底问题（演示模式）
    const mockQuestions = [
      `你在简历中提到你掌握了${session.userProfile.skills[0] || "编程"}技能，能具体讲讲你是如何学习这个技能的吗？在学习过程中遇到过什么困难？`,
      `我看到你参与了"${session.userProfile.projects[0] || "某个项目"}"项目，你在其中担任什么角色？具体负责哪些工作？`,
      `基于你的经历，你认为自己最大的优势是什么？这个优势如何帮助你胜任${session.config.targetJobId}岗位？`,
      `如果让你重新做一次"${session.userProfile.projects[0] || "那个项目"}"，你会如何改进？为什么？`,
      `你未来的职业规划是什么？为什么选择投递腾讯的${session.config.targetJobId}岗位？`,
    ];
    
    const questionIndex = Math.min(session.currentQuestionIndex, mockQuestions.length - 1);
    return mockQuestions[questionIndex];
  }
}
