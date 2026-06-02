"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cleanAIResponse } from "@/lib/textCleaner";

// ============================================
// 类型定义
// ============================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isError?: boolean;               // 是否为错误提示消息
  followUpQuestions?: string[];  // AI生成的追问引导问题
  knowledgeSources?: string[];    // 引用的知识来源
}

interface ChatRequest {
  messages: { role: string; content: string }[];
  userProfile?: UserProfile;
  sessionId?: string;
}

interface UserProfile {
  basicInfo: {
    grade: string;
    major: string;
    expectedPosition: string;
  };
}

// ============================================
// 猜你想问问题库（场景化快捷提问）
// ============================================

const GUESS_QUESTIONS = [
  "大三现在开始准备秋招晚吗？",
  "非技术岗实习怎么找？",
  "腾讯实习生有转正机会吗？",
  "简历项目经历怎么写才吸引人？",
  "腾讯面试会问哪些算法题？",
  "校招薪资待遇怎么样？",
  "WXG和IEG哪个事业群更好？",
  "面试中如何运用STAR法则？",
  "产品经理需要懂技术吗？",
  "腾讯的安居计划是什么？"
];

// ============================================
// 主组件
// ============================================

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `你好！我是你的 **AI求职成长顾问** 🤖

我可以帮你解答关于腾讯及互联网大厂求职的问题，并结合你的个人情况（年级、专业、求职意向）提供精准建议。

### 你可以问我：
- **简历撰写**：如何用STAR法则描述项目经历？
- **面试准备**：腾讯技术面会问什么算法题？
- **实习申请**：大三现在开始准备秋招晚吗？
- **薪资福利**：腾讯校招薪资待遇怎么样？

### 为了给你更精准的建议，请告诉我：
1. 你是大几的学生？
2. 你的专业是什么？
3. 你想投递什么岗位？

💡 **试试直接点击下面的问题**，或直接在输入框提问！`,
      timestamp: Date.now(),
      followUpQuestions: GUESS_QUESTIONS.slice(0, 5)
    },
  ]);
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);  // 会话ID（用于去重）
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const guessScrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 发送消息
  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // 调用后端API（集成OpenAI + RAG）
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content
          })),
          sessionId: sessionId,
          // TODO: 从全局状态获取用户画像
          // userProfile: getUserProfileFromContext()
        } as ChatRequest),
      });

      if (!response.ok) {
        // 尝试解析错误响应体，获取详细错误信息
        let errorMsg = `请求失败 (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (parseError) {
          errorMsg = `请求失败: ${response.statusText || response.status}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // 检查返回的数据格式
      if (!data.success) {
        throw new Error(data.error || data.message || '服务返回错误');
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.data.content,
        timestamp: Date.now(),
        followUpQuestions: data.data.followUpQuestions || [],
        knowledgeSources: data.data.knowledgeSources || []
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      
      // 根据错误类型显示不同的友好提示
      let errorContent = "AI 助手暂时开小差了，请稍后再试~";
      
      if (error.message.includes('503') || error.message.includes('未配置') || error.message.includes('AI服务')) {
        errorContent = "AI 服务当前未接入，暂时使用本地知识库模式为你解答。如需完整的 AI 体验，请联系管理员配置 API Key。";
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        errorContent = "服务暂时不可用，正在维护中。请稍后再试~";
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        errorContent = "服务器暂时繁忙，工程师正在处理中。请稍后重试~";
      } else if (error.message.includes('网络') || error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        errorContent = "网络连接异常，请检查网络后重试~";
      } else if (error.message.includes('超时') || error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorContent = "AI 正在思考中，但响应超时了。请换个简短的问题再试~";
      }
      
      // 错误时显示兜底回复
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: errorContent,
        timestamp: Date.now(),
        isError: true,
        followUpQuestions: ["换个问题试试？", "腾讯面试流程是什么？", "如何准备技术面试？"]
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 点击"猜你想问"或"追问引导"问题时，自动填充输入框并发送
  const handleQuickQuestion = useCallback((question: string) => {
    setInput(question);
    inputRef.current?.focus();
    // 自动发送（延迟100ms确保输入框已更新）
    setTimeout(() => {
      handleSend();
    }, 100);
  }, [handleSend]);

  // 横向滚动"猜你想问"（鼠标滚轮横向滚动）
  const handleGuessWheel = useCallback((e: React.WheelEvent) => {
    if (guessScrollRef.current) {
      e.preventDefault();
      guessScrollRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card-bg/80 backdrop-blur-md sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white text-xl">
              🤖
            </div>
            <div>
              <h1 className="font-bold text-lg">智能求职顾问</h1>
              <p className="text-text-secondary text-xs">AI 成长伙伴在线答疑</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-success">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            在线
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] ${
                      message.role === "user"
                        ? "bg-primary text-white rounded-2xl rounded-tr-md"
                        : message.isError
                        ? "bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-md"
                        : "bg-card-bg border border-border rounded-2xl rounded-tl-md"
                    } px-5 py-3.5 shadow-sm`}
                  >
                    <div className="text-sm md:text-base leading-relaxed prose prose-sm max-w-none">
                      {message.role === "assistant" ? (
                        <ReactMarkdown>
                          {cleanAIResponse(message.content)}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>

                    {/* 知识来源引用 */}
                    {message.role === "assistant" && message.knowledgeSources && message.knowledgeSources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-text-secondary">
                          📚 参考：{message.knowledgeSources.join("、")}
                        </p>
                      </div>
                    )}

                    {/* 追问引导问题 */}
                    {message.role === "assistant" && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.followUpQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickQuestion(q)}
                            className="px-3 py-1.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      className={`text-xs mt-2 ${
                        message.role === "user" ? "text-white/60" : "text-text-secondary"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 打字中指示器 */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-card-bg border border-border rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 猜你想问（横向滑动气泡） - 仅在对话开始时显示 */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <p className="text-text-secondary text-sm mb-3 text-center">💡 猜你想问：</p>
              <div 
                ref={guessScrollRef}
                onWheel={handleGuessWheel}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {GUESS_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(q)}
                    className="px-4 py-2 rounded-full text-sm bg-card-bg border border-border hover:border-primary hover:text-primary transition-all duration-300 whitespace-nowrap flex-shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="text-text-secondary text-xs mt-2 text-center opacity-60">
                ← 左右滑动查看更多问题 →
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card-bg/80 backdrop-blur-md sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题，或点击上面的问题..."
                disabled={isTyping}
                className="w-full px-5 py-3.5 rounded-2xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 text-sm md:text-base pr-12 disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-primary/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-text-secondary text-xs mt-2 text-center">
            AI 生成内容仅供参考，重要决策请以官方信息为准
          </p>
        </div>
      </div>
    </div>
  );
}
