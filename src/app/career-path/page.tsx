"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimelineNode, TaskCard, TaskPriority, TaskStatus, GapAnalysisResult } from "@/types/career-path";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/types/career-path";

// ============================================
// 主组件
// ============================================

export default function CareerPathPage() {
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TimelineNode | null>(null);

  // 初始化：检查用户画像与目标岗位，然后生成成长路径
  useEffect(() => {
    generateCareerPath();
  }, []);

  /**
   * 生成成长路径（调用后端API）
   */
  const generateCareerPath = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: 从全局状态获取用户画像和目标岗位ID
      const userId = "user_123";  // 模拟用户ID
      const targetJobId = "backend";  // 模拟目标岗位ID（后端开发工程师）

      // 调用后端API
      const response = await fetch("/api/career-path/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          targetJobId: targetJobId,
          userProfileSnapshot: {
            grade: "大二",
            major: "计算机科学与技术",
            expectedPosition: "后端开发工程师",
            skills: ["Java", "数据结构", "算法"],
            projects: [
              {
                name: "学生管理系统",
                role: "后端开发",
                duration: "2023.09-2023.12",
                technologies: ["Java", "Spring Boot", "MySQL"],
                description: "使用Spring Boot开发后台管理系统，实现用户管理和权限控制"
              },
            ],
            internships: [],
            dimensionScores: {
              professional: 60,
              communication: 70,
              leadership: 65,
              innovation: 68,
              resilience: 72,
            },
          },
          forceRegenerate: false
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setGapResult(data.data);
        setSelectedNode(data.data.timeline[0] || null);  // 默认选中第一个节点
      } else {
        throw new Error(data.error || "Failed to generate career path");
      }

    } catch (err) {
      console.error("Generate career path error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新任务状态（完成/跳过）
   */
  const updateTaskStatus = async (nodeId: string, taskId: string, newStatus: TaskStatus) => {
    // TODO: 调用后端API更新任务状态
    console.log("Update task status:", nodeId, taskId, newStatus);

    // 演示模式：本地更新
    if (gapResult) {
      const updatedTimeline = gapResult.timeline.map(node => {
        if (node.id === nodeId) {
          const updatedTasks = node.tasks.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
              };
            }
            return task;
          });
          return { ...node, tasks: updatedTasks };
        }
        return node;
      });

      setGapResult({
        ...gapResult,
        timeline: updatedTimeline
      });
    }
  };

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">AI正在分析你的画像与目标岗位差距，生成成长路径...</p>
        </div>
      </div>
    );
  }

  // 错误
  if (error || !gapResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">生成失败</h2>
          <p className="text-text-secondary mb-6">{error || "未知错误"}</p>
          <button
            onClick={generateCareerPath}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
          >
            重新生成
          </button>
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card-bg/80 backdrop-blur-md sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🗺️ 动态成长路径规划</h1>
              <p className="text-text-secondary text-sm mt-1">
                目标岗位：{gapResult.targetJobTitle} | 总体差距得分：{gapResult.overallGapScore}分
              </p>
            </div>
            <button
              onClick={generateCareerPath}
              className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
            >
              🔄 重新生成
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：时间轴 */}
          <div className="lg:col-span-1">
            <TimelineView
              timeline={gapResult.timeline}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          </div>

          {/* 右侧：任务列表 */}
          <div className="lg:col-span-2">
            {selectedNode ? (
              <TaskListView
                node={selectedNode}
                onUpdateTaskStatus={updateTaskStatus}
              />
            ) : (
              <div className="text-center py-12 text-text-secondary">
                <p>请选择时间节点查看任务</p>
              </div>
            )}
          </div>
        </div>

        {/* 底部：差距分析总结 */}
        <div className="mt-12 bg-card-bg rounded-2xl border border-border p-6">
          <h2 className="text-xl font-bold mb-4">📊 差距分析总结</h2>
          <p className="text-text-secondary leading-relaxed">{gapResult.summary}</p>
          
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-xl p-4">
              <h3 className="font-semibold text-red-700 mb-2">技能差距</h3>
              <ul className="text-sm text-red-600 space-y-1">
                {gapResult.skillGaps.map((gap, idx) => (
                  <li key={idx}>• {gap.skillName}：{gap.currentLevel} → {gap.targetLevel}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-orange-50 rounded-xl p-4">
              <h3 className="font-semibold text-orange-700 mb-2">经历差距</h3>
              <ul className="text-sm text-orange-600 space-y-1">
                {gapResult.experienceGaps.map((gap, idx) => (
                  <li key={idx}>• {gap.experienceType}：{gap.currentCount}/{gap.targetCount}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-700 mb-2">能力差距</h3>
              <ul className="text-sm text-blue-600 space-y-1">
                {gapResult.dimensionGaps.map((gap, idx) => (
                  <li key={idx}>• {gap.dimension}：{gap.currentScore} → {gap.targetScore}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 时间轴视图组件
// ============================================

interface TimelineViewProps {
  timeline: TimelineNode[];
  selectedNode: TimelineNode | null;
  onSelectNode: (node: TimelineNode) => void;
}

function TimelineView({ timeline, selectedNode, onSelectNode }: TimelineViewProps) {
  return (
    <div className="bg-card-bg rounded-2xl border border-border p-4">
      <h2 className="text-lg font-bold mb-4">⏰ 时间轴</h2>
      
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {timeline.map((node, idx) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelectNode(node)}
            className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
              selectedNode?.id === node.id
                ? 'bg-primary/10 border-2 border-primary'
                : node.isCurrent
                ? 'bg-green-50 border-2 border-green-400'
                : node.isCompleted
                ? 'bg-gray-50 border-2 border-gray-300'
                : 'bg-background border-2 border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{node.title}</span>
              {node.isCurrent && (
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">当前</span>
              )}
              {node.isCompleted && (
                <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">已完成</span>
              )}
            </div>
            <p className="text-xs text-text-secondary">{node.date}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-background rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${calculateNodeProgress(node)}%` }}
                ></div>
              </div>
              <span className="text-xs text-text-secondary">{calculateNodeProgress(node)}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * 计算时间节点进度（完成的任务数/总任务数）
 */
function calculateNodeProgress(node: TimelineNode): number {
  if (node.tasks.length === 0) return 0;
  const completedCount = node.tasks.filter(t => t.status === 'completed').length;
  return Math.round((completedCount / node.tasks.length) * 100);
}

// ============================================
// 任务列表视图组件
// ============================================

interface TaskListViewProps {
  node: TimelineNode;
  onUpdateTaskStatus: (nodeId: string, taskId: string, newStatus: TaskStatus) => void;
}

function TaskListView({ node, onUpdateTaskStatus }: TaskListViewProps) {
  return (
    <div className="bg-card-bg rounded-2xl border border-border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{node.title}</h2>
        <p className="text-text-secondary text-sm mt-1">{node.date}</p>
      </div>

      <div className="space-y-4">
        {node.tasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-xl border-2 ${
              task.status === 'completed'
                ? 'bg-green-50 border-green-300'
                : task.status === 'in_progress'
                ? 'bg-blue-50 border-blue-300'
                : 'bg-background border-border'
            }`}
          >
            {/* 任务头部：标题 + 优先级 + 状态 */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  task.status === 'completed' ? 'line-through text-text-secondary' : ''
                }`}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      color: PRIORITY_CONFIG[task.priority].color,
                      backgroundColor: PRIORITY_CONFIG[task.priority].bgColor
                    }}
                  >
                    {PRIORITY_CONFIG[task.priority].label}
                  </span>
                  <span className="text-xs text-text-secondary">
                    ⏱️ {task.estimatedTime}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 状态按钮 */}
                {task.status !== 'completed' && (
                  <button
                    onClick={() => onUpdateTaskStatus(node.id, task.id, 'completed')}
                    className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    完成
                  </button>
                )}
                {task.status !== 'skipped' && task.status !== 'completed' && (
                  <button
                    onClick={() => onUpdateTaskStatus(node.id, task.id, 'skipped')}
                    className="text-xs px-3 py-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    跳过
                  </button>
                )}
                {task.status === 'completed' && (
                  <span className="text-xs text-green-600 font-semibold">✅ 已完成</span>
                )}
              </div>
            </div>

            {/* 任务描述 */}
            <p className="text-sm text-text-secondary mb-2">{task.description}</p>

            {/* 关联差距 */}
            <div className="bg-orange-50 rounded-lg p-2 mb-2">
              <p className="text-xs text-orange-700">
                <span className="font-semibold">🎯 关联差距：</span>
                {task.relatedGap}
              </p>
            </div>

            {/* 直达链接 */}
            {task.actionLink && (
              <a
                href={task.actionLink.href}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition-colors"
              >
                {task.actionLink.label} →
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
