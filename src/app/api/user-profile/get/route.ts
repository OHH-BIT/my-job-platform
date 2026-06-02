export const dynamic = 'force-static';

/**
 * API 端点：获取用户画像
 * GET /api/user-profile/get
 * 
 * 鉴权重构完成：
 * 1. ✅ 使用 withAuth 中间件（JWT 签名验证）
 * 2. ✅ 移除 query 参数 userId（改由 Token 中提取）
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt';

export const GET = withAuth(async (request: any, context: any, user: any) => {
  try {
    const userId = user.uid;

    // 从 save 端点共享的内存中查找用户画像
    const { getUserProfile } = await import('../save/route');
    const profile = getUserProfile(userId);

    return NextResponse.json({
      success: true,
      data: profile || null,
      message: profile ? '用户画像获取成功' : '未找到用户画像，请先完成智能画像测评',
    });
  } catch (error: any) {
    console.error('获取用户画像失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户画像失败', details: error.message },
      { status: 500 }
    );
  }
});
