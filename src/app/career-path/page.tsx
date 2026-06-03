"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimelineNode, TaskCard, TaskPriority, TaskStatus, GapAnalysisResult } from "@/types/career-path";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/types/career-path";

/**
 * 从 localStorage 读取用户已保存的数据（技能标签、年级、期望岗位等）
 */
function getSavedUserData(): {
  skills: string[];
  grade: string;
  major: string;
  expectedPosition: string;
  projects: any[];
  internships: any[];
  dimensionScores: { professional: number; communication: number; leadership: number; innovation: number; resilience: number };
} {
  if (typeof window === 'undefined') {
    return {
      skills: [], grade: '', major: '', expectedPosition: '',
      projects: [], internships: [],
      dimensionScores: { professional: 55, communication: 55, leadership: 45, innovation: 55, resilience: 55 },
    };
  }
  try {
    const profileStr = localStorage.getItem('user_profile');
    const profileData = profileStr ? JSON.parse(profileStr) : {};
    const tagsStr = localStorage.getItem('selected_tags');
    const tagsData = tagsStr ? JSON.parse(tagsStr) : [];

    // 提取技能标签名
    const skills: string[] = Array.isArray(tagsData)
      ? tagsData.map((t: any) => t.name || t.label || t).filter(Boolean)
      : [];

    return {
      skills,
      grade: profileData.grade || profileData.basicInfo?.grade || '',
      major: profileData.major || profileData.basicInfo?.major || '',
      expectedPosition: profileData.expectedPosition || profileData.basicInfo?.expectedPosition || '',
      projects: profileData.projects || [],
      internships: profileData.internships || [],
      dimensionScores: profileData.dimensionScores || profileData.basicInfo?.dimensionScores || {
        professional: 55, communication: 55, leadership: 45, innovation: 55, resilience: 55,
      },
    };
  } catch {
    return {
      skills: [], grade: '', major: '', expectedPosition: '',
      projects: [], internships: [],
      dimensionScores: { professional: 55, communication: 55, leadership: 45, innovation: 55, resilience: 55 },
    };
  }
}

/**
 * 从 JWT token 解析用户 ID
 */
