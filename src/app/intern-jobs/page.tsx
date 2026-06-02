"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// 实习生岗位数据类型定义
interface InternJob {
  id: string;
  title: string;
  category: string;
  org: string; // 所属事业群
  location: string;
  duration: string; // 实习时长
  salary: string; // 实习薪资
  description: string;
  responsibilities: string[]; // 岗位职责
  requirements: string[]; // 岗位要求
}

// 实习生岗位数据（真实腾讯JD）
const INTERN_JOBS: InternJob[] = [
  // 技术类
  {
    id: "intern-tech-001",
    title: "软件开发实习生（后端）",
    category: "技术类",
    org: "WXG",
    location: "深圳/广州",
    duration: "3-6个月",
    salary: "300-400元/天",
    description: "负责微信后端服务的开发与维护，参与高并发、分布式系统的设计与实现。",
    responsibilities: [
      "参与微信核心业务模块的后端开发与维护",
      "设计和实现高并发、高可用的分布式系统架构",
      "优化系统性能，提升服务稳定性和响应速度",
      "参与代码评审，编写技术文档",
      "跟进线上问题排查与故障修复"
    ],
    requirements: [
      "计算机相关专业，本科及以上学历，2026/2027届毕业生",
      "扎实的计算机基础知识，熟悉数据结构、算法、操作系统",
      "熟悉至少一门后端开发语言（C++/Go/Java/Python）",
      "了解MySQL、Redis等常用数据库和缓存技术",
      "有良好的编码习惯和文档写作能力",
      "具备较强的学习能力和团队协作精神"
    ]
  },
  {
    id: "intern-tech-002",
    title: "软件开发实习生（前端）",
    category: "技术类",
    org: "WXG",
    location: "广州/深圳",
    duration: "3-6个月",
    salary: "300-400元/天",
    description: "负责微信Web端、小程序的开发与优化，打造流畅的用户体验。",
    responsibilities: [
      "参与微信小程序、H5等前端业务的开发和维护",
      "优化前端性能，提升页面加载速度和用户体验",
      "参与前端基础架构建设，封装通用组件和工具库",
      "跟进前端技术方案设计，编写技术文档",
      "与设计师、后端工程师协作，确保产品高质量交付"
    ],
    requirements: [
      "计算机或相关专业，本科及以上学历，2026/2027届毕业生",
      "熟悉React/Vue等主流前端框架，理解其设计思想",
      "掌握TypeScript，有实际项目开发经验",
      "了解Webpack/Vite等构建工具，熟悉前端工程化",
      "对用户体验有敏感度，关注前端性能优化",
      "有小程序开发经验者优先"
    ]
  },
  {
    id: "intern-tech-003",
    title: "算法实习生（NLP）",
    category: "技术类",
    org: "CSIG",
    location: "北京/深圳",
    duration: "3-6个月",
    salary: "350-450元/天",
    description: "参与自然语言处理、大语言模型相关的研究与工程化落地。",
    responsibilities: [
      "参与大语言模型（LLM）的微调、推理优化和应用落地",
      "研究和实现NLP前沿算法，包括文本理解、生成、对话等",
      "参与腾讯混元大模型的相关研发工作",
      "编写算法文档，进行实验设计和结果分析",
      "与产品、工程团队紧密合作，推动算法上线"
    ],
    requirements: [
      "硕士/博士在读，NLP、机器学习、深度学习方向，2026/2027届毕业生",
      "熟悉PyTorch/TensorFlow等深度学习框架",
      "有NLP项目经验，了解Transformer、BERT、GPT等模型原理",
      "有论文发表或开源项目贡献者优先（ACL/EMNLP/NeurIPS等）",
      "良好的英文文献阅读能力，能够快速跟进前沿技术",
      "编程能力强，熟悉Python/C++"
    ]
  },
  {
    id: "intern-tech-004",
    title: "技术研究实习生",
    category: "技术类",
    org: "TEG",
    location: "深圳",
    duration: "3-6个月",
    salary: "350-450元/天",
    description: "参与AI Lab的前沿技术研究，包括机器学习、计算机视觉等方向。",
    responsibilities: [
      "参与AI Lab前沿技术研究方向，包括多模态学习、强化学习等",
      "撰写高水平学术论文，投稿顶会顶刊",
      "参与开源项目维护和技术文档编写",
      "与团队共同探索AI技术的前沿边界",
      "指导初级研究人员，参与技术分享"
    ],
    requirements: [
      "博士在读，AI、机器学习、计算机视觉等相关方向，2026/2027届毕业生",
      "有顶会论文发表经验（NeurIPS/ICML/CVPR/ICLR等）",
      "编程能力强，熟悉C++/Python，有大规模实验经验",
      "对科研工作有浓厚兴趣，具备独立研究能力",
      "良好的英文写作和学术交流能力",
      "有开源项目贡献或Kaggle竞赛获奖经历者优先"
    ]
  },
  // 产品类
  {
    id: "intern-pm-001",
    title: "产品经理实习生",
    category: "产品类",
    org: "IEG",
    location: "深圳",
    duration: "3-6个月",
    salary: "250-350元/天",
    description: "参与游戏产品的需求分析、功能设计，跟进产品迭代全流程。",
    responsibilities: [
      "参与游戏产品的需求调研和竞品分析",
      "撰写产品需求文档（PRD），设计产品原型和交互流程",
      "跟进产品研发进度，协调设计、开发、测试等资源",
      "分析产品数据，提出优化方案并推动落地",
      "参与用户体验研究，收集用户反馈并改进产品"
    ],
    requirements: [
      "本科及以上学历，专业不限，2026/2027届毕业生",
      "热爱游戏，对主流游戏产品有深入体验和理解",
      "逻辑思维强，善于分析问题和总结规律",
      "具备良好的沟通协调能力和团队合作精神",
      "熟练使用Axure/Figma等原型设计工具",
      "有产品实习经验或游戏策划经验者优先"
    ]
  },
  {
    id: "intern-pm-002",
    title: "产品运营实习生",
    category: "产品类",
    org: "PCG",
    location: "深圳/北京",
    duration: "3-6个月",
    salary: "250-350元/天",
    description: "负责内容产品的运营策略制定与执行，提升用户活跃与留存。",
    responsibilities: [
      "参与内容产品（腾讯视频/腾讯新闻等）的运营策略制定",
      "策划线上线下运营活动，提升用户活跃和留存",
      "分析运营数据，输出数据报告并提出优化建议",
      "参与用户增长、内容分发等核心运营工作",
      "协调内外部资源，推动运营项目落地"
    ],
    requirements: [
      "本科及以上学历，专业不限，2026/2027届毕业生",
      "对内容行业有热情，网感好，关注热点话题",
      "数据分析能力强，会SQL/Python进行数据挖掘者优先",
      "创意丰富，具备优秀的活动策划和执行能力",
      "善于沟通表达，能够撰写高质量的运营文案",
      "有新媒体运营、社群运营经验者优先"
    ]
  },
  // 设计类
  {
    id: "intern-design-001",
    title: "交互设计实习生",
    category: "设计类",
    org: "WXG",
    location: "广州",
    duration: "3-6个月",
    salary: "250-350元/天",
    description: "参与微信产品的交互设计，优化用户操作流程与体验。",
    responsibilities: [
      "参与微信产品的交互设计，输出交互原型和数据流转图",
      "进行用户体验研究，通过用户访谈、可用性测试等方法优化设计",
      "与产品、视觉设计、开发团队紧密协作，确保设计落地",
      "参与设计规范和组件库建设，提升设计效率",
      "关注行业动态，研究竞品交互设计趋势"
    ],
    requirements: [
      "交互设计、用户体验、心理学等相关专业，本科及以上学历，2026/2027届毕业生",
      "熟悉Figma/Sketch/Axure等设计工具",
      "有良好的逻辑思维与用户同理心，能够站在用户角度思考问题",
      "具备优秀的设计作品集，能够清晰阐述设计思路",
      "了解前端开发基础，能够与开发团队有效沟通",
      "有互联网产品设计实习经验者优先"
    ]
  },
  {
    id: "intern-design-002",
    title: "视觉设计实习生",
    category: "设计类",
    org: "IEG",
    location: "深圳",
    duration: "3-6个月",
    salary: "250-350元/天",
    description: "参与游戏UI、运营活动的视觉设计，打造极致的视觉体验。",
    responsibilities: [
      "参与游戏UI界面设计，包括图标、按钮、弹窗等元素",
      "负责游戏运营活动的视觉设计，包括H5、Banner、宣传图等",
      "参与游戏品牌视觉体系建设，输出视觉规范文档",
      "与交互设计师、前端开发协作，确保设计还原度",
      "关注游戏视觉设计趋势，持续提升设计品质"
    ],
    requirements: [
      "视觉传达、数字媒体、游戏设计等相关专业，本科及以上学历，2026/2027届毕业生",
      "熟练掌握Photoshop/Illustrator/After Effects等设计软件",
      "有良好的审美能力与创意思维，对色彩、排版敏感",
      "热爱游戏文化，熟悉主流游戏产品的视觉风格",
      "具备优秀的设计作品集，能够展示设计过程和思考",
      "有游戏公司设计实习经验者优先"
    ]
  },
  // 市场与职能类
  {
    id: "intern-market-001",
    title: "市场营销实习生",
    category: "市场与职能类",
    org: "CDG",
    location: "深圳/北京",
    duration: "3-6个月",
    salary: "200-300元/天",
    description: "参与腾讯投资品牌的市场推广活动策划与执行。",
    responsibilities: [
      "参与腾讯投资品牌（如腾讯音乐、美团等）的市场推广活动策划",
      "负责市场活动物料准备，包括PPT、宣传册、海报等",
      "参与社交媒体运营，包括微信公众号、微博等平台内容创作",
      "协助市场数据分析，跟踪活动效果并输出报告",
      "维护媒体关系和KOL合作，拓展品牌曝光渠道"
    ],
    requirements: [
      "专业不限，市场营销、传媒、工商管理等相关专业优先，2026/2027届毕业生",
      "性格开朗，善于沟通表达，具备优秀的人际交往能力",
      "有活动策划或新媒体运营经验者优先",
      "英语流利，能够阅读英文资料和进行简单口语交流",
      "熟练使用Office办公软件，会Photoshop/PR等工具者加分",
      "具备创新思维和抗压能力，能够适应快节奏工作环境"
    ]
  },
  {
    id: "intern-market-002",
    title: "人力资源实习生",
    category: "市场与职能类",
    org: "TEG",
    location: "深圳",
    duration: "3-6个月",
    salary: "200-300元/天",
    description: "参与校园招聘、人才培养等HR项目的策划与执行。",
    responsibilities: [
      "参与校园招聘项目的策划与执行，包括宣讲会、笔试、面试等",
      "负责人才培养项目的运营，包括新人培训、导师计划等",
      "参与HR数据分析，输出人力报表和洞察报告",
      "维护HR系统和员工档案，确保数据准确性和完整性",
      "协助组织员工活动，提升员工满意度和归属感"
    ],
    requirements: [
      "人力资源、心理学、管理学等相关专业，本科及以上学历，2026/2027届毕业生",
      "亲和力强，善于与人沟通，具备优秀的倾听和表达能力",
      "有学生会、社团组织或志愿者活动经验者优先",
      "熟练使用Office办公软件（Excel、PPT、Word）",
      "具备较强的组织策划能力和团队协作精神",
      "对HR工作有热情，愿意在人力资源领域长期发展"
    ]
  },
];

