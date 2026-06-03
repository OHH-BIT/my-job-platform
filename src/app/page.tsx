"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// 通用动画配置
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] },
  }),
};

// 功能图标组件
function FeatureIcon({ className, d }: { className?: string; d: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden gradient-hero text-white py-24 md:py-36">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="absolute inset-0 bg-grid opacity-30" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-white/90 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              2026 校招季进行中
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
              鹅厂成长伙伴
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                你的腾讯求职引路人
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
              智能画像 · AI面试 · 岗位匹配 · 全景地图
              <br className="hidden sm:block" />
              一站式腾讯校园招聘陪伴平台
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/job-match"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold hover:bg-gray-50 transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                开始匹配岗位
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <a
                href="https://join.qq.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                前往腾讯官网
              </a>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ===== 功能卡片区 ===== */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
              全方位助力求职之路
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed">
              从能力画像到岗位匹配，从面试训练到成长规划
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {[
              {
                icon: <FeatureIcon className="w-7 h-7" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
                title: "智能画像分析",
                desc: "AI 深度分析你的简历与能力，生成竞争力评估、技能掌握度和精准提升建议",
                href: "/job-match",
                gradient: "from-purple-500/10 to-pink-500/10",
                iconColor: "text-purple-600",
                iconBg: "bg-purple-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M12 20V10M6 20V4M18 20v-6" />,
                title: "智能岗位匹配",
                desc: "选择你的技能、项目和目标岗位，AI 精准匹配最适合的方向，直观的雷达图对比差距与优势",
                href: "/job-match",
                gradient: "from-indigo-500/10 to-violet-500/10",
                iconColor: "text-indigo-600",
                iconBg: "bg-indigo-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
                title: "前辈说",
                desc: "腾讯学长学姐的真实经验分享，面试技巧、职场心得一手掌握",
                href: "/mentor-sharing",
                gradient: "from-amber-500/10 to-orange-500/10",
                iconColor: "text-amber-600",
                iconBg: "bg-amber-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />,
                title: "AI面试舱",
                desc: "模拟腾讯真实面试场景，AI 实时反馈与评分，助你临场不惧",
                href: "/mock-interview/config",
                gradient: "from-cyan-500/10 to-teal-500/10",
                iconColor: "text-cyan-600",
                iconBg: "bg-cyan-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />,
                title: "简历诊所",
                desc: "AI 一键诊断简历，精准优化建议，让你的简历脱颖而出",
                href: "/resume-checker",
                gradient: "from-emerald-500/10 to-green-500/10",
                iconColor: "text-emerald-600",
                iconBg: "bg-emerald-500/10",
                highlight: true,
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M6 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />,
                title: "成长路径",
                desc: "根据目标岗位定制个性化成长计划，从技能到项目一步步提升",
                href: "/growth-path",
                gradient: "from-rose-500/10 to-pink-500/10",
                iconColor: "text-rose-600",
                iconBg: "bg-rose-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />,
                title: "进度看板",
                desc: "实时追踪求职进度，管理投递记录，从网申到 Offer 一目了然",
                href: "/job-tracking",
                gradient: "from-blue-500/10 to-indigo-500/10",
                iconColor: "text-blue-600",
                iconBg: "bg-blue-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
                title: "实习生专区",
                desc: "专属实习岗位推荐与申请指南，提前锁定腾讯实习机会",
                href: "/intern-jobs",
                gradient: "from-orange-500/10 to-red-500/10",
                iconColor: "text-orange-600",
                iconBg: "bg-orange-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />,
                title: "全景地图",
                desc: "腾讯各事业群全景介绍，深入了解 WXG、IEG、CSIG 等部门文化",
                href: "/tencent-map",
                gradient: "from-violet-500/10 to-purple-500/10",
                iconColor: "text-violet-600",
                iconBg: "bg-violet-500/10",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={fadeUp}
                custom={index}
              >
                <Link
                  href={feature.href}
                  className={`group block p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border ${"highlight" in feature ? "border-orange-300/50" : "border-transparent"} hover:border-indigo-200/40 card-hover cursor-pointer`}
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <span className={feature.iconColor}>{feature.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 数据展示区 ===== */}
      <section className="py-20 md:py-28 bg-background bg-grid">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
              为什么选择腾讯？
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { number: "10W+", label: "全球员工", desc: "遍布全球的员工，多元包容的文化" },
              { number: "6", label: "事业群", desc: "WXG、IEG、CSIG、PCG、TEG、CDG 全覆盖" },
              { number: "100+", label: "校招岗位", desc: "技术、产品、设计、市场等各类岗位" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                custom={index}
                className="glass-card p-8 text-center group hover:border-indigo-200/50"
              >
                <div className="text-5xl md:text-6xl font-extrabold gradient-text-brand mb-3">
                  {stat.number}
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{stat.label}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA区域 ===== */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand" />
        <div className="hero-orb hero-orb-1" style={{ top: "-150px", right: "-150px" }} />
        <div className="hero-orb hero-orb-2" style={{ bottom: "-100px", left: "-100px" }} />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-extrabold mb-4 text-white tracking-tight">
              准备好加入鹅厂了吗？
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-white/70 mb-10 leading-relaxed">
              立即开始你的腾讯求职之旅，让我们一起成长
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Link
                href="/job-match"
                className="group inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-white text-indigo-700 font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                立即匹配岗位
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
