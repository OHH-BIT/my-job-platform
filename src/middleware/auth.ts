/**
 * API鉴权中间件
 * 
 * 功能：
 * 1. 验证请求头中的Authorization Bearer Token
 * 2. 解析JWT获取user_id
 * 3. 将user_id附加到request对象上
 * 4. 可选鉴权模式（允许匿名访问）
 * 
 * 使用方式：
 * - 必需鉴权：await withAuth(request)
 * - 可选鉴权：await withOptionalAuth(request)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, JwtPayload } from '@/lib/jwt';

// ============================================
// 类型扩展
// ============================================

declare global {
  interface Request {
    user?: JwtPayload;
  }
}

// ============================================
// 必需鉴权中间件
// 如果Token无效或缺失，返回401错误
// ============================================

export async function withAuth(request: NextRequest): Promise<{ user: JwtPayload } | NextResponse> {
  try {
    // 1. 从请求头提取Authorization Bearer Token
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '未提供认证令牌' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // 去掉"Bearer "

    // 2. 验证Access Token
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: '认证令牌无效或已过期' },
        { status: 401 }
      );
    }

    // 3. 返回用户信息
    return { user: payload };

  } catch (error) {
    console.error('鉴权中间件错误：', error);
    return NextResponse.json(
      { success: false, error: '鉴权失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// ============================================
// 可选鉴权中间件
// 如果有Token则解析，没有Token则匿名访问
// ============================================

export async function withOptionalAuth(request: NextRequest): Promise<{ user?: JwtPayload }> {
  try {
    // 1. 从请求头提取Authorization Bearer Token
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有Token，匿名访问
      return {};
    }

    const token = authHeader.substring(7); // 去掉"Bearer "

    // 2. 验证Access Token
    const payload = verifyAccessToken(token);

    if (!payload) {
      // Token无效，匿名访问
      return {};
    }

    // 3. 返回用户信息
    return { user: payload };

  } catch (error) {
    console.error('可选鉴权中间件错误：', error);
    // 出错时也允许匿名访问
    return {};
  }
}

// ============================================
// 数据隔离工具函数
// 确保所有查询都通过user_id进行过滤
// ============================================

/**
 * 构建用户数据查询条件
 * @param userId 用户ID
 * @returns MongoDB查询条件（示例）
 */
export function buildUserFilter(userId: string): Record<string, any> {
  return { user_id: userId };
}

/**
 * 验证数据归属权
 * 检查某条数据是否属于当前用户
 * @param dataUserId 数据所属的用户ID
 * @param currentUserId 当前请求的用户ID
 * @returns 是否有权限访问
 */
export function checkDataOwnership(dataUserId: string, currentUserId: string): boolean {
  return dataUserId === currentUserId;
}

/**
 * 权限检查装饰器（高阶函数）
 * 用于API路由，确保用户只能访问自己的数据
 */
export function requireOwnership<T extends (...args: any[]) => any>(
  handler: T,
  getUserIdFromData: (data: any) => string
): T {
  return (async (request: NextRequest, context: any) => {
    // 1. 鉴权
    const authResult = await withAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // 返回401错误
    }

    const { user } = authResult;
    const currentUserId = user.uid;

    // 2. 获取数据（调用handler）
    const response = await handler(request, context);
    const data = await response.json();

    // 3. 检查数据归属权
    if (data.success && data.data) {
      const dataUserId = getUserIdFromData(data.data);
      if (dataUserId !== currentUserId) {
        return NextResponse.json(
          { success: false, error: '无权访问该数据' },
          { status: 403 }
        );
      }
    }

    return response;
  }) as T;
}

export default withAuth;
