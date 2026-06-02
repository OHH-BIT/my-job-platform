"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 预设的AI回复话术
const PRESET_RESPONSES: Record<string, string> = {
  "腾讯福利": "腾讯的福利待遇非常优厚！主要包括：\n1. 安居计划：提供购房补贴和无息借款\n2. 免费三餐：公司食堂提供免费的一日三餐\n3. 健康检查：年度全面体检和健康咨询\n4. 带薪年假：每年10-20天带薪年假\n5. 节日福利：各类节日礼品和奖金\n6. 团队建设：定期的团队活动经费",
  "薪资": "腾讯的薪资水平在行业内非常有竞争力！一般来说：\n• 应届生：年薪30-60万（根据岗位和学历）\n• 开发岗：普遍高于产品岗\n• 年终奖：3-6个月工资\n• 股票激励：优秀员工可获得股票期权\n具体薪资会在面试后根据您的能力和表现确定哦！",
  "工作时间": "腾讯倡导work-life balance！\n• 标准工作时间：9:30-18:30（弹性工作制）\n• 每周工作5天，双休\n• 加班情况：项目紧急时可能需要加班，但有加班费或调休\n• 远程办公：部分岗位支持混合办公模式",
  "面试": "腾讯的面试流程一般包括：\n1. 简历筛选：HR初步评估\n2. 笔试：技术岗有在线编程测试\n3. 一面：专业面试官（技术/业务能力）\n4. 二面：交叉面或总监面\n5. HR面：薪资、价值观等综合评估\n6. 终面：部门负责人或VP面\n准备建议：多刷LeetCode，了解腾讯产品，准备项目经验！",
  "岗位": "腾讯有非常多的岗位类型！主要包括：\n• 技术类：前端、后端、算法、测试、运维\n• 产品类：产品经理、产品运营、数据分析\n• 设计类：UI设计、交互设计、视觉设计\n• 市场类：市场营销、品牌管理、商务拓展\n• 职能类：人力资源、财务管理、法务合规\n建议根据自己的专业和兴趣选择合适岗位！",
};

// 智能匹配用户问题，返回预设回复
const getAIResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  for (const [keyword, response] of Object.entries(PRESET_RESPONSES)) {
    if (message.includes(keyword.toLowerCase())) {
      return response;
    }
  }
  
  // 默认回复
  return `感谢您的提问！我是鹅厂成长伙伴的AI助手，可以帮您解答关于腾讯招聘、福利待遇、面试流程等问题。请您换个方式提问，或者访问我们的"岗位匹配"页面获取更多信息！😊`;
};

interface Message {
  id: string;  // 改为 string 类型，使用唯一 ID
  role: "user" | "assistant";
  content: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: `msg-${Date.now()}-1`,  // 使用唯一 ID
      role: "assistant",
      content: "你好！我是鹅厂成长伙伴的AI助手 🤖\n有什么可以帮助你的吗？你可以问我关于腾讯招聘、福利、面试等问题哦！"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);  // 用于生成唯一 ID 的计数器

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // 生成唯一的消息 ID
    const userMessageId = `msg-${Date.now()}-${++idCounter.current}`;
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // 模拟AI思考延迟
    setTimeout(() => {
      const aiResponseId = `msg-${Date.now()}-${++idCounter.current}`;
      const aiResponse: Message = {
        id: aiResponseId,
        role: "assistant",
        content: getAIResponse(inputValue)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary text-white shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center text-2xl md:text-3xl z-40 ${
          isOpen ? "hidden" : "flex"
        }`}
        aria-label="打开AI助手"
      >
        🤖
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed z-50 bg-white rounded-2xl shadow-2xl overflow-hidden ${
              isMinimized
                ? "bottom-4 right-4 md:bottom-6 md:right-6 w-72 h-14"
                : "bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-96 h-[100vh] md:h-[600px] md:max-h-[calc(100vh-2rem)] rounded-t-2xl md:rounded-2xl"
            }`}
            style={{ boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }}
          >
            {/* Chat Header */}
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold text-sm">鹅厂AI助手</h3>
                  <p className="text-xs text-white/70">在线 · 随时为您服务</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                  aria-label={isMinimized ? "最大化" : "最小化"}
                >
                  {isMinimized ? "□" : "—"}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-8rem)]">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          message.role === "user"
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md p-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入您的问题..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="发送"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
