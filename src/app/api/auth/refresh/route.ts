
/**
 * Token 刷新 API
 * POST /api/auth/refresh
 * 
 * 功能：使用 Refresh Token 获取新的 Access Token
 * 前端 api-client 在收到 401 时自动调用此接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: '缺少 refresh_token' },
        { status: 400 }
      );
    }

    // 调用 JWT 工具库刷新 Token
    const result = await refreshAccessToken(refreshToken);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'refresh_token 无效或已过期，请重新登录' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      },
    });

  } catch (error) {
    console.error('Token 刷新失败：', error);
    return NextResponse.json(
      { success: false, error: 'Token 刷新失败，请重新登录' },
      { status: 401 }
    );
  }
}
