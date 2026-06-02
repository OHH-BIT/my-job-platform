/**
 * 求职进度与复盘看板 - 主页面
 * 
 * 功能：
 * 1. 双区布局：左侧看板列表 + 右侧AI复盘助手
 * 2. 可视化追踪：卡片式看板，支持状态切换和删除
 * 3. 投递转化率漏斗：各阶段数量可视化
 * 4. KPI 指标卡片：多巴胺配色，微交互动效
 * 5. AI复盘助手：点击卡片展开时间线与复盘笔记
 * 
 * 数据层重构完成：
 * 1. ✅ 移除所有Mock/硬编码数据，仅从API获取
 * 2. ✅ JWT鉴权传递（x-user-id 头）
 * 3. ✅ 添加删除功能（二次确认 + 列表联动刷新）
 * 4. ✅ 投递转化率漏斗图表
 * 5. ✅ 高颜值UI：多巴胺配色KPI卡片 + 微交互动效 + 大圆角布局
 * 
 * 页面路径：/job-tracking
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ApplicationRecord, 
  ApplicationStatus, 
  STATUS_CONFIG,
  GetApplicationsResponse 
} from '@/types/job-tracking';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// 工具函数
// ============================================

/** 格式化日期 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

/** 转化率漏斗的阶段配置 */
const FUNNEL_STAGES: { key: ApplicationStatus; label: string; color: string; bgColor: string }[] = [
  { key: 'applied', label: '已投递', color: '#1890FF', bgColor: 'bg-blue-500' },
  { key: 'screening', label: '简历筛选', color: '#722ED1', bgColor: 'bg-purple-500' },
  { key: 'assessment', label: '笔试/测评', color: '#FA8C16', bgColor: 'bg-orange-500' },
  { key: 'interviewing', label: '面试中', color: '#52C41A', bgColor: 'bg-green-500' },
  { key: 'waiting', label: '待反馈', color: '#FAAD14', bgColor: 'bg-yellow-500' },
  { key: 'offer', label: 'Offer', color: '#13C2C2', bgColor: 'bg-cyan-500' },
];

// ============================================
// 主组件
// ============================================

