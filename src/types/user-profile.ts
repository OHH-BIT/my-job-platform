// 用户画像相关类型定义

// 五大能力维度
export type Dimension = "professional" | "communication" | "leadership" | "innovation" | "resilience";

// 维度得分
export interface DimensionScores {
  professional: number;    // 专业技能 (0-100)
  communication: number;   // 沟通协作 (0-100)
  leadership: number;      // 领导力 (0-100)
  innovation: number;      // 创新思维 (0-100)
  resilience: number;      // 抗压能力 (0-100)
}

// 学历类型
export type DegreeType = "high_school" | "associate" | "bachelor" | "master" | "phd" | "postdoc";

// 职业阶段枚举（新增：用于阶段感知逻辑）
export type CareerStage = 
  | "freshman_sophomore"    // 大一/大二 - 探索期
  | "junior_senior"         // 大三/大四 - 实战期
  | "master"                // 硕士 - 深化期
  | "phd"                  // 博士 - 专家期
  | "postdoc";             // 博士后 - 顶级专家期

// 职业阶段配置
export interface CareerStageConfig {
  stage: CareerStage;
  label: string;                    // 阶段标签（中文）
  degreeRequired: DegreeType[];     // 对应的学历要求
  gradesRequired: string[];         // 对应的年级
  focusAreas: string[];            // 关注领域（建议方向）
  forbiddenAdvice: string[];       // 禁止的建议类型
  recommendedKeywords: string[];   // 推荐的关键词（用于岗位匹配）
  weightAdjustments: {             // 岗位匹配权重调整
    research: number;              // 科研类岗位权重
    internship: number;            // 实习类岗位权重
    fulltime: number;              // 全职类岗位权重
    entry_level: number;           // 入门级岗位权重
    expert_level: number;          // 专家级岗位权重
  };
}

// 基础信息（扩展版：增加degree字段和阶段感知）
export interface BasicInfo {
  grade: string;           // 年级：大一/大二/大三/大四/研究生一年级/研究生二年级/研究生三年级
  degree: DegreeType;      // 学历：bachelor/master/phd等
  major: string;           // 专业
  expectedPosition: string; // 期望岗位
  interests: string[];     // 兴趣标签
  careerStage?: CareerStage; // 职业阶段（自动计算）
}

// 职业价值观
export interface CareerValues {
  workLifeBalance: number; // 工作生活平衡 (1-5)
  challenge: number;       // 挑战性 (1-5)
  stability: number;       // 稳定性 (1-5)
  growth: number;          // 成长空间 (1-5)
  salary: number;          // 薪资回报 (1-5)
}

// 完整用户画像
export interface UserProfile {
  id: string;
  basicInfo: BasicInfo;
  dimensionScores: DimensionScores;
  careerValues: CareerValues;
  completedAt: string; // 完成时间
  reportGenerated: boolean;
}

// 岗位匹配结果
export interface JobMatchResult {
  jobId: string;
  matchScore: number;      // 匹配度 (0-100)
  dimensionMatch: {
    professional: number;
    communication: number;
    leadership: number;
    innovation: number;
    resilience: number;
  };
  reasons: string[];       // 匹配理由
  gaps: string[];         // 差距分析
}

// 维度标签映射
export const DIMENSION_LABELS: Record<Dimension, string> = {
  professional: "专业技能",
  communication: "沟通协作",
  leadership: "领导力",
  innovation: "创新思维",
  resilience: "抗压能力"
};

// 维度颜色映射
export const DIMENSION_COLORS: Record<Dimension, string> = {
  professional: "#0052D9",
  communication: "#00A870",
  leadership: "#FF6B35",
  innovation: "#7C3AED",
  resilience: "#F59E0B"
};

// 年级选项
export const GRADE_OPTIONS = [
  "大一",
  "大二",
  "大三",
  "大四",
  "研究生一年级",
  "研究生二年级",
  "研究生三年级"
];

// 常见专业
export const MAJOR_OPTIONS = [
  "计算机科学与技术",
  "软件工程",
  "人工智能",
  "数据科学与大数据技术",
  "电子信息工程",
  "通信工程",
  "自动化",
  "数学与应用数学",
  "统计学",
  "信息管理",
  "产品设计",
  "视觉传达设计",
  "其他"
];

// 期望岗位选项
export const POSITION_OPTIONS = [
  "前端开发工程师",
  "后端开发工程师",
  "算法工程师",
  "产品经理",
  "UI/UX设计师",
  "数据分析师",
  "运营专员",
  "市场营销",
  "其他"
];

