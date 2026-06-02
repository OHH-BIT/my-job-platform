/**
 * 统一身份认证与云端数据同步 - 类型定义（精简版）
 * 
 * 功能：
 * 1. 邮箱验证码登录/注册
 * 2. JWT鉴权机制
 * 3. 云端数据同步
 * 4. 账号数据合并
 */

// ============================================
// 核心类型定义
// ============================================

/**
 * 用户表（云端数据库）
 * 全局唯一用户标识（UID）
 */
export interface User {
  uid: string;                       // 全局唯一用户ID（UUID v4）
  email: string;                     // 邮箱（必填）
  passwordHash?: string;             // 密码哈希（bcrypt/Argon2，可选）
  
  // 用户信息
  nickname?: string;                 // 昵称（可选）
  avatarUrl?: string;               // 头像URL（可选）
  gender?: 'male' | 'female' | 'unknown'; // 性别（可选）
  
  // 账号状态
  status: UserStatus;                // 账号状态（active、inactive、banned）
  emailVerified: boolean;            // 邮箱是否已验证（邮箱验证码登录，默认已验证）
  
  // 时间戳
  createdAt: string;                // 创建时间（ISO 8601）
  updatedAt: string;                // 更新时间（ISO 8601）
  lastLoginAt: string;              // 最后登录时间（ISO 8601）
  
  // 元数据
  loginCount: number;               // 登录次数
  source: UserSource;               // 注册来源（仅email）
}

/**
 * 用户状态
 */
export type UserStatus = 
  | 'active'       // 活跃（正常）
  | 'inactive'     // 未激活（邮箱未验证）
  | 'banned';      // 已封禁

/**
 * 用户来源（仅邮箱）
 */
export type UserSource = 
  | 'email';        // 邮箱注册

/**
 * 用户会话表（JWT令牌管理）
 * 用于刷新令牌、强制下线等场景
 */
export interface UserSession {
  id: string;                       // 会话ID（UUID v4）
  uid: string;                       // 用户ID（外键 -> users.uid）
  
  // 令牌信息
  refreshToken: string;              // 刷新令牌（用于获取新的access token）
  refreshTokenExpiresAt: string;     // 刷新令牌过期时间（ISO 8601）
  
  // 设备信息
  deviceId?: string;                // 设备ID（可选，用于多设备管理）
  deviceName?: string;              // 设备名称（可选，如"iPhone 13"）
  userAgent?: string;                // User-Agent（可选）
  ipAddress?: string;               // IP地址（可选）
  
  // 状态
  isActive: boolean;                // 是否活跃（false表示已登出或过期）
  loggedOutAt?: string;             // 登出时间（可选）
  
  // 时间戳
  createdAt: string;                // 创建时间（ISO 8601）
  updatedAt: string;                // 更新时间（ISO 8601）
}

/**
 * 邮箱验证码表
 * 用于邮箱注册、登录等场景
 */
export interface EmailVerificationCode {
  id: string;                       // 记录ID（UUID v4）
  email: string;                    // 邮箱地址
  code: string;                    // 验证码（6位数字）
  type: VerificationCodeType;        // 验证码类型
  isUsed: boolean;                 // 是否已使用
  expiresAt: string;               // 过期时间（ISO 8601）
  createdAt: string;               // 创建时间（ISO 8601）
}

/**
 * 验证码类型（仅保留邮箱相关）
 */
export type VerificationCodeType = 
  | 'register'      // 注册
  | 'login'        // 登录
  | 'reset_password'; // 重置密码

/**
 * JWT Payload（JWT令牌负载）
 * 包含在JWT令牌中的信息
 */
export interface JwtPayload {
  uid: string;                      // 用户ID
  email?: string;                   // 邮箱
  nickname?: string;                // 昵称（可选）
  avatarUrl?: string;              // 头像URL（可选）
  source: UserSource;              // 登录来源（仅email）
  sessionId: string;               // 会话ID（用于刷新令牌）
  iat: number;                     // 签发时间（Unix时间戳）
  exp: number;                     // 过期时间（Unix时间戳）
}

/**
 * 认证响应（登录/注册成功后的响应）
 */