export default function JobTrackingPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    status: '' as ApplicationStatus | '',
    company: '',
    position: '',
    city: '',
    sortBy: 'appliedDate',
    sortOrder: 'desc',
  });
  
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 删除确认弹窗状态
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; applicationId: string | null; companyName: string }>({
    show: false, applicationId: null, companyName: '',
  });
  const [deleting, setDeleting] = useState(false);

  // ============================================
  // 数据获取
  // ============================================

  const fetchApplications = useCallback(async () => {
    // 初始化期间或未登录时不发请求，等待 Auth 就绪
    if (isInitializing || !isAuthenticated) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.company) params.append('company', filters.company);
      if (filters.position) params.append('position', filters.position);
      if (filters.city) params.append('city', filters.city);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());

      const result = await api.get(`/api/job-tracking/applications?${params.toString()}`);

      if (result.success) {
        setApplications(result.data ?? []);
        setStats(result.stats);
        setPagination({
          page: result.page ?? 1,
          pageSize: result.pageSize ?? 10,
          total: result.total ?? 0,
          totalPages: result.totalPages ?? 1,
        });
      } else {
        setError(result.error || '获取投递记录失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      fetchApplications();
    }
  }, [isInitializing, isAuthenticated, fetchApplications]);

  // ============================================
  // 事件处理
  // ============================================

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleCardClick = (application: ApplicationRecord) => {
    setSelectedApplication(application);
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: ApplicationStatus) => {
    if (!isAuthenticated) return;
    try {
      const result = await api.patch(`/api/job-tracking/applications/${applicationId}`, { status: newStatus });
      if (result.success) {
        fetchApplications();
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(result.data);
        }
      } else {
        alert(result.error || '更新状态失败');
      }
    } catch {
      alert('网络错误，请稍后重试');
    }
  };

  const handleAddApplication = async (formData: any) => {
    if (!isAuthenticated) return;
    try {
      const result = await api.post('/api/job-tracking/applications', formData);
      if (result.success) {
        setShowAddModal(false);
        fetchApplications();
      } else {
        alert(result.error || '创建投递记录失败');
      }
    } catch {
      alert('网络错误，请稍后重试');
    }
  };

  // 删除操作
  const handleDeleteClick = (e: React.MouseEvent, application: ApplicationRecord) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, applicationId: application.id, companyName: application.company });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.applicationId || !isAuthenticated) return;
    setDeleting(true);
    try {
      const result = await api.delete(`/api/job-tracking/applications/${deleteConfirm.applicationId}`);
      if (result.success) {
        setApplications(prev => prev.filter(a => a.id !== deleteConfirm.applicationId));
        if (selectedApplication?.id === deleteConfirm.applicationId) {
          setSelectedApplication(null);
        }
        fetchApplications();
        setDeleteConfirm({ show: false, applicationId: null, companyName: '' });
      } else {
        alert(result.error || '删除失败');
      }
    } catch {
      alert('网络错误，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // 渲染：未登录（由 Middleware 拦截，此处为兜底）
  // ============================================

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center max-w-md">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可查看和管理你的求职进度看板</p>
          <a href="/auth/login" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all hover:shadow-lg">
            去登录
          </a>
        </div>
      </div>
    );
  }

  // ============================================
  // 渲染：主界面
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* ============ 页面头部 ============ */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                求职进度与复盘看板
              </h1>
              <p className="mt-2 text-gray-500">可视化追踪投递状态，AI辅助生成面试复盘笔记</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
            >
              + 新增投递
            </button>
          </div>

          {/* KPI 指标卡片 */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                icon="📊"
                label="总投递数"
                value={stats.totalApplications}
                gradient="from-blue-500 to-blue-600"
                hoverShadow="hover:shadow-blue-200"
              />
              <KPICard
                icon="🚀"
                label="本周投递"
                value={stats.thisWeekApplications}
                gradient="from-violet-500 to-purple-600"
                hoverShadow="hover:shadow-purple-200"
              />
              <KPICard
                icon="⚡"
                label="进行中"
                value={stats.inProgressCount}
                gradient="from-amber-500 to-orange-500"
                hoverShadow="hover:shadow-orange-200"
              />
              <KPICard
                icon="🎉"
                label="已拿Offer"
                value={stats.offerCount}
                gradient="from-emerald-500 to-green-600"
                hoverShadow="hover:shadow-green-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* ============ 投递转化率漏斗 ============ */}
      {stats && stats.byStatus && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <ConversionFunnel stats={stats} />
        </div>
      )}

      {/* ============ 筛选栏 ============ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all"
            >
              <option value="">全部状态</option>
              {Object.values(STATUS_CONFIG).map((config) => (
                <option key={config.key} value={config.key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="筛选公司..."
              value={filters.company}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all"
            />
            <input
              type="text"
              placeholder="筛选岗位..."
              value={filters.position}
              onChange={(e) => handleFilterChange('position', e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all"
            />
            <input
              type="text"
              placeholder="筛选城市..."
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ============ 主内容区 ============ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：投递记录列表 */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-5 py-3.5 rounded-2xl mb-4 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {applications.length === 0 && !loading ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-500 text-lg mb-2">暂无投递记录</p>
                <p className="text-gray-400 text-sm">点击右上角"新增投递"开始记录你的求职历程</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedApplication?.id === app.id}
                    onClick={() => handleCardClick(app)}
                    onStatusUpdate={handleStatusUpdate}
                    onDelete={(e) => handleDeleteClick(e, app)}
                  />
                ))}
              </div>
            )}

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center space-x-3">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all hover:shadow-sm"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-gray-600 font-medium">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all hover:shadow-sm"
                >
                  下一页
                </button>
              </div>
            )}
          </div>

          {/* 右侧：AI复盘助手 */}
          <div className="lg:col-span-1">
            {selectedApplication ? (
              <ReviewAssistant application={selectedApplication} />
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-10 text-center sticky top-6">
                <div className="text-5xl mb-4">🤖</div>
                <p className="text-gray-500">点击左侧卡片查看详情和AI复盘</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ 新增投递弹窗 ============ */}
      {showAddModal && (
        <AddApplicationModal onClose={() => setShowAddModal(false)} onSubmit={handleAddApplication} />
      )}

      {/* ============ 删除确认弹窗 ============ */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-in">
            <div className="text-center">
              <div className="text-5xl mb-4">🗑️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">确认删除</h3>
              <p className="text-gray-600 mb-1">你确定要删除</p>
              <p className="text-lg font-semibold text-red-600 mb-4">{deleteConfirm.companyName}</p>
              <p className="text-gray-500 text-sm mb-6">的投递记录吗？此操作不可撤销。</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, applicationId: null, companyName: '' })}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                disabled={deleting}
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    删除中...
                  </span>
                ) : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 子组件：KPI 指标卡片（多巴胺配色）
