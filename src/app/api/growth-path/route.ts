export const dynamic = 'force-static';

/**
 * API 端点：获取用户的成长路径
 * GET /api/growth-path?userId=xxx&targetJobId=xxx
 * POST /api/growth-path （创建路径）
 * 
 * 鉴权重构完成：
 * 1. ✅ GET/POST 使用 withAuth 中间件（JWT 签名验证）
 * 2. ✅ 移除 query 参数 userId（改由 Token 中提取）
 * 
 * 使用内存存储（实际生产环境应使用数据库）
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt';
import { GrowthPath } from '@/data/growth-path-models';

// 内存存储：所有成长路径
let growthPaths: GrowthPath[] = [];

/**
 * 导出内存存储引用，供其他端点共享
 */
export function getGrowthPathStore(): GrowthPath[] {
  return growthPaths;
}

export function setGrowthPathStore(paths: GrowthPath[]): void {
  growthPaths = paths;
}

// ============================================
// GET：获取成长路径列表
// ============================================

export const GET = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    const userId = user.uid;
    const { searchParams } = new URL(request.url);
    const targetJobId = searchParams.get('targetJobId');

    let userPaths = growthPaths.filter(path => path.userId === userId);

    if (targetJobId) {
      userPaths = userPaths.filter(path => path.targetJobId === targetJobId);
    }

    return NextResponse.json({
      success: true,
      data: userPaths
    });
  } catch (error: any) {
    console.error('获取用户成长路径失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户成长路径失败', details: error.message },
      { status: 500 }
    );
  }
});
