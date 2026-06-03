
// 前辈说 - 帖子列表API
// 功能：获取帖子列表，支持分页、筛选、搜索

import { NextRequest, NextResponse } from "next/server";
import { userPosts, aiMockPosts } from "@/lib/mentor-sharing-store";

// ============================================
// GET - 获取帖子列表
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 获取查询参数
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || searchParams.get("pageSize") || "10");
    const tag = searchParams.get("tag") || searchParams.get("topicTag") || "";
    const search = searchParams.get("search") || searchParams.get("keyword") || "";
    const sortBy = searchParams.get("sortBy") || "latest";
    const company = searchParams.get("company") || "";
    const position = searchParams.get("position") || "";
    const type = searchParams.get("type") || "";

    // 合并所有帖子：AI卡片 + 用户发布的帖子
    const allPosts = [...userPosts, ...aiMockPosts];

    // 过滤逻辑
    let filteredPosts = [...allPosts];

    // 按公司过滤
    if (company) {
      filteredPosts = filteredPosts.filter(post =>
        post.company === company ||
        post.author?.company?.includes(company) ||
        post.mentor?.currentCompany?.includes(company)
      );
    }

    // 按岗位过滤
    if (position) {
      filteredPosts = filteredPosts.filter(post =>
        post.position === position ||
        post.author?.position?.includes(position) ||
        post.mentor?.currentPosition?.includes(position)
      );
    }

    // 按类型过滤
    if (type) {
      filteredPosts = filteredPosts.filter(post =>
        post.type === type
      );
    }

    // 按标签过滤
    if (tag) {
      filteredPosts = filteredPosts.filter(post =>
        (post.topicTags && post.topicTags.some(t => t === tag)) ||
        (post.tags && post.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())))
      );
    }

    // 按搜索关键词过滤
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        (post.title && post.title.toLowerCase().includes(searchLower)) ||
        post.content.toLowerCase().includes(searchLower) ||
        (post.tags && post.tags.some(t => t.toLowerCase().includes(searchLower))) ||
        (post.topicTags && post.topicTags.some(t => t.toLowerCase().includes(searchLower))) ||
        (post.aiAnalysis?.coreSummary && post.aiAnalysis.coreSummary.toLowerCase().includes(searchLower))
      );
    }

    // 排序逻辑
    if (sortBy === "popular") {
      filteredPosts.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === "recommendation") {
      filteredPosts.sort((a, b) => (b.aiAnalysis?.recommendationScore || 0) - (a.aiAnalysis?.recommendationScore || 0));
    } else {
      // 最新排序（默认）- 新帖优先
      filteredPosts.sort((a, b) =>
        new Date(b.createdAt || b.sharedAt || "").getTime() - new Date(a.createdAt || a.sharedAt || "").getTime()
      );
    }

    // 分页逻辑
    const total = filteredPosts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        posts: paginatedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("[Mentor Sharing List] 获取帖子列表失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "获取帖子列表失败" },
      { status: 500 }
    );
  }
}
