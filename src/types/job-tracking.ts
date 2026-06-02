/**
 * 求职进度与复盘看板 - 类型定义
 * 
 * 功能：
 * 1. 可视化追踪投递状态（Kanban看板）
 * 2. AI驱动的面试复盘与笔记生成
 * 3. 时间线视图展示求职历程
 * 4. 数据统计与筛选
 */

// ============================================
// 核心类型定义
// ============================================

/**
 * 投递状态枚举
 * 表示求职过程中的各个阶段
 */
export type ApplicationStatus = 
  | 'applied'       // 已投递
  | 'screening'     // 简历筛选中
  | 'assessment'    // 笔试/测评中
  | 'interviewing'  // 面试中
  | 'waiting'       // 待反馈
  | 'offer'         // 已拿Offer
  | 'rejected'      // 已拒绝
  | 'withdrawn';    // 已撤回

/**
 * 投递状态配置
 */
export interface StatusConfig {
  key: ApplicationStatus;
  label: string;                    // 状态标签（中文）
  color: string;                    // 状态颜色（用于卡片边框/背景）
  icon: string;                     // 状态图标
  order: number;                    // 排序权重（用于Kanban列顺序）
}

/**
 * 投递记录（Application Record）
 * 表示一次完整的求职投递
 */
export interface ApplicationRecord {
  id: string;                       // 唯一标识
  userId: string;                    // 用户ID
  
  // 基本信息
  company: string;                   // 公司名称
  companyLogo?: string;              // 公司Logo URL（可选）
  position: string;                  // 岗位名称
  positionType: PositionType;        // 岗位类型
  city: string;                      // 工作城市
  salaryRange?: string;              // 薪资范围（可选）
  
  // 投递信息
  appliedDate: string;               // 投递日期（ISO 8601）
  channel: ApplicationChannel;        // 投递渠道
  resumeVersion?: string;             // 使用的简历版本（可选）
  
  // 当前状态
  status: ApplicationStatus;          // 当前状态
  statusUpdatedAt: string;           // 状态更新时间
  daysSinceUpdate: number;           // 距离上次更新天数（计算属性）
  
  // 面试信息
  interviews: InterviewRecord[];      // 面试记录列表
  currentRound?: number;             // 当前面试轮次（可选）
  
  // 复盘笔记
  reviewNotes?: ReviewNote;           // AI生成的复盘笔记（可选）
  
  // 元数据
  createdAt: string;                 // 创建时间
  updatedAt: string;                 // 更新时间
  notes?: string;                     // 用户备注（可选）
  tags?: string[];                   // 自定义标签（可选）
}

/**
 * 岗位类型
 */
export type PositionType = 
  | 'fulltime'     // 全职
  | 'intern'       // 实习
  | 'parttime'     // 兼职
  | 'contract';    // 合同工

/**
 * 投递渠道
 */
export type ApplicationChannel = 
  | 'official_website'  // 官网投递
  | 'campus_recruitment' // 校园招聘
  | 'referral'           // 内推
  | 'recruitment_platform' // 招聘平台（Boss直聘、猎聘等）
  | 'social_media'       // 社交媒体（脉脉、小红书等）
  | 'career_fair'        // 招聘会
  | 'other';             // 其他

/**
 * 面试记录（Interview Record）
 * 表示一次面试或笔试
 */
export interface InterviewRecord {
  id: string;                       // 唯一标识
  applicationId: string;             // 关联的投递ID
  
  // 基本信息
  round: number;                     // 面试轮次（1, 2, 3...）
  type: InterviewType;               // 面试类型
  interviewer?: string;              // 面试官（可选）
  interviewerRole?: string;          // 面试官角色（可选，如"HR"、"技术总监"）
  
  // 时间信息
  scheduledAt?: string;              // 预约时间（可选）
  startedAt: string;                 // 开始时间
  endedAt?: string;                  // 结束时间（可选）
  duration?: number;                 // 时长（分钟，可选）
  
