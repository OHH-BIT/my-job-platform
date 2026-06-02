/**
 * 全局 HTTP 客户端
 * 
 * 统一处理：
 * 1. 自动携带 Authorization: Bearer <token>
 * 2. 全局 401 拦截：自动刷新 Token 或重定向登录
 * 3. Token 自检：应用初始化时检测凭证异常
 * 4. 集中化的错误处理
 */

// ============================================
// 类型定义
// ============================================

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface ApiClientOptions extends RequestInit {
  /** 是否跳过鉴权（公开接口） */
  skipAuth?: boolean;
  /** 自定义重定向行为（不使用默认的登录页跳转） */
  onAuthError?: () => void;
  /** 请求体 */
  body?: any;
}

interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  stats?: any;
}

/** 当前正在刷新 Token 的 Promise，防止并发刷新 */
let refreshPromise: Promise<boolean> | null = null;

// ============================================
// Token 存取（统一 localStorage key）
// ============================================

const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  // 优先 localStorage（兼容旧逻辑）
  return localStorage.getItem(TOKEN_KEYS.ACCESS) || null;
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEYS.REFRESH) || null;
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_KEYS.ACCESS, tokens.accessToken);
  localStorage.setItem(TOKEN_KEYS.REFRESH, tokens.refreshToken);
  // 同时写入 Cookie，供 Edge Middleware 读取
  document.cookie = `${TOKEN_KEYS.ACCESS}=${tokens.accessToken}; path=/; max-age=${15 * 60}; SameSite=Lax`;
  document.cookie = `${TOKEN_KEYS.REFRESH}=${tokens.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
  // 清除 Cookie
  document.cookie = `${TOKEN_KEYS.ACCESS}=; path=/; max-age=0`;
  document.cookie = `${TOKEN_KEYS.REFRESH}=; path=/; max-age=0`;
}

/**
 * 从 Token 中解析用户 ID
 * 仅用于快速判断，不做签名验证（签名验证由后端完成）
 */
export function getUserIdFromToken(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.uid || null;
  } catch {
    return null;
  }
}

/**
 * 检查 Token 是否存在且格式合法
 */
export function hasValidTokenFormat(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // 检查是否过期
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// ============================================
// Token 刷新
// ============================================

/**
 * 尝试使用 Refresh Token 刷新 Access Token
 * @returns 是否刷新成功
 */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const result = await response.json();
    if (result.success && result.data) {
      setTokens({
        accessToken: result.data.tokens.accessToken,
        refreshToken: result.data.tokens.refreshToken,
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 获取刷新锁（防止并发刷新）
 */
async function refreshTokenWithLock(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = tryRefreshToken();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// ============================================
// 认证失败处理
// ============================================

/** 自定义 401 处理回调（可由 AuthProvider 设置） */
let authErrorHandler: (() => void) | null = null;

/**
 * 设置全局认证失败回调
 */
export function setAuthErrorHandler(handler: (() => void) | null) {
  authErrorHandler = handler;
}

function handleAuthError() {
  // 清除残留的错误凭证
  clearTokens();
  // 执行自定义回调（通常由 AuthProvider 设置为跳转登录页）
  if (authErrorHandler) {
    authErrorHandler();
  } else {
    // 默认行为：跳转登录页，带上当前路径
    const currentPath = window.location.pathname;
    window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

// ============================================
// 核心请求方法
// ============================================

/**
 * 全局 API 请求方法
 * 
 * 自动处理：
 * - 添加 Authorization 头
 * - 401 自动刷新 Token 并重试
 * - JSON 序列化/反序列化
 * - 统一错误处理
 */
export async function apiClient<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<ApiResult<T>> {
  const { skipAuth = false, onAuthError, body, headers, ...restOptions } = options;

  // 构建请求头
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // 添加鉴权头（除非明确跳过）
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // 序列化 body
  const fetchOptions: RequestInit = {
    ...restOptions,
    headers: requestHeaders,
  };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // 处理 401：尝试刷新 Token 后重试
    if (response.status === 401 && !skipAuth) {
      const refreshed = await refreshTokenWithLock();
      if (refreshed) {
        // 用新 Token 重试原请求
        const newToken = getAccessToken();
        if (newToken) {
          requestHeaders['Authorization'] = `Bearer ${newToken}`;
        }
        const retryResponse = await fetch(url, { ...fetchOptions, headers: requestHeaders });

        if (retryResponse.ok) {
          return await retryResponse.json();
        }
        // 刷新后仍然 401，说明 Refresh Token 也过期了
        if (retryResponse.status === 401) {
          if (onAuthError) {
            onAuthError();
          } else {
            handleAuthError();
          }
          return { success: false, error: '登录已过期，请重新登录' };
        }
        return await retryResponse.json();
      }

      // 刷新失败
      if (onAuthError) {
        onAuthError();
      } else {
        handleAuthError();
      }
      return { success: false, error: '登录已过期，请重新登录' };
    }

    // 非 401 错误正常处理
    const result = await response.json();
    return result;

  } catch (error) {
    console.error(`[API] 请求失败: ${url}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败，请稍后重试',
    };
  }
}

// ============================================
// 便捷方法
// ============================================

export const api = {
  get: <T = any>(url: string, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, body?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'POST', body }),

  put: <T = any>(url: string, body?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'PUT', body }),

  patch: <T = any>(url: string, body?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'PATCH', body }),

  delete: <T = any>(url: string, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
};

// ============================================
// 导出
// ============================================

export default apiClient;
