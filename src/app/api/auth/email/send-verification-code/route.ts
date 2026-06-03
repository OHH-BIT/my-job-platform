
import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/emailService';

/**
 * 发送邮箱验证码接口
 * 
 * 功能：
 * 1. 验证邮箱格式
 * 2. 生成6位随机验证码
 * 3. 调用邮件服务发送验证码
 * 4. 将验证码存入Redis（设置5分钟过期）
 * 
 * 端点：POST /api/auth/email/send-verification-code
 */

// ============================================
// 主处理函数
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();
    const { email, type } = body;

    // 2. 验证必填字段
    if (!email) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：email' },
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

    // 4. 验证类型（register-注册, login-登录, reset-password-重置密码）
    const validTypes = ['register', 'login', 'reset-password'];
    const codeType = type || 'register';
    if (!validTypes.includes(codeType)) {
      return NextResponse.json(
        { success: false, error: `无效的验证码类型，支持的类型：${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. 生成6位随机验证码
    const code = generateVerificationCode();
    console.log(`📧 生成验证码：${email} -> ${code}`);

    // 6. 调用邮件服务发送验证码
    const emailSent = await sendVerificationEmail(email, code, {
      subject: getEmailSubject(codeType),
      fromName: '求职助手',
    });

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: '邮件发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 7. 将验证码存入Redis（设置5分钟过期）
    // TODO: 实际生产环境中，这里应该连接Redis
    // await redis.setex(`email:code:${email}:${codeType}`, 300, code);
    
    // 模拟：开发模式下，将验证码存储在内存中（实际应该使用Redis）
    (global as any).emailVerificationCodes = (global as any).emailVerificationCodes || {};
    (global as any).emailVerificationCodes[`${email}:${codeType}`] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟后过期
      used: false,
    };
    console.log(`💾 验证码已存储（模拟Redis）：${email}:${codeType} -> ${code}`);

    // 8. 返回成功响应
    return NextResponse.json({
      success: true,
      message: '验证码已发送至您的邮箱，请在5分钟内完成验证',
      // 开发模式下，返回验证码方便测试（生产环境应删除）
      ...(process.env.NODE_ENV === 'development' && { dev_code: code }),
    });

  } catch (error) {
    console.error('发送邮箱验证码失败：', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '发送验证码失败，请稍后重试' 
      },
      { status: 500 }
    );
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 生成6位随机验证码
 * @returns 6位数字字符串
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 根据验证码类型获取邮件主题
 * @param type 验证码类型
 * @returns 邮件主题
 */
function getEmailSubject(type: string): string {
  const subjectMap: Record<string, string> = {
    'register': '【求职助手】您的注册验证码',
    'login': '【求职助手】您的登录验证码',
    'reset-password': '【求职助手】您的重置密码验证码',
  };
  return subjectMap[type] || '【求职助手】您的验证码';
}

// ============================================
// 开发模式：验证邮箱验证码（模拟Redis）
// ============================================

/**
 * 验证邮箱验证码（供登录/注册接口调用）
 * @param email 邮箱地址
 * @param code 验证码
 * @param type 验证码类型
 * @returns 是否有效
 */
export async function verifyEmailCode(
  email: string,
  code: string,
  type: string
): Promise<boolean> {
  // TODO: 实际生产环境中，这里应该查询Redis
  // const storedCode = await redis.get(`email:code:${email}:${type}`);
  // if (!storedCode || storedCode !== code) return false;
  // await redis.del(`email:code:${email}:${type}`); // 验证成功后删除
  // return true;


  // 模拟验证（开发模式）
  console.log('🔍 验证邮箱验证码：', email, code, type);
  
  const key = `${email}:${type}`;
  const record = (global as any).emailVerificationCodes?.[key];
  
  if (!record) {
    console.log('❌ 验证码不存在');
    return false;
  }
  
  if (record.used) {
    console.log('❌ 验证码已使用');
    return false;
  }
  
  if (Date.now() > record.expiresAt) {
    console.log('❌ 验证码已过期');
    return false;
  }
  
  if (record.code !== code) {
    console.log('❌ 验证码不匹配');
    return false;
  }
  
  // 标记已使用
  record.used = true;
  console.log('✅ 验证码验证成功');
  return true;
}

/**
 * 标记邮箱验证码已使用（供注册/登录接口调用）
 * @param email 邮箱地址
 * @param code 验证码
 */
export async function markEmailCodeUsed(
  email: string,
  code: string
): Promise<void> {
  // TODO: 实际生产环境中，这里应该更新Redis或数据库
  // await redis.del(`email:code:${email}:register`);
  
  // 模拟标记（开发模式）
  console.log('📝 标记邮箱验证码已使用：', email, code);
  
  const key = `${email}:register`;
  if ((global as any).emailVerificationCodes?.[key]) {
    (global as any).emailVerificationCodes[key].used = true;
  }
}
