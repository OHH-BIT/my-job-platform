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
        {/* 装饰光球 */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        {/* 网格纹理 */}
        <div className="absolute inset-0 bg-grid opacity-30" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
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
                href="/profile/smart"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold hover:bg-gray-50 transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                开始匹配岗位
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <Link
                href="/tencent-map"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0L4.553 18.68A1 1 0 0 1 4 17.786V5.023a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>
                查看全景地图
              </Link>
            </div>
          </motion.div>
        </div>

        {/* 底部渐变过渡 */}
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              {
                icon: <FeatureIcon className="w-7 h-7" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
                title: "智能岗位匹配",
                desc: "基于专业、技能和兴趣，智能推荐最适合的腾讯岗位",
                href: "/profile/smart",
                gradient: "from-indigo-500/10 to-violet-500/10",
                iconColor: "text-indigo-600",
                iconBg: "bg-indigo-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M12 20V10M6 20V4M18 20v-6" />,
                title: "智能画像分析",
                desc: "AI深度分析你的竞争力，生成精准提升建议",
                href: "/profile/smart",
                gradient: "from-purple-500/10 to-pink-500/10",
                iconColor: "text-purple-600",
                iconBg: "bg-purple-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M3 3v18h18M7 16l4-8 4 4 6-10" />,
                title: "进度看板",
                desc: "可视化追踪投递状态，AI辅助生成面试复盘笔记",
                href: "/job-tracking",
                gradient: "from-emerald-500/10 to-teal-500/10",
                iconColor: "text-emerald-600",
                iconBg: "bg-emerald-500/10",
              },
              {
                icon: <FeatureIcon className="w-7 h-7" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
                title: "前辈说",
                desc: "倾听往届校友真实分享，打破求职信息不对称",
                href: "/mentor-sharing",
                gradient: "from-amber-500/10 to-orange-500/10",
                iconColor: "text-amber-600",
                iconBg: "bg-amber-500/10",
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
                  className={`group block p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-transparent hover:border-indigo-200/40 dark:hover:border-indigo-500/20 card-hover cursor-pointer`}
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

      {/* ===== 实习生专区 ===== */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold mb-6 shadow-lg shadow-orange-500/25"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              2026 / 2027 届独家
            </motion.div>

            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
              鹅厂实习生专属通道
              <br />
              <span className="gradient-text-warm">开启你的职场第一步</span>
            </motion.h2>

            <motion.p variants={fadeUp} custom={2} className="text-lg text-text-secondary mb-10 leading-relaxed max-w-2xl mx-auto">
              <span className="font-semibold text-foreground">顶级导师带教</span> ·{" "}
              <span className="font-semibold text-foreground">转正绿卡</span> ·{" "}
              <span className="font-semibold text-foreground">免费三餐房补</span>
              <br />
              实习薪资 <span className="text-2xl font-extrabold gradient-text-warm">200-450元/天</span>
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/intern-jobs"
                className="btn-primary inline-flex items-center gap-2 !px-10 !py-4 text-lg shadow-xl shadow-orange-500/25 hover:shadow-2xl"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                查看实习岗位
              </Link>
              <a
                href="https://join.qq.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2 !px-10 !py-4 text-lg !border-orange-300 !text-orange-600 hover:!bg-orange-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                前往官网投递
              </a>
            </motion.div>

            {/* 核心亮点 */}
            <motion.div variants={scaleIn} custom={4} className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
              {[
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: "一对一导师" },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>, label: "转正绿色通道" },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 11h.01M11 15h.01M16 16c.5-1.5.17-2.5 0-3-.5-1-1-1.5-1.5-2-.5-.5-1-1-1-2 0-1.5 1-2.5 2.5-2.5s2 1 2.5 2c.5 1 .5 2-.5 3"/><path d="M2 12h4m12 0h4M12 2v4m0 12v4"/></svg>, label: "免费三餐+房补" },
              ].map((h) => (
                <div key={h.label} className="glass-card p-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-600 mb-2">
                    {h.icon}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{h.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
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
                href="/profile/smart"
                className="group inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-white text-indigo-700 font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
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
