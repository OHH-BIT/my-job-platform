/**
 * 动态路径时间轴组件
 * 用交互式的时间轴展示系统生成的成长路径
 */

'use client';

import React, { useState } from 'react';
import { PathNode, PathStatus, NodeType, PriorityLevel, getNodeTypeLabel } from '@/data/growth-path-models';

interface GrowthPathTimelineProps {
  nodes: PathNode[];
  onNodeStatusChange?: (nodeId: string, newStatus: PathStatus, progress: number) => void;
}

const phaseColors: Record<NodeType, { gradient: string; bg: string; text: string; dot: string }> = {
  'skill_learning': { gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'project_practice': { gradient: 'from-purple-400 to-violet-500', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'certification': { gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'interview_prep': { gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'networking': { gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
};

const nodeIcons: Record<NodeType, JSX.Element> = {
  'skill_learning': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  'project_practice': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  'certification': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  'interview_prep': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  'networking': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

const resourceIcons: Record<string, JSX.Element> = {
  course: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  video: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  book: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  default: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

function getResourceIcon(type: string): JSX.Element {
  return resourceIcons[type] || resourceIcons.default;
}

function getResourceColorClass(type: string): string {
  switch (type) {
    case 'course': return 'bg-blue-100 text-blue-600';
    case 'video': return 'bg-purple-100 text-purple-600';
    case 'book': return 'bg-amber-100 text-amber-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return '入门';
    case 'intermediate': return '进阶';
    case 'advanced': return '高级';
    default: return difficulty;
  }
}

const shadowColorMap: Record<NodeType, string> = {
  'skill_learning': 'blue',
  'project_practice': 'purple',
  'certification': 'emerald',
  'interview_prep': 'amber',
  'networking': 'pink',
};

export default function GrowthPathTimeline({ nodes, onNodeStatusChange }: GrowthPathTimelineProps) {
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodeId(expandedNodeId === nodeId ? null : nodeId);
  };

  const handleStart = (nodeId: string) => {
    if (onNodeStatusChange) {
      onNodeStatusChange(nodeId, 'in_progress', 50);
    }
  };

  const handleComplete = (nodeId: string) => {
    if (onNodeStatusChange) {
      onNodeStatusChange(nodeId, 'completed', 100);
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        {/* 时间轴线 — 渐变色 */}
        <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-400 via-purple-500 to-amber-400"></div>

        <div className="space-y-8">
          {nodes.map((node, index) => {
            const expanded = expandedNodeId === node.id;
            const colors = phaseColors[node.nodeType];
            const shadowColor = shadowColorMap[node.nodeType];

            return (
              <div key={node.id} className="group relative flex items-start gap-5">
                {/* 节点圆圈 */}
                <div className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br ${colors.gradient} shadow-lg shadow-${shadowColor}-500/25 transition-transform duration-300 group-hover:scale-110`}>
                  <span className="text-white">{nodeIcons[node.nodeType]}</span>
                  {node.status === 'completed' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>

                {/* 内容卡片 */}
                <div className={`flex-1 bg-white rounded-xl border transition-all duration-300 
                  ${node.status === 'completed' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}
                  hover:shadow-lg hover:-translate-y-0.5`}>
                  <div className="p-5">
                    {/* 序号 + 标题 */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                        {index + 1}
                      </span>
                      <h4 className="text-base font-bold text-gray-900">{node.title}</h4>
                    </div>

                    {/* 类型标签 + 预估时间 + 优先级 */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                        {getNodeTypeLabel(node.nodeType)}
                      </span>
                      <span className="text-xs text-gray-400">约 {node.estimatedHours} 小时</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        node.priority === 'high' ? 'border-red-200 text-red-600 bg-red-50' :
                        node.priority === 'medium' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                        'border-green-200 text-green-600 bg-green-50'
                      }`}>
                        {node.priority === 'high' ? '高优先' : node.priority === 'medium' ? '中优先' : '低优先'}
                      </span>
                    </div>

                    {/* 描述 */}
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{node.description}</p>

                    {/* 进度条（进行中） */}
                    {node.status === 'in_progress' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>学习进度</span>
                          <span className="font-medium">{node.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${node.progress}%` }}></div>
                        </div>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleExpand(node.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {expanded ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                        </svg>
                        {expanded ? '收起' : '展开详情'}
                      </button>
                      {node.status === 'not_started' && (
                        <button onClick={() => handleStart(node.id)} className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-lg hover:shadow-md transition-all">
                          开始学习
                        </button>
                      )}
                      {node.status === 'in_progress' && (
                        <button onClick={() => handleComplete(node.id)} className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-lg hover:shadow-md transition-all">
                          标记完成
                        </button>
                      )}
                      {node.status === 'completed' && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          已完成
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 展开详情区域 */}
                  {expanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-gray-100 mt-3">
                      <div className="pt-4 space-y-4">
                        {/* 关联技能 */}
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">关联技能</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {node.relatedSkills.map((skill, idx) => (
                              <span key={idx} className={`text-xs px-2.5 py-1 rounded-lg ${colors.bg} ${colors.text}`}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 完成标准 */}
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">完成标准</h5>
                          <p className="text-sm text-gray-600">{node.completionCriteria}</p>
                        </div>

                        {/* 学习资源 */}
                        {node.resources && node.resources.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">推荐资源</h5>
                            <div className="space-y-2">
                              {node.resources.map((resource, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getResourceColorClass(resource.type)}`}>
                                    {getResourceIcon(resource.type)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-800">{resource.title}</div>
                                    <div className="text-xs text-gray-500">{getDifficultyLabel(resource.difficulty)} · 约{resource.durationHours}小时</div>
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${resource.isFree ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {resource.isFree ? '免费' : '付费'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
