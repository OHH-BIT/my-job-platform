/**
 * 前辈说（职场人脉与经验传承）页面
 * 
 * 功能：展示前辈分享卡片信息流，支持筛选、搜索、分页
 * 布局：现代化卡片式信息流，类似小红书/脉脉风格
 * 核心：AI聚合、整理并展示往届校友及行业前辈的真实面经、工作日常、团队氛围
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { aiMockPosts } from "@/lib/mentor-sharing-store";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  ImagePlus,
  Tag,
  Eye,
  Clock,
} from "lucide-react";
import CreatePostModal from "@/components/CreatePostModal";

// ============================================
// 统一帖子类型
// ============================================

interface PostItem {
  id: string;
  title?: string;
  content: string;
  images?: string[];
  tags?: string[];
  type?: string;
  company?: string;
  position?: string;
  topicTags?: string[];
  mentor?: {
    anonymousLabel?: string;
    currentCompany?: string;
    currentPosition?: string;
    yearsOfExperience?: number;
    avatar?: string;
  };
  aiAnalysis?: {
    recommendationScore?: number;
    salaryCompetitiveness?: number;
    workLifeBalance?: number;
    teamAtmosphere?: number;
    growthSpace?: number;
    interviewDifficulty?: number;
    coreSummary?: string;
    representativeQuotes?: string[];
    sanitizedContent?: string;
  };
  author?: {
    id: string;
    name: string;
    avatar: string;
    company?: string;
    position?: string;
  };
  likes: number;
  comments: number;
  createdAt: string;
  sharedAt?: string;
  isLiked: boolean;
  isAnonymous?: boolean;
}

// ============================================
// 筛选类型
// ============================================

interface FilterBarProps {
  filters: {
    keyword: string;
    sortBy: string;
  };
  onFilterChange: (filters: any) => void;
  tags: string[];
}

function FilterBar({ filters, onFilterChange, tags }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* 搜索框 */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={filters.keyword}
          onChange={(e) => onFilterChange({ ...filters, keyword: e.target.value })}
          placeholder="搜索经验分享..."
          className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm"
        />
      </div>

      {/* 热门标签 */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onFilterChange({ ...filters, keyword: tag.replace("#", "") })}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 排序 */}
      <select
        value={filters.sortBy}
        onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
        className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      >
        <option value="latest">最新发布</option>
        <option value="popular">最热</option>
        <option value="recommendation">推荐指数</option>
      </select>
    </div>
  );
}

// ============================================
// 图片查看器（全屏大图）
// ============================================

