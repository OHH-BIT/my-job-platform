"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Target,
  Zap,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-client";
import RadarChart from "./RadarChart";
import GapAnalysisCards from "./GapAnalysisCards";
import MatchResultCards from "./MatchResultCards";

// ============================================
// 类型定义
// ============================================

interface Tag {
  id: string;
  name: string;
  emoji: string;
  category: "skill" | "project" | "position";
  keywords?: string[];
}

interface JobModel {
  positionId: string;
  title: string;
  category: string;
  description: string;
  typicalCompanies: string[];
  salaryRange: string;
}

interface MatchResult {
  positionId: string;
  positionTitle: string;
  matchScore: number;
  matchLevel: "高" | "中" | "低";
  breakdown: {
    requiredMatch: number;
    preferredMatch: number;
    bonusMatch: number;
  };
  matchedTags: Tag[];
  missingRequiredTags: Tag[];
  missingPreferredTags: Tag[];
  recommendedProjects: Tag[];
  reasons: string[];
  suggestions: string[];
}

type TabType = "skill" | "project" | "position";

// ============================================
// 分类配置
// ============================================

const TABS: { key: TabType; label: string; emoji: string; color: string; activeBg: string; activeText: string }[] = [
  { key: "skill", label: "技能", emoji: "⚡", color: "text-violet-600", activeBg: "bg-violet-100", activeText: "text-violet-700" },
  { key: "project", label: "项目经历", emoji: "🚀", color: "text-blue-600", activeBg: "bg-blue-100", activeText: "text-blue-700" },
  { key: "position", label: "目标岗位", emoji: "🎯", color: "text-emerald-600", activeBg: "bg-emerald-100", activeText: "text-emerald-700" },
];

// ============================================
// 技能学习建议库
// ============================================

