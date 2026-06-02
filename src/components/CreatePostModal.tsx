"use client";

// 发帖模态框组件
// 功能：包含标题、内容、图片上传、标签输入，支持发布新帖子

import { useState, useRef } from "react";
import { API_BASE_URL } from "@/lib/api-client";
import { X, ImagePlus, Tag, Send, Check } from "lucide-react";

// ============================================
// 类型定义
// ============================================

interface PostData {
  id: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  mentor: {
    anonymousLabel: string;
    currentCompany: string;
    currentPosition: string;
    avatar: string;
  };
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  createdAt: string;
  sharedAt: string;
  isLiked: boolean;
  isAnonymous: boolean;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost?: PostData) => void;
}

// ============================================
// 主组件
// ============================================

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 9) {
      setError("最多只能上传9张图片");
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("只能上传图片文件");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("每张图片大小不能超过5MB");
        return;
      }
    }

    setImages([...images, ...files]);
    setError(null);
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 处理发布
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("标题和内容不能为空");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("tags", tags);
      formData.append("isAnonymous", String(isAnonymous));

      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch(`${API_BASE_URL}/api/mentor-sharing/create`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const newPost = result.data.post as PostData;

        // 清空表单
        setTitle("");
        setContent("");
        setTags("");
        setImages([]);

        // 将完整帖子对象传给父组件做乐观更新
        onPostCreated(newPost);
        onClose();
      } else {
        setError(result.error || "发布失败");
      }
    } catch (err: any) {
      setError(err.message || "网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">分享经验</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 匿名开关 */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                isAnonymous ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isAnonymous ? "translate-x-4.5 left-[18px]" : "left-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              {isAnonymous ? "匿名发布（隐藏真实身份）" : "实名发布"}
            </span>
          </div>

          {/* 标题 */}
          <div>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-transparent"
              placeholder="输入一个吸引人的标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-300">{title.length}/100</span>
            </div>
          </div>

          {/* 内容 */}
          <div>
            <textarea
              required
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm resize-none bg-transparent leading-relaxed"
              placeholder="分享你的真实经验、心得、建议...&#10;&#10;好的分享应该包含具体的信息，比如面试流程、薪资范围、团队氛围等。"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-300">{content.length}/5000</span>
            </div>
          </div>

          {/* 标签 */}
          <div>
            <div className="relative">
              <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-300" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-transparent"
                placeholder="添加标签，用逗号分隔（如：面试经验,腾讯,前端）"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            {/* 快捷标签 */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["面试经验", "薪资真相", "加班真相", "团队氛围", "成长空间", "简历优化"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
                    if (!currentTags.includes(tag)) {
                      setTags([...currentTags, tag].join(","));
                    }
                  }}
                  className="px-2.5 py-1 text-xs text-gray-400 bg-gray-50 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* 图片上传 */}
          <div>
            {/* 图片预览网格 */}
            {images.length > 0 && (
              <div
                className={`grid gap-2 mb-3 ${
                  images.length === 1
                    ? "grid-cols-1"
                    : images.length <= 4
                    ? "grid-cols-2"
                    : "grid-cols-3"
                }`}
              >
                {images.map((image, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`预览 ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 上传区域 */}
            {images.length < 9 && (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all">
                <ImagePlus className="w-6 h-6 mb-1.5 text-gray-300" />
                <p className="text-xs text-gray-400">
                  点击上传图片（最多9张，每张不超过5MB）
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-6 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="flex-1 py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  发布中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  立即发布
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
