"use client";

import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, XCircle, Info } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  emoji: string;
  category: "skill" | "project" | "position";
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

interface MatchResultCardsProps {
  result: MatchResult;
}

export default function MatchResultCards({ result }: MatchResultCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 overflow-hidden"
    >
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          📋 匹配详情一览
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          一起看看你的优势和差距吧～
        </p>
      </div>

      <div className="px-6 pb-6 space-y-5">
        {/* 匹配理由 */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-800">匹配理由</span>
          </div>
          <ul className="space-y-2">
            {result.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-green-900">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 数据总览 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-4 bg-violet-50 rounded-xl border border-violet-100">
            <div className="text-3xl font-extrabold text-violet-600">
              {result.matchedTags.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">已掌握能力</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="text-3xl font-extrabold text-red-500">
              {result.missingRequiredTags.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">缺失必需技能</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <div className="text-3xl font-extrabold text-yellow-600">
              {result.missingPreferredTags.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">待补充优先技能</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="text-3xl font-extrabold text-blue-600">
              {result.recommendedProjects.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">推荐项目经历</div>
          </div>
        </div>

        {/* 快速总结 */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-700">快速总结</span>
          </div>
          {result.matchLevel === "高" ? (
            <p className="text-sm text-gray-600">
              🎉 你的能力与「{result.positionTitle}」岗位匹配度很高！
              {result.missingRequiredTags.length === 0
                ? " 所有核心技能都已达标，可以自信投递啦～"
                : ` 不过还有 ${result.missingRequiredTags.length} 个核心技能需要补充，加油！`}
            </p>
          ) : result.matchLevel === "中" ? (
            <p className="text-sm text-gray-600">
              ⚡ 你和「{result.positionTitle}」岗位有一定匹配度。
              {result.missingRequiredTags.length > 0
                ? ` 重点补充 ${result.missingRequiredTags.map((t) => `${t.emoji}${t.name}`).join("、")}，差距就能大大缩小！`
                : " 补充一些加分技能和项目经历，竞争力会显著提升～"}
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              💧 目前与「{result.positionTitle}」岗位的匹配度较低，但这正是成长空间！
              按照上方的建议一步步来，几个月后你会发现完全不一样～
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
