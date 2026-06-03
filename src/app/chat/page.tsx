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
  isError?: boolean;
  followUpQuestions?: string[];
  knowledgeSources?: string[];
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
// 本地知识库（静态部署兜底方案）
// ============================================

const LOCAL_KNOWLEDGE: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["秋招", "大三", "准备", "什么时候", "晚了", "晚吗", "太晚"],
    answer: "**大三开始准备秋招完全来得及！** 🎯\n\n一般来说，秋招的准备时间线建议：\n\n1. **大三寒假（1-2月）**：确定求职方向，梳理技能栈，开始刷算法题\n2. **大三下学期（3-5月）**：做1-2个高质量项目，准备实习简历，参加暑期实习招聘\n3. **大三暑假（6-8月）**：如果有暑期实习，努力拿转正 offer；同时准备秋招笔试面试\n4. **大四上学期（9-11月）**：全力冲刺秋招，海投简历，参加笔试面试\n\n> 关键是 **有目标、有计划地准备**，而不是盲目焦虑。做好技术基础+项目经历，秋招完全可以斩获满意的 Offer！\n\n💡 建议从现在开始：每天刷2道算法题 + 每周输出1篇技术博客 + 优化简历中的项目描述。",
  },
  {
    keywords: ["实习", "非技术", "产品", "运营", "市场", "人力", "设计"],
    answer: "**非技术岗找实习的实用攻略** 💼\n\n### 核心渠道\n- **实习僧 / BOSS直聘**：非技术岗岗位最多的平台\n- **牛客网**：互联网公司校招信息集中\n- **公司官网**：腾讯/阿里/字节等大厂都开放实习生投递\n- **内推**：学长学姐、校友群、导师推荐\n\n### 简历准备要点\n- 用 **STAR法则** 描述校园活动和项目经历\n- 突出 **数据成果**（如组织过百人活动、运营账号达到X粉丝）\n- 针对不同岗位 **定制化简历**\n\n### 面试准备\n- 产品岗：熟悉竞品分析、用户调研方法\n- 运营岗：准备活动策划案例、数据复盘经验\n- HR岗：了解劳动法基础、熟悉招聘流程\n\n> 💡 大三下学期（3-5月）是找暑期实习的黄金期，拿到实习转正 offer 秋招会轻松很多！",
  },
  {
    keywords: ["腾讯", "转正", "留用", "return", "实习转正"],
    answer: "**腾讯实习生转正机会详解** 🐧\n\n### 转正概率\n- 腾讯实习生转正率 **整体在50%-70%** 左右，不同部门差异较大\n- 热门部门（如WXG、IEG）竞争激烈，转正难度相对更高\n- 研发类岗位转正率通常高于非技术岗\n\n### 如何提高转正概率\n1. **高质量完成导师分配的任务**，主动承担更多\n2. **多和团队成员交流**，展现你的学习能力和团队协作\n3. **输出技术文档/总结**，体现你的专业素养\n4. **主动汇报工作进展**，让 leader 看到你的成长\n5. **融入团队文化**，参加团队活动\n\n### 转正评估标准\n- **工作能力**（40%）：代码质量/方案设计/问题解决\n- **学习成长**（25%）：学习速度、主动性\n- **团队协作**（20%）：沟通、配合、文化契合\n- **潜力评估**（15%）：综合判断、发展空间\n\n> 💡 即使没能转正，腾讯实习经历也是秋招简历的巨大加分项！",
  },
  {
    keywords: ["简历", "项目", "STAR", "描述", "写", "撰写", "经历"],
    answer: "**简历项目经历撰写指南** 📝\n\n### STAR法则模板\n> **S**ituation（背景）→ **T**ask（任务）→ **A**ction（行动）→ **R**esult（成果）\n\n### 示例\n❌ 负责了公司的前端开发工作\n✅ 作为前端负责人，主导了电商小程序从0到1的开发（S），需在3个月内上线支持双十一大促（T）。采用 Taro + TypeScript 技术栈，设计了可复用组件库，实现首屏加载时间降低40%（A）。最终项目如期上线，双十一期间日均PV达10万+，转化率提升15%（R）。\n\n### 量化你的成果\n- 用 **具体数字** 代替模糊描述\n- 如：「提升了性能」→「首屏加载时间降低40%」\n- 如：「优化了体验」→「用户留存率提升12%」\n\n### 排版技巧\n- 一个项目用 **3-5个要点** 描述\n- 每个要点控制在 **1-2行**\n- 技术栈和成果数据 **加粗突出**\n\n> 💡 面试官平均看一份简历只有 **6-10秒**，确保最有价值的信息在最显眼的位置！",
  },
  {
    keywords: ["算法", "面试", "面经", "技术面", "笔试", "LeetCode", "刷题"],
    answer: "**腾讯技术面试算法题攻略** 🧮\n\n### 腾讯算法面试特点\n- 难度 **中等偏上**，LeetCode Medium 为主，偶尔 Hard\n- 更看重 **解题思路**，不要求最优解\n- 喜欢考 **实际场景应用**，不只是纯算法题\n\n### 高频题型\n1. **数组/字符串**：双指针、滑动窗口、前缀和\n2. **树/图**：层序遍历、DFS/BFS、最近公共祖先\n3. **动态规划**：背包问题、最长子序列、区间DP\n4. **链表**：反转、合并、快慢指针\n5. **二分查找**：边界条件、旋转数组\n\n### 准备建议\n- 刷完 **LeetCode Hot 100** + **剑指Offer 67题**\n- 每道题 **先想思路再写代码**，控制在20分钟内\n- 重点练习 **手写代码能力**（白板/在线编辑器）\n- 了解 **时间复杂度分析** 的表达方式\n\n> 💡 腾讯一面通常有1-2道算法题，二面可能有系统设计题，三面偏综合能力考察。",
  },
  {
    keywords: ["薪资", "待遇", "工资", "收入", "包", "年薪", "Offer"],
    answer: "**互联网大厂校招薪资参考** 💰\n\n### 2025届校招薪资范围（仅供参考）\n| 公司 | 研发(本科) | 研发(硕士) | 非技术岗 |\n|------|-----------|-----------|--------|\n| 腾讯 | 18-22W | 25-35W | 15-22W |\n| 字节跳动 | 20-25W | 28-38W | 16-24W |\n| 阿里巴巴 | 18-23W | 25-32W | 15-20W |\n| 美团 | 16-20W | 22-28W | 14-18W |\n| 华为 | 15-22W | 22-30W | 13-18W |\n\n### 薪资构成\n- **月薪** × 14-16个月（年终奖视绩效而定）\n- **签字费**：优秀候选人可能有 3-8W\n- **股票/期权**：部分公司有 RSU/期权激励\n- **补贴**：餐补、交通补、租房补贴等\n\n### 谈薪技巧\n1. **不要先报价**，让对方先给范围\n2. 用 **其他 Offer** 作为谈判筹码\n3. 关注 **总包** 而不只是月薪\n4. 了解 **绩效体系** 对实际收入的影响\n\n> 💡 大厂校招薪资每年都有浮动，具体以当年招聘公告为准。多拿几个 Offer 才有谈判空间！",
  },
  {
    keywords: ["WXG", "IEG", "事业群", "部门", "哪个", "好", "选择", "PCG", "CSIG"],
    answer: "**腾讯主要事业群介绍** 🏢\n\n### 核心事业群\n- **WXG（微信事业群）**：微信生态，技术氛围极佳，转正率高，是很多候选人的首选\n- **IEG（互动娱乐事业群）**：游戏业务，薪资高、福利好，但加班相对较多\n- **CSIG（云与智慧产业事业群）**：腾讯云、政务、企业服务，业务增长快\n- **PCG（平台与内容事业群）**：QQ、浏览器、信息流，业务调整较多\n- **TEG（技术工程事业群）**：基础技术支撑，稳定性高，适合做底层技术\n\n### 如何选择\n1. **技术成长**：WXG > TEG > CSIG > IEG > PCG\n2. **薪资待遇**：IEG > WXG > CSIG > TEG > PCG\n3. **工作生活平衡**：TEG > WXG > PCG > CSIG > IEG\n4. **业务稳定性**：WXG > TEG > IEG > CSIG > PCG\n\n> 💡 选择事业群时，建议优先考虑 **导师和团队** 而不只是 BG 的名气。好的导师比好的 BG 更重要！",
  },
  {
    keywords: ["STAR", "法则", "面试技巧", "自我介绍", "回答", "结构化", "表达"],
    answer: `**面试中的STAR法则运用指南** ⭐

### STAR法则拆解
- **S**ituation（情景）：描述当时的背景和挑战
- **T**ask（任务）：你需要解决的问题或目标
- **A**ction（行动）：你采取了哪些具体行动（重点）
- **R**esult（结果）：最终取得了什么成果（量化）

### 面试话术模板
> "在我的XX项目中（S），我们需要解决XX问题（T）。我负责XX，采用了XX方案，具体做了1...2...3...（A）。最终实现了XX效果，数据提升了XX%（R）。"

### 应用场景
- **项目经历介绍**：用 STAR 讲述每个项目
- **行为面试题**：如「请讲一次你解决冲突的经历」
- **失败经历**：讲失败后如何复盘改进

### 注意事项
- **A 是核心**，占回答时间的 60%
- 多用 **第一人称**，体现你的贡献
- **R 必须量化**，没有数据就没有说服力
- 控制每个回答在 **2-3分钟** 内

> 💡 面试前准备 5-8 个 STAR 故事，可以覆盖 80% 的行为面试题！`,
  },
  {
    keywords: ["产品经理", "PM", "技术", "懂", "需要", "要不要"],
    answer: `**产品经理需要懂技术吗？** 🤔

### 答案是：**需要，但不需要精通**

### 不同级别的技术要求
- **基础了解**：能看懂技术文档、理解API概念、知道前后端交互逻辑
- **沟通协作**：能和开发有效沟通需求、理解技术可行性和开发周期
- **数据分析**：会用 SQL、Excel 做基础的数据查询和分析

### 不需要掌握的
- 不需要会写生产代码
- 不需要会复杂的架构设计
- 不需要会运维部署

### 懂技术的优势
1. **需求评审更顺畅**：减少因理解偏差导致的返工
2. **估算更准确**：能判断开发给出的工时是否合理
3. **创新更有方向**：知道技术能做到什么边界
4. **赢得开发尊重**：不被认为是「外行指挥内行」

> 💡 如果你是技术背景转产品，这是你的优势！在面试中突出你的技术理解力 + 用户思维的结合。`,
  },
  {
    keywords: ["安居计划", "住房", "公积金", "福利", "补贴", "待遇"],
    answer: `**腾讯安居计划简介** 🏠

### 什么是安居计划
腾讯为正式员工提供的 **无息购房借款** 福利计划，帮助员工在一线/新一线城市购房安家。

### 基本条件
- 入职满 **一定年限**（通常2-3年）
- 在工作城市或指定城市购买首套房
- 借款额度与职级和服务年限挂钩

### 额度范围（仅供参考）
- 初级员工：约 **10-20万**
- 中级员工：约 **20-40万**
- 高级员工：约 **40-90万**

### 其他住房福利
- **租房补贴**：部分城市/部门提供
- **住房公积金**：按最高比例缴纳
- **搬迁补贴**：入职时的安家费用

### 申请流程
1. 达到资格条件后提交申请
2. 公司审核（职级 + 服务年限）
3. 签署借款协议
4. 按月从工资中扣除还款（通常5-10年）

> 💡 安居计划是腾讯比较有特色的福利之一，但具体政策会调整，建议入职后咨询HR获取最新信息。`,
  },
];

