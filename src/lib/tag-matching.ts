/**
 * 标签匹配算法 — 计算用户标签与目标岗位的匹配度
 *
 * 核心逻辑：
 *  1. 将用户选中的标签 ID 与岗位能力模型中的 required/preferred/bonus 标签集做交集
 *  2. 按权重计算匹配度百分比（必需 60% + 优先 25% + 加分 15%）
 *  3. 输出"已具备的技能"和"缺失的技能差距清单"
 */

import { Tag, getTagById, ALL_TAGS } from './tag-database';
import { JobCapabilityModel, JOB_CAPABILITY_MODELS } from './job-capability-models';

// ============================================
// 类型定义
// ============================================

export interface TagMatchResult {
  /** 目标岗位 ID */
  positionId: string;
  /** 目标岗位名称 */
  positionTitle: string;
  /** 总匹配度百分比 (0-100) */
  matchScore: number;
  /** 匹配等级 */
  matchLevel: '高' | '中' | '低';
  /** 三维得分明细 */
  breakdown: {
    requiredMatch: number;   // 必需标签匹配率 (0-100)
    preferredMatch: number;  // 优先标签匹配率 (0-100)
    bonusMatch: number;       // 加分标签匹配率 (0-100)
  };
  /** 用户已具备的标签（含 Emoji） */
  matchedTags: Tag[];
  /** 用户缺失的必需标签（差距清单） */
  missingRequiredTags: Tag[];
  /** 用户缺失的优先标签（建议补充） */
  missingPreferredTags: Tag[];
  /** 推荐的项目经历（用户尚未拥有） */
  recommendedProjects: Tag[];
  /** 匹配理由（自然语言） */
  reasons: string[];
  /** 提升建议 */
  suggestions: string[];
}

// ============================================
// 匹配权重
// ============================================

const WEIGHTS = {
  required: 0.60,   // 必需标签权重
  preferred: 0.25,  // 优先标签权重
  bonus: 0.15,      // 加分标签权重
};

// ============================================
// 核心匹配函数
// ============================================

/**
 * 计算用户标签与单个岗位的匹配度
 *
 * @param userTagIds - 用户选中的标签 ID 数组
 * @param jobModel   - 目标岗位的能力模型
 * @returns 标签匹配结果
 */
export function calculateTagMatch(
  userTagIds: string[],
  jobModel: JobCapabilityModel
): TagMatchResult {
  const userSet = new Set(userTagIds);

  // --- 1. 计算各类标签交集 ---
  const matchedRequired = jobModel.requiredTags.filter(id => userSet.has(id));
  const matchedPreferred = jobModel.preferredTags.filter(id => userSet.has(id));
  const matchedBonus = jobModel.bonusTags.filter(id => userSet.has(id));

  const missingRequired = jobModel.requiredTags.filter(id => !userSet.has(id));
  const missingPreferred = jobModel.preferredTags.filter(id => !userSet.has(id));
  const missingProjects = jobModel.recommendedProjects.filter(id => !userSet.has(id));

  // --- 2. 计算匹配率 ---
  const requiredRate = jobModel.requiredTags.length > 0
    ? matchedRequired.length / jobModel.requiredTags.length
    : 1;
  const preferredRate = jobModel.preferredTags.length > 0
    ? matchedPreferred.length / jobModel.preferredTags.length
    : 1;
  const bonusRate = jobModel.bonusTags.length > 0
    ? matchedBonus.length / jobModel.bonusTags.length
    : 1;

  // --- 3. 加权综合得分 ---
  const totalScore = Math.round(
    (requiredRate * WEIGHTS.required +
     preferredRate * WEIGHTS.preferred +
     bonusRate * WEIGHTS.bonus) * 100
  );

  // --- 4. 组装结果 ---
  const allMatched = [...matchedRequired, ...matchedPreferred, ...matchedBonus]
    .map(id => getTagById(id))
    .filter((t): t is Tag => !!t);

  const missingRequiredTags = missingRequired
    .map(id => getTagById(id))
    .filter((t): t is Tag => !!t);

  const missingPreferredTags = missingPreferred
    .map(id => getTagById(id))
    .filter((t): t is Tag => !!t);

  const recommendedProjects = missingProjects
    .map(id => getTagById(id))
    .filter((t): t is Tag => !!t);

  const reasons = generateReasons(jobModel, matchedRequired, matchedPreferred, matchedBonus, allMatched);
  const suggestions = generateSuggestions(jobModel, missingRequiredTags, missingPreferredTags, recommendedProjects);

  return {
    positionId: jobModel.positionId,
    positionTitle: jobModel.title,
    matchScore: totalScore,
    matchLevel: totalScore >= 75 ? '高' : totalScore >= 50 ? '中' : '低',
    breakdown: {
      requiredMatch: Math.round(requiredRate * 100),
      preferredMatch: Math.round(preferredRate * 100),
      bonusMatch: Math.round(bonusRate * 100),
    },
    matchedTags: allMatched,
    missingRequiredTags,
    missingPreferredTags,
    recommendedProjects,
    reasons,
    suggestions,
  };
}

