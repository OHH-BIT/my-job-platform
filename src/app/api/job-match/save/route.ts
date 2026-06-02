/**
 * 岗位匹配 - 云端存储API
 * 
 * 功能：
 * 1. POST：保存岗位匹配结果到云端（新增或更新）
 * 2. GET：从云端读取岗位匹配结果（优先读取缓存）
 * 
 * 端点：/api/job-match/save
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// 模拟数据（实际应该存储在数据库）
// ============================================

let jobMatches: any[] = [];

// ============================================
// POST /api/job-match/save
// 保存岗位匹配结果到云端
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, jobId, jobTitle, company, department, matchResult, isFavorite = false } = body;

    // 1. 验证必需参数
    if (!userId || !jobId || !matchResult) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数：userId、jobId 或 matchResult' },
        { status: 400 }
      );
    }

    // 2. 检查是否已存在该用户的该岗位匹配结果
    const existingIndex = jobMatches.findIndex(
      m => m.userId === userId && m.jobId === jobId && m.isActive
    );

    if (existingIndex >= 0) {
      // 更新现有匹配结果
      jobMatches[existingIndex] = {
        ...jobMatches[existingIndex],
        matchResult,
        isFavorite,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // 创建新匹配结果
      const newMatch = {
        id: `match-${Date.now()}`,
        userId,
        jobId,
        jobTitle: jobTitle || '',
        company: company || '',
        department: department || null,
        matchResult,
        isActive: true,
        isFavorite,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      jobMatches.push(newMatch);
    }

    // 3. 返回结果
    return NextResponse.json({
      success: true,
      data: jobMatches.find(m => m.userId === userId && m.jobId === jobId && m.isActive),
      message: '岗位匹配结果保存成功',
    });

  } catch (error) {
    console.error('保存岗位匹配结果失败：', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '保存岗位匹配结果失败，请稍后重试' 
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/job-match/save?userId=xxx&jobId=xxx
// 从云端读取岗位匹配结果
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');

    // 1. 验证必需参数
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数：userId' },
        { status: 400 }
      );
    }

    // 2. 查找该用户的匹配结果
    let matches: any[];
    
    if (jobId) {
      // 查询特定岗位的匹配结果
      matches = jobMatches.filter(
        m => m.userId === userId && m.jobId === jobId && m.isActive
      );
    } else {
      // 查询该用户的所有匹配结果
      matches = jobMatches.filter(
        m => m.userId === userId && m.isActive
      );
    }

    // 3. 返回结果
    return NextResponse.json({
      success: true,
      data: jobId ? (matches[0] || null) : matches,
      message: matches.length > 0 ? '岗位匹配结果读取成功' : '未找到岗位匹配结果，请先进行匹配',
    });

  } catch (error) {
    console.error('读取岗位匹配结果失败：', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '读取岗位匹配结果失败，请稍后重试' 
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/job-match/save?userId=xxx&jobId=xxx
// 删除岗位匹配结果（标记为不活跃）
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');

    // 1. 验证必需参数
    if (!userId || !jobId) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数：userId 或 jobId' },
        { status: 400 }
      );
    }

    // 2. 查找并标记删除
    const matchIndex = jobMatches.findIndex(
      m => m.userId === userId && m.jobId === jobId && m.isActive
    );

    if (matchIndex === -1) {
      return NextResponse.json(
        { success: false, error: '未找到匹配的岗位匹配结果' },
        { status: 404 }
      );
    }

    // 标记为不活跃（软删除）
    jobMatches[matchIndex].isActive = false;
    jobMatches[matchIndex].updatedAt = new Date().toISOString();

    // 3. 返回结果
    return NextResponse.json({
      success: true,
      message: '岗位匹配结果删除成功',
    });

  } catch (error) {
    console.error('删除岗位匹配结果失败：', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '删除岗位匹配结果失败，请稍后重试' 
      },
      { status: 500 }
    );
  }
}
