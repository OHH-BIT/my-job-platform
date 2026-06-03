
/**
 * 邮箱登录接口
 * 
 * 功能：
 * 1. 验证邮箱和密码（或验证码）
 * 2. 查找用户
 * 3. 签发JWT（Access Token + Refresh Token）
 * 
 * 端点：POST /api/auth/email/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateAuthResponse } from '@/lib/jwt';
import { EmailLoginRequest, AuthResponse } from '@/types/auth';
import { verifyEmailCode, markEmailCodeUsed } from '@/app/api/auth/email/send-verification-code/route';

// ============================================
// 主处理函数
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body: EmailLoginRequest = await request.json();
    const { email, password, verificationCode } = body;

    // 2. 验证必填字段
    if (!email || (!password && !verificationCode)) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：email、password或verificationCode' },
        { status: 400 }
      );
    }

    // 3. 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 4. 查找用户（如果不存在则自动注册）
    let user = await findUserByEmail(email);
    
    // 如果用户不存在，自动创建新用户（静默注册）
    if (!user) {
      console.log('📧 邮箱未注册，自动创建新用户：', email);
      user = await createEmailUser({
        email,
        passwordHash: undefined, // 验证码登录，无密码
        nickname: email.split('@')[0], // 默认昵称：邮箱前缀
        source: 'email',
      });
    }

    // 5. 验证密码或验证码
    let isAuthenticated = false;

    if (password) {
      // 5.1 验证密码
      if (!user.passwordHash) {
        return NextResponse.json(
          { success: false, error: '该账号未设置密码，请使用验证码登录或重置密码' },
          { status: 400 }
        );
      }

      isAuthenticated = await verifyPassword(password, user.passwordHash);
      if (!isAuthenticated) {
        return NextResponse.json(
          { success: false, error: '密码错误，请重试' },
          { status: 401 }
        );
      }
    } else if (verificationCode) {
      // 5.2 验证验证码
      const isCodeValid = await verifyEmailCode(email, verificationCode, 'login');
      if (!isCodeValid) {
        return NextResponse.json(
          { success: false, error: '验证码无效或已过期' },
          { status: 400 }
        );
      }

      isAuthenticated = true;

      // 标记验证码已使用
      await markEmailCodeUsed(email, verificationCode);
    }

    // 6. 检查账号状态
    if (user.status === 'banned') {
      return NextResponse.json(
        { success: false, error: '该账号已被封禁，请联系客服' },
        { status: 403 }
      );
    }

    // 7. 更新最后登录时间和登录次数
    await updateUserLoginInfo(user.uid);

    // 8. 创建用户会话（user_sessions表）
    const sessionId = `session-${Date.now()}`;
    // TODO: 将sessionId插入数据库，关联user.uid

    // 9. 签发JWT（Access Token + Refresh Token）
    const authResponse = generateAuthResponse(
      {
        uid: user.uid,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        source: 'email',
      },
      sessionId
    );

    // 10. 返回响应
    return NextResponse.json(authResponse);

  } catch (error) {
    console.error('邮箱登录失败：', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '登录失败，请稍后重试' 
      },
      { status: 500 }
    );
  }
}

// ============================================
// 辅助函数（模拟实现，实际应该查询数据库）
// ============================================

/**
 * 根据邮箱查找用户
 * @param email 邮箱地址
 * @returns 用户对象，如果未找到则返回null
 */
async function findUserByEmail(email: string): Promise<{
  uid: string;
  email: string;
  passwordHash?: string;
  nickname?: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'banned';
} | null> {
  // TODO: 实际生产环境中，这里应该查询数据库
  // SELECT uid, email, password_hash, nickname, avatar_url, status FROM users WHERE email = ?

  // 模拟查找（开发模式）
  console.log('查找用户：', email);
  
  // 模拟：test@example.com存在
  if (email === 'test@example.com') {
    return {
      uid: 'user-test-12345',
      email: 'test@example.com',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqGOqBVv6', // test123456
      nickname: '测试用户',
      avatarUrl: 'https://via.placeholder.com/150',
      status: 'active',
    };
  }

  return null;
}

/**
 * 验证邮箱验证码
 * @param email 邮箱地址
 * @param code 验证码
 * @param type 验证码类型
 * @returns 是否有效
 */
/**
 * 更新用户登录信息
 * @param uid 用户ID
 */
async function updateUserLoginInfo(uid: string): Promise<void> {
  // TODO: 实际生产环境中，这里应该更新数据库
  // UPDATE users SET last_login_at = NOW(), login_count = login_count + 1 WHERE uid = ?

  // 模拟更新（开发模式）
  console.log('更新用户登录信息：', uid);
}

/**
 * 创建邮箱用户
 * @param params 用户创建参数
 * @returns 新创建的用户对象
 */
async function createEmailUser(params: {
  email: string;
  passwordHash?: string;
  nickname?: string;
  source: 'email' | 'phone' | 'wechat' | 'qq';
}): Promise<{
  uid: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'banned';
}> {
  // TODO: 实际生产环境中，这里应该插入数据库
  // INSERT INTO users (uid, email, password_hash, nickname, source, created_at, status)
  // VALUES (?, ?, ?, ?, ?, NOW(), 'active')

  // 模拟创建（开发模式）
  const newUser = {
    uid: `user-${Date.now()}`,
    email: params.email,
    nickname: params.nickname || params.email.split('@')[0],
    avatarUrl: `https://via.placeholder.com/150?text=${(params.nickname || params.email.split('@')[0]).charAt(0).toUpperCase()}`,
    status: 'active' as const,
  };

  console.log('✅ 创建新用户：', newUser);
  return newUser;
}

// ============================================
// 开发模式：模拟邮箱登录
// ============================================

/**
 * 开发模式：模拟邮箱登录API
 * 
 * 无需真实密码，直接返回模拟用户和Token
 */
export async function GET(request: NextRequest) {
  try {
    // 模拟登录
    const mockUser = {
      uid: `user-email-mock-${Date.now()}`,
      email: 'mock@example.com',
      nickname: '邮箱测试用户',
      avatarUrl: 'https://via.placeholder.com/150',
      source: 'email' as const,
    };

    const sessionId = `session-mock-${Date.now()}`;
    const authResponse = generateAuthResponse(mockUser, sessionId);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('模拟邮箱登录失败：', error);
    return NextResponse.json(
      { success: false, error: '模拟邮箱登录失败' },
      { status: 500 }
    );
  }
}