// ============================================
// 职业阶段配置数据（新增：阶段感知逻辑核心）
// ============================================

// 职业阶段详细配置
export const CAREER_STAGE_CONFIGS: Record<CareerStage, CareerStageConfig> = {
  freshman_sophomore: {
    stage: "freshman_sophomore",
    label: "探索期（大一/大二）",
    degreeRequired: ["bachelor"],
    gradesRequired: ["大一", "大二"],
    focusAreas: [
      "通识学习",
      "社团活动",
      "初步接触编程/专业技能",
      "寒暑假社会实践",
      "英语四六级准备",
      "基础课程学习（高数、英语、计算机基础）"
    ],
    forbiddenAdvice: [
      "正式实习",
      "全职工作",
      "秋招/春招",
      "项目经历完善",
      "算法题刷题",
      "顶会论文发表",
      "研究型实习"
    ],
    recommendedKeywords: [
      "学习",
      "社团",
      "课程",
      "基础",
      "实践",
      "探索"
    ],
    weightAdjustments: {
      research: 0.2,      // 科研权重低
      internship: 0.1,     // 实习权重极低
      fulltime: 0.0,       // 全职权重为0
      entry_level: 0.3,     // 入门级岗位权重低
      expert_level: 0.0     // 专家级岗位权重为0
    }
  },
  
  junior_senior: {
    stage: "junior_senior",
    label: "实战期（大三/大四）",
    degreeRequired: ["bachelor"],
    gradesRequired: ["大三", "大四"],
    focusAreas: [
      "大厂日常实习",
      "秋招/春招准备",
      "完善简历项目经历",
      "刷算法题",
      "技术栈深化",
      "毕业设计",
      "面试技巧训练"
    ],
    forbiddenAdvice: [
      "通识学习",
      "社团活动",
      "打基础",
      "参加普通社团",
      "顶会论文发表",
      "研究型实习（除非是科研背景）"
    ],
    recommendedKeywords: [
      "实习",
      "项目",
      "算法",
      "面试",
      "秋招",
      "春招",
      "简历"
    ],
    weightAdjustments: {
      research: 0.3,      // 科研权重中等
      internship: 0.8,     // 实习权重高
      fulltime: 0.6,      // 全职权重中等（大四）
      entry_level: 0.9,    // 入门级岗位权重高
      expert_level: 0.2    // 专家级岗位权重低
    }
  },
  
  master: {
    stage: "master",
    label: "深化期（硕士）",
    degreeRequired: ["master"],
    gradesRequired: ["研究生一年级", "研究生二年级", "研究生三年级"],
    focusAreas: [
      "深度科研项目",
      "发表高质量论文（非必须顶会）",
      "申请研究型实习（Research Intern）",
      "专家岗/校招SP offer冲刺",
      "产业界合作项目",
      "技术深度提升"
    ],
    forbiddenAdvice: [
      "通识学习",
      "社团活动",
      "打基础",
      "参加普通社团",
      "基础执行类工作"
    ],
    recommendedKeywords: [
      "科研",
      "论文",
      "研究",
      "深度",
      "项目",
      "实习"
    ],
    weightAdjustments: {
      research: 0.7,      // 科研权重高
      internship: 0.6,     // 实习权重中等
      fulltime: 0.8,      // 全职权重高
      entry_level: 0.5,    // 入门级岗位权重中等
      expert_level: 0.6    // 专家级岗位权重高
    }
  },
  
  phd: {
    stage: "phd",
    label: "专家期（博士）",
    degreeRequired: ["phd"],
    gradesRequired: ["研究生一年级", "研究生二年级", "研究生三年级", "博士四年级", "博士五年级"],
    focusAreas: [
      "深度科研项目",
      "发表顶会论文",
      "申请研究型实习（Research Intern）",
      "专家岗/校招SP offer冲刺",
      "学术影响力建设",
      "产业界前沿合作"
    ],
    forbiddenAdvice: [
      "通识学习",
      "社团活动",
      "打基础",
      "参加普通社团",
      "基础执行类工作",
      "入门级岗位",
      "普通实习"
    ],
    recommendedKeywords: [
      "顶会",
      "论文",
      "科研",
      "研究",
      "深度",
      "创新",
      "专家"
    ],
    weightAdjustments: {
      research: 0.9,      // 科研权重极高
      internship: 0.4,     // 实习权重中等（研究型实习）
      fulltime: 0.9,      // 全职权重极高
      entry_level: 0.1,    // 入门级岗位权重极低
      expert_level: 0.95   // 专家级岗位权重极高
    }
  },
  
  postdoc: {
    stage: "postdoc",
    label: "顶级专家期（博士后）",
    degreeRequired: ["postdoc"],
    gradesRequired: ["博士后"],
    focusAreas: [
      "顶级科研成果",
      "学术领军人物",
      "产学研深度融合",
      "高端人才引进项目"
    ],
    forbiddenAdvice: [
      "通识学习",
      "社团活动",
      "打基础",
      "实习",
      "入门级岗位",
      "基础执行类工作"
    ],
    recommendedKeywords: [
      "顶会",
      "领军",
      "学术",
      "产学研",
      "高端人才"
    ],
    weightAdjustments: {
      research: 1.0,      // 科研权重满分
      internship: 0.1,     // 实习权重极低
      fulltime: 1.0,      // 全职权重满分
      entry_level: 0.0,    // 入门级岗位权重为0
      expert_level: 1.0    // 专家级岗位权重满分
    }
  }
};

