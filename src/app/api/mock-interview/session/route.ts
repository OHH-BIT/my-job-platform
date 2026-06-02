/**
 * 获取面试会话数据
 * POST /api/mock-interview/session
 * 供前端 chat 页面加载会话（含预生成题目）
 */

import { NextRequest, NextResponse } from "next/server";
import { globalMockInterviews } from "../start/route";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "缺少 sessionId" },
        { status: 400 }
      );
    }

    const session = globalMockInterviews[sessionId];

    if (!session) {
      return NextResponse.json(
        { success: false, error: "未找到面试会话" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      config: session.config,
      messages: session.messages,
      currentQuestionIndex: session.currentQuestionIndex,
      questions: session.questions || [],
      status: session.status,
      startTime: session.startTime,
    });
  } catch (error: any) {
    console.error("获取会话失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "获取会话失败" },
      { status: 500 }
    );
  }
}