/**
 * 本地知识库匹配：根据用户问题关键词匹配最佳回答
 */
function getLocalAnswer(question: string): { content: string; followUpQuestions: string[]; knowledgeSources: string[] } {
  const q = question.toLowerCase();
  let bestMatch = LOCAL_KNOWLEDGE[0];
  let bestScore = 0;

  for (const item of LOCAL_KNOWLEDGE) {
    const score = item.keywords.reduce((s, kw) => s + (q.includes(kw.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // 如果匹配度太低，返回通用回答
  if (bestScore === 0) {
    return {
      content: `感谢你的提问！关于「${question}」，我目前暂时没有相关的本地知识储备。\n\n不过我可以帮你解答以下热门话题：\n- 大厂面试准备和算法刷题\n- 简历优化和项目经历撰写\n- 校招时间线和投递策略\n- 薪资待遇和谈薪技巧\n- 腾讯各事业群介绍\n\n💡 **试试点击下方推荐问题**，或者换个关键词再问我吧！`,
      followUpQuestions: ["腾讯面试流程是什么？", "简历项目经历怎么写？", "校招什么时候开始准备？"],
      knowledgeSources: ["本地知识库"],
    };
  }

  return {
    content: bestMatch.answer,
    followUpQuestions: ["还想了解什么？", "腾讯薪资待遇怎么样？", "面试中如何运用STAR法则？"],
    knowledgeSources: ["本地知识库"],
  };
}

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
      // 本地知识库模式（静态部署兜底方案）
      const localResult = getLocalAnswer(userMessage.content);

      // 模拟短暂延迟以提升体验
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: localResult.content,
        timestamp: Date.now(),
        followUpQuestions: localResult.followUpQuestions || [],
        knowledgeSources: localResult.knowledgeSources || []
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
  }, [input, isTyping]);

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
