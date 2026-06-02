import { NextRequest, NextResponse } from "next/server";

// ============================================
// AI 模拟面试舱 - 获取面试报告 API
// ============================================

export async function GET(request: NextRequest, context: any) {
  try {
    const { sessionId } = await context.params;

    // 获取面试会话
    const session = (global as any).globalMockInterviews?.[sessionId];
    if (!session) {
      return NextResponse.json(
        { success: false, error: "未找到面试会话" },
        { status: 404 }
      );
    }

    // 检查是否有报告
    if (!session.report) {
      return NextResponse.json(
        { success: false, error: "报告尚未生成" },
        { status: 202 }
      );
    }

    return NextResponse.json({
      success: true,
      report: session.report,
    });
  } catch (error: any) {
    console.error("获取报告失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "获取报告失败" },
      { status: 500 }
    );
  }
}
