"use client";

import { motion } from "framer-motion";

interface JobMatchReportProps {
  userProfile: any;
  analysisResult: any;
}

export default function JobMatchReport({ userProfile, analysisResult }: JobMatchReportProps) {
  if (!analysisResult || !analysisResult.jobRecommendations) return null;

  const jobs = analysisResult.jobRecommendations;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl shadow-lg p-8 mb-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        🎯 AI岗位匹配推荐
      </h2>
      <p className="text-gray-600 mb-6">
        基于你的智能画像数据，AI 将为你匹配最适合的岗位
      </p>

      <div className="space-y-4">
        {jobs.map((job: any, index: number) => (
          <div
            key={index}
            className={`p-5 rounded-xl border-2 transition-all duration-200 ${
              index === 0
                ? "border-blue-400 bg-blue-50/50"
                : "border-gray-200 hover:border-blue-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {job.title}
                  {index === 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                      最佳匹配
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">
                  {job.company} · {job.location}
                </p>
              </div>
              <div
                className={`px-3 py-1.5 rounded-full font-bold text-sm ${
                  job.matchScore >= 80
                    ? "bg-green-100 text-green-700"
                    : job.matchScore >= 60
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                匹配度 {job.matchScore}%
              </div>
            </div>

            {/* 推荐原因 */}
            {job.recommendationReason && (
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                💡 {job.recommendationReason}
              </p>
            )}

            {/* 维度得分 */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500">硬技能</div>
                <div className="font-bold text-blue-600">{job.hardSkillMatch}%</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500">软实力</div>
                <div className="font-bold text-green-600">{job.softSkillMatch}%</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500">经验匹配</div>
                <div className="font-bold text-purple-600">{job.experienceMatch}%</div>
              </div>
            </div>

            {/* 差距分析 */}
            {job.gaps && job.gaps.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.gaps.map((gap: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium"
                  >
                    📌 {gap}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
