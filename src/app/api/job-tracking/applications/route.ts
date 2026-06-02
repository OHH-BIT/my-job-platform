/**
 * 求职进度与复盘看板 - 投递记录列表API
 * 
 * 功能：
 * 1. GET：获取投递记录列表（支持筛选、排序、分页）
 * 2. POST：创建新的投递记录
 * 
 * 鉴权重构完成：
 * 1. ✅ 使用标准 withAuth 中间件（JWT 签名验证）
 * 2. ✅ 移除不安全的 base64 解码和 x-user-id 头
 * 3. ✅ 移除所有 Mock/硬编码数据
 * 4. ✅ 使用内存存储（生产环境应替换为数据库）
 * 
 * 端点：/api/job-tracking/applications
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt';
import { 
  ApplicationRecord, 
  ApplicationStatus, 
  GetApplicationsRequest, 
  GetApplicationsResponse,
  CreateApplicationRequest 
} from '@/types/job-tracking';

// ============================================
// 内存数据存储（演示用，生产环境应使用数据库）
// ============================================

const memoryStorage = {
  applications: [] as ApplicationRecord[],
  timelineNodes: [] as any[],
};

/**
 * 导出内存存储引用，供 DELETE/PATCH 路由共享
 */
export function getApplicationStore() {
  return memoryStorage;
}

// ============================================
// 工具函数
// ============================================

function getChannelLabel(channel: string): string {
  const channelLabels: Record<string, string> = {
    'official_website': '官网',
    'campus_recruitment': '校园招聘',
    'referral': '内推',
    'recruitment_platform': '招聘平台',
    'social_media': '社交媒体',
    'career_fair': '招聘会',
    'other': '其他',
  };
  return channelLabels[channel] || channel;
}

// ============================================
// API路由处理（使用 withAuth 鉴权中间件）
// ============================================

export const GET = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    const userId = user.uid;

    const { searchParams } = new URL(request.url);
    const query: GetApplicationsRequest = {
      status: searchParams.get('status') as ApplicationStatus || undefined,
      company: searchParams.get('company') || undefined,
      position: searchParams.get('position') || undefined,
      city: searchParams.get('city') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'appliedDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
    };

    // 筛选当前用户的数据
    let applications = memoryStorage.applications.filter(app => app.userId === userId);

    if (query.status) {
      applications = applications.filter(app => app.status === query.status);
    }
    if (query.company) {
      applications = applications.filter(app => 
        app.company.toLowerCase().includes(query.company!.toLowerCase())
      );
    }
    if (query.position) {
      applications = applications.filter(app => 
        app.position.toLowerCase().includes(query.position!.toLowerCase())
      );
    }
    if (query.city) {
      applications = applications.filter(app => 
        app.city.toLowerCase().includes(query.city!.toLowerCase())
      );
    }
    if (query.startDate) {
      applications = applications.filter(app => app.appliedDate >= query.startDate!);
    }
    if (query.endDate) {
      applications = applications.filter(app => app.appliedDate <= query.endDate!);
    }
    if (query.tags && query.tags.length > 0) {
      applications = applications.filter(app => 
        query.tags!.some(tag => app.tags?.includes(tag))
      );
    }

    // 排序
    applications.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (query.sortBy) {
        case 'appliedDate':
          aValue = new Date(a.appliedDate).getTime();
          bValue = new Date(b.appliedDate).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'company':
          aValue = a.company;
          bValue = b.company;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.appliedDate).getTime();
          bValue = new Date(b.appliedDate).getTime();
      }
      return query.sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    // 计算统计数据
    const userApplications = memoryStorage.applications.filter(app => app.userId === userId);
    const stats = {
      totalApplications: userApplications.length,
      thisWeekApplications: userApplications.filter(app => {
        const appliedDate = new Date(app.appliedDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return appliedDate >= weekAgo;
      }).length,
      inProgressCount: userApplications.filter(app => 
        ['applied', 'screening', 'assessment', 'interviewing', 'waiting'].includes(app.status)
      ).length,
      offerCount: userApplications.filter(app => app.status === 'offer').length,
      rejectedCount: userApplications.filter(app => app.status === 'rejected').length,
      byStatus: userApplications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCompany: userApplications.reduce((acc, app) => {
        acc[app.company] = (acc[app.company] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // 分页
    const total = applications.length;
    const totalPages = Math.ceil(total / query.pageSize!);
    const start = (query.page! - 1) * query.pageSize!;
    const end = start + query.pageSize!;
    const paginatedApplications = applications.slice(start, end);

    const response: GetApplicationsResponse = {
      success: true,
      data: paginatedApplications,
      total,
      page: query.page!,
      pageSize: query.pageSize!,
      totalPages,
      stats,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('获取投递记录列表失败：', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取投递记录列表失败，请稍后重试' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    const userId = user.uid;

    const body: CreateApplicationRequest = await request.json();
    const { company, position, positionType, city, salaryRange, appliedDate, channel, resumeVersion, notes, tags } = body;

    if (!company || !position || !positionType || !city || !appliedDate || !channel) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：company、position、positionType、city、appliedDate、channel' },
        { status: 400 }
      );
    }

    const newApplication: ApplicationRecord = {
      id: `app-${Date.now()}`,
      userId: userId,
      company,
      position,
      positionType,
      city,
      salaryRange,
      appliedDate,
      channel,
      resumeVersion,
      status: 'applied',
      statusUpdatedAt: new Date().toISOString(),
      daysSinceUpdate: 0,
      interviews: [],
      currentRound: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes,
      tags,
    };

    memoryStorage.applications.push(newApplication);

    const timelineNode = {
      id: `tl-${Date.now()}`,
      applicationId: newApplication.id,
      type: 'application',
      title: `投递${company}${position}岗`,
      description: `通过${getChannelLabel(channel)}投递${company}${position}岗位`,
      date: appliedDate,
      createdAt: new Date().toISOString(),
    };
    memoryStorage.timelineNodes.push(timelineNode);

    return NextResponse.json({
      success: true,
      data: newApplication,
      message: '投递记录创建成功',
    });

  } catch (error) {
    console.error('创建投递记录失败：', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建投递记录失败，请稍后重试' },
      { status: 500 }
    );
  }
});
