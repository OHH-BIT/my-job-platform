/**
 * JWT工具库
 * 
 * 功能：
 * 1. 签发JWT（Access Token + Refresh Token）
 * 2. 验证JWT（Access Token）
 * 3. 刷新JWT（使用Refresh Token获取新的Access Token）
 * 4. 解析JWT Payload
 * 
 * 依赖：jsonwebtoken、bcryptjs（密码哈希）
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JwtPayload, AuthResponse, JWT_CONFIG } from '@/types/auth';

// ============================================
// JWT签发与验证
// ============================================

/**
 * 签发Access Token（短期，15分钟）
 * @param payload JWT负载（包含uid、email、phone、nickname、avatarUrl、source、sessionId）
 * @returns 签发的JWT字符串
 */
export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const secret = JWT_CONFIG.secret;
  const expiresIn = JWT_CONFIG.accessTokenExpiry;

  // 添加iat（签发时间）和exp（过期时间）
  const token = jwt.sign(payload, secret, { expiresIn });

  return token;
}

/**
 * 签发Refresh Token（长期，7天）
 * @param payload 包含uid和sessionId的对象
 * @returns 签发的Refresh Token字符串
 */
export function signRefreshToken(payload: { uid: string; sessionId: string }): string {
  const secret = JWT_CONFIG.refreshSecret;
  const expiresIn = JWT_CONFIG.refreshTokenExpiry;

  const token = jwt.sign(payload, secret, { expiresIn });

  return token;
}

/**
 * 验证Access Token
 * @param token JWT字符串
 * @returns 解码后的Payload，如果验证失败则返回null
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const secret = JWT_CONFIG.secret;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    // 验证失败（过期、签名无效、格式错误等）
    console.error('Access Token验证失败：', error);
    return null;
  }
}

/**
 * 验证Refresh Token
 * @param token Refresh Token字符串
 * @returns 解码后的Payload，如果验证失败则返回null
 */
export function verifyRefreshToken(token: string): { uid: string; sessionId: string } | null {
  try {
    const secret = JWT_CONFIG.refreshSecret;
    const decoded = jwt.verify(token, secret) as { uid: string; sessionId: string };
    return decoded;
  } catch (error) {
    console.error('Refresh Token验证失败：', error);
    return null;
  }
}

/**
 * 解析JWT（不验证签名，仅解析Payload）
 * @param token JWT字符串
 * @returns Payload，如果解析失败则返回null
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT解析失败：', error);
    return null;
  }
}

/**
 * 生成认证响应（包含Access Token和Refresh Token）
 * @param user 用户对象（包含uid、email、phone、nickname、avatarUrl、source）
 * @param sessionId 会话ID
 * @returns 认证响应对象
 */
export function generateAuthResponse(
  user: {
    uid: string;
    email?: string;
    nickname?: string;
    avatarUrl?: string;
    source: 'email';  // 仅支持邮箱登录
  },
  sessionId: string
): AuthResponse {
  // 1. 构建JWT Payload
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    uid: user.uid,
    email: user.email,
    phone: user.phone,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    source: user.source,
    sessionId: sessionId,
  };

  // 2. 签发Access Token（15分钟）
  const accessToken = signAccessToken(payload);
  const accessTokenExpiresIn = 15 * 60; // 15分钟 = 900秒

  // 3. 签发Refresh Token（7天）
  const refreshToken = signRefreshToken({ uid: user.uid, sessionId });
  // Refresh Token过期时间：7天

  // 4. 返回响应
  return {
    success: true,
    message: '认证成功',
    data: {
      user: user as any, // 类型转换，实际应该返回User类型
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: accessTokenExpiresIn,
      },
    },
  };
}

// ============================================
// 密码哈希与验证（bcrypt）
// ============================================

