"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { JOB_POSITIONS } from "@/lib/job-matching";

// ============================================
// AI 模拟面试舱 - 配置页面
// ============================================

export default function MockInterviewConfigPage() {
  const router = useRouter();

  // 表单状态
  const [config, setConfig] = useState({
    targetJobId: "frontend",
    type: "technical" as const,
    difficulty: "medium" as const,
    questionCount: 5,
  });

  const [userProfile, setUserProfile] = useState({
    resumeText: "",
    basicInfo: {
      grade: "大三",
      major: "计算机科学与技术",
      school: "某某大学",
      targetPosition: "前端开发工程师",
    },
    skills: ["JavaScript", "React", "CSS"],
    projects: ["校园二手交易平台", "个人博客系统"],
    abilityTestResult: null,
  });

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理表单提交
  const handleStartInterview = async () => {
    setIsStarting(true);
    setError(null);

    try {
      // === 新增：先调用 AI 动态出题 ===
      let generatedQuestions: Array<{ id: string; question: string; type: string }> = [];
      
      try {
        const genResponse = await fetch(`${API_BASE_URL}/api/ai-interview/generate-questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobPosition: config.targetJobId,
            interviewType: config.type,
            difficultyLevel: config.difficulty,
            resumeText: userProfile.resumeText,
            questionCount: config.questionCount,
          }),
        });

        if (genResponse.ok) {
          const genData = await genResponse.json();
          if (genData.success && genData.questions?.length > 0) {
            generatedQuestions = genData.questions;
          }
        }
      } catch (genError) {
        console.warn("AI 出题失败，将使用实时出题模式:", genError);
      }

      // === 调用启动面试 API（传入预生成题目） ===
      const response = await fetch(`${API_BASE_URL}/api/mock-interview/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config,
          userProfile,
          preGeneratedQuestions: generatedQuestions.length > 0 ? generatedQuestions : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const msg = errorData?.error || `启动面试失败: ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "启动面试失败");
      }

      // 跳转到面试对话页面
      router.push(`/mock-interview/chat/${data.sessionId}`);
    } catch (error: any) {
      console.error("启动面试失败:", error);
      setError(error.message || "启动面试失败，请重试");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎯 AI 模拟面试舱
          </h1>
          <p className="text-xl text-gray-600">
            智能模拟腾讯面试流程，助你轻松拿Offer
          </p>
        </div>

        {/* 配置表单 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            面试配置
          </h2>

          <div className="space-y-6">
            {/* 目标岗位 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                目标岗位
              </label>
              <select
                value={config.targetJobId}
                onChange={(e) =>
                  setConfig({ ...config, targetJobId: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
              >
                {JOB_POSITIONS.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.department}
                  </option>
                ))}
              </select>
            </div>

            {/* 面试类型 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                面试类型
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "behavioral", label: "行为面试", icon: "💬" },
                  { value: "technical", label: "技术面试", icon: "💻" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setConfig({ ...config, type: option.value as any })
                    }
                    className={`p-4 rounded-xl border-2 transition-all ${
                      config.type === option.value
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-semibold">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 难度等级 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                难度等级
              </label>
              <div className="space-y-3">
                {[
                  {
                    value: "easy",
                    label: "初级（友好宽松）",
                    description: "适合面试新手，问题简单，多鼓励",
                  },
                  {
                    value: "medium",
                    label: "中级（标准难度）",
                    description: "还原真实面试场景，正常追问",
                  },
                  {
                    value: "stress",
                    label: "压力面（高压挑战）",
                    description: "适度质疑，考验抗压与应变能力",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setConfig({ ...config, difficulty: option.value as any })
                    }
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      config.difficulty === option.value
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 题目数量 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                题目数量：{config.questionCount} 题
              </label>
              <input
                type="range"
                min="3"
                max="10"
                value={config.questionCount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    questionCount: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>3题（快速体验）</span>
                <span>10题（完整模拟）</span>
              </div>
            </div>
          </div>
        </div>

        {/* 简历信息（可选） */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">📄</span>
            简历信息（可选）
          </h2>
          <p className="text-gray-600 mb-4">
            粘贴你的简历文本，AI 面试官将基于你的经历进行个性化提问
          </p>
          <textarea
            value={userProfile.resumeText}
            onChange={(e) =>
              setUserProfile({ ...userProfile, resumeText: e.target.value })
            }
            placeholder="请粘贴你的简历文本..."
            className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3 text-red-700">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold">启动面试失败</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 开始面试按钮 */}
        <div className="text-center">
          <button
            onClick={handleStartInterview}
            disabled={isStarting}
            className={`px-12 py-5 rounded-2xl text-xl font-bold text-white transition-all duration-300 ${
              isStarting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-primary to-purple-600 hover:shadow-2xl hover:-translate-y-1"
            }`}
          >
            {isStarting ? (
              <span className="flex items-center gap-3">
                <span className="animate-spin">⏳</span>
                AI 面试官正在根据您的简历定制专属考题...
              </span>
            ) : (
              <span>🚀 开始模拟面试</span>
            )}
          </button>
          <p className="text-sm text-gray-600 mt-4">
            预计耗时 {config.questionCount * 3}-{config.questionCount * 5} 分钟
          </p>
        </div>
      </div>
    </div>
  );
}