function getUserIdFromToken(): string {
  const token = getAccessToken();
  if (!token) return 'anonymous';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.uid || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

// ============================================
// 主组件
// ============================================

export default function CareerPathPage() {
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TimelineNode | null>(null);
  const [inputMode, setInputMode] = useState<'form' | 'result'>('form');
  const [formData, setFormData] = useState({
    grade: '',
    major: '',
    expectedPosition: '',
    skillsText: '',
    targetJobId: 'job_frontend_senior',
  });

  // 初始化表单：从 localStorage 读取已保存的数据
  useEffect(() => {
    const saved = getSavedUserData();
    setFormData(prev => ({
      ...prev,
      grade: saved.grade || prev.grade,
      major: saved.major || prev.major,
      expectedPosition: saved.expectedPosition || prev.expectedPosition,
      skillsText: saved.skills.length > 0 ? saved.skills.join('\n') : prev.skillsText,
    }));

    // 如果已有完整数据，自动填入表单
    if (saved.grade && saved.skills.length > 0 && saved.expectedPosition) {
      setInputMode('form');
    }
  }, []);

  // 岗位选项
  const jobOptions = [
    { id: 'job_frontend_senior', title: '高级前端开发工程师' },
    { id: 'job_frontend_mid', title: '前端开发工程师' },
    { id: 'job_backend_senior', title: '高级后端开发工程师' },
    { id: 'job_fullstack_senior', title: '高级全栈工程师' },
    { id: 'job_java_backend', title: 'Java后端开发工程师' },
    { id: 'job_ai_researcher', title: 'AI算法研究员' },
    { id: 'job_ml_engineer', title: '机器学习工程师' },
    { id: 'job_product_manager', title: '产品经理' },
    { id: 'job_data_analyst', title: '数据分析师' },
    { id: 'job_ui_designer', title: 'UI/UX设计师' },
    { id: 'job_product_operations', title: '产品运营' },
    { id: 'job_frontend_intern', title: '前端开发实习生' },
    { id: 'job_backend_intern', title: '后端开发实习生' },
  ];

  /**
   * 生成成长路径（调用后端API）
   */
  const generateCareerPath = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserIdFromToken();
      const targetJobId = formData.targetJobId;
      const selectedJob = jobOptions.find(j => j.id === targetJobId);
      const targetJobTitle = selectedJob?.title || formData.expectedPosition || '未选择';

      // 从表单数据构建 userProfileSnapshot
      const skills = formData.skillsText
        .split(/[\n,;，；、•·\-\*]+/)
        .map(s => s.trim()).filter(Boolean);

      const userProfileSnapshot = {
        grade: formData.grade || '未填写',
        major: formData.major || '未填写',
        expectedPosition: targetJobTitle,
        skills,
        projects: [],
        internships: [],
        dimensionScores: { professional: 55, communication: 55, leadership: 45, innovation: 55, resilience: 55 },
      };

      // 调用后端API
      try {
        const response = await fetch('/api/career-path/generate', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            targetJobId,
            userProfileSnapshot,
            forceRegenerate: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setGapResult(data.data);
          setSelectedNode(data.data.timeline[0] || null);
          setInputMode('result');
        } else {
          throw new Error(data.error || "生成成长路径失败");
        }
      } catch (apiErr) {
        // 静态部署兜底：生成本地示例成长路径
        console.warn("API 不可用，使用本地示例数据");
        const sampleResult: GapAnalysisResult = {
          userId: userId || 'local',
          targetJob: targetJobTitle,
          overallMatchScore: 55,
          dimensionScores: {
            professional: 55,
            communication: 55,
            leadership: 45,
            innovation: 55,
            resilience: 55,
          },
          timeline: [
            {
              id: "phase1",
              title: "夯实基础",
              phase: "short",
              duration: "1-3个月",
              tasks: [
                {
                  id: "t1", title: `系统学习 ${targetJobTitle} 核心技能`, priority: "high" as TaskPriority,
                  status: "pending" as TaskStatus, description: "通过在线课程和实践项目掌握核心技能",
                },
                {
                  id: "t2", title: "刷算法题 50 道", priority: "high" as TaskPriority,
                  status: "pending" as TaskStatus, description: "在 LeetCode 完成高频算法题",
                },
                {
                  id: "t3", title: "完善个人简历", priority: "medium" as TaskPriority,
                  status: "pending" as TaskStatus, description: "使用 STAR 法则优化项目经历描述",
                },
              ],
            },
            {
              id: "phase2",
              title: "项目实践",
              phase: "medium",
              duration: "3-6个月",
              tasks: [
                {
                  id: "t4", title: `完成一个 ${targetJobTitle} 相关实战项目`, priority: "high" as TaskPriority,
                  status: "pending" as TaskStatus, description: "独立完成一个完整的项目并部署上线",
                },
                {
                  id: "t5", title: "参加技术社区/开源项目", priority: "medium" as TaskPriority,
                  status: "pending" as TaskStatus, description: "参与 GitHub 开源项目贡献",
                },
                {
                  id: "t6", title: "模拟面试练习", priority: "medium" as TaskPriority,
                  status: "pending" as TaskStatus, description: "与同学互相模拟面试，练习表达",
                },
              ],
            },
            {
              id: "phase3",
              title: "冲刺求职",
              phase: "long",
              duration: "1-2个月",
              tasks: [
                {
                  id: "t7", title: "投递简历和笔试", priority: "high" as TaskPriority,
                  status: "pending" as TaskStatus, description: "海投简历，参加笔试",
                },
                {
                  id: "t8", title: "参加面试", priority: "high" as TaskPriority,
                  status: "pending" as TaskStatus, description: "准备技术面、HR面",
                },
                {
                  id: "t9", title: "Offer 选择和入职准备", priority: "medium" as TaskPriority,
                  status: "pending" as TaskStatus, description: "对比多个 Offer，选择最合适的",
                },
              ],
            },
          ],
          createdAt: new Date().toISOString(),
        };
        setGapResult(sampleResult);
        setSelectedNode(sampleResult.timeline[0] || null);
        setInputMode('result');
      }
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

  // 错误或无数据时，显示表单
  if (error || !gapResult || inputMode === 'form') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-2xl font-bold mb-2">动态成长路径规划</h1>
          <p className="text-text-secondary mb-6">填写你的年级、技能和目标岗位，AI将为你生成个性化成长路径。</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* 年级 */}
            <div>
              <label className="block text-sm font-medium mb-1">当前年级 *</label>
              <select
                value={formData.grade}
                onChange={e => setFormData(p => ({ ...p, grade: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card-bg"
              >
                <option value="">请选择年级</option>
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三">大三</option>
                <option value="大四">大四</option>
                <option value="硕士在读一年级">硕士在读一年级</option>
                <option value="硕士在读二年级">硕士在读二年级</option>
                <option value="博士在读">博士在读</option>
              </select>
            </div>

            {/* 专业 */}
            <div>
              <label className="block text-sm font-medium mb-1">专业</label>
              <input
                type="text"
                value={formData.major}
                onChange={e => setFormData(p => ({ ...p, major: e.target.value }))}
                placeholder="如：计算机科学与技术"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card-bg"
              />
            </div>

            {/* 目标岗位 */}
            <div>
              <label className="block text-sm font-medium mb-1">目标岗位 *</label>
              <select
                value={formData.targetJobId}
                onChange={e => setFormData(p => ({ ...p, targetJobId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card-bg"
              >
                <option value="">请选择目标岗位</option>
                {jobOptions.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>

            {/* 当前技能 */}
            <div>
              <label className="block text-sm font-medium mb-1">当前已掌握的技能 *</label>
              <textarea
                value={formData.skillsText}
                onChange={e => setFormData(p => ({ ...p, skillsText: e.target.value }))}
                placeholder="每行一个技能，如：&#10;JavaScript&#10;React&#10;CSS&#10;数据结构"
                rows={6}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card-bg resize-none"
              />
            </div>

            {/* 生成按钮 */}
            <button
              onClick={generateCareerPath}
              disabled={loading || !formData.grade || !formData.targetJobId}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '生成中...' : '生成成长路径'}
            </button>
          </div>
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
              onClick={() => { setInputMode('form'); setGapResult(null); }}
              className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
            >
              重新填写
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
