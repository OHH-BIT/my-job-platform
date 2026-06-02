"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// ============================================
// 类型定义
// ============================================

interface Message {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
}

interface QuestionItem {
  id: string;
  question: string;
  type: string;
  isFollowUp?: boolean;
  parentId?: string;
}

// ============================================
// AI 模拟面试舱 - 对话页面（重构版）
// ============================================

export default function MockInterviewChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // 题库状态
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [phase, setPhase] = useState<"loading" | "interviewing" | "completed">("loading");

  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ============================================
  // 加载面试会话
  // ============================================

  useEffect(() => {
    if (!sessionId) return;

    const loadSession = async () => {
      try {
        // 优先从 localStorage 恢复
        const saved = localStorage.getItem(`interview_${sessionId}`);
        if (saved) {
          const data = JSON.parse(saved);
          setQuestions(data.questions || []);
          setCurrentIndex(data.currentIndex || 0);
          setMessages(data.messages || []);
          setPhase("interviewing");
          return;
        }

        // 从 API 加载会话（通过 start API 返回的 firstQuestion 判断）
        // 题目已预生成并存在 session 中
        const response = await fetch("/api/mock-interview/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setQuestions(data.questions || []);
            setMessages(data.messages || []);
            setCurrentIndex(data.currentQuestionIndex || 0);
            setPhase("interviewing");
            return;
          }
        }

        // 降级：如果有预生成题目（通过 URL params 传递），使用它们
        setPhase("interviewing");
      } catch (err) {
        console.error("加载会话失败:", err);
        setError("加载面试会话失败，请返回重新开始");
      }
    };

    loadSession();
  }, [sessionId]);

  // 保存状态到 localStorage
  const saveState = useCallback(() => {
    localStorage.setItem(
      `interview_${sessionId}`,
      JSON.stringify({ questions, currentIndex, messages })
    );
  }, [sessionId, questions, currentIndex, messages]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // ============================================
  // 提交回答
  // ============================================

  const handleSubmitAnswer = async () => {
    if (!inputMessage.trim() || isLoading || isCompleted) return;

    const answer = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    // 添加候选人消息
    const candidateMsg: Message = {
      id: `msg_${Date.now()}`,
      role: "candidate",
      content: answer,
      timestamp: Date.now(),
    };
    const newMessages = [...messages, candidateMsg];
    setMessages(newMessages);

    try {
      // 调用回答 API（SSE 流式）
      const response = await fetch("/api/mock-interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: answer,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      // 解析 SSE 流
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.chunk) {
                  fullContent += data.chunk;
                  setStreamingText(fullContent);
                } else if (data.done) {
                  fullContent = data.fullContent || fullContent;
                } else if (data.error) {
                  throw new Error(data.error);
                } else if (data.isCompleted) {
                  // 面试结束
                  setIsCompleted(true);
                  setPhase("completed");
                  setTimeout(() => {
                    router.push(`/mock-interview/report/${sessionId}`);
                  }, 1500);
                  setIsLoading(false);
                  setStreamingText("");
                  return;
                }
              } catch (parseErr) {
                if (parseErr.message && !parseErr.message.includes("JSON")) {
                  throw parseErr;
                }
              }
            }
          }
        }
      }

      // 添加面试官回复
      const interviewerMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "interviewer",
        content: fullContent,
        timestamp: Date.now(),
      };

      setMessages([...newMessages, interviewerMsg]);
      setCurrentIndex((prev) => prev + 1);
      setStreamingText("");
    } catch (err: any) {
      console.error("发送回答失败:", err);
      setError(err.message || "发送失败，请重试");
      setMessages(messages); // 回滚
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // 结束面试
  // ============================================

  const handleEndInterview = async () => {
    if (!confirm("确定要结束面试吗？提前结束将基于已答题生成报告。")) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/mock-interview/complete/${sessionId}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error(`结束失败: ${response.status}`);

      setIsCompleted(true);
      setPhase("completed");
      localStorage.removeItem(`interview_${sessionId}`);

      setTimeout(() => {
        router.push(`/mock-interview/report/${sessionId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "结束面试失败");
      setIsLoading(false);
    }
  };

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  // 当前题目
  const currentQuestion = currentIndex < questions.length ? questions[currentIndex] : null;

  // ============================================
  // 渲染
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/80 px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/mock-interview/config")}
              className="text-gray-500 hover:text-gray-800 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AI 模拟面试</h1>
            </div>
          </div>

          {/* 进度条 */}
          {phase === "interviewing" && questions.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(((currentIndex) / questions.length) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {Math.min(currentIndex + 1, questions.length)} / {questions.length}
                </span>
              </div>
              <button
                onClick={handleEndInterview}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                结束面试
              </button>
            </div>
          )}

          {phase === "loading" && (
            <span className="text-sm text-gray-500">准备中...</span>
          )}
          {phase === "completed" && (
            <span className="text-sm text-green-600 font-medium">面试已结束</span>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container mx-auto max-w-3xl">

          {/* === 加载状态 === */}
          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">AI 面试官正在准备中</h2>
              <p className="text-gray-500 text-center max-w-md">
                正在根据您的简历和岗位要求定制专属面试题...
              </p>
              <div className="flex gap-1 mt-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* === 面试进行中 === */}
          {phase === "interviewing" && (
            <div className="space-y-6">
              {/* 当前题目高亮卡片 */}
              {currentQuestion && (
                <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mt-0.5">
                      Q{currentIndex + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                          {currentQuestion.type || "综合考察"}
                        </span>
                        {currentQuestion.isFollowUp && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                            追问
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 text-lg leading-relaxed font-medium">
                        {currentQuestion.question}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 已回答的消息流 */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "candidate" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      message.role === "interviewer"
                        ? "bg-white shadow-md border border-gray-100"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">
                        {message.role === "interviewer" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                            <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-xs font-medium ${message.role === "candidate" ? "text-blue-100" : "text-gray-500"}`}>
                        {message.role === "interviewer" ? "AI 面试官" : "你"}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 ${message.role === "candidate" ? "text-blue-200" : "text-gray-400"}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {/* 流式消息（AI正在生成） */}
              {streamingText && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white shadow-md border border-gray-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                      </svg>
                      <span className="text-xs font-medium text-gray-500">AI 面试官</span>
                      <span className="text-xs text-blue-500 animate-pulse">正在思考...</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px] text-gray-800">
                      {streamingText}
                      <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                    </div>
                  </div>
                </div>
              )}

              {/* 加载指示器 */}
              {isLoading && !streamingText && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-md border border-gray-100 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                      </svg>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-2 text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    <div>
                      <div className="font-medium text-sm">出错了</div>
                      <div className="text-sm text-red-600 mt-0.5">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* === 面试结束 === */}
          {phase === "completed" && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">面试已完成</h2>
              <p className="text-gray-500">正在生成复盘报告，即将跳转...</p>
            </div>
          )}
        </div>
      </div>

      {/* 输入区域 */}
      {phase === "interviewing" && !isCompleted && (
        <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-4 sticky bottom-0">
          <div className="container mx-auto max-w-3xl">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    currentQuestion
                      ? `回答第 ${currentIndex + 1} 题...（Enter 发送，Shift+Enter 换行）`
                      : "输入你的回答..."
                  }
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none disabled:bg-gray-50 disabled:text-gray-400 text-[15px]"
                />
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!inputMessage.trim() || isLoading}
                  className={`px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                    !inputMessage.trim() || isLoading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9z" />
                    </svg>
                    提交回答
                  </div>
                </button>
                <button
                  onClick={handleEndInterview}
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all disabled:opacity-50"
                >
                  结束面试
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
