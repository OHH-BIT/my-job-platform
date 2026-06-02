/**
 * 智能动态成长路径规划系统 - 数据模型定义
 * 包含：用户画像、岗位标准库、动态路径记录表
 */

// ============================================
// 1. 用户画像表 (User Profiles)
// ============================================

export interface UserSkill {
  name: string;           // 技能名称：'React', 'Node.js', 'Python'
  level: number;          // 熟练度：1-100
  yearsOfExperience: number; // 工作年限
  lastUsed?: string;      // 最后使用时间（ISO 日期字符串）
}

export interface UserProfile {
  id: string;
  userId: string;         // 关联用户ID
  basicInfo: {
    grade: string;       // 年级：大一/大二/大三/大四/研究生一年级等
    degree: DegreeType;   // 学历：bachelor/master/phd/postdoc
    major: string;        // 专业
    expectedPosition: string; // 期望岗位
    currentRank: string;  // 当前职级：初级/中级/高级/专家
    workYears: number;    // 工作年限
    careerStage: CareerStage;
  };
  skills: UserSkill[];   // 技能标签数组
  dimensionScores: {
    professional: number;    // 专业技能 (0-100)
    communication: number;   // 沟通协作 (0-100)
    leadership: number;      // 领导力 (0-100)
    innovation: number;      // 创新思维 (0-100)
    resilience: number;      // 抗压能力 (0-100)
  };
  careerValues: {
    workLifeBalance: number; // 工作生活平衡 (1-5)
    challenge: number;       // 挑战性 (1-5)
    stability: number;       // 稳定性 (1-5)
    growth: number;          // 成长空间 (1-5)
    salary: number;          // 薪资回报 (1-5)
  };
  completedAt: string;   // 完成时间
  updatedAt: string;     // 更新时间
}

// ============================================
// 2. 岗位标准库 (Job Benchmarks)
// ============================================

export type DegreeType = "high_school" | "associate" | "bachelor" | "master" | "phd" | "postdoc";
export type CareerStage = 
  | "freshman_sophomore"
  | "junior_senior"
  | "master"
  | "phd"
  | "postdoc";

export interface JobBenchmark {
  id: string;
  jobTitle: string;       // 岗位名称：'高级前端工程师'
  companyLevel: string;   // 公司级别：'大厂' | '中厂' | '小厂' | '创业公司'
  department: string;     // 部门：'技术' | '产品' | '设计' | '运营'
  
  // 硬性要求
  requiredSkills: {
    name: string;         // 技能名称
    minLevel: number;     // 最低熟练度要求 (0-100)
    weight: number;       // 权重 (0-1)，影响匹配度计算
    isRequired: boolean;  // 是否必须掌握
  }[];
  
  // 软技能要求
  softSkills: {
    name: string;         // 软技能名称：'团队协作' | '问题解决' | '沟通能力'
    minLevel: number;     // 最低要求 (0-100)
    weight: number;       // 权重
  }[];
  
  // 维度要求（与用户画像的五大维度对应）
  dimensionRequirements: {
    professional: number;    // 专业技能要求 (0-100)
    communication: number;   // 沟通协作要求 (0-100)
    leadership: number;      // 领导力要求 (0-100)
    innovation: number;      // 创新思维要求 (0-100)
    resilience: number;      // 抗压能力要求 (0-100)
  };
  
  // 学历要求
  educationRequirement: {
    minDegree: DegreeType;   // 最低学历要求
    preferredMajors: string[]; // 偏好专业
  };
  
  // 经验要求
  experienceRequirement: {
    minYears: number;      // 最低工作年限
    preferredCompanies: string[]; // 偏好公司背景
  };
  
  // 薪资范围
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  isActive: boolean;      // 是否启用
}

// ============================================
// 3. 动态路径记录表 (Growth Paths)
// ============================================

