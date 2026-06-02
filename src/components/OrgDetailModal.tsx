"use client";

import { motion, AnimatePresence } from "framer-motion";

// 岗位详细数据类型
interface JobDetail {
  jobId: string;
  title: string;
  category: string;
  location: string;
  type: string;
  responsibilities: string[];
  requirements: string[];
  departmentInfo: string;
}

// 岗位详情模态框组件
interface JobDetailModalProps {
  job: JobDetail;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: { jobId: string; title: string; category: string; location: string; type: string }) => void;
}

function JobDetailModal({ job, isOpen, onClose, onApply }: JobDetailModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition-colors duration-200 cursor-pointer"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
          <div className="flex items-center gap-4 text-white/80">
            <span>📍 {job.location}</span>
            <span>🏷️ {job.category}</span>
            <span>⏰ {job.type}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Responsibilities */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span>✅</span> 岗位职责
            </h3>
            <ul className="space-y-2">
              {job.responsibilities.map((item, index) => (
                <li key={`${job.jobId}-responsibility-${index}`} className="flex items-start gap-2 text-gray-700">
                  <span className="text-primary mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span>📋</span> 岗位要求
            </h3>
            <ul className="space-y-2">
              {job.requirements.map((item, index) => (
                <li key={`${job.jobId}-requirement-${index}`} className="flex items-start gap-2 text-gray-700">
                  <span className="text-primary mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Department Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span>🏢</span> 所属部门介绍
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {job.departmentInfo}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            >
              关闭
            </button>
            <button
              onClick={() => {
                onApply({
                  jobId: job.jobId,
                  title: job.title,
                  category: job.category,
                  location: job.location,
                  type: job.type
                });
                onClose();
              }}
              className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors duration-200 cursor-pointer"
            >
              立即申请
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 模拟岗位详细数据
const JOB_DETAILS: Record<string, JobDetail> = {
  "wxg-fe-001": {
    jobId: "wxg-fe-001",
    title: "前端开发工程师",
    category: "技术类",
    location: "广州/深圳",
    type: "全职",
    responsibilities: [
      "负责微信、企业微信等产品的Web前端开发，提供优质的用户体验",
      "参与前端架构设计，优化前端性能，提升页面加载速度和交互流畅度",
      "与设计师、后端工程师紧密协作，实现高质量的产品界面",
      "探索和创新前端技术，推动团队技术栈的升级和优化",
      "参与代码审查，确保代码质量和可维护性"
    ],
    requirements: [
      "本科及以上学历，计算机相关专业优先",
      "扎实的JavaScript/TypeScript基础，熟悉ES6+语法",
      "熟练掌握React或Vue框架，理解其设计原理",
      "了解前端工程化，熟悉Webpack、Vite等构建工具",
      "具备良好的学习能力、沟通能力和团队协作精神"
    ],
    departmentInfo: "微信事业群（WXG）负责中国最大的社交平台微信的生态建设，我们致力于通过技术创新，让微信成为连接一切的工具。"
  },
  "wxg-be-002": {
    jobId: "wxg-be-002",
    title: "后端开发工程师",
    category: "技术类",
    location: "广州/深圳",
    type: "全职",
    responsibilities: [
      "负责微信后台服务开发，支撑亿级用户的高并发访问",
      "设计和优化分布式系统架构，确保系统的高可用性和可扩展性",
      "参与数据库设计和优化，处理海量数据的存储和查询",
      "与前端团队配合，提供稳定高效的API接口",
      "参与系统监控和故障排查，保障服务稳定运行"
    ],
    requirements: [
      "本科及以上学历，计算机、软件工程相关专业",
      "熟练掌握Java、Go、C++中的一种或多种后端语言",
      "了解分布式系统原理，有微服务架构经验者优先",
      "熟悉MySQL、Redis等数据库和缓存技术",
      "具备强烈的责任心和解决问题的能力"
    ],
    departmentInfo: "微信事业群（WXG）是腾讯最核心的事业群之一，我们的后台系统每天处理数百亿次请求。"
  },
  "ieg-gc-001": {
    jobId: "ieg-gc-001",
    title: "游戏客户端开发",
    category: "技术类",
    location: "深圳/上海",
    type: "全职",
    responsibilities: [
      "负责王者荣耀、和平精英等游戏客户端的开发和维护",
      "优化游戏性能，提升帧率和降低功耗，确保流畅的游戏体验",
      "实现游戏核心玩法逻辑，与策划团队紧密协作",
      "参与游戏引擎（Unity/Unreal）的定制和优化",
      "解决游戏崩溃、卡顿等技术问题，提升用户满意度"
    ],
    requirements: [
      "本科及以上学历，计算机相关专业",
      "熟练掌握C++编程，了解游戏引擎原理",
      "有Unity或Unreal Engine开发经验者优先",
      "热爱游戏，对游戏机制有深入的理解",
      "具备良好的团队合作能力和抗压能力"
    ],
    departmentInfo: "互动娱乐事业群（IEG）是腾讯游戏业务的核心载体，我们秉持'用心创造快乐'的理念。"
  },
  "csig-ca-001": {
    jobId: "csig-ca-001",
    title: "云计算架构师",
    category: "技术类",
    location: "深圳/北京",
    type: "全职",
    responsibilities: [
      "为客户提供腾讯云解决方案的架构设计和技术咨询",
      "参与腾讯云产品的设计和开发，推动产品创新和优化",
      "协助客户完成云迁移和技术转型，解决技术难题",
      "编写技术文档和最佳实践，提升团队技术能力",
      "跟踪云计算行业趋势，研究和引入新技术"
    ],
    requirements: [
      "本科及以上学历，5年以上云计算相关经验",
      "深入理解云计算架构，有AWS、Azure或阿里云经验者优先",
      "熟悉容器化技术（Docker、Kubernetes）和微服务架构",
      "具备优秀的沟通能力和客户服务能力",
      "有大型分布式系统架构设计经验者优先"
    ],
    departmentInfo: "云与智慧产业事业群（CSIG）是腾讯To B战略的核心平台，助力各行各业实现数字化转型。"
  },
};

// 获取岗位详情（如果预定义数据中没有，则生成默认数据）
const getJobDetail = (jobId: string, job: { title: string; category: string; location: string; type: string }): JobDetail => {
  if (JOB_DETAILS[jobId]) {
    return JOB_DETAILS[jobId];
  }
  
  // 生成默认数据
  return {
    jobId: jobId,
    title: job.title,
    category: job.category,
    location: job.location,
    type: job.type,
    responsibilities: [
      `负责${job.title}相关的核心业务开发和维护`,
      "参与系统架构设计和技术方案评审",
      "与跨职能团队紧密协作，推动项目按时交付",
      "持续优化系统性能，提升用户体验",
      "参与技术文档编写和知识分享"
    ],
    requirements: [
      "本科及以上学历，计算机或相关理工科专业",
      "扎实的编程基础，熟悉常用的数据结构和算法",
      "良好的学习能力和问题解决能力",
      "优秀的沟通能力和团队协作精神",
      "有相关实习或项目经验者优先"
    ],
    departmentInfo: "这是一个充满活力和创新的团队，我们致力于通过技术创造价值，为用户提供卓越的产品体验。"
  };
};

interface OrgDetailModalProps {
  org: {
    id: string;
    name: string;
    shortName: string;
    description: string;
    detail: string;
    coreProducts: string[];
    jobs: {
      jobId: string;
      title: string;
      category: string;
      location: string;
      type: string;
    }[];
    color: string;
    icon: string;
  };
  isOpen: boolean;
  onClose: () => void;
  selectedJob?: {
    jobId: string;
    title: string;
    category: string;
    location: string;
    type: string;
  } | null;
  onViewJobDetail?: (job: { jobId: string; title: string; category: string; location: string; type: string }) => void;
  onCloseJobDetail?: () => void;
  onApplyJob?: (job: { jobId: string; title: string; category: string; location: string; type: string }) => void;
}

export default function OrgDetailModal({ 
  org, 
  isOpen, 
  onClose, 
  selectedJob, 
  onViewJobDetail, 
  onCloseJobDetail, 
  onApplyJob 
}: OrgDetailModalProps) {
  if (!isOpen || !org) return null;

  const handleViewDetail = (job: { jobId: string; title: string; category: string; location: string; type: string }) => {
    if (onViewJobDetail) {
      onViewJobDetail(job);
    }
  };

  const handleApply = (job: { jobId: string; title: string; category: string; location: string; type: string }) => {
    if (onApplyJob) {
      onApplyJob(job);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="org-detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className={`bg-gradient-to-r ${org.color} p-8 text-white relative overflow-hidden`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition-colors duration-200 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-start gap-6">
              <div className="text-8xl opacity-20 absolute top-4 right-8">
                {org.icon}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{org.name}</h2>
                <p className="text-white/80 text-lg font-medium">{org.shortName}</p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-8">
            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📖</span> 事业群介绍
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {org.detail}
              </p>
            </div>

            {/* Core Products */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🎯</span> 核心产品矩阵
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {org.coreProducts.map((product) => (
                  <div
                    key={product}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  >
                    <span className="font-medium text-sm">{product}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Jobs */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>💼</span> 在招岗位
              </h3>
              <div className="space-y-3">
                {org.jobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="p-4 rounded-xl bg-green-50 border border-green-200 hover:bg-green-100 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-green-800">{job.title}</span>
                      <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded">
                        {job.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-green-700 mb-3">
                      <span>📍 {job.location}</span>
                      <span>🏷️ {job.category}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(job)}
                        className="flex-1 py-2 px-4 bg-white text-green-700 rounded-lg border border-green-300 hover:bg-green-50 transition-colors duration-200 text-sm font-medium cursor-pointer"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => handleApply(job)}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium cursor-pointer"
                      >
                        申请岗位
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Job Detail Modal (Secondary) */}
      {selectedJob && onCloseJobDetail && (
        <JobDetailModal
          job={getJobDetail(selectedJob.jobId, selectedJob)}
          isOpen={!!selectedJob}
          onClose={onCloseJobDetail}
          onApply={handleApply}
        />
      )}
    </AnimatePresence>
  );
}
