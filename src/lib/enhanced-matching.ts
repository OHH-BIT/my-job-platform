// 增强版用户画像分析算法库（最简版本 - 占位符）
// TODO: 完整实现多维加权评分模型和动态阈值判定

import { EnhancedMatchResult, EnhancedAnalysisRequest } from '@/types/enhanced-matching';

// 主函数：增强版岗位匹配分析（占位符）
export function analyzeJobMatchEnhanced(request: EnhancedAnalysisRequest): EnhancedMatchResult {
  // TODO: 实现完整的加权评分和阈值判定逻辑
  console.warn('analyzeJobMatchEnhanced: 临时占位符实现');
  
  return {
    jobId: request.job.id,
    matchScore: 75,
    weightedBreakdown: {
      hardSkills: 75,
      projectExperience: 75,
      softSkills: 75,
      careerValues: 75
    },
    dimensionAnalysis: {
      professional: { score: 75, weight: 0.35, weightedScore: 26.25, threshold: 65, passed: true, details: [] },
      project: { score: 75, weight: 0.25, weightedScore: 18.75, threshold: 60, passed: true, details: [] },
      soft: { score: 75, weight: 0.25, weightedScore: 18.75, threshold: 60, passed: true, details: [] },
      potential: { score: 75, weight: 0.15, weightedScore: 11.25, threshold: 65, passed: true, details: [] },
      practical: { score: 75, weight: 0.15, weightedScore: 11.25, threshold: 55, passed: true, details: [] }
    },
    thresholdCheck: { passed: true, failedDimensions: [], suggestions: [] },
    reasons: ['临时版本 - 需完整实现'],
    gaps: []
  };
}

// 辅助函数：判断岗位职级（根据标题和部门推断）
export function inferJobLevel(job: any): 'intern' | 'fresh' | 'experienced' {
  const title = job.title?.toLowerCase() || '';
  
  if (title.includes('实习') || title.includes('intern')) {
    return 'intern';
  }
  
  if (title.includes('校招') || title.includes('应届') || title.includes('fresh')) {
    return 'fresh';
  }
  
  return 'experienced';
}