/**
 * 批量匹配：用户标签 vs 所有岗位模型
 *
 * @param userTagIds - 用户选中的标签 ID 数组
 * @param positionIds - 可选，指定要匹配的岗位 ID（不传则匹配全部）
 * @returns 按匹配度降序排列的匹配结果
 */
export function calculateTagMatches(
  userTagIds: string[],
  positionIds?: string[]
): TagMatchResult[] {
  const models = positionIds
    ? JOB_CAPABILITY_MODELS.filter(m => positionIds.includes(m.positionId))
    : JOB_CAPABILITY_MODELS;

  const results = models.map(model => calculateTagMatch(userTagIds, model));
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

// ============================================
// 匹配理由生成
// ============================================

function generateReasons(
  job: JobCapabilityModel,
  matchedRequired: string[],
  matchedPreferred: string[],
  matchedBonus: string[],
  allMatchedTags: Tag[]
): string[] {
  const reasons: string[] = [];

  // 必需标签完全满足
  if (matchedRequired.length === job.requiredTags.length && job.requiredTags.length > 0) {
    reasons.push(`所有岗位必需技能均已具备，基础扎实`);
  } else if (matchedRequired.length > job.requiredTags.length * 0.6) {
    const pct = Math.round(matchedRequired.length / job.requiredTags.length * 100);
    reasons.push(`已掌握 ${pct}% 的岗位核心技能`);
  }

  // 优先标签满足情况
  if (matchedPreferred.length > 0) {
    const topSkills = matchedPreferred
      .slice(0, 3)
      .map(id => getTagById(id))
      .filter((t): t is Tag => !!t)
      .map(t => `${t.emoji}${t.name}`);
    if (topSkills.length > 0) {
      reasons.push(`加分技能：${topSkills.join('、')}`);
    }
  }

  // 加分标签
  if (matchedBonus.length > 0) {
    const bonusNames = matchedBonus
      .slice(0, 2)
      .map(id => getTagById(id))
      .filter((t): t is Tag => !!t)
      .map(t => `${t.emoji}${t.name}`);
    if (bonusNames.length > 0) {
      reasons.push(`额外亮点：${bonusNames.join('、')}`);
    }
  }

  // 至少有一条理由
  if (reasons.length === 0) {
    reasons.push('可通过补充相关技能提升匹配度');
  }

  return reasons.slice(0, 3);
}

// ============================================
// 提升建议生成
// ============================================

function generateSuggestions(
  job: JobCapabilityModel,
  missingRequired: Tag[],
  missingPreferred: Tag[],
  missingProjects: Tag[]
): string[] {
  const suggestions: string[] = [];

  // 必需技能缺失
  if (missingRequired.length > 0) {
    const top = missingRequired.slice(0, 3);
    const names = top.map(t => `${t.emoji}${t.name}`).join('、');
    suggestions.push(`优先学习：${names}`);
  }

  // 建议补充的项目经历
  if (missingProjects.length > 0) {
    const top = missingProjects.slice(0, 2);
    const names = top.map(t => `${t.emoji}${t.name}`).join('、');
    suggestions.push(`建议经历：${names}`);
  }

  // 优先技能补充建议
  if (missingPreferred.length > 2 && suggestions.length < 3) {
    const top = missingPreferred.slice(0, 2);
    const names = top.map(t => `${t.emoji}${t.name}`).join('、');
    suggestions.push(`进阶方向：${names}`);
  }

  return suggestions.slice(0, 3);
}
