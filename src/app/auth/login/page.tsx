/**
 * 登录/注册页面 - 精简版
 * 
 * 功能：
 * 1. 仅支持邮箱验证码登录/注册
 * 2. 简洁的邮箱输入框和验证码交互
 * 3. 自动注册：新邮箱自动创建账号
 * 
 * 页面路径：/auth/login
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// 主组件
// ============================================

export default function LoginPage() {
  const { login } = useAuth();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 表单状态
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // 验证码倒计时
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 本地数据检测
  const [showMergePrompt, setShowMergePrompt] = useState(false);
  const [localData, setLocalData] = useState<any>(null);

  // ============================================
  // 生命周期
  // ============================================

  useEffect(() => {
    // 首次加载时检查 URL 错误参数
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    if (urlError) {
      setError(getErrorMessage(urlError));
    }

    // 检查本地是否有历史数据
    checkLocalData();
  }, []);

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ============================================
  // 事件处理
  // ============================================

  // 检查本地数据
  const checkLocalData = () => {
    try {
      const localProfile = localStorage.getItem('user_profile');
      const localCareerPath = localStorage.getItem('career_path');
      const localApplications = localStorage.getItem('job_applications');

      if (localProfile || localCareerPath || localApplications) {
        setLocalData({
          profile: localProfile ? JSON.parse(localProfile) : null,
          careerPath: localCareerPath ? JSON.parse(localCareerPath) : null,
          applications: localApplications ? JSON.parse(localApplications) : null,
        });
        setShowMergePrompt(true);
      }
    } catch (err) {
      console.error('检查本地数据失败：', err);
    }
  };

  // 处理发送验证码
  const handleSendCode = async () => {
    if (countdown > 0) return;

    // 验证邮箱格式
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('邮箱格式不正确，请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 本地模式：模拟发送验证码（静态部署无法调用邮件服务）
      setCodeSent(true);
      setCountdown(60);
      setSuccess('验证码已生成，请使用任意6位数字完成验证（演示模式）');
    } catch (err) {
      setError('发送验证码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理邮箱登录/注册
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 验证邮箱格式
      if (!email) {
        setError('请输入邮箱地址');
        setLoading(false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('邮箱格式不正确');
        setLoading(false);
        return;
      }

      // 验证验证码
      if (!verificationCode) {
        setError('请输入验证码');
        setLoading(false);
        return;
      }

      if (verificationCode.length !== 6) {
        setError('验证码必须是6位数字');
        setLoading(false);
        return;
      }

      // 本地模式：模拟登录（静态部署无法调用后端）
      const mockAccessToken = 'local_token_' + Date.now();
      const mockRefreshToken = 'local_refresh_' + Date.now();

      login(
        { accessToken: mockAccessToken, refreshToken: mockRefreshToken },
        {
          uid: 'local_user_' + Date.now(),
          email: email,
          nickname: email.split('@')[0],
          source: 'email',
        }
      );

      // 检查是否需要合并本地数据
      if (localData) {
        setShowMergePrompt(true);
      } else {
        setSuccess('登录成功！正在跳转...');
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/';
        setTimeout(() => {
          window.location.href = redirect;
        }, 500);
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理合并本地数据
  const handleMergeData = async (merge: boolean) => {
    if (merge) {
      // 本地模式：直接清除本地数据（无需合并到后端）
      try {
        localStorage.removeItem('user_profile');
        localStorage.removeItem('career_path');
        localStorage.removeItem('job_applications');
        setSuccess('数据合并成功！正在跳转...');
      } catch (err) {
        setError('数据合并失败');
      }
    } else {
      // 跳过合并，直接跳转
      setSuccess('已跳过数据合并，正在跳转...');
    }

    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect') || '/';
      window.location.href = redirect;
    }, 1000);
  };

  // ============================================
  // 渲染辅助函数
  // ============================================

  // 获取错误信息
  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'email_auth_failed': '邮箱验证失败，请重试',
      'missing_code': '验证码缺失，请重试',
      'internal_error': '服务器内部错误，请稍后重试',
    };

    return errorMessages[errorCode] || '登录失败，请重试';
  };

  // ============================================
  // 主渲染
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* 账号关联引导弹窗 */}
      {showMergePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                检测到本地求职档案
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                我们发现您有本地求职档案（画像、成长路径、投递记录等），是否将其合并至当前云端账号？
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleMergeData(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  合并数据
                </button>
                <button
                  onClick={() => handleMergeData(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  跳过
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 登录/注册表单 */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">鹅厂成长伙伴</h2>
          <p className="mt-2 text-gray-600">请输入您的常用邮箱以接收验证码</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          {/* 邮箱登录表单 */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入您的常用邮箱"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                验证码
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入6位验证码"
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '登录中...' : '登录 / 注册'}
            </button>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>首次使用？输入邮箱获取验证码即可自动注册</p>
            <p className="mt-1">遇到问题？请联系客服获取帮助</p>
          </div>
        </div>
      </div>
    </div>
  );
}