export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    tokens: {
      accessToken: string;          // JWT Access Token（短期，15分钟）
      refreshToken: string;         // Refresh Token（长期，7天）
      expiresIn: number;            // Access Token过期时间（秒）
    };
  };
  error?: string;
}

// ============================================
// API请求/响应类型
// ============================================

/**
 * 邮箱注册请求
 */
export interface EmailRegisterRequest {
  email: string;
  password?: string;                 // 密码（可选，如果不设密码则使用验证码登录）
  verificationCode: string;          // 邮箱验证码
  nickname?: string;                // 昵称（可选）
}

/**
 * 邮箱登录请求
 */
export interface EmailLoginRequest {
  email: string;
  password?: string;                 // 密码（可选）
  verificationCode?: string;         // 邮箱验证码（可选，用于二次验证）
}

/**
 * 发送邮箱验证码请求
 */
export interface SendEmailCodeRequest {
  email: string;
  type: VerificationCodeType;        // 验证码类型
}

/**
 * 数据合并请求
 * 当用户使用新方式登录时，检测到本地历史数据，提示合并
 */
export interface MergeDataRequest {
  uid: string;                      // 当前登录用户的UID
  localData: LocalUserData;          // 本地历史数据（从localStorage读取）
  mergeStrategy: 'overwrite' | 'keep_both' | 'manual'; // 合并策略
}

/**
 * 本地用户数据（从localStorage读取）
 * 包含用户的智能画像、成长路径、面试记录等
 */
export interface LocalUserData {
  userProfile?: any;                // 智能画像数据
  careerPath?: any;                 // 成长路径数据
  jobApplications?: any[];          // 投递记录数据
  interviewReviews?: any[];         // 面试复盘数据
  mentorSharings?: any[];          // 前辈说数据（如果有的话）
  // ... 其他业务数据
}

// ============================================
// 中间件类型
// ============================================

/**
 * 认证中间件配置
 */
export interface AuthMiddlewareConfig {
  secret: string;                   // JWT密钥（从环境变量读取）
  accessTokenExpiry: string;        // Access Token过期时间（如"15m"）
  refreshTokenExpiry: string;       // Refresh Token过期时间（如"7d"）
  refreshSecret: string;             // Refresh Token密钥（可与Access Token不同）
}

/**
 * 认证中间件请求对象（扩展NextRequest）
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;               // 解码后的JWT Payload（如果认证成功）
  authError?: string;               // 认证错误信息（如果认证失败）
}

// ============================================
// 配置常量
// ============================================

/**
 * JWT配置
 */
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  accessTokenExpiry: '15m',        // Access Token 15分钟过期
  refreshTokenExpiry: '7d',       // Refresh Token 7天过期
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  algorithm: 'HS256',              // 签名算法
};

/**
 * 密码哈希配置
 */
export const PASSWORD_CONFIG = {
  algorithm: 'bcrypt',             // 哈希算法（bcrypt或Argon2）
  saltRounds: 12,                  // bcrypt盐轮数（12轮=约250ms）
  // Argon2配置（如果使用Argon2）
  argon2: {
    type: 'argon2id',              // Argon2id（推荐）
    memoryCost: 65536,             // 64 MB内存
    timeCost: 3,                   // 3轮迭代
    parallelism: 4,                 // 4个并行线程
  },
};

/**
 * 验证码配置
 */
export const VERIFICATION_CODE_CONFIG = {
  length: 6,                       // 验证码长度（6位数字）
  expiryMinutes: 5,                // 过期时间（5分钟）
  maxAttempts: 5,                 // 最大尝试次数（防止暴力破解）
  resendCooldownSeconds: 60,       // 重发冷却时间（60秒）
};

/**
 * 数据库表名映射（仅保留邮箱相关表）
 */
export const TABLE_NAMES = {
  users: 'users',
  userSessions: 'user_sessions',
  emailVerificationCodes: 'email_verification_codes',
  // 业务表（需要添加user_id字段）
  userProfiles: 'user_profiles',
  careerPaths: 'career_paths',
  jobApplications: 'job_applications',
  interviewReviews: 'interview_reviews',
  mentorSharings: 'mentor_sharings',
};