const LEARNING_SUGGESTIONS: Record<string, string> = {
  python: "🐍 推荐课程：Python Crash Course / 廖雪峰 Python 教程 | 实战：用 Python 爬取一个网站的数据",
  javascript: "⚡ 推荐课程：MDN JavaScript 教程 / freeCodeCamp | 实战：完成 freeCodeCamp 的 5 个项目挑战",
  java: "☕ 推荐课程：黑马程序员 Java / 尚硅谷 Java | 实战：用 Spring Boot 写一个 RESTful API",
  cpp: "⚙️ 推荐课程：《C++ Primer》/ 侯捷 C++ 系列 | 实战：在 LeetCode 刷 50 道 C++ 题",
  go: "🦫 推荐课程：Go by Example / A Tour of Go | 实战：写一个 Go 微服务并部署",
  rust: "🦀 推荐课程：The Rust Book / Rustlings 练习 | 实战：用 Rust 写一个 CLI 工具",
  sql: "🗃️ 推荐课程：SQLZoo / LeetCode 数据库题 | 实战：分析一个真实数据集",
  r: "📊 推荐课程：R for Data Science | 实战：用 R 完成一次统计可视化",
  swift: "🍎 推荐课程：Swift Playgrounds / Stanford CS193p | 实战：开发一个 iOS 小 App",
  kotlin: "🟣 推荐课程：Kotlin 官方教程 / Google Codelabs | 实战：开发一个 Android App",
  react: "⚛️ 推荐课程：React 官方教程 / Next.js Learn | 实战：用 Next.js 搭建个人博客",
  vue: "💚 推荐课程：Vue.js 官方文档 / Vue Mastery | 实战：用 Vue 3 写一个 Todo App",
  nextjs: "▲ 推荐课程：Next.js Learn | 实战：部署一个全栈应用到 Vercel",
  angular: "🅰️ 推荐课程：Angular 官方教程 | 实战：用 Angular 写一个企业管理后台",
  tailwindcss: "🎨 推荐课程：Tailwind CSS 官方文档 | 实战：重写你的项目 UI",
  html_css: "🌐 推荐课程：MDN HTML & CSS 入门 | 实战：像素级还原一个 Dribbble 设计稿",
  typescript: "🔷 推荐课程：TypeScript Handbook | 实战：把你的 JS 项目迁移到 TS",
  springboot: "🍃 推荐课程：尚硅谷 Spring Boot / 黑马 | 实战：写一个电商后端 API",
  nodejs: "🟩 推荐课程：Node.js 官方文档 / The Node.js Handbook | 实战：用 Express 写一个聊天后端",
  django: "🎸 推荐课程：Django 官方教程 / Two Scoops of Django | 实战：写一个博客系统",
  docker: "🐳 推荐课程：Docker 官方入门 / 播客《Docker 从入门到实践》| 实战：Docker 化你的项目并部署",
  k8s: "☸️ 推荐课程：Kubernetes 官方教程 / 马哥 K8s | 实战：用 Minikube 部署一个微服务集群",
  linux: "🐧 推荐课程：鸟哥的 Linux 私房菜 | 实战：在云服务器上搭建 LNMP 环境",
  git: "📦 推荐课程：Pro Git / GitHub Learning Lab | 实战：用 Git Flow 管理一个团队项目",
  pytorch: "🔥 推荐课程：PyTorch 官方教程 / 动手学深度学习 | 实战：训练一个图像分类模型",
  tensorflow: "🧠 推荐课程：TensorFlow 官方教程 | 实战：用 TF 部署一个 ML 模型到生产环境",
  ml: "🤖 推荐课程：吴恩达 ML 课程 / scikit-learn 文档 | 实战：Kaggle 入门竞赛",
  dl: "🔮 推荐课程：李沐《动手学深度学习》| 实战：复现一篇经典论文的模型",
  nlp: "💬 推荐课程：Hugging Face NLP Course | 实战：微调一个中文文本分类模型",
  cv: "👁️ 推荐课程：斯坦福 CS231n | 实战：目标检测 YOLOv8 实战项目",
  data_analysis: "📈 推荐课程：Pandas 官方教程 / 数据分析实战 | 实战：分析一份公开数据集并写报告",
  data_visualization: "📉 推荐课程：ECharts 官方教程 / D3.js 入门 | 实战：做一个数据大屏",
  llm: "✨ 推荐课程：Prompt Engineering Guide / LangChain 文档 | 实战：搭建一个 RAG 问答系统",
  figma: "🎨 推荐课程：Figma 官方教程 / B 站 Figma 设计课 | 实战：设计一个 App 完整 UI",
  photoshop: "🖼️ 推荐课程：B 站 PS 基础教程 | 实战：设计一套社交媒体配图",
  sketch: "✏️ 推荐课程：Sketch 官方教程 | 实战：完成一个 Web App 的 UI 设计",
  after_effects: "🎬 推荐课程：B 站 AE 动效教程 | 实战：做一个 30 秒的 App 演示动画",
  illustrator: "🖌️ 推荐课程：AI 官方教程 / 站酷设计课 | 实战：设计一套品牌视觉",
  blender: "🧊 推荐课程：Blender Guru / B 站 Blender 教程 | 实战：做一个 3D Logo 动画",
  data_structure: "🧩 推荐资源：LeetCode 热题 100 / 代码随想录 | 实战：每天刷 2 道算法题，坚持一个月",
  excel: "📊 推荐课程：Excel Home / 王佩丰 Excel | 实战：用数据透视表分析一份销售数据",
  ppt: "📑 推荐课程：B 站 PPT 设计课 / 锐普 PPT | 实战：做一份产品发布会 PPT",
  writing: "✍️ 推荐资源：人人都是产品经理 / 少数派写作指南 | 实战：在知乎写 5 篇深度回答",
  video_editing: "🎥 推荐课程：B 站 PR/剪映教程 | 实战：剪辑一条 Vlog 或技术教程",
  math: "📐 推荐课程：MIT 18.06 线性代数 / 3Blue1Brown | 实战：参加一次数学建模竞赛",
  math_modeling: "🏆 推荐课程：B 站数学建模教程 / 司守奎教材 | 实战：组队参加一次美赛或国赛",
  acm: "🥇 推荐资源：洛谷 / Codeforces / LeetCode | 实战：每周打一场 CF Div.2",
  kaggle: "🥈 推荐课程：Kaggle Learn / 数据竞赛入门 | 实战：参加 Kaggle 入门赛 Tabular Playground",
  hackathon: "💻 推荐：关注 Devpost / 黑客松中国 | 实战：参加一次 48h 黑客松",
  paper: "📄 推荐资源：arXiv / Google Scholar | 实战：精读 10 篇顶会论文，尝试复现",
  patent: "💡 推荐资源：国家知识产权局官网 | 实战：写一份专利交底书",
  research_project: "🔬 推荐行动：主动联系导师加入课题组 | 实战：完整参与一个科研课题",
  dachuang: "🚀 推荐：关注学校教务处通知 / 大创官网 | 实战：组建团队申报省级以上大创项目",
  innovation_comp: "🌐 推荐：关注互联网+大赛官网 | 实战：打磨一个创新创业项目参赛",
  challenge_cup: "🏅 推荐：关注挑战杯官网 | 实战：用科研或竞赛成果参赛",
  personal_project: "🔧 推荐行动：在 GitHub 上开一个 Side Project | 实战：写一个完整的开源项目并获 Star",
  full_stack_project: "🏗️ 推荐技术栈：Next.js + Prisma + PostgreSQL | 实战：独立上线一个全栈 Web 应用",
  mobile_project: "📱 推荐：用 Flutter 或 React Native | 实战：上线一个小程序到应用商店",
  ai_project: "🤖 推荐平台：Kaggle / Hugging Face | 实战：训练并部署一个 AI 模型",
  data_project: "📊 推荐：Kaggle Datasets / 天池数据集 | 实战：完成一次完整的数据分析项目",
  big_company_intern: "🏢 推荐渠道：牛客网 / 实习僧 / 公司官网 | 实战：至少拿到一个大厂日常实习 Offer",
  startup_intern: "💡 推荐渠道：BOSS 直聘 / 创投圈 | 实战：在创业公司承担核心模块开发",
  student_org: "🤝 推荐行动：竞选学生会/社团干部 | 实战：组织一场百人规模的校园活动",
  volunteer: "❤️ 推荐平台：志愿北京 / 学校志愿中心 | 实战：累计 50+ 小时志愿服务时长",
};

