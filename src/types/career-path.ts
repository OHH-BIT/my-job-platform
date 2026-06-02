/**
 * 动态成长路径规划 - 类型定义
 * 
 * 功能：
 * 1. 基于用户画像与目标岗位的差距分析
 * 2. 生成分阶段、可执行的大学成长地图
 * 3. 时间轴可视化与任务卡片UI
 * 4. 动态更新机制（状态联动）
 */

// ============================================
// 核心类型定义
// ============================================

/**
 * 时间节点（Timeline Node）
 * 表示成长地图中的一个时间点（如"大二下"、"大三暑假"）
 */
export interface TimelineNode {
  id: string;                    // 唯一标识
  title: string;                 // 节点标题（如"大二下"、"大三寒假"）
  date: string;                  // 日期（如"2024-03"）
  semester: string;              // 学期（如"大二下"、"大三上"）
  isCurrent: boolean;            // 是否是当前时间点
  isCompleted: boolean;          // 是否已过完
  tasks: TaskCard[];             // 该时间点的任务列表
}

/**
 * 任务卡片（Task Card）
 * 表示成长地图中的一个具体行动建议
 */
export interface TaskCard {
  id: string;                   // 唯一标识
  title: string;                // 行动标题（如"参加互联网+大赛"）
  description: string;           // 详细描述
  relatedGap: string;           // 关联差距（为什么要做这件事）
  priority: TaskPriority;       // 优先级
  status: TaskStatus;           // 完成状态
  estimatedTime: string;        // 预计耗时（如"2周"、"1个月"）
  actionLink?: ActionLink;       // 直达链接（跳转到站内其他模块）
  subTasks?: SubTask[];         // 子任务列表（可选）
  completedAt?: string;         // 完成时间（如果已完成）
}

/**
 * 任务优先级
 */
export type TaskPriority = 
  | 'P0'  // 必须完成（红色）
  | 'P1'  // 建议完成（橙色）
  | 'P2'; // 可选完成（蓝色）

/**
 * 任务状态
 */
export type TaskStatus = 
  | 'pending'     // 待完成
  | 'in_progress' // 进行中
  | 'completed'   // 已完成
  | 'skipped';    // 已跳过

/**
 * 直达链接
 * 任务卡片上的跳转按钮，指向站内其他模块
 */
export interface ActionLink {
  label: string;                // 按钮文字（如"去学习"、"去找实习"）
  href: string;                 // 跳转链接（如"/chat?q=SQL教程"、"/intern-jobs"）
  module: TargetModule;          // 目标模块
}

/**
 * 目标模块（站内模块）
 */
export type TargetModule = 
  | 'chat'          // 问答科普
  | 'intern-jobs'   // 实习生专区
  | 'resume-checker' // 简历诊所
  | 'mock-interview' // AI模拟面试舱
  | 'profile'        // 智能画像
  | 'job-match';     // 岗位匹配

/**
 * 子任务
 */
export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
}

// ============================================
// 差距分析相关类型
// ============================================

/**
 * 差距分析结果
 * AI分析用户画像与目标岗位的差距后生成
 */
export interface GapAnalysisResult {
  userId: string;                // 用户ID
  targetJobId: string;          // 目标岗位ID
  targetJobTitle: string;       // 目标岗位标题
  analyzedAt: string;           // 分析时间
  overallGapScore: number;      // 总体差距得分（0-100，100表示完全匹配）
  dimensionGaps: DimensionGap[]; // 各维度差距
  skillGaps: SkillGap[];        // 技能差距
  experienceGaps: ExperienceGap[]; // 经历差距
  timeline: TimelineNode[];     // 生成的时间轴规划
  summary: string;              // AI生成的总结文案
}

/**
 * 维度差距
 */
export interface DimensionGap {
  dimension: DimensionType;
  currentScore: number;         // 当前得分
  targetScore: number;          // 目标得分
  gap: number;                 // 差距（目标-当前）
  suggestions: string[];        // 改进建议
}

/**
 * 维度类型
 */
export type DimensionType = 
  | 'professional'   // 专业技能
  | 'communication'  // 沟通协作
  | 'leadership'     // 领导力
  | 'innovation'     // 创新思维
  | 'resilience';    // 抗压能力

/**
 * 技能差距
 */
export interface SkillGap {
  skillName: string;            // 技能名称（如"Python"、"SQL"）
  currentLevel: string;         // 当前水平（如"入门"、"熟练"）
  targetLevel: string;          // 目标水平（如"熟练"、"精通"）
  importance: 'must' | 'should' | 'nice'; // 重要性
  learningPath?: string;        // 学习路径建议
}

/**
 * 经历差距
 */
export interface ExperienceGap {
  experienceType: string;       // 经历类型（如"大厂实习"、"项目经历"）
  currentCount: number;         // 当前数量
  targetCount: number;         // 目标数量
  description: string;         // 描述
  howToFill: string;           // 如何弥补
}