  // 内容信息
  questions?: string[];              // 面试问题列表（可选）
  userAnswers?: string[];            // 用户回答列表（可选）
  keyHighlights?: string[];          // 关键亮点（可选）
  keyWeaknesses?: string[];          // 关键不足（可选）
  
  // AI模拟面试关联
  mockInterviewId?: string;          // 关联的AI模拟面试ID（可选）
  
  // 复盘信息
  review?: InterviewReview;          // 本次面试的复盘（可选）
  
  // 状态
  status: InterviewStatus;            // 面试状态
  result?: InterviewResult;          // 面试结果（可选）
  feedback?: string;                 // 面试官反馈（可选）
}

/**
 * 面试类型
 */
export type InterviewType = 
  | 'phone_screening'   // 电话初筛
  | 'online_assessment'  // 在线测评/笔试
  | 'technical'         // 技术面试
  | 'hr'                // HR面试
  | 'behavioral'        // 行为面试
  | 'case'              // Case面试
  | 'group_discussion'  // 群面
  | 'presentation'      // 演讲/PPT展示
  | 'final'             // 终面
  | 'other';            // 其他

/**
 * 面试状态
 */
export type InterviewStatus = 
  | 'scheduled'    // 已预约
  | 'in_progress'  // 进行中
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'no_show';     // 未出席

/**
 * 面试结果
 */
export type InterviewResult = 
  | 'passed'       // 通过
  | 'failed'       // 未通过
  | 'pending'      // 待定
  | 'withdrawn';   // 已撤回

/**
 * 面试复盘（Interview Review）
 * AI生成的结构化复盘报告
 */
export interface InterviewReview {
  id: string;                       // 唯一标识
  interviewId: string;               // 关联的面试ID
  applicationId: string;             // 关联的投递ID
  
  // 基本信息
  generatedAt: string;              // 生成时间
  model: string;                     // 使用的AI模型
  confidence: number;               // AI置信度（0-1）
  
  // AI分析维度
  overallScore: number;              // 总体评分（0-100）
  dimensionScores: ReviewDimensionScore[]; // 各维度得分
  
  // 关键问答分析
  keyQAPairs: QAanalysis[];         // 关键问答对分析
  
  // 亮点与不足
  highlights: string[];             // 亮点列表
  weaknesses: string[];             // 不足列表
  
  // 结构化复盘（STAR法则）
  starAnalysis?: STARAnalysis;       // STAR法则分析（可选）
  
  // 技术盲区总结
  technicalGaps: TechnicalGap[];    // 技术盲区列表
  
  // 面试官关注点
  interviewerFocus: string[];        // 面试官关注点列表
  
  // 下一步行动建议
  actionItems: ActionItem[];         // 行动建议列表
  
  // 原始输入（用户回忆/AI模拟面试记录）
  rawInput: string;                  // 原始输入文本
  inputSource: 'manual' | 'mock_interview' | 'mixed'; // 输入来源
  
  // 用户编辑历史
  editedByUser: boolean;            // 是否被用户编辑过
  editHistory?: EditRecord[];        // 编辑历史（可选）
}

/**
 * 复盘维度得分
 */
export interface ReviewDimensionScore {
  dimension: ReviewDimension;         // 维度
  score: number;                      // 得分（0-100）
  feedback: string;                   // 反馈意见
}

/**
 * 复盘维度
 */
export type ReviewDimension = 
  | 'technical_depth'      // 技术深度
  | 'communication_clarity' // 沟通清晰度
  | 'problem_solving'       // 问题解决能力
  | 'cultural_fit'         // 文化匹配度
  | 'confidence'           // 自信心
  | 'preparation'          // 准备充分度
  | 'question_quality'     // 提问质量
  | 'time_management';     // 时间管理

/**
 * 问答对分析
 */
export interface QAanalysis {
  question: string;                  // 面试问题
  userAnswer: string;                // 用户回答
  analysis: string;                  // AI分析
  score: number;                     // 得分（0-100）
  suggestion: string;                // 改进建议
}

