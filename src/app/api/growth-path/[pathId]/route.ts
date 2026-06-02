/**
 * API 端点：获取和更新成长路径
 * GET /api/growth-path/:pathId
 * PUT /api/growth-path/:pathId
 * 
 * 鉴权重构完成：
 * 1. ✅ 使用 withAuth 中间件（JWT 签名验证）
 * 2. ✅ PUT 需归属权校验
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt';
import { PathStatus } from '@/data/growth-path-models';
import { getGrowthPathStore } from '../route';

// ============================================
// GET：获取单个成长路径
// ============================================

export const GET = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    const { pathId } = await context.params;

    if (!pathId) {
      return NextResponse.json(
        { error: '缺少路径ID' },
        { status: 400 }
      );
    }

    const store = getGrowthPathStore();
    const path = store.find(p => p.id === pathId);

    if (!path) {
      return NextResponse.json(
        { success: false, error: '未找到指定的成长路径' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: path
    });
  } catch (error: any) {
    console.error('获取成长路径失败:', error);
    return NextResponse.json(
      { success: false, error: '获取成长路径失败', details: error.message },
      { status: 500 }
    );
  }
});

// ============================================
// PUT：更新成长路径节点状态
// ============================================

export const PUT = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    const userId = user.uid;
    const { pathId } = await context.params;
    const body = await request.json();
    const { nodeId, status, progress } = body;

    if (!pathId || !nodeId || !status) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数：pathId, nodeId, status' },
        { status: 400 }
      );
    }

    const validStatuses: PathStatus[] = ['not_started', 'in_progress', 'completed', 'paused'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态值' },
        { status: 400 }
      );
    }

    const store = getGrowthPathStore();
    const pathIdx = store.findIndex(p => p.id === pathId);

    if (pathIdx === -1) {
      return NextResponse.json(
        { success: false, error: '未找到指定的成长路径' },
        { status: 404 }
      );
    }

    // 归属权校验
    if (store[pathIdx].userId !== userId) {
      return NextResponse.json(
        { success: false, error: '无权操作他人的成长路径' },
        { status: 403 }
      );
    }

    const path = store[pathIdx];
    const nodeIdx = path.pathNodes.findIndex(n => n.id === nodeId);

    if (nodeIdx === -1) {
      return NextResponse.json(
        { success: false, error: '未找到指定的路径节点' },
        { status: 404 }
      );
    }

    // 更新节点状态
    path.pathNodes[nodeIdx].status = status;
    path.pathNodes[nodeIdx].progress = progress || 0;

    if (status === 'in_progress' && !path.pathNodes[nodeIdx].startedAt) {
      path.pathNodes[nodeIdx].startedAt = new Date().toISOString();
    }
    if (status === 'completed' && !path.pathNodes[nodeIdx].completedAt) {
      path.pathNodes[nodeIdx].completedAt = new Date().toISOString();
    }

    path.updatedAt = new Date().toISOString();

    const allDone = path.pathNodes.every(n => n.status === 'completed');
    if (allDone) {
      path.status = 'completed';
      path.completedAt = new Date().toISOString();
    } else {
      const ci = path.pathNodes.findIndex(n => n.status === 'in_progress' || n.status === 'not_started');
      path.currentNodeIndex = ci >= 0 ? ci : 0;
    }

    store[pathIdx] = path;

    return NextResponse.json({
      success: true,
      message: '节点状态更新成功',
      data: path
    });
  } catch (error: any) {
    console.error('更新成长路径失败:', error);
    return NextResponse.json(
      { success: false, error: '更新成长路径失败', details: error.message },
      { status: 500 }
    );
  }
});
