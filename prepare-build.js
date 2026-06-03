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
const path = require('path');

const tempDir = '.build-temp';

const tempMoves = [
  { src: 'src/app/api', dst: `${tempDir}/api` },
  { src: 'src/app/mock-interview/chat/[sessionId]', dst: `${tempDir}/mock-chat-session` },
  { src: 'src/app/mock-interview/report/[sessionId]', dst: `${tempDir}/mock-report-session` },
];

/**
 * 兼容 Node 18 的递归复制函数
 * 使用同步原生 fs API，避免依赖 fsext 扩展
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 兼容 Node 18 的递归删除函数
 */
function removeDirSync(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeDirSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  fs.rmdirSync(dir);
}

function move(src, dst) {
  if (!fs.existsSync(src)) return;
  copyDirSync(src, dst);
  removeDirSync(src);
}

function restore() {
  // 反向恢复: dst -> src
  for (const { src, dst } of tempMoves) {
    if (!fs.existsSync(dst)) continue;
    fs.mkdirSync(src, { recursive: true });
    copyDirSync(dst, src);
  }
  removeDirSync(tempDir);
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
