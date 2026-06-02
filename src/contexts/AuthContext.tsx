/**
 * 全局认证状态管理（React Context）
 * 
 * 功能：
 * 1. 在应用初始化时自检 Token 有效性
 * 2. 提供统一的登录状态给所有子组件
 * 3. Token 过期时自动清理并重定向到登录页
 * 4. 暴露登录/登出方法
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAuthErrorHandler, hasValidTokenFormat, clearTokens, setTokens, getUserIdFromToken, getAccessToken, getRefreshToken } from '@/lib/api-client';

// ============================================
// 类型定义
// ============================================

interface UserInfo {
  uid: string;
  email?: string;
  nickname?: string;
  avatarUrl?: string;
  source?: string;
}

interface AuthContextType {
  /** 当前用户信息（从 Token 解析，轻量） */
  user: UserInfo | null;
  /** 是否已登录 */
  isAuthenticated: boolean;
  /** 是否正在初始化认证状态 */
  isInitializing: boolean;
  /** 登录方法（设置 Token + 用户信息） */
  login: (tokens: { accessToken: string; refreshToken: string }, user?: UserInfo) => void;
  /** 登出方法 */
  logout: (redirect?: string) => void;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // 初始化：自检 Token 有效性
  useEffect(() => {
    const initAuth = async () => {
      // 1. 检查 Access Token 是否存在且未过期
      if (hasValidTokenFormat()) {
        const uid = getUserIdFromToken();
        if (uid) {
          // 同步 Cookie（确保 Edge Middleware 能读到）
          const at = getAccessToken();
          const rt = getRefreshToken();
          if (at) document.cookie = `access_token=${at}; path=/; max-age=${15 * 60}; SameSite=Lax`;
          if (rt) document.cookie = `refresh_token=${rt}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          setUser({ uid });
          setIsInitializing(false);
          return;
        }
      }

      // 2. Access Token 不存在或已过期，尝试用 Refresh Token 刷新
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const result = await response.json();
          if (result.success && result.data?.tokens) {
            setTokens(result.data.tokens);
            const uid = getUserIdFromToken();
            if (uid) {
              setUser({ uid });
              setIsInitializing(false);
              return;
            }
          }
        } catch (err) {
          console.error('[Auth] Token 刷新失败:', err);
        }
      }

      // 3. 彻底无有效凭证
      clearTokens();
      setUser(null);
      setIsInitializing(false);
    };

    initAuth();
  }, []);

  // 设置全局 401 回调（当 api-client 遇到 401 时触发）
  useEffect(() => {
    setAuthErrorHandler(() => {
      // 清除凭证
      clearTokens();
      setUser(null);
      // 重定向到登录页
      const currentPath = window.location.pathname;
      if (currentPath !== '/auth/login') {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    });

    return () => {
      setAuthErrorHandler(null);
    };
  }, []);

  const login = useCallback((tokens: { accessToken: string; refreshToken: string }, userInfo?: UserInfo) => {
    setTokens(tokens);
    // 从 userInfo 或 token 解析用户信息
    const uid = userInfo?.uid || getUserIdFromToken() || '';
    setUser({
      uid,
      email: userInfo?.email,
      nickname: userInfo?.nickname,
      avatarUrl: userInfo?.avatarUrl,
      source: userInfo?.source,
    });
  }, []);

  const logout = useCallback((redirect?: string) => {
    clearTokens();
    setUser(null);
    if (redirect) {
      window.location.href = redirect;
    } else {
      window.location.href = '/auth/login';
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isInitializing,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

/**
 * 获取全局认证状态
 * 
 * 用法：
 * ```tsx
 * const { isAuthenticated, user, login, logout } = useAuth();
 * 
 * if (!isAuthenticated) {
 *   return <div>请先登录</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用。请确保在 layout.tsx 中包裹了 <AuthProvider>。');
  }
  return context;
}

export default AuthProvider;
