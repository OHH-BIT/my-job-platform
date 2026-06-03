/**
 * 智能动态成长路径规划页面
 * 用户主动输入现状 -> AI 差距分析 -> 动态生成路径
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AbilityRadarChart from '@/components/AbilityRadarChart';
import GrowthPathTimeline from '@/components/GrowthPathTimeline';

// ============================================
// AI 分析报告子组件（结构化渲染 markdown）
// ============================================

interface AnalysisSection {
  title: string;
  items: string[];
  isWarning?: boolean;
}

function AnalysisReport({ content }: { content: string }) {
  const sections = useMemo(() => {
    const lines = content.split('\n').filter(l => l.trim());
    const result: AnalysisSection[] = [];
    let current: AnalysisSection | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // ## 标题
      const h2Match = trimmed.match(/^##\s+(.+)/);
      if (h2Match) {
        if (current) result.push(current);
        current = { title: h2Match[1], items: [] };
        continue;
      }

      // ### 子标题
      const h3Match = trimmed.match(/^###\s+(.+)/);
      if (h3Match && current) {
        current.items.push(`__PHASE__${h3Match[1]}`);
        continue;
      }

      // > 引用/警告
      const quoteMatch = trimmed.match(/^>\s*(.+)/);
      if (quoteMatch) {
        if (current) {
          current.items.push(`__WARN__${quoteMatch[1]}`);
        }
        continue;
      }

      // 普通文本（去除 ** 标记）
      if (current) {
        const cleanText = trimmed.replace(/\*\*/g, '').replace(/^[-*]\s*/, '');
        if (cleanText) {
          current.items.push(cleanText);
        }
      }
    }

    if (current) result.push(current);
    return result;
  }, [content]);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-5">
      {sections.map((section, si) => (
        <div key={si}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{section.title}</h3>
          <div className="space-y-1">
            {section.items.map((item, ii) => {
              // 阶段标题
              if (item.startsWith('__PHASE__')) {
                const title = item.slice(8);
                return (
                  <div key={ii} className="mt-3 mb-1 text-sm font-semibold text-gray-800">{title}</div>
                );
              }
              // 警告
              if (item.startsWith('__WARN__')) {
                const text = item.slice(8);
                return (
                  <div key={ii} className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{text}</div>
                );
              }
              // 普通条目
              const cleaned = item.replace(/^[-*]\s+/, '');
              // 判断是否是差距条目（含括号内的数值对比）
              const isGap = cleaned.includes('当前') && cleaned.includes('分');
              return (
                <div key={ii} className={`text-sm flex items-start gap-2 leading-relaxed ${isGap ? 'text-red-600' : 'text-gray-600'}`}>
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isGap ? 'bg-red-400' : 'bg-primary/50'}`} />
                  <span>{cleaned}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
import { GrowthPath, PathStatus, SkillGap } from '@/data/growth-path-models';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// 内联 SVG 图标常量
// ============================================

const Icons = {
  edit: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  ),
  radar: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M12 3a9 9 0 0 1 0 18" />
      <path d="M3 12a9 9 0 0 1 18 0" />
      <path d="M12 7a5 5 0 0 1 0 10" />
      <path d="M7 12a5 5 0 0 1 10 0" />
    </svg>
  ),
  route: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7h8.5" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  ),
  brain: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 5 5c0 1.1-.4 2.1-1 2.9" />
      <path d="M12 2a5 5 0 0 0-5 5c0 1.1.4 2.1 1 2.9" />
      <path d="M15.4 9.9c.7.8 1.1 1.9 1.1 3.1 0 2.8-2.2 5-5 5s-5-2.2-5-5c0-1.2.4-2.3 1.1-3.1" />
      <path d="M9.5 17.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5" />
      <path d="M12 2v20" />
      <path d="M4.5 11.5c1.5-.5 3-.5 4.5 0" />
      <path d="M15 11.5c1.5-.5 3-.5 4.5 0" />
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  alert: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  refresh: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  ),
  target: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  ),
  spinner: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
};

// ============================================
// 类型定义
// ============================================

interface JobOption {
  id: string;
  jobTitle: string;
  salaryRange?: { min: number; max: number; currency: string };
  requiredSkills?: Array<{ name: string; minLevel: number }>;
}

// ============================================
// 匹配度圆环组件
// ============================================

function MatchScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative w-32 h-32">
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, #E5E7EB ${score * 3.6}deg)`,
        }}
      />
      <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color }}>
            {score.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">匹配度</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 差距等级颜色映射
// ============================================

function getGapLevelColor(level: string): string {
  switch (level) {
    case 'critical': return '#EF4444';
    case 'high': return '#F97316';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
}

function getGapLevelLabel(level: string): string {
  switch (level) {
    case 'critical': return '严重';
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '';
  }
}

// ============================================
// 主组件
// ============================================

export default function GrowthPathPage() {
  const { isAuthenticated, isInitializing, user: authUser } = useAuth();

  // ========== 表单状态 ==========
  const [grade, setGrade] = useState('大三');
  const [currentSkills, setCurrentSkills] = useState('');
  const [targetJobId, setTargetJobId] = useState('');
  const [targetJobTitle, setTargetJobTitle] = useState('');

  // ========== 岗位列表 ==========
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // ========== 成长路径结果 ==========
  const [growthPath, setGrowthPath] = useState<GrowthPath | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== 回填表单（编辑模式） ==========
  const [editingForm, setEditingForm] = useState(false);

  // ============================================
  // 生命周期：加载岗位列表 + 已有路径
  // ============================================

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      fetchJobList();
      loadExistingPath();
    }
  }, [isInitializing, isAuthenticated]);

  // ============================================
  // 获取岗位列表
  // ============================================

  const fetchJobList = async () => {
    setJobsLoading(true);
    try {
      const result = await api.get('/api/job-benchmarks');
      if (result.success && Array.isArray(result.data)) {
        const options: JobOption[] = result.data.map((job: any) => ({
          id: job.id,
          jobTitle: job.jobTitle,
          salaryRange: job.salaryRange,
          requiredSkills: job.requiredSkills?.slice(0, 5),
        }));
        setJobOptions(options);
      } else {
        // fallback
        setJobOptions(getFallbackJobs());
      }
    } catch {
      setJobOptions(getFallbackJobs());
    } finally {
      setJobsLoading(false);
    }
  };

  function getFallbackJobs(): JobOption[] {
    return [
      { id: 'job_frontend_senior', jobTitle: '高级前端开发工程师' },
      { id: 'job_frontend', jobTitle: '前端开发工程师' },
      { id: 'job_backend_senior', jobTitle: '高级后端开发工程师' },
      { id: 'job_fullstack_senior', jobTitle: '高级全栈工程师' },
      { id: 'job_java_backend', jobTitle: 'Java后端开发工程师' },
      { id: 'job_ai_researcher', jobTitle: 'AI算法研究员' },
      { id: 'job_ml_engineer', jobTitle: '机器学习工程师' },
      { id: 'job_pm', jobTitle: '产品经理' },
      { id: 'job_data_analyst', jobTitle: '数据分析师' },
      { id: 'job_uiux', jobTitle: 'UI/UX设计师' },
      { id: 'job_operation', jobTitle: '产品运营' },
      { id: 'job_frontend_intern', jobTitle: '前端开发实习生' },
      { id: 'job_backend_intern', jobTitle: '后端开发实习生' },
    ];
  }

  // ============================================
  // 加载已有路径
  // ============================================

  const loadExistingPath = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get('/api/growth-path');
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setGrowthPath(result.data[0]);
      }
    } catch (err: any) {
      console.error('[成长路径] 加载已有路径失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // 生成成长路径
  // ============================================

  const handleGenerate = async () => {
    if (!grade.trim() || !currentSkills.trim() || !targetJobId || !targetJobTitle.trim()) {
      setError('请填写所有必填信息');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const result = await api.post('/api/growth-path/generate', {
        grade: grade.trim(),
        currentSkills: currentSkills.trim(),
        targetJobId,
        targetJobTitle: targetJobTitle.trim(),
      });

      if (result.success) {
        setGrowthPath(result.data);
        setEditingForm(false);
      } else {
        setError('生成失败: ' + (result.error || '未知错误'));
      }
    } catch (err: any) {
      setError('生成失败: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // ============================================
  // 重新分析
  // ============================================

  const handleReanalyze = () => {
    setEditingForm(true);
    setGrowthPath(null);
    setError(null);
  };

  // ============================================
  // 重新生成（保留表单数据）
  // ============================================

  const handleRegenerate = async () => {
    if (!grade.trim() || !currentSkills.trim() || !targetJobId || !targetJobTitle.trim()) {
      setError('请填写所有必填信息');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const result = await api.post('/api/growth-path/generate', {
        grade: grade.trim(),
        currentSkills: currentSkills.trim(),
        targetJobId,
        targetJobTitle: targetJobTitle.trim(),
      });

      if (result.success) {
        setGrowthPath(result.data);
      } else {
        setError('重新生成失败: ' + (result.error || '未知错误'));
      }
    } catch (err: any) {
      setError('重新生成失败: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // ============================================
  // 更新节点状态
  // ============================================

  const handleNodeStatusChange = async (nodeId: string, newStatus: PathStatus, progress: number) => {
    if (!growthPath) return;

    try {
      const result = await api.put(`/api/growth-path/${growthPath.id}`, { nodeId, status: newStatus, progress });
      if (result.success) {
        setGrowthPath(result.data);
      } else {
        setError('更新节点状态失败: ' + result.error);
      }
    } catch (err: any) {
      setError('更新节点状态失败: ' + err.message);
    }
  };

  // ============================================
  // 选中的岗位信息
  // ============================================

  const selectedJob = jobOptions.find(j => j.id === targetJobId);

  // ============================================
  // 渲染：未登录
  // ============================================

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
            {Icons.user}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可查看你的专属成长路径</p>
          <a
            href="/auth/login"
            className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all hover:shadow-lg"
          >
            去登录
          </a>
        </div>
      </div>
    );
  }

  // ============================================
  // 渲染：主页面
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50">
      {/* ====== 页面顶部标题区 ====== */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">智能动态成长路径规划</h1>
          <p className="text-indigo-100 text-lg">输入你的现状，AI 将为你量身定制专属成长方案</p>
        </div>
      </div>

      {/* ====== 内容区 ====== */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* 加载状态 */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ====== 交互式信息录入面板（无 growthPath 或编辑模式时显示） ====== */}
            {!growthPath && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                {/* 标题 */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-indigo-600">{Icons.edit}</div>
                  <h2 className="text-xl font-bold text-gray-900">填写你的现状信息</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6 ml-8">
                  告诉我们你当前的年级、技能储备和目标岗位，AI 将为你生成专属的成长路径
                </p>

                {/* 错误提示 */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <span className="text-red-600">{Icons.alert}</span>
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* 表单 */}
                <div className="space-y-5">
                  {/* 当前年级 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">当前年级</label>
                    <select
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    >
                      <option value="大一">大一</option>
                      <option value="大二">大二</option>
                      <option value="大三">大三</option>
                      <option value="大四">大四</option>
                      <option value="硕士在读一年级">硕士在读一年级</option>
                      <option value="硕士在读二年级">硕士在读二年级</option>
                      <option value="博士在读">博士在读</option>
                    </select>
                  </div>

                  {/* 当前技能与知识状态 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">当前技能与知识状态</label>
                    <textarea
                      value={currentSkills}
                      onChange={e => setCurrentSkills(e.target.value)}
                      placeholder={`请描述你目前掌握的技能、知识储备和项目经历，例如：\n• 掌握 JavaScript、React 基础\n• 做过一个校园二手交易小程序\n• 了解基本的算法和数据结构`}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* 意向岗位 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">意向岗位</label>
                    <select
                      value={targetJobId}
                      onChange={e => {
                        const id = e.target.value;
                        setTargetJobId(id);
                        const job = jobOptions.find(j => j.id === id);
                        if (job) setTargetJobTitle(job.jobTitle);
                      }}
                      disabled={jobsLoading}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all disabled:opacity-60"
                    >
                      <option value="" disabled>
                        {jobsLoading ? '加载中...' : '请选择目标岗位'}
                      </option>
                      {jobOptions.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.jobTitle}
                        </option>
                      ))}
                    </select>

                    {/* 选中岗位的信息概览 */}
                    {selectedJob && (
                      <div className="mt-3 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          {selectedJob.salaryRange && (
                            <div>
                              <span className="text-gray-500">薪资范围：</span>
                              <span className="font-semibold text-indigo-700">
                                {selectedJob.salaryRange.currency === 'CNY' ? '¥' : selectedJob.salaryRange.currency}
                                {selectedJob.salaryRange.min}k - {selectedJob.salaryRange.max}k
                              </span>
                            </div>
                          )}
                          {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                            <div>
                              <span className="text-gray-500">核心技能：</span>
                              <span className="text-indigo-700">
                                {selectedJob.requiredSkills.map(s => s.name).join('、')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 生成按钮 */}
                  <button
                    onClick={editingForm ? handleRegenerate : handleGenerate}
                    disabled={generating || !grade.trim() || !currentSkills.trim() || !targetJobId}
                    className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin inline-block">{Icons.spinner}</span>
                        AI 正在分析...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {Icons.brain}
                        {editingForm ? '重新分析并生成路径' : '生成我的专属成长路径'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ====== 成长路径结果展示 ====== */}
            {growthPath && (
              <div className="space-y-6">
                {/* --- 3a. 匹配度概览卡片 --- */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* 左侧：匹配度圆环 */}
                    <MatchScoreRing score={growthPath.matchAnalysis.overallMatchScore} />

                    {/* 右侧：优势 + 待改进 */}
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          优势领域
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {growthPath.matchAnalysis.strengthAreas.map((area, idx) => (
                            <span key={idx} className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          待改进领域
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {growthPath.matchAnalysis.improvementAreas.map((area, idx) => (
                            <span key={idx} className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg text-sm">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 底部：目标岗位 + 重新分析 */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      {Icons.target}
                      <span>目标岗位：<strong className="text-gray-900">{growthPath.targetJobTitle}</strong></span>
                    </div>
                    <button
                      onClick={handleReanalyze}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-all text-sm font-medium"
                    >
                      {Icons.refresh}
                      重新分析
                    </button>
                  </div>
                </div>

                {/* --- 3b. 差距分析可视化 --- */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                  {/* 板块标题 */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                      {Icons.radar}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">能力差距分析</h2>
                      <p className="text-sm text-gray-500">基于 AI 分析结果，对比你的现状与目标岗位要求</p>
                    </div>
                  </div>

                  {/* 已掌握 vs 欠缺 */}
                  {(() => {
                    const mastered = growthPath.matchAnalysis.skillGaps.filter(g => g.gapScore <= 10);
                    const gaps = growthPath.matchAnalysis.skillGaps.filter(g => g.gapScore > 10);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 左：已掌握 */}
                        <div>
                          <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            已掌握的技能
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {mastered.length > 0 ? mastered.map((gap, idx) => (
                              <span
                                key={idx}
                                className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                              >
                                {gap.skillName}
                                <span className="text-green-500 text-xs">{gap.currentLevel}/{gap.requiredLevel}</span>
                              </span>
                            )) : (
                              <span className="text-gray-400 text-sm">暂无已掌握的技能</span>
                            )}
                          </div>
                        </div>

                        {/* 右：欠缺 */}
                        <div>
                          <h3 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            需要提升的技能
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {gaps.length > 0 ? gaps.map((gap, idx) => {
                              const sizeClass = gap.gapScore > 50 ? 'text-base' : gap.gapScore > 30 ? 'text-sm' : 'text-xs';
                              return (
                                <span
                                  key={idx}
                                  className={`bg-orange-50 text-orange-700 border-2 border-dashed border-orange-300 px-3 py-1.5 rounded-lg ${sizeClass} flex items-center gap-1.5`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getGapLevelColor(gap.gapLevel) }}
                                  ></span>
                                  {gap.skillName}
                                  <span className="text-orange-400 text-xs">{gap.currentLevel}/{gap.requiredLevel}</span>
                                </span>
                              );
                            }) : (
                              <span className="text-gray-400 text-sm">暂无需要提升的技能</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 欠缺技能进度条 */}
                  {(() => {
                    const gaps = growthPath.matchAnalysis.skillGaps.filter(g => g.gapScore > 10);
                    if (gaps.length === 0) return null;

                    return (
                      <div className="mt-6 space-y-3">
                        {gaps.map((gap, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700 flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: getGapLevelColor(gap.gapLevel) }}
                                ></span>
                                {gap.skillName}
                                <span className="text-xs text-gray-400 font-normal">
                                  {getGapLevelLabel(gap.gapLevel)}差距
                                </span>
                              </span>
                              <span className="text-gray-500">{gap.currentLevel}/{gap.requiredLevel}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((gap.currentLevel / gap.requiredLevel) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* --- 3c. 能力雷达图 --- */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white">
                      {Icons.radar}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">能力维度对比</h2>
                      <p className="text-sm text-gray-500">五维能力雷达图：你 vs 目标岗位要求</p>
                    </div>
                  </div>
                  <AbilityRadarChart
                    userScores={growthPath.matchAnalysis.dimensionMatch}
                    targetScores={growthPath.matchAnalysis.dimensionMatch}
                    matchScores={growthPath.matchAnalysis.dimensionMatch}
                  />
                </div>

                {/* --- 3d. 动态成长路径时间轴 --- */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white">
                      {Icons.route}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">个性化学习路径</h2>
                      <p className="text-sm text-gray-500">为你量身定制的阶段性成长计划</p>
                    </div>
                  </div>
                  <GrowthPathTimeline
                    nodes={growthPath.pathNodes}
                    onNodeStatusChange={handleNodeStatusChange}
                  />
                </div>

                {/* --- 3e. AI 差距分析总结 --- */}
                {(growthPath as any).aiAnalysis && (
                  <div className="rounded-2xl border border-border bg-card-bg p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-primary">{Icons.brain}</span>
                      <h2 className="text-lg font-bold">AI 智能分析报告</h2>
                    </div>
                    <AnalysisReport content={(growthPath as any).aiAnalysis} />
                  </div>
                )}

                {/* --- 底部：重新生成按钮 --- */}
                <div className="text-center pt-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-indigo-500 hover:text-indigo-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <>
                        <span className="animate-spin inline-block">{Icons.spinner}</span>
                        正在重新生成...
                      </>
                    ) : (
                      <>
                        {Icons.refresh}
                        重新生成成长路径
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 全局错误（有 growthPath 时） */}
            {growthPath && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
                <span className="text-red-600">{Icons.alert}</span>
                <p className="text-red-800 text-sm">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                  &times;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