// ============================================
// 用户画像快照（用于差距分析）
// ============================================

/**
 * 用户画像快照
 * 从UserProfile提取关键信息，用于AI分析
 */
export interface UserProfileSnapshot {
  grade: string;               // 年级
  major: string;               // 专业
  expectedPosition: string;     // 期望岗位
  skills: string[];            // 已掌握技能
  projects: ProjectSnapshot[]; // 项目经历
  internships: InternshipSnapshot[]; // 实习经历
  dimensionScores: {            // 维度得分
    professional: number;
    communication: number;
    leadership: number;
    innovation: number;
    resilience: number;
  };
}

/**
 * 项目经历快照
 */
export interface ProjectSnapshot {
  name: string;
  role: string;
  duration: string;
  technologies: string[];
  description: string;
}

/**
 * 实习经历快照
 */
export interface InternshipSnapshot {
  company: string;
  position: string;
  duration: string;
  description: string;
}

// ============================================
// AI Prompt相关类型
// ============================================

/**
 * AI差距分析请求
 */
export interface AIGapAnalysisRequest {
  userProfile: UserProfileSnapshot;
  targetJob: {
    id: string;
    title: string;
    description: string;
    requirements: {
      skills: string[];
      experience: string;
      education: string;
    };
    softRequirements?: {
      communication: number;
      resilience: number;
      leadership: number;
      innovation: number;
    };
  };
  currentTime: string;          // 当前时间（如"2024-03"）
  currentSemester: string;      // 当前学期（如"大二下"）
}

/**
 * AI差距分析响应
 */
export interface AIGapAnalysisResponse {
  overallGapScore: number;
  dimensionGaps: DimensionGap[];
  skillGaps: SkillGap[];
  experienceGaps: ExperienceGap[];
  timeline: TimelineNode[];
  summary: string;
}

// ============================================
// API请求/响应类型
// ============================================

/**
 * 生成成长路径请求
 */
export interface GeneratePathRequest {
  userId: string;
  targetJobId: string;
  userProfileSnapshot: UserProfileSnapshot;
  forceRegenerate?: boolean;     // 是否强制重新生成（默认false，有缓存则使用缓存）
}

/**
 * 生成成长路径响应
 */
export interface GeneratePathResponse {
  success: boolean;
  data?: GapAnalysisResult;
  error?: string;
}

/**
 * 更新任务状态请求
 */
export interface UpdateTaskStatusRequest {
  userId: string;
  timelineNodeId: string;      // 时间节点ID
  taskId: string;              // 任务ID
  newStatus: TaskStatus;
  completedAt?: string;        // 完成时间（如果标记为完成）
}

/**
 * 更新任务状态响应
 */
export interface UpdateTaskStatusResponse {
  success: boolean;
  error?: string;
}

// ============================================
// 常量配置
// ============================================

/**
 * 优先级配置（颜色、标签）
 */
export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  P0: { label: '必须完成', color: '#DC2626', bgColor: '#FEE2E2' },
  P1: { label: '建议完成', color: '#D97706', bgColor: '#FEF3C7' },
  P2: { label: '可选完成', color: '#2563EB', bgColor: '#DBEAFE' },
};

/**
 * 状态配置（图标、标签）
 */
export const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: string }> = {
  pending: { label: '待完成', icon: '⏳' },
  in_progress: { label: '进行中', icon: '🔄' },
  completed: { label: '已完成', icon: '✅' },
  skipped: { label: '已跳过', icon: '⏭️' },
};

/**
 * 学期时间轴配置（用于生成时间节点）
 */
export const SEMESTER_TIMELINE = [
  { semester: '大一上', month: 9, yearOffset: 0 },
  { semester: '大一下', month: 3, yearOffset: 1 },
  { semester: '大二上', month: 9, yearOffset: 1 },
  { semester: '大二下', month: 3, yearOffset: 2 },
  { semester: '大三上', month: 9, yearOffset: 2 },
  { semester: '大三下', month: 3, yearOffset: 3 },
  { semester: '大四上', month: 9, yearOffset: 3 },
  { semester: '大四下', month: 3, yearOffset: 4 },
];

/**
 * 暑假/寒假节点（插入到学期之间）
 */
export const HOLIDAY_NODES = [
  { semester: '大一暑假', month: 7, yearOffset: 1 },
  { semester: '大二寒假', month: 1, yearOffset: 2 },
  { semester: '大二暑假', month: 7, yearOffset: 2 },
  { semester: '大三寒假', month: 1, yearOffset: 3 },
  { semester: '大三暑假', month: 7, yearOffset: 3 },
  { semester: '大四寒假', month: 1, yearOffset: 4 },
];
