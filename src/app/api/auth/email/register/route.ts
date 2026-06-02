/**
 * 邮箱注册接口
 * 
 * 功能：
 * 1. 验证邮箱和验证码
 * 2. 创建新用户（email + password_hash）
 * 3. 签发JWT（Access Token + Refresh Token）
 * 
 * 端点：POST /api/auth/email/register
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateAuthResponse } from '@/lib/jwt';
import { EmailRegisterRequest, AuthResponse } from '@/types/auth';
import { verifyEmailCode, markEmailCodeUsed } from '@/app/api/auth/email/send-verification-code/route';

// ============================================
// 主处理函数
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body: EmailRegisterRequest = await request.json();
    const { email, password, verificationCode, nickname } = body;

    // 2. 验证必填字段
    if (!email || !password || !verificationCode) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：email、password、verificationCode' },
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

    // 4. 验证密码强度（至少8位，包含字母和数字）
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, error: '密码至少8位，且包含字母和数字' },
        { status: 400 }
      );
    }

    // 5. 验证验证码（调用新的验证函数）
    const isCodeValid = await verifyEmailCode(email, verificationCode, 'register');
    if (!isCodeValid) {
      return NextResponse.json(
        { success: false, error: '验证码无效或已过期' },
        { status: 400 }
      );
    }

    // 6. 检查邮箱是否已注册
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已注册，请直接登录或找回密码' },
        { status: 409 }
      );
    }

    // 7. 哈希密码（使用bcrypt）
    const passwordHash = await hashPassword(password);

    // 8. 创建新用户
    const newUser = await createEmailUser({
      email,
      passwordHash,
      nickname: nickname || email.split('@')[0], // 默认昵称：邮箱前缀
      source: 'email',
    });

    // 9. 标记验证码已使用
    await markEmailCodeUsed(email, verificationCode);

    // 10. 创建用户会话（user_sessions表）
    const sessionId = `session-${Date.now()}`;
    // TODO: 将sessionId插入数据库，关联newUser.uid

    // 11. 签发JWT（Access Token + Refresh Token）
    const authResponse = generateAuthResponse(
      {
        uid: newUser.uid,
        email: newUser.email,
        nickname: newUser.nickname,
        avatarUrl: newUser.avatarUrl,
        source: 'email',
      },
      sessionId
    );

    // 12. 返回响应
    return NextResponse.json(authResponse);

  } catch (error) {
    console.error('邮箱注册失败：', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '注册失败，请稍后重试' 
      },
      { status: 500 }
    );
  }
}

// ============================================
// 开发模式：模拟邮箱注册
// ============================================

/**
 * 开发模式：模拟邮箱注册API
 * 
 * 无需真实发送邮件，直接返回模拟用户和Token
 */
export async function GET(request: NextRequest) {
  try {
    // 模拟注册
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
    console.error('模拟邮箱注册失败：', error);
    return NextResponse.json(
      { success: false, error: '模拟邮箱注册失败' },
      { status: 500 }
    );
  }
}

// ============================================
// 辅助函数：查找用户By邮箱
// ============================================

async function findUserByEmail(email: string): Promise<{
  uid: string;
  email: string;
  passwordHash?: string;
  nickname: string;
  avatarUrl?: string;
  source: 'email' | 'phone' | 'wechat' | 'qq';
  status: 'active' | 'inactive' | 'banned';
} | null> {
  // TODO: 实际生产环境中，这里应该查询数据库
  // SELECT * FROM users WHERE email = ?

  // 模拟查询（开发模式）
  console.log('查找用户By邮箱：', email);
  
  // 模拟：如果邮箱是 mock@example.com，则返回模拟用户
  if (email === 'mock@example.com') {
    return {
      uid: 'user-mock-123',
      email: 'mock@example.com',
      passwordHash: undefined,
      nickname: '模拟用户',
      avatarUrl: 'https://via.placeholder.com/150',
      source: 'email' as const,
      status: 'active' as const,
    };
  }


  return null;
}

// ============================================
// 辅助函数：创建邮箱用户
// ============================================

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