/**
 * 哈希密码（使用bcrypt）
 * @param password 明文密码
 * @returns 哈希后的密码字符串
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // 盐轮数（12轮 = 约250ms）
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

/**
 * 验证密码（比较明文密码和哈希）
 * @param password 明文密码
 * @param hash 哈希后的密码
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch;
}

// ============================================
// JWT中间件（用于Next.js API Routes）
// ============================================

/**
 * JWT认证中间件
 * 用于保护需要登录的API路由
 * 
 * 使用方法：
 * ```typescript
 * import { withAuth } from '@/lib/jwt-middleware';
 * 
 * export const GET = withAuth(async (request: NextRequest, context: any, user: JwtPayload) => {
 *   // 这里可以安全使用user.uid
 *   return NextResponse.json({ success: true, data: { uid: user.uid } });
 * });
 * ```
 */
export function withAuth(
  handler: (request: any, context: any, user: JwtPayload) => Promise<Response>
) {
  return async (request: any, context: any) => {
    try {
      // 1. 从请求头中获取Authorization
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ success: false, error: '未授权：缺少Token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 2. 提取Token
      const token = authHeader.replace('Bearer ', '');

      // 3. 验证Token
      const payload = verifyAccessToken(token);
      if (!payload) {
        return new Response(
          JSON.stringify({ success: false, error: '未授权：Token无效或已过期' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 4. 将用户信息附加到请求对象
      request.user = payload;

      // 5. 调用实际的处理函数
      return await handler(request, context, payload);
    } catch (error) {
      console.error('JWT中间件错误：', error);
      return new Response(
        JSON.stringify({ success: false, error: '服务器内部错误' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * 可选JWT认证中间件
 * 用于某些API路由，有Token则解析，无Token则匿名访问
 */
export function withOptionalAuth(
  handler: (request: any, context: any, user: JwtPayload | null) => Promise<Response>
) {
  return async (request: any, context: any) => {
    try {
      // 1. 尝试从请求头中获取Authorization
      const authHeader = request.headers.get('Authorization');
      let user: JwtPayload | null = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        // 2. 提取Token
        const token = authHeader.replace('Bearer ', '');

        // 3. 验证Token（如果有效则解析，无效则忽略）
        user = verifyAccessToken(token);
      }

      // 4. 调用实际的处理函数（user可能为null）
      return await handler(request, context, user);
    } catch (error) {
      console.error('可选JWT中间件错误：', error);
      return new Response(
        JSON.stringify({ success: false, error: '服务器内部错误' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

// ============================================
// Token刷新逻辑
// ============================================

/**
 * 刷新Access Token（使用Refresh Token）
 * @param refreshToken Refresh Token字符串
 * @returns 新的Access Token和Refresh Token，如果Refresh Token无效则返回null
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
  try {
    // 1. 验证Refresh Token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return null; // Refresh Token无效或已过期
    }

    // 2. 从数据库查询会话（检查sessionId是否有效、是否活跃、是否过期）
    // 注意：这里应该查询数据库，检查sessionId是否存在且is_active=true且refresh_token_expires_at > NOW()
    // 为简化演示，这里跳过数据库查询，直接签发新的Token
    // 实际生产环境中，必须使用数据库验证

    // TODO: 数据库验证
    // const session = await db.query('SELECT * FROM user_sessions WHERE id = ? AND is_active = 1 AND refresh_token_expires_at > NOW()', [payload.sessionId]);
    // if (!session) return null;

    // 3. 签发新的Access Token
    const newAccessToken = signAccessToken({
      uid: payload.uid,
      sessionId: payload.sessionId,
      // 其他字段需要从数据库查询，这里省略
    });

    // 4. 签发新的Refresh Token（可选，也可以继续使用旧的）
    const newRefreshToken = signRefreshToken({
      uid: payload.uid,
      sessionId: payload.sessionId,
    });

    // 5. 返回新的Token对
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15分钟
    };
  } catch (error) {
    console.error('刷新Access Token失败：', error);
    return null;
  }
}

// ============================================
// 导出
// ============================================

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  parseJwt,
  generateAuthResponse,
  hashPassword,
  verifyPassword,
  withAuth,
  withOptionalAuth,
  refreshAccessToken,
};
