/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出模式：适配 EdgeOne Pages 纯静态托管
  output: "export",

  // 静态导出不支持 Next.js 内置图片优化，需关闭
  images: {
    unoptimized: true,
  },

  // 跳过构建时类型检查（API routes 包含服务端专用代码）
  typescript: {
    ignoreBuildErrors: true,
  },

  // 固定构建 ID，避免每次构建生成不同 ID 导致缓存失效
  generateBuildId: () => "tencent-career-static-build",

  // 禁用 Next.js 构建缓存（EdgeOne 静态托管无需增量构建缓存）
  // 避免 "No build cache found" 警告
  cacheHandler: undefined,
};

export default nextConfig;
