"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen, Lightbulb } from "lucide-react";
import { useState } from "react";

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

interface GapAnalysisCardsProps {
  result: MatchResult;
  learningSuggestions: Record<string, string>;
}

export default function GapAnalysisCards({
  result,
  learningSuggestions,
}: GapAnalysisCardsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hasMissing = result.missingRequiredTags.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ===== 缺失的必需技能（急需补充）===== */}
      {result.missingRequiredTags.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-red-100/50 border border-red-100/50 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🔴 急需补充的核心技能
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              这些是岗位的"硬门槛"，缺少任何一个都会大大降低竞争力哦～
            </p>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {result.missingRequiredTags.map((tag, i) => {
              const isExpanded = expanded[`req-${tag.id}`];
              const suggestion = learningSuggestions[tag.id];
              return (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(`req-${tag.id}`)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tag.emoji}</span>
                      <div>
                        <span className="font-bold text-red-800">{tag.name}</span>
                        <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-700 rounded-full text-xs font-bold">
                          必需
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-red-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-red-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <div className="flex items-start gap-2 p-3 bg-white/80 rounded-lg border border-red-100">
                            <BookOpen className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-800 leading-relaxed">
                              {suggestion || `📚 建议系统学习 ${tag.name}，可以从基础教程开始，结合实际项目练习`}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 缺失的优先技能（建议补充）===== */}
      {result.missingPreferredTags.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-yellow-100/50 border border-yellow-100/50 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🟡 建议补充的加分技能
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              这些技能能让你的简历更有竞争力，面试加分利器！
            </p>
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {result.missingPreferredTags.map((tag, i) => {
                const isExpanded = expanded[`pref-${tag.id}`];
                const suggestion = learningSuggestions[tag.id];
                return (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative"
                  >
                    <button
                      onClick={() => toggleExpand(`pref-${tag.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-yellow-50 border-2 border-yellow-300 text-yellow-800 font-medium text-sm hover:bg-yellow-100 transition-colors"
                    >
                      <span className="text-base">{tag.emoji}</span>
                      <span>{tag.name}</span>
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          className="absolute z-10 top-full left-0 mt-2 w-72 p-3 bg-white rounded-xl shadow-xl border border-yellow-200"
                        >
                          <p className="text-xs text-yellow-800 leading-relaxed">
                            {suggestion || `💡 建议学习 ${tag.name}，可以通过在线课程或实战项目快速上手`}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== 已掌握的技能（绿色达标）===== */}
      {result.matchedTags.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-green-100/50 border border-green-100/50 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🟢 已达标的技能 & 经历
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              这些你已经具备的能力，继续保持！{!hasMissing && " 🎉 太棒了，所有核心技能都已达标！"}
            </p>
          </div>
          <div className="px-6 pb-6">
            {/* 分类展示 */}
            {["skill", "project", "position"].map((cat) => {
              const tags = result.matchedTags.filter((t) => t.category === cat);
              if (tags.length === 0) return null;
              const catLabel =
                cat === "skill" ? "技能" : cat === "project" ? "项目经历" : "岗位";
              const catEmoji =
                cat === "skill" ? "⚡" : cat === "project" ? "🚀" : "🎯";
              return (
                <div key={cat} className="mb-4 last:mb-0">
                  <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                    {catEmoji} {catLabel}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <motion.span
                        key={tag.id}
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 border border-green-300 text-green-800 font-medium text-sm"
                      >
                        <span>{tag.emoji}</span>
                        <span>{tag.name}</span>
                        <span className="text-green-500">✓</span>
                      </motion.span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 推荐的项目经历 ===== */}
      {result.recommendedProjects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🏆 推荐补充的项目经历
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              这些项目经历能大幅提升你的简历含金量！
            </p>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {result.recommendedProjects.map((project, i) => {
              const suggestion = learningSuggestions[project.id];
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{project.emoji}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900">{project.name}</h3>
                      {suggestion && (
                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                          {suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 综合建议 ===== */}
      {result.suggestions.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-lg border border-indigo-100/50 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              📝 AI 综合提升建议
            </h2>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {result.suggestions.map((suggestion, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-indigo-100"
              >
                <span className="text-xl mt-0.5">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  {suggestion}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
