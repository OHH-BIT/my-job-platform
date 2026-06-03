"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import OrgDetailModal from "@/components/OrgDetailModal";

// 岗位数据类型定义
interface Job {
  jobId: string;
  title: string;
  category: string;
  location: string;
  type: string; // 全职/实习
}

// 腾讯六大事业群完整数据
const ORG_GROUPS = [
  {
    id: "wxg",
    name: "微信事业群",
    shortName: "WXG",
    description: "负责微信、微信支付、企业微信等产品的开发与运营，连接人与服务，打造智慧生活。",
    coreProducts: ["微信", "微信支付", "企业微信", "微信读书", "视频号"],
    jobs: [
      { jobId: "wxg-fe-001", title: "前端开发工程师（校招）", category: "技术类", location: "广州/深圳", type: "校招" },
      { jobId: "wxg-be-002", title: "后端开发工程师（校招）", category: "技术类", location: "广州/深圳", type: "校招" },
      { jobId: "wxg-pm-003", title: "产品经理（技术背景）", category: "产品类", location: "广州", type: "校招" },
      { jobId: "wxg-da-004", title: "数据分析师（校招）", category: "分析类", location: "深圳", type: "校招" },
      { jobId: "wxg-ui-005", title: "交互设计师（校招）", category: "设计类", location: "广州", type: "校招" },
    ] as Job[],
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50",
    icon: "💬",
    detail: "微信事业群（WXG）是腾讯最核心的事业群之一，负责中国最大的社交平台微信的生态建设。我们致力于通过技术创新，让微信成为连接一切的工具，为用户提供便捷的通讯、支付、生活服务体验。"
  },
  {
    id: "ieg",
    name: "互动娱乐事业群",
    shortName: "IEG",
    description: "负责游戏研发与运营，致力于为用户提供高品质的游戏娱乐体验，打造全球最好的游戏产品。",
    coreProducts: ["王者荣耀", "和平精英", "英雄联盟", "地下城与勇士", "QQ飞车"],
    jobs: [
      { jobId: "ieg-gc-001", title: "游戏客户端开发（校招）", category: "技术类", location: "深圳/上海", type: "校招" },
      { jobId: "ieg-gs-002", title: "游戏服务器开发（校招）", category: "技术类", location: "深圳", type: "校招" },
      { jobId: "ieg-gd-003", title: "游戏策划（校招）", category: "策划类", location: "深圳/上海", type: "校招" },
      { jobId: "ieg-ga-004", title: "游戏引擎开发（校招）", category: "技术类", location: "深圳", type: "校招" },
      { jobId: "ieg-om-005", title: "游戏运营（校招）", category: "运营类", location: "深圳", type: "校招" },
    ] as Job[],
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50",
    icon: "🎮",
    detail: "互动娱乐事业群（IEG）是腾讯游戏业务的核心载体，拥有全球顶尖的游戏研发和运营团队。我们秉持'用心创造快乐'的理念，不断推出深受玩家喜爱的游戏作品，致力于成为全球游戏行业的领导者。"
  },
  {
    id: "csig",
    name: "云与智慧产业事业群",
    shortName: "CSIG",
    description: "依托腾讯云，助力产业数字化升级，为政府、企业提供数字化解决方案。",
    coreProducts: ["腾讯云", "腾讯会议", "企业微信", "腾讯文档", "地图服务"],
    jobs: [
      { jobId: "csig-ca-001", title: "云计算开发工程师（校招）", category: "技术类", location: "深圳/北京", type: "校招" },
      { jobId: "csig-be-002", title: "后端开发工程师（校招）", category: "技术类", location: "深圳", type: "校招" },
      { jobId: "csig-sa-003", title: "自然语言处理算法（校招）", category: "技术类", location: "北京/上海", type: "校招" },
      { jobId: "csig-pm-004", title: "产品经理（技术背景）", category: "产品类", location: "深圳", type: "校招" },
      { jobId: "csig-sm-005", title: "AI产品经理（校招）", category: "产品类", location: "深圳", type: "校招" },
    ] as Job[],
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50",
    icon: "☁️",
    detail: "云与智慧产业事业群（CSIG）是腾讯To B战略的核心平台，整合了腾讯云、AI、大数据、安全等先进技术能力，助力各行各业实现数字化转型。我们致力于成为各行各业数字化转型的助手。"
  },
  {
    id: "pcg",
    name: "平台与内容事业群",
    shortName: "PCG",
    description: "负责QQ、腾讯视频、腾讯新闻等平台与内容业务，打造一站式内容生态。",
    coreProducts: ["QQ", "腾讯视频", "腾讯新闻", "腾讯微视", "QQ浏览器"],
    jobs: [
      { jobId: "pcg-fe-001", title: "前端开发工程师（校招）", category: "技术类", location: "深圳/北京", type: "校招" },
      { jobId: "pcg-ra-002", title: "推荐算法工程师（校招）", category: "技术类", location: "深圳", type: "校招" },
      { jobId: "pcg-co-003", title: "内容运营（校招）", category: "运营类", location: "深圳", type: "校招" },
      { jobId: "pcg-pm-004", title: "产品经理（校招）", category: "产品类", location: "深圳/北京", type: "校招" },
      { jobId: "pcg-da-005", title: "数据分析师（校招）", category: "分析类", location: "深圳", type: "校招" },
    ] as Job[],
    color: "from-red-500 to-orange-600",
    bgColor: "bg-red-50",
    icon: "📺",
    detail: "平台与内容事业群（PCG）聚焦内容生态建设，通过QQ、腾讯视频、腾讯新闻等产品，为用户提供丰富优质的内容服务。我们致力于用技术驱动内容产业变革，让优质内容触手可及。"
  },
  {
    id: "teg",
    name: "技术工程事业群",
    shortName: "TEG",
    description: "负责腾讯底层技术基础设施建设，为各事业群提供技术支撑和基础设施服务。",
    coreProducts: ["腾讯数据中心", "腾讯网络", "AI Lab", "腾讯安全", "技术平台"],
    jobs: [
      { jobId: "teg-ia-001", title: "基础架构工程师（校招）", category: "技术类", location: "深圳/天津", type: "校招" },
      { jobId: "teg-ns-002", title: "网络安全工程师（校招）", category: "技术类", location: "深圳", type: "校招" },
      { jobId: "teg-ai-003", title: "AI研究员（校招）", category: "技术类", location: "深圳/西雅图", type: "校招" },
      { jobId: "teg-od-004", title: "运维开发工程师（校招）", category: "技术类", location: "深圳", type: "校招" },
      { jobId: "teg-tm-005", title: "技术研究工程师（校招）", category: "技术类", location: "深圳", type: "校招" },
    ] as Job[],
    color: "from-gray-700 to-gray-900",
    bgColor: "bg-gray-50",
    icon: "⚙️",
    detail: "技术工程事业群（TEG）是腾讯技术能力的中坚力量，负责构建和维护腾讯庞大的技术基础设施。我们的工作涵盖数据中心、网络架构、AI研究、网络安全等多个前沿领域，为整个腾讯集团提供坚实的技术保障。"
  },
  {
    id: "cdg",
    name: "企业发展事业群",
    shortName: "CDG",
    description: "负责腾讯新业务孵化和投资并购，推动公司战略发展和新增长点培育。",
    coreProducts: ["腾讯投资", "微信支付", "FiT金融", "广告业务", "战略发展"],
    jobs: [
      { jobId: "cdg-im-001", title: "投资分析师（校招）", category: "投资类", location: "深圳/北京", type: "校招" },
      { jobId: "cdg-sp-002", title: "战略规划师（校招）", category: "战略类", location: "深圳", type: "校招" },
      { jobId: "cdg-fp-003", title: "金融产品经理（校招）", category: "产品类", location: "深圳", type: "校招" },
      { jobId: "cdg-da-004", title: "数据分析师（校招）", category: "分析类", location: "深圳", type: "校招" },
      { jobId: "cdg-is-005", title: "行业研究分析师（校招）", category: "研究类", location: "北京/上海", type: "校招" },
    ] as Job[],
    color: "from-yellow-500 to-amber-600",
    bgColor: "bg-yellow-50",
    icon: "📈",
    detail: "企业发展事业群（CDG）肩负着腾讯战略发展和新业务探索的使命。我们通过投资并购、新业务孵化等方式，不断拓展腾讯的业务边界，为公司长期发展培育新的增长引擎。CDG是腾讯连接未来的重要桥梁。"
  },
];