/**
 * STAR法则分析
 */
export interface STARAnalysis {
  situation: string;                 // 情境（Situation）
  task: string;                      // 任务（Task）
  action: string;                    // 行动（Action）
  result: string;                    // 结果（Result）
  analysis: string;                  // AI分析（STAR法则运用得如何）
  suggestions: string[];            // 改进建议
}

/**
 * 技术盲区
 */
export interface TechnicalGap {
  topic: string;                     // 技术主题（如"Redis持久化"）
  description: string;               // 描述（如"对RDB和AOF的区别理解不深"）
  severity: 'high' | 'medium' | 'low'; // 严重程度
  learningResources?: string[];      // 学习资源链接（可选）
  searchQuery?: string;              // 搜索关键词（用于跳转到问答科普）
}

/**
 * 行动建议
 */
export interface ActionItem {
  id: string;                        // 唯一标识
  priority: 'high' | 'medium' | 'low'; // 优先级
  category: ActionCategory;          // 建议类别
  title: string;                     // 建议标题
  description: string;               // 详细描述
  deadline?: string;                 // 截止时间（可选）
  completed: boolean;                // 是否已完成
  completedAt?: string;              // 完成时间（可选）
}

/**
 * 行动建议类别
 */
export type ActionCategory = 
  | 'review_tech'      // 复习技术知识点
  | 'practice_coding'  // 练习编程
  | 'prepare_questions' // 准备面试问题
  | 'research_company'  // 研究公司/岗位
  | 'improve_resume'    // 改进简历
  | 'follow_up'        // 跟进面试
  | 'other';           // 其他

/**
 * 编辑记录
 */
export interface EditRecord {
  editedAt: string;                  // 编辑时间
  field: string;                     // 编辑的字段
  oldValue: string;                  // 旧值
  newValue: string;                  // 新值
}

/**
 * 复盘笔记（Review Note）
 * 关联到投递记录的整体复盘
 */
export interface ReviewNote {
  id: string;                        // 唯一标识
  applicationId: string;              // 关联的投递ID
  
  // 基本信息
  createdAt: string;                 // 创建时间
  updatedAt: string;                 // 更新时间
  
  // 整体评价
  overallRating: number;              // 整体评分（0-5星）
  outcome: 'offer' | 'rejected' | 'pending'; // 最终结果
  
  // AI生成内容
  summary: string;                    // AI生成的整体总结
  keyLearnings: string[];             // 关键学习点
  improvements: string[];             // 改进方向
  
  // 面试记录复盘列表
  interviewReviews: InterviewReview[]; // 各面试的复盘
  
  // 用户自定义内容
  userNotes?: string;                 // 用户笔记（可选）
  tags?: string[];                   // 标签（可选）
}

// ============================================
// 时间线相关类型
// ============================================

/**
 * 时间线节点（Timeline Node）
 * 表示求职历程中的一个关键节点
 */
export interface TimelineNode {
  id: string;                        // 唯一标识
  applicationId: string;              // 关联的投递ID
  
  // 节点信息
  type: TimelineNodeType;             // 节点类型
  title: string;                      // 节点标题
  description?: string;                // 节点描述（可选）
  date: string;                       // 日期（ISO 8601）
  
  // 关联信息
  interviewId?: string;               // 关联的面试ID（可选）
  reviewId?: string;                  // 关联的复盘ID（可选）
  
  // 元数据
  createdAt: string;                 // 创建时间
  icon?: string;                      // 自定义图标（可选）
  color?: string;                     // 自定义颜色（可选）
}

/**
 * 时间线节点类型
 */
export type TimelineNodeType = 
  | 'application'      // 投递
  | 'screening'        // 简历筛选
  | 'assessment'       // 笔试/测评
  | 'interview'        // 面试
  | 'offer'            // Offer
  | 'rejection'        // 拒绝
  | 'withdrawal'       // 撤回
  | 'note';            // 用户笔记

// ============================================
// API请求/响应类型
// ============================================