export type PathStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';
export type NodeType = 'skill_learning' | 'project_practice' | 'certification' | 'interview_prep' | 'networking';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface GrowthPath {
  id: string;
  userId: string;
  targetJobId: string;        // 目标岗位ID（关联 JobBenchmark）
  targetJobTitle: string;      // 目标岗位名称（冗余存储）
  
  // 匹配度分析
  matchAnalysis: {
    overallMatchScore: number;  // 总体匹配度 (0-100)
    dimensionMatch: {
      professional: number;
      communication: number;
      leadership: number;
      innovation: number;
      resilience: number;
    };
    skillGaps: SkillGap[];      // 技能差距分析
    strengthAreas: string[];    // 优势领域
    improvementAreas: string[]; // 待改进领域
  };
  
  // 动态路径节点（阶段性目标）
  pathNodes: PathNode[];
  
  // 路径状态
  status: PathStatus;
  currentNodeIndex: number;     // 当前进行到的节点索引
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface SkillGap {
  skillName: string;           // 技能名称
  currentLevel: number;        // 当前水平 (0-100)
  requiredLevel: number;       // 要求水平 (0-100)
  gapScore: number;            // 差距分数 (required - current)
  gapLevel: 'low' | 'medium' | 'high' | 'critical'; // 差距等级
  suggestion: string;          // 改进建议
}

export interface PathNode {
  id: string;
  nodeType: NodeType;          // 节点类型
  title: string;               // 节点标题
  description: string;         // 详细描述
  priority: PriorityLevel;     // 优先级
  
  // 关联技能
  relatedSkills: string[];     // 涉及的技能名称
  
  // 学习资源
  resources: LearningResource[];
  
  // 评估标准
  completionCriteria: string;   // 完成标准描述
  estimatedHours: number;      // 预计耗时（小时）
  
  // 状态
  status: PathStatus;
  progress: number;            // 进度 (0-100)
  startedAt?: string;
  completedAt?: string;
  
  // 依赖关系
  dependsOn?: string[];        // 依赖的节点ID数组
  order: number;               // 排序序号
}

export interface LearningResource {
  id: string;
  type: 'course' | 'article' | 'video' | 'book' | 'project' | 'documentation';
  title: string;
  url?: string;
  provider?: string;           // 提供方：'Coursera' | 'Udemy' | '官方文档'
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationHours: number;
  rating?: number;             // 评分 (0-5)
  isFree: boolean;
}

// ============================================
// 4. 学习资源库 (Learning Resources Library)
// ============================================

export interface ResourceLibrary {
  [skillName: string]: LearningResource[];
}

// ============================================
// 工具函数：类型守卫和辅助函数
// ============================================

export function isCriticalGap(gap: SkillGap): boolean {
  return gap.gapLevel === 'critical' || gap.gapLevel === 'high';
}

export function calculateGapLevel(current: number, required: number): 'low' | 'medium' | 'high' | 'critical' {
  const gap = required - current;
  if (gap <= 10) return 'low';
  if (gap <= 30) return 'medium';
  if (gap <= 50) return 'high';
  return 'critical';
}

export function getNodeTypeLabel(nodeType: NodeType): string {
  const labels: Record<NodeType, string> = {
    'skill_learning': '技能学习',
    'project_practice': '项目实战',
    'certification': '认证考试',
    'interview_prep': '面试准备',
    'networking': '人脉拓展'
  };
  return labels[nodeType];
}

export function getPriorityColor(priority: PriorityLevel): string {
  const colors: Record<PriorityLevel, string> = {
    'high': '#EF4444',     // 红色
    'medium': '#F59E0B',   // 黄色
    'low': '#10B981'       // 绿色
  };
  return colors[priority];
}

export function getStatusColor(status: PathStatus): string {
  const colors: Record<PathStatus, string> = {
    'not_started': '#6B7280',   // 灰色
    'in_progress': '#3B82F6',   // 蓝色
    'completed': '#10B981',     // 绿色
    'paused': '#F59E0B'        // 黄色
  };
  return colors[status];
}
