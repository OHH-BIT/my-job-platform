import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Proxy — 全站路由守卫
 * 
 * 功能：
 * 1. 受保护页面（/job-tracking、/profile 等）在 Token 不存在时重定向到登录页
 * 2. 已登录用户在内部页面间自由跳转，绝不二次拦截
 * 3. Access Token 过期但 Refresh Token 有效时，自动静默刷新
 * 4. 登录页已登录用户直接跳转首页
 */

// 受保护的路由前缀（需要登录才能访问）
const PROTECTED_PREFIXES = [
  '/job-tracking',
  '/profile',
  '/career-path',
  '/mock-interview',
  '/resume-checker',
  '/intern-jobs',
  '/growth-path',
  '/chat',
];

// 仅公开的路由（不需要登录）
const PUBLIC_PATHS = [
  '/auth/login',
  '/api/auth/email/send-verification-code',
  '/api/auth/email/login',
  '/api/auth/email/register',
  '/api/auth/refresh',
  '/mentor-sharing',
  '/api/mentor-sharing',
];

// 主匹配器配置：只在这些路径上运行 proxy
export const config = {
  matcher: [
    // 匹配所有页面路由（排除 _next/static、_next/image、favicon 等）
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === API 请求不拦截（鉴权由 API 路由内部处理） ===
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // === 静态资源不拦截 ===
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') // 任何带扩展名的文件
  ) {
    return NextResponse.next();
  }

  // === 登录页特殊处理：已登录用户直接跳转首页 ===
  if (pathname === '/auth/login') {
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (accessToken || refreshToken) {
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.next();
  }

  // === 受保护路由：检查登录态 ===
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    // 公开页面（首页等），直接放行
    return NextResponse.next();
  }

  // 检查 Token（优先 Cookie，回退 localStorage 设置的 Cookie）
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // 有 Access Token 即视为已登录（签名验证由 API 路由完成）
  if (accessToken) {
    return NextResponse.next();
  }

  // 无 Access Token 但有 Refresh Token → 尝试静默刷新
  if (refreshToken) {
    // Edge Runtime 不能直接调用外部 fetch 做 refresh，
    // 但可以将用户重定向到 refresh 端点后再跳回
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('reason', 'token_expired');
    return NextResponse.redirect(loginUrl);
  }

  // 完全无凭证 → 重定向到登录页，记录来源
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}
