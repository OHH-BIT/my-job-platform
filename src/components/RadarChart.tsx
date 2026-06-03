"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";

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

// ============================================
// 雷达图维度映射
// ============================================

// 将匹配结果映射到雷达图的 6 个维度
const DIMENSIONS = [
  { key: "coreSkills", label: "核心技能", emoji: "🎯" },
  { key: "preferredSkills", label: "优先技能", emoji: "⭐" },
  { key: "bonusSkills", label: "加分技能", emoji: "🌟" },
  { key: "projectExp", label: "项目经历", emoji: "📁" },
  { key: "overallMatch", label: "综合匹配", emoji: "📊" },
  { key: "growthSpace", label: "成长空间", emoji: "🌱" },
];

interface RadarChartProps {
  result: MatchResult;
}

export default function RadarChart({ result }: RadarChartProps) {
  const chartData = useMemo(() => {
    // 已匹配的必需标签数 / 总必需标签数
    const coreSkillsRate = result.breakdown.requiredMatch;
    // 已匹配的优先标签数 / 总优先标签数
    const preferredSkillsRate = result.breakdown.preferredMatch;
    // 已匹配的加分标签数 / 总加分标签数
    const bonusSkillsRate = result.breakdown.bonusMatch;
    // 项目经历：基于已匹配的 project 类型标签 vs 推荐项目
    const matchedProjectCount = result.matchedTags.filter(
      (t) => t.category === "project"
    ).length;
    const totalRecommendedProjects = result.recommendedProjects.length + matchedProjectCount;
    const projectRate =
      totalRecommendedProjects > 0
        ? Math.round((matchedProjectCount / totalRecommendedProjects) * 100)
        : 50;
    // 综合匹配
    const overallMatch = result.matchScore;
    // 成长空间 = 缺失技能 / (缺失+已掌握) — 越高说明越有提升空间
    const missingCount =
      result.missingRequiredTags.length +
      result.missingPreferredTags.length +
      result.recommendedProjects.length;
    const totalCount = missingCount + result.matchedTags.length;
    const growthSpace =
      totalCount > 0 ? Math.round((missingCount / totalCount) * 100) : 0;

    return DIMENSIONS.map((dim) => {
      const values: Record<string, number> = {
        coreSkills: coreSkillsRate,
        preferredSkills: preferredSkillsRate,
        bonusSkills: bonusSkillsRate,
        projectExp: projectRate,
        overallMatch: overallMatch,
        growthSpace: growthSpace,
      };

      // 岗位要求 = 最大可能值 (100 for all except growth which is inverse)
      const jobRequirement =
        dim.key === "growthSpace" ? Math.min(100, values[dim.key] + 30) : 100;

      return {
        dimension: `${dim.emoji} ${dim.label}`,
        "你的能力": values[dim.key],
        "岗位要求": jobRequirement,
      };
    });
  }, [result]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        📐 能力雷达图
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        蓝色 = 你的能力，橙色 = 岗位要求。覆盖面积越接近，匹配度越高！
      </p>

      <div className="w-full max-w-lg mx-auto">
        <ResponsiveContainer width="100%" height={360}>
          <RechartsRadar data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 12, fill: "#64748b" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
            />
            <Radar
              name="你的能力"
              dataKey="你的能力"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.3}
              strokeWidth={2.5}
            />
            <Radar
              name="岗位要求"
              dataKey="岗位要求"
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
              iconType="circle"
              iconSize={10}
            />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>

      {/* 数据说明 */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 rounded-xl text-center"
          >
            <div className="text-sm font-medium text-gray-700">
              {DIMENSIONS[index].emoji} {DIMENSIONS[index].label}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <span className="text-xs text-gray-400">你</span>
              <span className="text-lg font-extrabold text-indigo-600">
                {item["你的能力"]}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
