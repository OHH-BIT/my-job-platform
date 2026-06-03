"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { InterviewReport, InterviewScore } from "@/types/mock-interview";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";

// ============================================
// AI 模拟面试舱 - 报告展示页面
// ============================================

export default function MockInterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载报告
  useEffect(() => {
    if (!sessionId) return;

    const loadReport = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/mock-interview/report/${sessionId}`);
        if (!response.ok) throw new Error("加载报告失败");

        const data = await response.json();
        if (!data.success) throw new Error(data.error || "加载报告失败");

        setReport(data.report);
      } catch (error: any) {
        console.error("加载报告失败:", error);
        setError(error.message || "加载报告失败");
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [sessionId]);

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📊</div>
          <div className="text-xl text-gray-600">生成复盘报告中...</div>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl text-red-600">{error || "报告不存在"}</div>
          <button
            onClick={() => router.push("/mock-interview/config")}
            className="mt-6 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            返回重新面试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            📊 面试复盘报告
          </h1>
          <p className="text-xl text-gray-600">
            全方位分析你的面试表现，助你持续提升
          </p>
        </div>

        {/* 综合得分 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <div className="text-center mb-8">
            <div className="text-8xl font-bold text-primary mb-4">
              {report.score.overall}
            </div>
            <div className="text-2xl text-gray-600">综合得分</div>
          </div>

          {/* 维度雷达图 */}
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={prepareRadarData(report.score)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="你的得分"
                  dataKey="score"
                  stroke="#0052D9"
                  fill="#0052D9"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 总体反馈 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">💬</span>
            总体反馈
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {report.overallFeedback}
          </p>
        </div>

        {/* 改进建议 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">💡</span>
            改进建议
          </h2>
          <ul className="space-y-4">
            {report.improvementSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-primary font-bold">{index + 1}.</span>
                <span className="text-lg text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 逐题精评 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">📝</span>
            逐题精评
          </h2>

          <div className="space-y-8">
            {report.questionReviews.map((review, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-2xl p-6">
                {/* 题目头部 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-primary">
                    第 {review.questionIndex + 1} 题
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {review.score} 分
                  </div>
                </div>

                {/* 问题与回答 */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">面试官提问：</div>
                    <div className="p-4 bg-gray-50 rounded-xl text-gray-800">
                      {review.question}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">你的回答：</div>
                    <div className="p-4 bg-blue-50 rounded-xl text-gray-800">
                      {review.answer}
                    </div>
                  </div>
                </div>

                {/* 亮点与不足 */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm font-semibold text-green-700 mb-2">✅ 回答亮点</div>
                    <ul className="space-y-1">
                      {review.highlights.map((highlight, i) => (
                        <li key={i} className="text-sm text-green-600">
                          • {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-700 mb-2">⚠️ 回答不足</div>
                    <ul className="space-y-1">
                      {review.gaps.map((gap, i) => (
                        <li key={i} className="text-sm text-red-600">
                          • {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 优化话术示范（核心功能） */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <div className="text-lg font-bold text-green-800 mb-3">
                    💎 优化话术示范（满分参考回答）
                  </div>
                  <div className="text-gray-800 leading-relaxed">
                    {review.suggestedAnswer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="text-center space-y-4">
          <button
            onClick={() => router.push("/mock-interview/config")}
            className="px-12 py-5 rounded-2xl text-xl font-bold bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            🔄 再次模拟面试
          </button>
          <div>
            <button
              onClick={() => router.push("/")}
              className="px-8 py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 辅助函数：准备雷达图数据
// ============================================

function prepareRadarData(score: InterviewScore) {
  return [
    { dimension: "逻辑思维", score: score.dimensions.logicalThinking },
    { dimension: "语言表达", score: score.dimensions.languageExpression },
    { dimension: "专业技能", score: score.dimensions.professionalSkills },
    { dimension: "岗位匹配度", score: score.dimensions.jobMatch },
    { dimension: "抗压能力", score: score.dimensions.stressResistance },
  ];
}