/**
 * 创建投递记录请求
 */
export interface CreateApplicationRequest {
  company: string;
  position: string;
  positionType: PositionType;
  city: string;
  salaryRange?: string;
  appliedDate: string;
  channel: ApplicationChannel;
  resumeVersion?: string;
  notes?: string;
  tags?: string[];
}

/**
 * 更新投递状态请求
 */
export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  note?: string;
}

/**
 * 添加面试记录请求
 */
export interface AddInterviewRequest {
  round: number;
  type: InterviewType;
  interviewer?: string;
  interviewerRole?: string;
  scheduledAt?: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  questions?: string[];
  userAnswers?: string[];
  mockInterviewId?: string;
}

/**
 * 生成面试复盘请求
 */
export interface GenerateReviewRequest {
  interviewId: string;
  rawInput: string;                   // 用户回忆/AI模拟面试记录
  inputSource: 'manual' | 'mock_interview' | 'mixed';
  mockInterviewId?: string;           // 如果是mock_interview，提供ID
}

/**
 * 获取投递列表请求（筛选+分页）
 */
export interface GetApplicationsRequest {
  status?: ApplicationStatus;          // 按状态筛选
  company?: string;                   // 按公司筛选
  position?: string;                  // 按岗位筛选
  city?: string;                      // 按城市筛选
  startDate?: string;                 // 开始日期
  endDate?: string;                   // 结束日期
  tags?: string[];                    // 按标签筛选
  sortBy?: 'appliedDate' | 'updatedAt' | 'company' | 'status'; // 排序字段
  sortOrder?: 'asc' | 'desc';        // 排序方向
  page?: number;                      // 页码
  pageSize?: number;                  // 每页数量
}

/**
 * 获取投递列表响应
 */
export interface GetApplicationsResponse {
  success: boolean;
  data: ApplicationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  
  // 统计数据
  stats: {
    totalApplications: number;         // 总投递数
    thisWeekApplications: number;     // 本周投递数
    inProgressCount: number;          // 进行中数量
    offerCount: number;               // Offer数量
    rejectedCount: number;            // 拒绝数量
    byStatus: Record<ApplicationStatus, number>; // 按状态统计
    byCompany: Record<string, number>; // 按公司统计
  };
}

// ============================================
// 配置常量
// ============================================

/**
 * 状态配置映射
 */
export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  applied: {
    key: 'applied',
    label: '已投递',
    color: '#1890FF',
    icon: '📤',
    order: 1
  },
  screening: {
    key: 'screening',
    label: '简历筛选',
    color: '#722ED1',
    icon: '🔍',
    order: 2
  },
  assessment: {
    key: 'assessment',
    label: '笔试中',
    color: '#FA8C16',
    icon: '✍️',
    order: 3
  },
  interviewing: {
    key: 'interviewing',
    label: '面试中',
    color: '#52C41A',
    icon: '🎯',
    order: 4
  },
  waiting: {
    key: 'waiting',
    label: '待反馈',
    color: '#FAAD14',
    icon: '⏳',
    order: 5
  },
  offer: {
    key: 'offer',
    label: '已拿Offer',
    color: '#13C2C2',
    icon: '🎉',
    order: 6
  },
  rejected: {
    key: 'rejected',
    label: '已拒绝',
    color: '#FF4D4F',
    icon: '❌',
    order: 7
  },
  withdrawn: {
    key: 'withdrawn',
    label: '已撤回',
    color: '#8C8C8C',
    icon: '↩️',
    order: 8
  }
};

/**
 * 默认分页大小
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * 最大分页大小
 */
export const MAX_PAGE_SIZE = 100;

/**
 * 紧急程度阈值（天数）
 */
export const URGENCY_THRESHOLDS = {
  WARNING: 7,      // 7天未更新：标黄提醒
  CRITICAL: 14,    // 14天未更新：标红警告
};

/**
 * AI置信度阈值
 */
export const AI_CONFIDENCE_THRESHOLD = 0.7;
