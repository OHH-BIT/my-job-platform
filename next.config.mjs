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
};

export default nextConfig;
