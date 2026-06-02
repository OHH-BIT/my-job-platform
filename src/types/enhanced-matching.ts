// 增强版用户画像分析 - 类型定义

// 岗位职级类型
export type JobLevel = 'intern' | 'fresh' | 'experienced';

// 加权评分权重配置
export interface WeightConfig {
  hardSkills: number;      // 硬技能权重 (0-1)
  projectExperience: number; // 项目经历权重 (0-1)
  softSkills: number;       // 软技能权重 (0-1)
  careerValues: number;     // 职业价值观权重 (0-1)
  total: number;            // 总权重（应为1）
}

// 动态阈值配置（根据岗位职级）
export interface ThresholdConfig {
  level: JobLevel;
  minScore: number;           // 最低准入分数
  dimensionThresholds: {
    professional: number;     // 专业能力最低要求
    project: number;          // 项目经历最低要求
    soft: number;             // 软技能最低要求
    potential: number;        // 潜力最低要求（实习生重点）
    practical: number;        // 实战经验最低要求（正式员工重点）
  };
  focusAreas: string[];      // 重点关注维度
}

// 增强版匹配结果
export interface EnhancedMatchResult {
  jobId: string;
  matchScore: number;
  weightedBreakdown: {
    hardSkills: number;      // 硬技能得分
    projectExperience: number; // 项目经历得分
    softSkills: number;       // 软技能得分
    careerValues: number;     // 职业价值观得分
  };
  dimensionAnalysis: {
    professional: DimensionDetail;
    project: DimensionDetail;
    soft: DimensionDetail;
    potential: DimensionDetail;
    practical: DimensionDetail;
  };
  thresholdCheck: {
    passed: boolean;
    failedDimensions: string[];
    suggestions: string[];
  };
  reasons: string[];
  gaps: string[];
}

// 维度详细分析
export interface DimensionDetail {
  score: number;
  weight: number;
  weightedScore: number;
  threshold: number;
  passed: boolean;
  details: string[];
}

// 用户画像增强分析请求
export interface EnhancedAnalysisRequest {
  userProfile: any; // UserProfile类型
  job: any; // JobPosition类型
  jobLevel: JobLevel;
}

// 预设的权重配置（根据不同岗位类型）
export const WEIGHT_CONFIGS: Record<string, WeightConfig> = {
  // 技术类岗位
  technical: {
    hardSkills: 0.35,
    projectExperience: 0.25,
    softSkills: 0.25,
    careerValues: 0.15,
    total: 1.0
  },
  // 产品类岗位
  product: {
    hardSkills: 0.20,
    projectExperience: 0.30,
    softSkills: 0.35,
    careerValues: 0.15,
    total: 1.0
  },
  // 设计类岗位
  design: {
    hardSkills: 0.25,
    projectExperience: 0.35,
    softSkills: 0.30,
    careerValues: 0.10,
    total: 1.0
  },
  // 市场/职能类岗位
  business: {
    hardSkills: 0.15,
    projectExperience: 0.30,
    softSkills: 0.40,
    careerValues: 0.15,
    total: 1.0
  }
};

// 预设的阈值配置（根据岗位职级）
export const THRESHOLD_CONFIGS: Record<JobLevel, ThresholdConfig> = {
  intern: {
    level: 'intern',
    minScore: 60,
    dimensionThresholds: {
      professional: 50,
      project: 40,
      soft: 55,
      potential: 65,  // 实习生重点看潜力
      practical: 30
    },
    focusAreas: ['potential', 'learning', 'soft']
  },
  fresh: {
    level: 'fresh',
    minScore: 70,
    dimensionThresholds: {
      professional: 65,
      project: 60,
      soft: 60,
      potential: 60,
      practical: 55
    },
    focusAreas: ['professional', 'project', 'soft']
  },
  experienced: {
    level: 'experienced',
    minScore: 75,
    dimensionThresholds: {
      professional: 75,
      project: 70,
      soft: 65,
      potential: 50,
      practical: 75  // 正式员工重点看实战经验
    },
    focusAreas: ['practical', 'professional', 'project']
  }
};