// 职类Tab选项
const CATEGORIES = ["全部", "技术类", "产品类", "设计类", "市场与职能类"];

export default function InternJobsPage() {
  const [activeCategory, setActiveCategory] = useState("全部");
  const [selectedJob, setSelectedJob] = useState<InternJob | null>(null);

  // 筛选岗位
  const filteredJobs = activeCategory === "全部"
    ? INTERN_JOBS
    : INTERN_JOBS.filter(job => job.category === activeCategory);

  // 查看岗位详情
  const handleViewDetail = (job: InternJob) => {
    setSelectedJob(job);
  };

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setSelectedJob(null);
  };

  // 极速投递 - 跳转腾讯校招官网
  const handleQuickApply = (job: InternJob) => {
    const keyword = encodeURIComponent(job.title);
    window.open(`https://join.qq.com/`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Banner区域 */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white py-20 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6 backdrop-blur-sm">
              <span>🔥</span>
              <span>2026/2027届实习生专属招募</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              加入鹅厂实习
              <br />
              <span className="text-yellow-300">开启职场第一步</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              顶级导师带教 + 转正绿卡 + 免费三餐房补
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#jobs"
                className="px-8 py-4 rounded-xl bg-white text-primary font-bold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                🚀 立即查看岗位
              </Link>
              <a
                href="https://join.qq.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl border-2 border-white text-white font-bold hover:bg-white/10 transition-all duration-300"
              >
                📝 前往官网投递
              </a>
            </div>
          </motion.div>
        </div>

        {/* 装饰元素 */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* 核心福利展示 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: "👨‍🏫",
                title: "顶级导师带教",
                desc: "一对一导师制，腾讯P7+资深员工亲自指导，快速成长"
              },
              {
                icon: "🎯",
                title: "转正绿卡",
                desc: "实习表现优秀者可获得校招绿色通道，直通终面"
              },
              {
                icon: "🍜",
                title: "免费三餐房补",
                desc: "一日三餐免费，住房补贴丰厚，实习无忧"
              }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-text-secondary">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 岗位列表区域 */}
      <section id="jobs" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🎯 热招实习生岗位
            </h2>
            <p className="text-text-secondary text-lg">
              按职类筛选，找到最适合你的实习机会
            </p>
          </motion.div>

          {/* 职类Tab选项卡 */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeCategory === category
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 岗位卡片网格 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300"
              >
                {/* 卡片头部 */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                      {job.org}
                    </span>
                    <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded font-bold">
                      {job.salary}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span>📍 {job.location}</span>
                    <span>⏰ {job.duration}</span>
                  </div>
                </div>

                {/* 卡片主体 */}
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewDetail(job)}
                      className="flex-1 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-colors duration-200"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => handleQuickApply(job)}
                      className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors duration-200"
                    >
                      极速投递 🚀
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl">该分类下暂无实习岗位，敬请期待</p>
            </div>
          )}
        </div>
      </section>

      {/* 岗位详情弹窗 */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseDetail}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white sticky top-0 z-10">
                <button
                  onClick={handleCloseDetail}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {selectedJob.org}
                  </span>
                  <span className="text-sm bg-yellow-400 text-yellow-900 px-2 py-1 rounded font-bold">
                    {selectedJob.salary}
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-3">{selectedJob.title}</h2>
                <div className="flex flex-wrap gap-4 text-white/80">
                  <span>📍 {selectedJob.location}</span>
                  <span>⏰ {selectedJob.duration}</span>
                  <span>📂 {selectedJob.category}</span>
                </div>
              </div>

              {/* 弹窗主体 */}
              <div className="p-8">
                {/* 岗位描述 */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>📋</span> 岗位描述
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>

                {/* 岗位职责 */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>💼</span> 岗位职责
                  </h3>
                  <ul className="space-y-3">
                    {selectedJob.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-gray-700">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 岗位要求 */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>✅</span> 岗位要求
                  </h3>
                  <ul className="space-y-3">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleQuickApply(selectedJob)}
                    className="flex-1 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-colors duration-200 shadow-lg shadow-primary/25"
                  >
                    🚀 极速投递
                  </button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                  点击"极速投递"将跳转至腾讯校招官网
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              准备好开启你的鹅厂实习之旅了吗？
            </h2>
            <p className="text-xl text-white/90 mb-10">
              立即投递，让顶级的导师带你飞
            </p>
            <a
              href="https://join.qq.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-white text-primary font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <span>🎯</span>
              立即前往腾讯校招官网投递
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