// ============================================

function KPICard({ icon, label, value, gradient, hoverShadow }: {
  icon: string; label: string; value: number; gradient: string; hoverShadow: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} ${hoverShadow} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default group`}>
      {/* 装饰背景圆 */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-500"></div>
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/5"></div>
      <div className="relative z-10">
        <span className="text-2xl">{icon}</span>
        <p className="text-white/80 text-sm mt-2">{label}</p>
        <p className="text-white text-3xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}

// ============================================
// 子组件：投递转化率漏斗
// ============================================

function ConversionFunnel({ stats }: { stats: any }) {
  const maxCount = Math.max(
    ...FUNNEL_STAGES.map(s => stats.byStatus[s.key] || 0),
    1
  );

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">投递转化率漏斗</h3>
      <div className="space-y-2.5">
        {FUNNEL_STAGES.map((stage) => {
          const count = stats.byStatus[stage.key] || 0;
          const widthPercent = maxCount > 0 ? Math.max((count / maxCount) * 100, 8) : 8;
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20 text-right shrink-0">{stage.label}</span>
              <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${stage.bgColor} rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                  style={{ width: `${widthPercent}%` }}
                >
                  <span className="text-white text-xs font-bold">{count > 0 ? count : ''}</span>
                </div>
              </div>
              {count > 0 && (
                <span className="text-sm font-medium text-gray-700 w-8">{count}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// 子组件：投递记录卡片
// ============================================

function ApplicationCard({
  application,
  isSelected,
  onClick,
  onStatusUpdate,
  onDelete,
}: {
  application: ApplicationRecord;
  isSelected: boolean;
  onClick: () => void;
  onStatusUpdate: (id: string, status: ApplicationStatus) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const statusConfig = STATUS_CONFIG[application.status];

  // 紧急程度颜色
  const urgencyColor = application.daysSinceUpdate >= 14 ? '#FF4D4F'
    : application.daysSinceUpdate >= 7 ? '#FAAD14' : '#52C41A';

  return (
    <div
      onClick={onClick}
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-5 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'border border-gray-100'
      }`}
      style={{ borderLeft: `4px solid ${statusConfig.color}` }}
    >
      {/* 头部：公司 + 岗位 + 状态 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-lg truncate">{application.company}</h3>
            {application.salaryRange && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                {application.salaryRange}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{application.position}</p>
        </div>
        <span
          className="px-3 py-1 text-xs rounded-full font-medium shrink-0 ml-3"
          style={{ backgroundColor: `${statusConfig.color}18`, color: statusConfig.color }}
        >
          {statusConfig.icon} {statusConfig.label}
        </span>
      </div>

      {/* 中部：城市 + 日期 + 紧急程度 */}
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
        <span>📍 {application.city}</span>
        <span>📅 {formatDate(application.appliedDate)}</span>
        <span style={{ color: urgencyColor }} className="font-medium">
          {application.daysSinceUpdate >= 14 ? '🔴' : application.daysSinceUpdate >= 7 ? '🟡' : '🟢'}
          {application.daysSinceUpdate}天未更新
        </span>
      </div>

      {/* 标签 */}
      {application.tags && application.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {application.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 底部：状态切换 + 删除 */}
      <div className="flex items-center justify-between">
        <select
          value={application.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusUpdate(application.id, e.target.value as ApplicationStatus);
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {Object.values(STATUS_CONFIG).map((config) => (
            <option key={config.key} value={config.key}>
              {config.label}
            </option>
          ))}
        </select>
        <button
          onClick={onDelete}
          className="text-xs px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          title="删除此记录"
        >
          🗑️ 删除
        </button>
      </div>
    </div>
  );
}

