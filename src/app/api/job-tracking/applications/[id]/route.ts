export const dynamic = 'force-static';
export function generateStaticParams() { return []; }

/**
 * 求职进度与复盘看板 - 单条投递记录 API
 * 
 * 功能：
 * 1. PATCH：更新投递状态
 * 2. DELETE：删除投递记录（含鉴权，只能删除自己的数据）
 * 
 * 鉴权重构完成：
 * 1. ✅ 使用标准 withAuth 中间件（JWT 签名验证）
 * 2. ✅ 归属权校验：只能操作自己的数据
 * 
 * 端点：/api/job-tracking/applications/:id
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt';
import { ApplicationStatus } from '@/types/job-tracking';
import { getApplicationStore } from '../route';

// ============================================
// PATCH：更新投递状态
// ============================================

export const PATCH = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    const { id } = await context.params;
    const userId = user.uid;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少投递记录ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, note } = body;

    const validStatuses = ['applied', 'screening', 'assessment', 'interviewing', 'waiting', 'offer', 'rejected', 'withdrawn'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态值' },
        { status: 400 }
      );
    }

    const store = getApplicationStore();
    const appIndex = store.applications.findIndex(a => a.id === id);

    if (appIndex === -1) {
      return NextResponse.json(
        { success: false, error: '未找到该投递记录' },
        { status: 404 }
      );
    }

    // 权限校验：只能修改自己的记录
    if (store.applications[appIndex].userId !== userId) {
      return NextResponse.json(
        { success: false, error: '无权操作他人的投递记录' },
        { status: 403 }
      );
    }

    // 更新状态
    const app = store.applications[appIndex];
    app.status = status as ApplicationStatus;
    app.statusUpdatedAt = new Date().toISOString();
    app.updatedAt = new Date().toISOString();
    app.daysSinceUpdate = 0;
    if (note) {
      app.notes = (app.notes ? app.notes + '\n' : '') + `[${new Date().toLocaleDateString('zh-CN')}] ${note}`;
    }

    if (status === 'interviewing') {
      app.currentRound = (app.currentRound || 0) + 1;
    }

    // 添加时间线节点
    store.timelineNodes.push({
      id: `tl-${Date.now()}`,
      applicationId: app.id,
      type: status === 'offer' ? 'offer' : status === 'rejected' ? 'rejection' : status === 'withdrawn' ? 'withdrawal' : 'note',
      title: `状态更新为：${status}`,
      description: note || '',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    store.applications[appIndex] = app;

    return NextResponse.json({
      success: true,
      data: app,
      message: '状态更新成功',
    });

  } catch (error) {
    console.error('更新投递状态失败：', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新投递状态失败' },
      { status: 500 }
    );
  }
});

// ============================================
// DELETE：删除投递记录
// ============================================

export const DELETE = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    const { id } = await context.params;
    const userId = user.uid;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少投递记录ID' },
        { status: 400 }
      );
    }

    const store = getApplicationStore();
    const appIndex = store.applications.findIndex(a => a.id === id);

    if (appIndex === -1) {
      return NextResponse.json(
        { success: false, error: '未找到该投递记录' },
        { status: 404 }
      );
    }

    // 权限校验：只能删除自己的记录
    if (store.applications[appIndex].userId !== userId) {
      return NextResponse.json(
        { success: false, error: '无权操作他人的投递记录' },
        { status: 403 }
      );
    }

    // 删除投递记录
    store.applications.splice(appIndex, 1);

    // 同步删除关联的时间线节点
    store.timelineNodes = store.timelineNodes.filter(tl => tl.applicationId !== id);

    return NextResponse.json({
      success: true,
      message: '投递记录已删除',
    });

  } catch (error) {
    console.error('删除投递记录失败：', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除投递记录失败' },
      { status: 500 }
    );
  }
});
