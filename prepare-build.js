/**
 * EdgeOne 静态导出构建预处理脚本
 * 
 * 解决的问题：
 * 1. Next.js output:"export" 不支持 API Routes
 * 2. Windows 下 Next.js [param] 动态路由与 output:"export" 不兼容
 * 
 * 构建命令: node prepare-build.js
 * 此脚本会自动执行: 移出不兼容文件 -> next build -> 恢复文件
 */

const { execSync } = require('child_process');
const fs = require('fs');

const tempDir = '.build-temp';

const tempMoves = [
  { src: 'src/app/api', dst: `${tempDir}/api` },
  { src: 'src/app/mock-interview/chat/[sessionId]', dst: `${tempDir}/mock-chat-session` },
  { src: 'src/app/mock-interview/report/[sessionId]', dst: `${tempDir}/mock-report-session` },
];

function move(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
  fs.rmSync(src, { recursive: true, force: true });
}

function restore() {
  // 反向恢复: dst -> src
  for (const { src, dst } of tempMoves) {
    if (!fs.existsSync(dst)) continue;
    fs.mkdirSync(src, { recursive: true });
    fs.cpSync(dst, src, { recursive: true });
  }
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
}

// Step 1: 移出不兼容文件
for (const { src, dst } of tempMoves) {
  move(src, dst);
}
console.log('[1/3] Moved incompatible routes to .build-temp/');

// Step 2: 构建
try {
  console.log('[2/3] Running next build...');
  execSync('npx next build', { stdio: 'inherit', env: process.env });
  console.log('[2/3] Build succeeded!');
} catch (e) {
  console.error('[2/3] Build failed!');
  restore();
  console.log('[3/3] Restored original files');
  process.exit(1);
}

// Step 3: 恢复
restore();
console.log('[3/3] Restored original files');
console.log('\nBuild complete! Output in out/');