// ============================================
// 主组件
// ============================================

export default function JobMatchPage() {
  // 标签数据
  const [skillTags, setSkillTags] = useState<Tag[]>([]);
  const [projectTags, setProjectTags] = useState<Tag[]>([]);
  const [positionTags, setPositionTags] = useState<Tag[]>([]);
  const [jobModels, setJobModels] = useState<JobModel[]>([]);

  // 用户选择
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>("skill");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);

  // 匹配结果
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedJob, setSelectedJob] = useState<MatchResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ============================================
  // 加载标签数据
  // ============================================

  const loadTags = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/job-match/analyze`);
      const json = await res.json();
      if (json.success) {
        setSkillTags(json.data.skillTags);
        setProjectTags(json.data.projectTags);
        setPositionTags(json.data.positionTags);
        setJobModels(json.data.jobModels);
        setDataLoaded(true);
      }
    } catch (err) {
      console.error("加载标签失败:", err);
    }
  };

  // 初始加载
  useMemo(() => { loadTags(); }, []);

  // ============================================
  // 标签选择操作
  // ============================================

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const clearAll = () => {
    setSelectedTags(new Set());
    setMatchResults([]);
    setSelectedJob(null);
  };

  // ============================================
  // 获取当前分类的标签
  // ============================================

  const currentTags: Tag[] = useMemo(() => {
    const pool = activeTab === "skill" ? skillTags
      : activeTab === "project" ? projectTags
      : positionTags;
    if (!searchQuery.trim()) return pool;
    const q = searchQuery.toLowerCase();
    return pool.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.id.includes(q) ||
        t.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [activeTab, skillTags, projectTags, positionTags, searchQuery]);

  // ============================================
  // 发起匹配分析
  // ============================================

  const handleAnalyze = async () => {
    if (selectedTags.size === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/job-match/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userTagIds: Array.from(selectedTags) }),
      });
      const json = await res.json();
      if (json.success) {
        setMatchResults(json.data.matchResults);
        if (json.data.matchResults.length > 0) {
          setSelectedJob(json.data.matchResults[0]);
        }
      }
    } catch (err) {
      console.error("匹配分析失败:", err);
    }
    setIsAnalyzing(false);
  };

  // ============================================
  // 选中统计
  // ============================================

  const selectedSkillCount = [...selectedTags].filter((id) =>
    skillTags.some((t) => t.id === id)
  ).length;
  const selectedProjectCount = [...selectedTags].filter((id) =>
    projectTags.some((t) => t.id === id)
  ).length;
  const selectedPositionCount = [...selectedTags].filter((id) =>
    positionTags.some((t) => t.id === id)
  ).length;
  const totalSelected = selectedTags.size;

  // ============================================
  // 渲染
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-violet-50/30">
      {/* ========== 顶部 Hero ========== */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-[10%] text-7xl animate-bounce">🎯</div>
          <div className="absolute top-12 right-[15%] text-6xl animate-pulse">⚡</div>
          <div className="absolute bottom-4 left-[30%] text-5xl animate-bounce delay-100">🚀</div>
          <div className="absolute bottom-8 right-[30%] text-6xl animate-pulse delay-200">✨</div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-extrabold text-white mb-3"
          >
            <span className="inline-flex items-center gap-2">
              <Target className="w-8 h-8" />
              AI 画像与岗位匹配
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-blue-100 text-lg max-w-2xl mx-auto"
          >
            选择你的技能、项目和目标岗位，AI 帮你精准匹配最合适的方向！
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mt-5"
          >
            <span className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-sm">
              🏷️ {totalSelected} 个标签已选
            </span>
            <span className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-sm">
              🔍 {jobModels.length} 个岗位模型
            </span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* ========== 标签选择区 ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 overflow-hidden"
        >
          {/* 标题栏 */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  选择你的标签
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  越精准，匹配结果越靠谱哦～
                </p>
              </div>
              <div className="flex items-center gap-2">
                {totalSelected > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    清空
                  </button>
                )}
              </div>
            </div>

            {/* 分类 Tab */}
            <div className="flex items-center gap-1 mt-5 p-1 bg-gray-100 rounded-xl w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? `bg-white ${tab.activeText} shadow-sm`
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.key ? tab.activeBg + " " + tab.activeText : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {tab.key === "skill" ? selectedSkillCount
                      : tab.key === "project" ? selectedProjectCount
                      : selectedPositionCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="px-6 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`搜索${activeTab === "skill" ? "技能" : activeTab === "project" ? "项目经历" : "岗位"}...`}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              />
            </div>
          </div>

          {/* 标签网格 */}
          <div className="px-6 pb-6">
            {!dataLoaded ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-gray-500">加载标签中...</span>
              </div>
            ) : currentTags.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl">🔍</span>
                <p className="mt-2 text-sm">没有找到匹配的标签</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {currentTags.map((tag) => {
                    const isSelected = selectedTags.has(tag.id);
                    return (
                      <motion.button
                        key={tag.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                          isSelected
                            ? activeTab === "skill"
                              ? "bg-violet-100 border-violet-400 text-violet-800 shadow-md shadow-violet-100"
                              : activeTab === "project"
                              ? "bg-blue-100 border-blue-400 text-blue-800 shadow-md shadow-blue-100"
                              : "bg-emerald-100 border-emerald-400 text-emerald-800 shadow-md shadow-emerald-100"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-base">{tag.emoji}</span>
                        <span>{tag.name}</span>
                        {isSelected && (
                          <span className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-current/20 text-[10px]">
                            ✓
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* 分析按钮 */}
          <div className="px-6 pb-6">
            <motion.button
              whileHover={{ scale: totalSelected > 0 ? 1.02 : 1 }}
              whileTap={{ scale: totalSelected > 0 ? 0.98 : 1 }}
              onClick={handleAnalyze}
              disabled={totalSelected === 0 || isAnalyzing}
              className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 ${
                totalSelected > 0
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI 匹配分析中...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  开始匹配分析
                  <span className="text-sm opacity-80">（已选 {totalSelected} 个标签）</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* ========== 匹配结果区 ========== */}
        {matchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* ---- 岗位匹配列表 ---- */}
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-500" />
                  岗位匹配排行
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  点击岗位查看详细分析 👇
                </p>
              </div>

              <div className="px-6 pb-6 space-y-3">
                {matchResults.map((result, index) => (
                  <motion.button
                    key={result.positionId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedJob(result)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedJob?.positionId === result.positionId
                        ? "border-blue-400 bg-blue-50/60 shadow-md"
                        : result.matchScore >= 75
                        ? "border-green-200 bg-white hover:border-green-300"
                        : result.matchScore >= 50
                        ? "border-yellow-200 bg-white hover:border-yellow-300"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0
                              ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-white"
                              : index === 1
                              ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                              : index === 2
                              ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{result.positionTitle}</h3>
                            {index === 0 && (
                              <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 rounded-full font-bold">
                                最佳匹配
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {jobModels.find((j) => j.positionId === result.positionId)?.salaryRange || ""}
                            {" · "}
                            {result.matchedTags.length} 项技能已匹配
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-2xl font-extrabold ${
                            result.matchScore >= 75
                              ? "text-green-600"
                              : result.matchScore >= 50
                              ? "text-yellow-600"
                              : "text-red-500"
                          }`}
                        >
                          {result.matchScore}%
                        </div>
                        <span className="text-xs text-gray-400">匹配度</span>
                      </div>
                    </div>

                    {/* 匹配理由预览 */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {result.reasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white/80 text-xs text-gray-600 rounded-lg border border-gray-100"
                        >
                          💡 {reason}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ---- 选中岗位的详细分析 ---- */}
            {selectedJob && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedJob.positionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* 岗位信息卡 */}
                  <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {selectedJob.positionTitle}
                        </h3>
                        <p className="text-gray-500 mt-1">
                          {jobModels.find((j) => j.positionId === selectedJob.positionId)?.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold ${
                            selectedJob.matchScore >= 75
                              ? "bg-green-100 text-green-700"
                              : selectedJob.matchScore >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {selectedJob.matchLevel === "高" ? "🔥" : selectedJob.matchLevel === "中" ? "⚡" : "💧"}{" "}
                          匹配度 {selectedJob.matchScore}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {jobModels
                        .find((j) => j.positionId === selectedJob.positionId)
                        ?.typicalCompanies.map((c) => (
                          <span
                            key={c}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                          >
                            🏢 {c}
                          </span>
                        ))}
                    </div>

                    {/* 三维得分 */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100">
                        <div className="text-sm text-gray-500 mb-1">必需技能</div>
                        <div className="text-3xl font-extrabold text-red-600">
                          {selectedJob.breakdown.requiredMatch}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">权重 60%</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="text-sm text-gray-500 mb-1">优先技能</div>
                        <div className="text-3xl font-extrabold text-blue-600">
                          {selectedJob.breakdown.preferredMatch}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">权重 25%</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                        <div className="text-sm text-gray-500 mb-1">加分技能</div>
                        <div className="text-3xl font-extrabold text-emerald-600">
                          {selectedJob.breakdown.bonusMatch}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">权重 15%</div>
                      </div>
                    </div>
                  </div>

                  {/* 雷达图 */}
                  <RadarChart result={selectedJob} />

                  {/* 差距分析卡片 */}
                  <GapAnalysisCards result={selectedJob} learningSuggestions={LEARNING_SUGGESTIONS} />

                  {/* 匹配结果详情卡片 */}
                  <MatchResultCards result={selectedJob} />
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {/* 无结果时的空状态 */}
        {matchResults.length === 0 && !isAnalyzing && dataLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🔮</div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">
              选择标签后，AI 将为你生成匹配报告
            </h3>
            <p className="text-gray-400 text-sm">
              试试选 5~10 个你已掌握的技能和项目，匹配结果会更精准哦～
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