function ImageViewer({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
      >
        <X className="w-6 h-6" />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => Math.max(0, i - 1)); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-white/10 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => Math.min(images.length - 1, i + 1)); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-white/10 rounded-full"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      <img
        src={images[currentIndex]}
        alt={`图片 ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-6 text-white/60 text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

// ============================================
// 帖子卡片组件（视觉大升级）
// ============================================

function SharingCardItem({
  card,
  onLike,
  onViewDetail,
}: {
  card: PostItem;
  onLike: (id: string) => void;
  onViewDetail: (card: PostItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ images: string[]; index: number } | null>(null);

  // 判断是否需要展开（超过4行，约200字符）
  const needsExpand = card.content && card.content.length > 200;
  const displayContent =
    needsExpand && !expanded ? card.content.slice(0, 200) + "..." : card.content;

  // 评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "bg-emerald-500", text: "text-emerald-600" };
    if (score >= 60) return { bg: "bg-amber-500", text: "text-amber-600" };
    return { bg: "bg-red-500", text: "text-red-600" };
  };

  // 获取头像
  const avatarUrl = card.mentor?.avatar || card.author?.avatar || "";
  const displayName = card.mentor?.anonymousLabel || card.author?.name || "匿名用户";
  const company = card.mentor?.currentCompany || card.author?.company || "";
  const position = card.mentor?.currentPosition || card.author?.position || "";

  // 时间格式化
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  // 处理点赞动画
  const handleLike = () => {
    if (!isLikeAnimating) {
      setIsLikeAnimating(true);
      onLike(card.id);
      setTimeout(() => setIsLikeAnimating(false), 600);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
        {/* 卡片头部 */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            {/* 头像 */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {(displayName || "匿")[0]}
                </div>
              )}
              {/* 在线指示点 */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>

            {/* 用户信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm truncate">
                  {displayName}
                </span>
                {/* 匿名标签 */}
                {card.isAnonymous && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
                    匿名
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                {company && (
                  <>
                    <span>{company}</span>
                    {position && <span>·</span>}
                  </>
                )}
                {position && <span>{position}</span>}
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTime(card.createdAt || card.sharedAt || "")}
                </span>
              </div>
            </div>

            {/* AI 推荐指数徽章 */}
            {card.aiAnalysis?.recommendationScore !== undefined && (
              <div className="flex-shrink-0 text-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm ${
                    getScoreColor(card.aiAnalysis.recommendationScore).bg
                  }`}
                >
                  {card.aiAnalysis.recommendationScore}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">推荐</span>
              </div>
            )}
          </div>
        </div>

        {/* 卡片标题 */}
        {card.title && (
          <div className="px-5 pb-2">
            <h3 className="font-bold text-gray-900 text-base leading-snug">
              {card.title}
            </h3>
          </div>
        )}

        {/* 正文内容 */}
        <div className="px-5 pb-3">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          {/* 展开渐变遮罩 */}
          {needsExpand && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-1 text-blue-500 text-xs font-medium hover:text-blue-600 transition-colors inline-flex items-center gap-0.5"
            >
              展开全文
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
          {needsExpand && expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="mt-1 text-gray-400 text-xs font-medium hover:text-gray-500 transition-colors inline-flex items-center gap-0.5"
            >
              收起
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* AI 核心摘要 */}
        {card.aiAnalysis?.coreSummary && (
          <div className="mx-5 mb-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-xs font-semibold mt-0.5 flex-shrink-0">AI 摘要</span>
              <p className="text-gray-700 text-sm leading-relaxed">{card.aiAnalysis.coreSummary}</p>
            </div>
          </div>
        )}

        {/* AI 评分条 */}
        {card.aiAnalysis && (
          <div className="mx-5 mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {card.aiAnalysis.salaryCompetitiveness !== undefined && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-16 flex-shrink-0">薪资竞争力</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreColor(card.aiAnalysis.salaryCompetitiveness).bg}`}
                    style={{ width: `${card.aiAnalysis.salaryCompetitiveness}%` }}
                  />
                </div>
                <span className={`w-6 text-right font-medium text-[11px] ${getScoreColor(card.aiAnalysis.salaryCompetitiveness).text}`}>
                  {card.aiAnalysis.salaryCompetitiveness}
                </span>
              </div>
            )}
            {card.aiAnalysis.workLifeBalance !== undefined && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-16 flex-shrink-0">工作生活</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreColor(card.aiAnalysis.workLifeBalance).bg}`}
                    style={{ width: `${card.aiAnalysis.workLifeBalance}%` }}
                  />
                </div>
                <span className={`w-6 text-right font-medium text-[11px] ${getScoreColor(card.aiAnalysis.workLifeBalance).text}`}>
                  {card.aiAnalysis.workLifeBalance}
                </span>
              </div>
            )}
            {card.aiAnalysis.teamAtmosphere !== undefined && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-16 flex-shrink-0">团队氛围</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreColor(card.aiAnalysis.teamAtmosphere).bg}`}
                    style={{ width: `${card.aiAnalysis.teamAtmosphere}%` }}
                  />
                </div>
                <span className={`w-6 text-right font-medium text-[11px] ${getScoreColor(card.aiAnalysis.teamAtmosphere).text}`}>
                  {card.aiAnalysis.teamAtmosphere}
                </span>
              </div>
            )}
            {card.aiAnalysis.growthSpace !== undefined && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-16 flex-shrink-0">成长空间</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreColor(card.aiAnalysis.growthSpace).bg}`}
                    style={{ width: `${card.aiAnalysis.growthSpace}%` }}
                  />
                </div>
                <span className={`w-6 text-right font-medium text-[11px] ${getScoreColor(card.aiAnalysis.growthSpace).text}`}>
                  {card.aiAnalysis.growthSpace}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 原声摘录 */}
        {card.aiAnalysis?.representativeQuotes && card.aiAnalysis.representativeQuotes.length > 0 && (
          <div className="mx-5 mb-3 pl-4 border-l-2 border-gray-200">
            <p className="text-gray-500 text-sm italic leading-relaxed">
              &ldquo;{card.aiAnalysis.representativeQuotes[0]}&rdquo;
            </p>
          </div>
        )}

        {/* 图片网格 */}
        {card.images && card.images.length > 0 && (
          <div className="px-5 pb-3">
            <div
              className={`grid gap-2 ${
                card.images.length === 1
                  ? "grid-cols-1"
                  : card.images.length <= 4
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {card.images.slice(0, 9).map((img, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-xl bg-gray-100 cursor-pointer group/img ${
                    card.images.length === 1 ? "max-h-80" : "aspect-square"
                  }`}
                  onClick={() => setViewerImage({ images: card.images!, index })}
                >
                  <img
                    src={img}
                    alt={`图片 ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    loading="lazy"
                  />
                  {/* 悬停遮罩 */}
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 话题标签 */}
        {(card.tags && card.tags.length > 0) || (card.topicTags && card.topicTags.length > 0) && (
          <div className="px-5 pb-3 flex flex-wrap gap-1.5">
            {(card.topicTags || []).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
            {(card.tags || []).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-[11px] font-medium text-gray-500 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部互动栏 */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* 点赞 */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                card.isLiked
                  ? "text-red-500 bg-red-50"
                  : "text-gray-400 hover:text-red-400 hover:bg-red-50/50"
              } ${isLikeAnimating ? "scale-110" : "scale-100"}`}
            >
              <Heart
                className={`w-4 h-4 transition-all ${
                  card.isLiked ? "fill-current" : ""
                } ${isLikeAnimating ? "animate-ping" : ""}`}
              />
              <span className="text-xs font-medium">{card.likes || ""}</span>
            </button>

            {/* 评论 */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{card.comments || ""}</span>
            </button>

            {/* 分享 */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-400 hover:text-emerald-500 hover:bg-emerald-50/50 transition-all duration-200"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* 查看详情 */}
          {card.aiAnalysis && (
            <button
              onClick={() => onViewDetail(card)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              详情
            </button>
          )}
        </div>
      </div>

      {/* 图片查看器 */}
      {viewerImage && (
        <ImageViewer
          images={viewerImage.images}
          initialIndex={viewerImage.index}
          onClose={() => setViewerImage(null)}
        />
      )}
    </>
  );
}

// ============================================
// 发布成功 Toast
// ============================================

function PostSuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-lg border border-emerald-100">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <Send className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{message}</p>
          <p className="text-xs text-gray-400">帖子已成功发布</p>
        </div>
        <button onClick={onClose} className="ml-2 text-gray-300 hover:text-gray-500">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// 主页面组件
// ============================================

export default function MentorSharingPage() {
  const [sharings, setSharings] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [filters, setFilters] = useState({
    keyword: "",
    sortBy: "latest",
  });

  const [selectedCard, setSelectedCard] = useState<PostItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 加载帖子列表（本地数据，无需 API）
  const allPosts = useMemo(() => aiMockPosts, []);

  const loadSharings = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // 本地筛选
      let filtered = [...allPosts];

      // 关键词搜索
      if (filters.keyword) {
        const q = filters.keyword.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.content.toLowerCase().includes(q) ||
            p.mentor?.currentCompany?.toLowerCase().includes(q) ||
            p.mentor?.currentPosition?.toLowerCase().includes(q) ||
            p.topicTags?.some((t) => t.toLowerCase().includes(q))
        );
      }

      // 排序
      if (filters.sortBy === "popular") {
        filtered.sort((a, b) => b.likes - a.likes);
      } else if (filters.sortBy === "recommendation") {
        filtered.sort((a, b) => (b.aiAnalysis?.recommendationScore || 0) - (a.aiAnalysis?.recommendationScore || 0));
      }
      // "latest" 保持原序

      // 分页
      const totalCount = filtered.length;
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      setSharings(paged);
      setTotal(totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, allPosts]);

  useEffect(() => {
    loadSharings();
  }, [loadSharings]);

  // 处理筛选变化
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  // 处理帖子发布成功 — 乐观更新
  const handlePostCreated = (newPost?: PostItem) => {
    if (newPost) {
      // 乐观更新：直接将新帖插入到列表最前面
      setSharings((prev) => [newPost, ...prev]);
      setTotal((prev) => prev + 1);
      setToastMessage(`"${newPost.title || "经验分享"}" 已发布`);
    } else {
      // 回退：重新拉取列表
      loadSharings();
      setToastMessage("帖子已发布");
    }
  };

  // 处理点赞
  const handleLike = (id: string) => {
    setSharings((prev) =>
      prev.map((card) =>
        card.id === id
          ? { ...card, isLiked: !card.isLiked, likes: card.isLiked ? card.likes - 1 : card.likes + 1 }
          : card
      )
    );
  };

  // 热门标签
  const hotTags = ["面试经验", "薪资真相", "加班真相", "团队氛围", "成长空间", "简历优化"];

  // 渲染
  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* 发布成功 Toast */}
      {toastMessage && (
        <PostSuccessToast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">前辈说</h1>
              <p className="text-gray-500 text-sm">
                倾听往届校友及行业前辈的真实分享，打破求职信息不对称
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-sm hover:shadow-md text-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              分享经验
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 筛选栏 */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} tags={hotTags} />

        {/* 帖子列表 */}
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
            <p className="mt-3 text-gray-400 text-sm">加载中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-300" />
            </div>
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={loadSharings}
              className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : sharings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 mb-1">暂无分享</p>
            <p className="text-gray-300 text-sm">成为第一个分享经验的人吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharings.map((card) => (
              <SharingCardItem
                key={card.id}
                card={card}
                onLike={handleLike}
                onViewDetail={setSelectedCard}
              />
            ))}
          </div>
        )}

        {/* 分页 */}
        {!loading && !error && total > pageSize && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <span className="text-sm text-gray-500">
              第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-gray-900">分享详情</h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {/* 弹窗内容 */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedCard.aiAnalysis?.sanitizedContent || selectedCard.content}
              </p>
              {/* 评分详情 */}
              {selectedCard.aiAnalysis && (
                <div className="grid grid-cols-3 gap-3">
                  {selectedCard.aiAnalysis.salaryCompetitiveness !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-emerald-600">{selectedCard.aiAnalysis.salaryCompetitiveness}</div>
                      <div className="text-xs text-gray-500 mt-1">薪资竞争力</div>
                    </div>
                  )}
                  {selectedCard.aiAnalysis.workLifeBalance !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{selectedCard.aiAnalysis.workLifeBalance}</div>
                      <div className="text-xs text-gray-500 mt-1">工作生活平衡</div>
                    </div>
                  )}
                  {selectedCard.aiAnalysis.teamAtmosphere !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">{selectedCard.aiAnalysis.teamAtmosphere}</div>
                      <div className="text-xs text-gray-500 mt-1">团队氛围</div>
                    </div>
                  )}
                  {selectedCard.aiAnalysis.growthSpace !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-amber-600">{selectedCard.aiAnalysis.growthSpace}</div>
                      <div className="text-xs text-gray-500 mt-1">成长空间</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 发帖模态框 */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
