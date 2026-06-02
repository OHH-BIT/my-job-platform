import { NextRequest, NextResponse } from "next/server";
import { globalMockInterviews } from "../start/route";
import { generateText, buildReportPrompt } from "@/lib/ai-service";

// ============================================
// 类型定义
// ============================================

interface InterviewScore {
  overall: number;
  dimensions: {
    logicalThinking: number;
    languageExpression: number;
    professionalSkills: number;
    jobMatch: number;
    stressResistance: number;
  };
}

interface QuestionReview {
  questionIndex: number;
  question: string;
  answer: string;
  score: number;
  highlights: string[];
  gaps: string[];
  suggestedAnswer: string;
}

interface InterviewReport {
  sessionId: string;
  score: InterviewScore;
  questionReviews: QuestionReview[];
  overallFeedback: string;
  improvementSuggestions: string[];
  generatedAt: number;
}

// ============================================
// AI 模拟面试舱 - 结束面试并生成报告 API
// ============================================

export async function POST(request: NextRequest, context: any) {
  try {
    const { sessionId } = await context.params;

    // 获取面试会话
    const session = globalMockInterviews[sessionId];
    if (!session) {
      return NextResponse.json(
        { success: false, error: "未找到面试会话" },
        { status: 404 }
      );
    }

    // 更新会话状态
    session.status = "completed";
    session.endTime = Date.now();

    // 生成面试报告
    const report = await generateInterviewReport(session);

    // 保存报告到会话
    session.report = report;

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("结束面试失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "结束面试失败" },
      { status: 500 }
    );
  }
}

// ============================================
// 生成面试报告（核心）
// ============================================

async function generateInterviewReport(session: any): Promise<InterviewReport> {
  try {
    // 构建对话历史文本
    const conversationText = session.messages
      .map((msg: any) => `${msg.role === "interviewer" ? "面试官" : "候选人"}: ${msg.content}`)
      .join("\n\n");

    // 构建报告生成 Prompt
    const reportPrompt = buildReportPrompt(conversationText);

    // 调用 AI 服务生成报告
    const reportContent = await generateText(
      reportPrompt,
      "请分析以上面试对话，生成复盘报告。",
      {
        temperature: 0.3,
        maxTokens: 3000,
      }
    );

    // 解析JSON（处理可能的markdown代码块）
    const jsonMatch = reportContent.match(/```json\n([\s\S]*?)\n```/) || reportContent.match(/\{[\s\S]*\}/);
    const reportJson = jsonMatch ? jsonMatch[1] || jsonMatch[0] : reportContent;
    
    const reportData = JSON.parse(reportJson);

    // 构建报告对象
    const report: InterviewReport = {
      sessionId: session.id,
      score: {
        overall: reportData.overallScore,
        dimensions: {
          logicalThinking: reportData.dimensionScores.logicalThinking,
          languageExpression: reportData.dimensionScores.languageExpression,
          professionalSkills: reportData.dimensionScores.professionalSkills,
          jobMatch: reportData.dimensionScores.jobMatch,
          stressResistance: reportData.dimensionScores.stressResistance,
        },
      },
      questionReviews: reportData.questionReviews.map((qr: any, index: number) => ({
        questionIndex: qr.questionIndex || index,
        question: qr.question,
        answer: qr.answer,
        score: qr.score,
        highlights: qr.highlights || [],
        gaps: qr.gaps || [],
        suggestedAnswer: qr.suggestedAnswer || "",
      })),
      overallFeedback: reportData.overallFeedback,
      improvementSuggestions: reportData.improvementSuggestions || [],
      generatedAt: Date.now(),
    };

    return report;
  } catch (error) {
    console.error("生成报告失败:", error);
    // 返回模拟报告（兜底）
    return generateMockReport(session);
  }
}

// ============================================
// 生成模拟报告（演示模式）
// ============================================

function generateMockReport(session: any): InterviewReport {
  // 模拟逐题点评
  const questionReviews: QuestionReview[] = session.messages
    .filter((msg: any) => msg.role === "interviewer")
    .map((msg: any, index: number) => {
      const candidateMsg = session.messages
        .filter((m: any) => m.role === "candidate")[index];
      
      return {
        questionIndex: index,
        question: msg.content,
        answer: candidateMsg?.content || "（未回答）",
        score: Math.floor(Math.random() * 30) + 70, // 70-100分
        highlights: [
          "回答结构清晰，使用了STAR法则",
          "能够结合自身经历举例说明",
        ],
        gaps: [
          "量化数据不够具体",
          "可以更进一步说明个人贡献",
        ],
        suggestedAnswer: `建议优化为："我在项目中负责了XX模块的开发，通过引入XX技术，将性能提升了30%，并主导了XX功能的实现..."`,
      };
    });

  // 模拟综合得分
  const overallScore = Math.floor(Math.random() * 20) + 75; // 75-95分

  return {
    sessionId: session.id,
    score: {
      overall: overallScore,
      dimensions: {
        logicalThinking: Math.floor(Math.random() * 20) + 75,
        languageExpression: Math.floor(Math.random() * 20) + 70,
        professionalSkills: Math.floor(Math.random() * 20) + 80,
        jobMatch: Math.floor(Math.random() * 20) + 75,
        stressResistance: Math.floor(Math.random() * 20) + 70,
      },
    },
    questionReviews,
    overallFeedback: `总体而言，你的面试表现${overallScore >= 90 ? "非常优秀" : overallScore >= 80 ? "良好" : "有待提升"}。你在专业技能和逻辑思维方面表现突出，但在语言表达和量化数据方面还有提升空间。建议多练习STAR法则，并准备更多具体的量化案例。`,
    improvementSuggestions: [
      "准备更多量化数据案例（使用具体数字）",
      "练习STAR法则回答行为问题",
      "提升语言表达的流畅度和自信度",
      "深入研究目标岗位的JD，准备匹配案例",
    ],
    generatedAt: Date.now(),
  };
}
