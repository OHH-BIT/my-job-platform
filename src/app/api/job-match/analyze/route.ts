import { NextRequest, NextResponse } from 'next/server';

/**
 * 岗位匹配分析 API — 基于标签匹配算法
 *
 * POST /api/job-match/analyze
 * 请求体：
 *   { userTagIds: string[], positionId?: string }
 *
 * 返回按匹配度降序排列的岗位匹配结果，包含匹配百分比、已具备技能和差距清单。
 */

import {
  calculateTagMatches,
  TagMatchResult,
} from '@/lib/tag-matching';
import { SKILL_TAGS, PROJECT_TAGS, POSITION_TAGS, Tag } from '@/lib/tag-database';
import { JOB_CAPABILITY_MODELS, JobCapabilityModel } from '@/lib/job-capability-models';

// GET /api/job-match/analyze — 返回所有标签和岗位模型（供前端渲染选择器）
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      skillTags: SKILL_TAGS,
      projectTags: PROJECT_TAGS,
      positionTags: POSITION_TAGS,
      jobModels: JOB_CAPABILITY_MODELS.map(m => ({
        positionId: m.positionId,
        title: m.title,
        category: m.category,
        description: m.description,
        typicalCompanies: m.typicalCompanies,
        salaryRange: m.salaryRange,
      })),
    },
  });
}

// POST /api/job-match/analyze — 标签匹配计算
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userTagIds, positionId } = body;

    if (!userTagIds || !Array.isArray(userTagIds)) {
      return NextResponse.json(
        { success: false, error: 'userTagIds 必须是标签 ID 数组' },
        { status: 400 }
      );
    }

    // 计算匹配结果（可指定单个岗位或匹配全部）
    const results = calculateTagMatches(
      userTagIds,
      positionId ? [positionId] : undefined
    );

    return NextResponse.json({
      success: true,
      data: {
        matchResults: results,
        totalJobs: JOB_CAPABILITY_MODELS.length,
        matchedJobs: results.filter(r => r.matchScore >= 50).length,
      },
    });
  } catch (error: any) {
    console.error('岗位匹配 API 错误：', error);
    return NextResponse.json(
      { success: false, error: error.message || '岗位匹配服务暂时不可用' },
      { status: 500 }
    );
  }
}
