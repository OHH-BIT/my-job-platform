export const dynamic = 'force-static';

/**
 * API 端点：保存用户画像
 * POST /api/user-profile/save
 * 
 * 鉴权重构完成：
 * 1. ✅ 使用 withAuth 中间件（JWT 签名验证）
 * 2. ✅ userId 从 Token 中提取
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt';

// 模拟数据（实际生产环境应使用数据库）
let userProfiles: any[] = [];

/**
 * 导出查找函数，供 /api/user-profile/get 端点调用
 */
export function getUserProfile(userId: string): any | null {
  return userProfiles.find(p => p.userId === userId && p.isActive) || null;
}

// ============================================
// POST：保存个人画像到云端
// ============================================

export const POST = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    const userId = user.uid;
    const body = await request.json();
    const { profileData, isActive = true } = body;

    if (!profileData) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数：profileData' },
        { status: 400 }
      );
    }

    const existingIndex = userProfiles.findIndex(
      p => p.userId === userId && p.isActive
    );

    if (existingIndex >= 0) {
      userProfiles[existingIndex] = {
        ...userProfiles[existingIndex],
        profileData,
        isActive,
        updatedAt: new Date().toISOString(),
      };
    } else {
      userProfiles.push({
        userId,
        profileData,
        isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: '个人画像保存成功',
      data: { userId, isActive },
    });

  } catch (error) {
    console.error('保存个人画像失败：', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '保存个人画像失败' },
      { status: 500 }
    );
  }
});