// ============================================
// 工具函数：阶段感知逻辑
// ============================================

/**
 * 根据用户年级和学历自动计算职业阶段
 */
export function calculateCareerStage(grade: string, degree: DegreeType): CareerStage {
  // 大一/大二 -> 探索期
  if (grade === "大一" || grade === "大二") {
    return "freshman_sophomore";
  }
  
  // 大三/大四 -> 实战期
  if (grade === "大三" || grade === "大四") {
    return "junior_senior";
  }
  
  // 硕士 -> 深化期
  if (degree === "master") {
    return "master";
  }
  
  // 博士 -> 专家期
  if (degree === "phd") {
    return "phd";
  }
  
  // 博士后 -> 顶级专家期
  if (degree === "postdoc") {
    return "postdoc";
  }
  
  // 兜底：默认探索期
  console.warn(`[CareerStage] 无法识别的阶段: grade=${grade}, degree=${degree}，默认返回 freshman_sophomore`);
  return "freshman_sophomore";
}

/**
 * 获取职业阶段配置
 */
export function getCareerStageConfig(stage: CareerStage): CareerStageConfig {
  return CAREER_STAGE_CONFIGS[stage];
}

/**
 * 检查建议是否适合当前阶段（返回true表示适合，false表示不适合）
 */
export function isAdviceAppropriateForStage(advice: string, stage: CareerStage): boolean {
  const config = CAREER_STAGE_CONFIGS[stage];
  const forbiddenWords = config.forbiddenAdvice;
  
  // 检查建议是否包含禁止的关键词
  for (const forbidden of forbiddenWords) {
    if (advice.includes(forbidden)) {
      console.warn(`[CareerStage] 建议不适合当前阶段: "${advice}" 包含禁止词 "${forbidden}" (阶段: ${config.label})`);
      return false;
    }
  }
  
  return true;
}

/**
 * 生成阶段感知的建议文案
 */
export function generateStageAwareAdvice(
  userGrade: string,
  userDegree: DegreeType,
  adviceTemplate: string,
  fallbackAdvice: string = "继续保持对技术的热爱，稳步提升自己的能力。"
): string {
  const stage = calculateCareerStage(userGrade, userDegree);
  const config = CAREER_STAGE_CONFIGS[stage];
  
  // 检查模板建议是否适合当前阶段
  if (isAdviceAppropriateForStage(adviceTemplate, stage)) {
    return adviceTemplate;
  }
  
  // 如果不适合，生成阶段适配的建议
  console.warn(`[CareerStage] 建议不适合阶段 ${config.label}，使用兜底建议`);
  
  // 根据阶段生成针对性建议
  switch (stage) {
    case "freshman_sophomore":
      return `建议专注于${config.focusAreas.slice(0, 3).join("、")}。当前阶段重点是打好基础，不必急于实习或找工作。`;
    
    case "junior_senior":
      return `现在是${config.focusAreas[0]}的黄金窗口期。建议尽快完善简历，投递大厂的日常实习岗位积累实战经验。`;
    
    case "master":
      return `您的学术背景很强，建议加强${config.focusAreas.slice(0, 2).join("和")}，为专家岗/校招SP offer冲刺做准备。`;
    
    case "phd":
      return `您的学术研究能力很强，但建议补充一些工业界的落地项目经验，以便更好地适应企业级开发。可以考虑申请研究型实习（Research Intern）。`;
    
    case "postdoc":
      return `您已处于学术顶尖阶段，建议重点关注${config.focusAreas[0]}，考虑高端人才引进项目或产学研深度融合机会。`;
    
    default:
      return fallbackAdvice;
  }
}