// ============================================
// 子组件：AI复盘助手（右侧面板）
// ============================================

function ReviewAssistant({ application }: { application: ApplicationRecord }) {
  const statusConfig = STATUS_CONFIG[application.status];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h2 className="text-xl font-bold text-gray-900">AI复盘助手</h2>
      </div>
      
      {/* 投递信息卡片 */}
      <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100/50">
        <h3 className="font-bold text-gray-900 text-lg">{application.company} - {application.position}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2.5 py-1 text-xs rounded-full font-medium"
            style={{ backgroundColor: `${statusConfig.color}18`, color: statusConfig.color }}>
            {statusConfig.icon} {statusConfig.label}
          </span>
          <span className="text-xs text-gray-500">
            投递于 {new Date(application.appliedDate).toLocaleDateString('zh-CN')}
          </span>
        </div>
        {application.salaryRange && (
          <p className="text-sm text-gray-600 mt-2">💰 {application.salaryRange}</p>
        )}
      </div>

      {/* 面试记录 */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span>📋</span> 面试记录
        </h4>
        {application.interviews.length === 0 ? (
          <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3">暂无面试记录</p>
        ) : (
          <div className="space-y-2">
            {application.interviews.map((interview) => (
              <div key={interview.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  第{interview.round}轮 - {interview.type}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(interview.startedAt).toLocaleDateString('zh-CN')}
                  {interview.duration && ` · ${interview.duration}分钟`}
                </p>
                {interview.result && (
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                    interview.result === 'passed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {interview.result === 'passed' ? '✅ 通过' : '❌ 未通过'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI复盘笔记 */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span>💡</span> AI复盘笔记
        </h4>
        {application.reviewNotes ? (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100/50">
            <p className="text-sm text-gray-800">{application.reviewNotes.summary}</p>
            {application.reviewNotes.tags && application.reviewNotes.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {application.reviewNotes.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-blue-100/80 text-blue-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3">暂无AI复盘笔记，点击"生成复盘"开始分析</p>
        )}
      </div>

      {/* 备注 */}
      {application.notes && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>📝</span> 备注
          </h4>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{application.notes}</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="space-y-2">
        <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all hover:shadow-md hover:shadow-blue-200 font-medium">
          🤖 AI生成复盘
        </button>
        <button className="w-full px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium">
          📝 查看时间线
        </button>
      </div>
    </div>
  );
}

// ============================================
// 子组件：新增投递弹窗
// ============================================

function AddApplicationModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    positionType: 'fulltime',
    city: '',
    salaryRange: '',
    appliedDate: new Date().toISOString().split('T')[0],
    channel: 'official_website',
    notes: '',
    tags: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">新增投递记录</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">公司名称 *</label>
            <input type="text" required value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              placeholder="如：腾讯" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">岗位名称 *</label>
            <input type="text" required value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              placeholder="如：前端开发工程师" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">岗位类型 *</label>
              <select value={formData.positionType}
                onChange={(e) => setFormData({ ...formData, positionType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50">
                <option value="fulltime">全职</option>
                <option value="intern">实习</option>
                <option value="parttime">兼职</option>
                <option value="contract">合同工</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">投递渠道 *</label>
              <select value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50">
                <option value="official_website">官网投递</option>
                <option value="campus_recruitment">校园招聘</option>
                <option value="referral">内推</option>
                <option value="recruitment_platform">招聘平台</option>
                <option value="social_media">社交媒体</option>
                <option value="career_fair">招聘会</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">工作城市 *</label>
              <input type="text" required value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="如：深圳" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">薪资范围</label>
              <input type="text" value={formData.salaryRange}
                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="如：30-40w" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">投递日期 *</label>
            <input type="date" required value={formData.appliedDate}
              onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
            <textarea value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              rows={2} placeholder="可选备注信息" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">标签</label>
            <input type="text" value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              placeholder="逗号分隔，如：腾讯,前端,内推" />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium">
              取消
            </button>
            <button type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all hover:shadow-md hover:shadow-blue-200 font-medium">
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
