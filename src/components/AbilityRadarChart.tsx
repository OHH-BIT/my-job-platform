/**
 * 能力雷达图对比组件
 * 使用 Recharts 将"用户当前能力"与"目标岗位要求"以双层雷达图的形式展示
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

interface AbilityRadarChartProps {
  userScores: {
    professional: number;
    communication: number;
    leadership: number;
    innovation: number;
    resilience: number;
  };
  targetScores: {
    professional: number;
    communication: number;
    leadership: number;
    innovation: number;
    resilience: number;
  };
  matchScores?: {
    professional: number;
    communication: number;
    leadership: number;
    innovation: number;
    resilience: number;
  };
}

export default function AbilityRadarChart({
  userScores,
  targetScores,
  matchScores
}: AbilityRadarChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // 准备雷达图数据
    const data = [
      {
        dimension: '专业技能',
        user: userScores.professional,
        target: targetScores.professional,
        fullMark: 100,
        match: matchScores ? matchScores.professional : 0
      },
      {
        dimension: '沟通协作',
        user: userScores.communication,
        target: targetScores.communication,
        fullMark: 100,
        match: matchScores ? matchScores.communication : 0
      },
      {
        dimension: '领导力',
        user: userScores.leadership,
        target: targetScores.leadership,
        fullMark: 100,
        match: matchScores ? matchScores.leadership : 0
      },
      {
        dimension: '创新思维',
        user: userScores.innovation,
        target: targetScores.innovation,
        fullMark: 100,
        match: matchScores ? matchScores.innovation : 0
      },
      {
        dimension: '抗压能力',
        user: userScores.resilience,
        target: targetScores.resilience,
        fullMark: 100,
        match: matchScores ? matchScores.resilience : 0
      }
    ];

    setChartData(data);
  }, [userScores, targetScores, matchScores]);

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const userScore = payload.find((p: any) => p.dataKey === 'user')?.value || 0;
      const targetScore = payload.find((p: any) => p.dataKey === 'target')?.value || 0;
      const matchScore = payload.find((p: any) => p.dataKey === 'match')?.value || 0;

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              我的能力: {userScore}分
            </p>
            <p className="text-red-600">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              岗位要求: {targetScore}分
            </p>
            <p className="text-green-600 font-semibold">
              匹配度: {matchScore.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-96 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">能力雷达图对比</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ fill: '#374151', fontSize: 14 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          
          {/* 目标岗位要求 - 底层 */}
          <Radar
            name="岗位要求"
            dataKey="target"
            stroke="#EF4444"
            fill="#EF4444"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          
          {/* 用户当前能力 - 上层 */}
          <Radar
            name="我的能力"
            dataKey="user"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            iconSize={10}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>💡 蓝色区域表示您的当前能力，红色区域表示目标岗位的要求。重叠部分越小，说明差距越大。</p>
      </div>
    </div>
  );
}
