"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/", label: "首页", icon: "home" },
  { href: "/job-match", label: "智能画像", icon: "radar" },
  { href: "/chat", label: "问答科普", icon: "message-circle" },
  { href: "/job-tracking", label: "进度看板", icon: "bar-chart-3" },
  { href: "/mentor-sharing", label: "前辈说", icon: "users" },
  { href: "/growth-path", label: "成长路径", icon: "route" },
  { href: "/mock-interview/config", label: "AI面试舱", icon: "mic" },
  { href: "/resume-checker", label: "简历诊所", icon: "file-check", highlight: true },
  { href: "/intern-jobs", label: "实习生专区", icon: "flame" },
];

// SVG 图标组件 — 统一 20x20 viewBox
const iconMap: Record<string, (cls: string) => React.ReactNode> = {
  home: (c) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  radar: (c) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  "message-circle": (c) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  "bar-chart-3": (c) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  users: (c) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  route: (c) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>,
  mic: (c) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  "file-check": (c) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>,
  flame: (c) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout, isInitializing } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (_item: typeof navItems[0], e: React.MouseEvent) => {
    // 预留扩展点
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/10 dark:border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow duration-300">
              <span className="text-white font-bold text-lg">鹅</span>
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:block tracking-tight">
              鹅厂成长伙伴
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(item, e)}
                className={`relative px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-300 cursor-pointer ${
                  item.highlight
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-px"
                    : pathname === item.href
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-text-secondary hover:text-foreground hover:bg-gray-100/80 dark:hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {iconMap[item.icon]?.("w-[15px] h-[15px]")}
                  {item.label}
                </span>
                {pathname === item.href && !item.highlight && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* 用户区域 */}
          <div className="hidden lg:flex items-center gap-3">
            {!isInitializing && (
              isAuthenticated ? (
                <>
                  <button
                    onClick={() => router.push("/job-match")}
                    className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
                  >
                    <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {(user?.nickname || user?.email || "用")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                      {user?.nickname || user?.email || "用户"}
                    </span>
                  </button>
                  <button
                    onClick={() => logout()}
                    className="text-sm text-text-muted hover:text-text-secondary transition-colors duration-200 cursor-pointer"
                  >
                    退出
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push("/auth/login")}
                  className="btn-primary text-sm !px-5 !py-2 !rounded-xl"
                >
                  登录
                </button>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-gray-200/50 dark:border-white/5">
            <div className="grid grid-cols-3 gap-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(item, e);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                    item.highlight
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                      : pathname === item.href
                      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      : "text-text-secondary hover:text-foreground hover:bg-gray-100/80 dark:hover:bg-white/5"
                  }`}
                >
                  {iconMap[item.icon]?.("w-5 h-5")}
                  {item.label}
                </Link>
              ))}
            </div>

            {/* 移动端用户区域 */}
            {!isInitializing && (
              <div className="px-4 pt-4 mt-2 border-t border-gray-200/50 dark:border-white/5">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { router.push("/job-match"); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {(user?.nickname || user?.email || "用")[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {user?.nickname || user?.email || "用户"}
                      </span>
                    </button>
                    <button
                      onClick={() => logout()}
                      className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                    >
                      退出
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { router.push("/auth/login"); setMobileMenuOpen(false); }}
                    className="w-full py-2.5 rounded-xl btn-primary text-sm cursor-pointer"
                  >
                    登录
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
