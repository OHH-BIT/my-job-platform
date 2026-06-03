
// 前辈说 - 创建帖子API
// 功能：接收前端提交的标题、内容及图片文件，创建新帖子并存入内存存储

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { userPosts } from "@/lib/mentor-sharing-store";

// ============================================
// POST - 创建新帖子
// ============================================

export async function POST(request: NextRequest) {
  try {
    console.log("[Mentor Sharing Create] 收到创建帖子请求");

    // 解析FormData（包含文本字段和文件）
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const tags = formData.get("tags") as string; // 逗号分隔的标签
    const isAnonymous = formData.get("isAnonymous") !== "false"; // 默认匿名

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    // 处理图片上传
    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    // 创建上传目录（如果不存在）
    const uploadDir = join(process.cwd(), "public", "uploads", "mentor-sharing");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // 目录已存在，忽略
    }

    // 保存每张图片
    for (const file of imageFiles) {
      if (file.size === 0) continue; // 跳过空文件

      // 验证文件类型
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: "只能上传图片文件" },
          { status: 400 }
        );
      }

      // 验证文件大小（限制5M，从1M放宽）
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "图片大小不能超过5M" },
          { status: 400 }
        );
      }

      // 生成文件名
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop() || "jpg";
      const fileName = `post_${timestamp}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
      const filePath = join(uploadDir, fileName);

      // 保存文件
      const fileBuffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(fileBuffer));

      // 生成访问URL
      const fileUrl = `/uploads/mentor-sharing/${fileName}`;
      imageUrls.push(fileUrl);
      console.log(`[Mentor Sharing Create] 图片已保存: ${fileUrl}`);
    }

    // 创建新帖子对象
    const newPost = {
      id: `post_${Date.now()}`,
      title,
      content,
      images: imageUrls,
      tags: tags ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
      // 兼容前端 SharingCard 的 mentor 字段
      mentor: isAnonymous
        ? {
            anonymousLabel: "匿名用户",
            currentCompany: "未知公司",
            currentPosition: "未知岗位",
            avatar: "",
          }
        : {
            anonymousLabel: "当前用户",
            currentCompany: "未知公司",
            currentPosition: "未知岗位",
            avatar: "",
          },
      author: isAnonymous
        ? {
            id: "anonymous",
            name: "匿名用户",
            avatar: "/avatars/default.jpg",
          }
        : {
            id: "current_user",
            name: "当前用户",
            avatar: "/avatars/default.jpg",
          },
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      sharedAt: new Date().toISOString(),
      isLiked: false,
      isAnonymous,
    };

    // 将帖子存入内存存储（模块级数组，跨请求持久化）
    userPosts.unshift(newPost);

    console.log(`[Mentor Sharing Create] 帖子已创建: id=${newPost.id}, title="${title}", images=${imageUrls.length}张`);
    console.log(`[Mentor Sharing Create] 当前总帖子数: ${userPosts.length}`);

    return NextResponse.json({
      success: true,
      data: {
        post: newPost,
      },
    });
  } catch (error: any) {
    console.error("[Mentor Sharing Create] 创建帖子失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "创建帖子失败" },
      { status: 500 }
    );
  }
}
