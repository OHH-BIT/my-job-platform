"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface JobDetailModalProps {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobDetailModal({ jobId, isOpen, onClose }: JobDetailModalProps) {
  const router = useRouter();
  
  if (!isOpen || !jobId) return null;

  const jobTitle = jobId === "frontend" ? "前端开发工程师" : "后端开发工程师";
  const jobDescription = jobId === "frontend" 
    ? "负责腾讯前端开发，要求熟悉React、TypeScript、Vue等主流框架，有大型项目经验者优先。"
    : "负责腾讯后端开发，要求熟悉Java/Go/Python，掌握分布式系统设计，有高并发经验者优先。";

  // 跳转到简历诊断页面，并带上岗位信息
  const handleDeepDiagnosis = () => {
    onClose();
    router.push(`/resume-checker?jobId=${jobId}&jobTitle=${encodeURIComponent(jobTitle)}&jobDescription=${encodeURIComponent(jobDescription)}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{jobTitle}</h2>
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                匹配度 85%
              </span>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg">
              ✕
            </button>
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">职位描述</h3>
            <p className="text-gray-600 leading-relaxed">{jobDescription}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">Requirements</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>本科及以上学历，计算机相关专业</li>
              <li>熟练掌握至少一门编程语言</li>
              <li>有良好的沟通能力和团队协作精神</li>
              <li>有相关实习或项目经验者优先</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={handleDeepDiagnosis}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-2"
            >
              📝 上传简历深度诊断
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