export default function TencentMapPage() {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleViewDetail = (orgId: string) => {
    setSelectedOrg(orgId);
    setSelectedJob(null);
  };

  const handleCloseModal = () => {
    setSelectedOrg(null);
    setSelectedJob(null);
  };

  const handleViewJobDetail = (job: Job) => {
    setSelectedJob(job);
  };

  const handleCloseJobDetail = () => {
    setSelectedJob(null);
  };

  const handleApplyJob = (job: Job) => {
    const keyword = encodeURIComponent(job.title);
    window.open(`https://join.qq.com/post.html?keyword=${keyword}`, '_blank');
  };

  const selectedOrgData = ORG_GROUPS.find(org => org.id === selectedOrg);

  return (
    <div className="min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
          >
            ← 返回首页
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🗺️ 腾讯全景地图
          </h1>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto">
            深入了解腾讯六大事业群，找到最适合你的业务方向。点击事业群卡片查看详细介绍、核心产品和在招岗位。
          </p>
        </motion.div>

        {/* Org Chart Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ORG_GROUPS.map((org, index) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 bg-white"
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-br ${org.color} p-6 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 text-8xl opacity-10">
                  {org.icon}
                </div>
                <h3 className="font-bold text-2xl mb-2">{org.name}</h3>
                <p className="text-white/80 text-sm font-medium">{org.shortName}</p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {org.description}
                </p>

                {/* Core Products */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">核心产品</h4>
                  <div className="flex flex-wrap gap-2">
                    {org.coreProducts.slice(0, 3).map((product) => (
                      <span key={product} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {product}
                      </span>
                    ))}
                    {org.coreProducts.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                        +{org.coreProducts.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleViewDetail(org.id)}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors duration-200"
                >
                  查看详情 →
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Org Detail Modal */}
        {selectedOrgData && (
          <OrgDetailModal
            org={selectedOrgData}
            isOpen={!!selectedOrg}
            onClose={handleCloseModal}
            selectedJob={selectedJob}
            onViewJobDetail={handleViewJobDetail}
            onCloseJobDetail={handleCloseJobDetail}
            onApplyJob={handleApplyJob}
          />
        )}
      </div>
    </div>
  );
}
