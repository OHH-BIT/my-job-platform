/**
 * 前辈说（职场人脉与经验传承）模块 - 类型定义
 * 
 * 功能：AI聚合、整理并展示往届校友及行业前辈的真实面经、工作日常、团队氛围等隐性信息
 * 核心：AI驱动的非结构化文本深度分析与脱敏
 */

// ==================== 基础枚举 ====================

// 分享类型
export type SharingType = 
  | "interview_experience"  // 面试经验
  | "work_life"            // 工作日常
  | "team_culture"         // 团队文化
  | "career_growth"        // 职业成长
  | "salary_benefits"      // 薪资福利
  | "interview_tips";      // 面试避坑

// 分享类型标签映射
export const SHARING_TYPE_LABELS: Record<SharingType, string> = {
  interview_experience: "面试经验",
  work_life: "工作日常",
  team_culture: "团队文化",
  career_growth: "职业成长",
  salary_benefits: "薪资福利",
  interview_tips: "面试避坑"
};

// 分享类型图标映射
export const SHARING_TYPE_ICONS: Record<SharingType, string> = {
  interview_experience: "🎯",
  work_life: "💼",
  team_culture: "🤝",
  career_growth: "📈",
  salary_benefits: "💰",
  interview_tips: "⚠️"
};

// 公司枚举（主流互联网公司）
export type Company = 
  | "tencent"      // 腾讯
  | "alibaba"      // 阿里巴巴
  | "byte_dance"   // 字节跳动
  | "baidu"        // 百度
  | "huawei"       // 华为
  | "JD.com"       // 京东
  | "meituan"      // 美团
  | "xiaohongshu"  // 小红书
  | "other";       // 其他

// 公司标签映射
export const COMPANY_LABELS: Record<Company, string> = {
  tencent: "腾讯",
  alibaba: "阿里巴巴",
  byte_dance: "字节跳动",
  baidu: "百度",
  huawei: "华为",
  "JD.com": "京东",
  meituan: "美团",
  xiaohongshu: "小红书",
  other: "其他"
};

// 公司图标映射
export const COMPANY_ICONS: Record<Company, string> = {
  tencent: "🐧",
  alibaba: "🛒",
  byte_dance: "🎵",
  baidu: "🅱️",
  huawei: "🔶",
  "JD.com": "📦",
  meituan: "🍔",
  xiaohongshu: "📕",
  other: "🏢"
};

// 岗位枚举（主流技术/产品/运营岗位）
export type JobPosition = 
  | "frontend"         // 前端开发
  | "backend"          // 后端开发
  | "fullstack"        // 全栈开发
  | "mobile"           // 移动端开发
  | "ai_engineer"      // AI工程师
  | "data_analyst"     // 数据分析师
  | "product_manager"  // 产品经理
  | "ui_designer"      // UI设计师
  | "operations"       // 运营
  | "marketing"        // 市场营销
  | "other";           // 其他

// 岗位标签映射
export const JOB_POSITION_LABELS: Record<JobPosition, string> = {
  frontend: "前端开发",
  backend: "后端开发",
  fullstack: "全栈开发",
  mobile: "移动端开发",
  ai_engineer: "AI工程师",
  data_analyst: "数据分析师",
  product_manager: "产品经理",
  ui_designer: "UI设计师",
  operations: "运营",
  marketing: "市场营销",
  other: "其他"
};

// 岗位图标映射
export const JOB_POSITION_ICONS: Record<JobPosition, string> = {
  frontend: "🎨",
  backend: "⚙️",
  fullstack: "🔧",
  mobile: "📱",
  ai_engineer: "🤖",
  data_analyst: "📊",
  product_manager: "📋",
  ui_designer: "🎨",
  operations: "📢",
  marketing: "📣",
  other: "💼"
};

// 话题标签枚举
export type TopicTag = 
  | "overtime"           // 加班真相
  | "team_atmosphere"    // 团队氛围
  | "interview_pitfalls" // 面试避坑
  | "salary_truth"       // 薪资真相
  | "growth_space"       // 成长空间
  | "work_life_balance"  // 工作生活平衡
  | "office_politics"    // 职场政治
  | "project_pressure";  // 项目压力

// 话题标签映射
export const TOPIC_TAG_LABELS: Record<TopicTag, string> = {
  overtime: "#加班真相",
  team_atmosphere: "#团队氛围",
  interview_pitfalls: "#面试避坑",
  salary_truth: "#薪资真相",
  growth_space: "#成长空间",
  work_life_balance: "#工作生活平衡",
  office_politics: "#职场政治",
  project_pressure: "#项目压力"
};

// ==================== 核心数据模型 ====================

// AI多维度情感与事实提取结果
export interface AIAnalysisResult {
  // 推荐指数 (0-100)
  recommendationScore: number;
  
  // 薪资竞争力 (0-100)
  salaryCompetitiveness: number;
  
  // 工作生活平衡度 (0-100)
  workLifeBalance: number;
  
  // 团队氛围 (0-100)
  teamAtmosphere: number;
  
  // 成长空间 (0-100)
  growthSpace: number;
  
  // 面试难度 (0-100)
  interviewDifficulty: number;
  
  // 核心看点（AI智能摘要，100字以内）
  coreSummary: string;
  
  // 真实原声摘录（1-2句最具代表性的用户原话）
  representativeQuotes: string[];
  
  // 脱敏后的原始文本（AI已抹去敏感信息）
  sanitizedContent: string;
  
  // AI分析置信度 (0-1)
  confidence: number;
  
  // 分析时间戳
  analyzedAt: string;
}

// 匿名前辈身份标识
export interface AnonymousMentor {
  // 匿名标签（如"18届学长"、"5年产品老兵"）
  anonymousLabel: string;
  
  // 毕业年份（可选，用于计算工龄）
  graduationYear?: number;
  
  // 工作年限
  yearsOfExperience: number;
  
  // 当前公司（脱敏后，如"某大厂"或具体公司名）
  currentCompany: string;
  
  // 当前岗位
  currentPosition: string;
  
  // 所在部门/事业群（可选）
  department?: string;
}

// 分享卡片（前端展示用）
export interface SharingCard {
  // 唯一标识
  id: string;
  
  // 分享类型
  type: SharingType;
  
  // 公司
  company: Company;
  
  // 岗位
  position: JobPosition;
  
  // 话题标签
  topicTags: TopicTag[];
  
  // 匿名前辈身份
  mentor: AnonymousMentor;
  
  // AI分析结果
  aiAnalysis: AIAnalysisResult;
  
  // 原始分享内容（脱敏后）
  originalContent: string;
  
  // 点赞数
  likes: number;
  
  // 评论数
  comments: number;
  
  // 分享时间
  sharedAt: string;
  
  // 是否匿名（默认true）
  isAnonymous: boolean;
  
  // 关联岗位ID（可选，用于跳转）
  relatedJobId?: string;
}

// ==================== API请求/响应类型 ====================

// 获取分享列表请求
export interface GetSharingsRequest {
  // 筛选条件
  company?: Company;
  position?: JobPosition;
  topicTag?: TopicTag;
  type?: SharingType;
  
  // 搜索关键词
  keyword?: string;
  
  // 排序方式
  sortBy?: "latest" | "popular" | "recommendation";
  
  // 分页
  page: number;
  pageSize: number;
}

// 获取分享列表响应
export interface GetSharingsResponse {
  success: boolean;
  data: SharingCard[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
}

// AI分析原始文本请求
export interface AnalyzeSharingRequest {
  // 原始非结构化文本
  rawContent: string;
  
  // 补充信息（可选）
  company?: Company;
  position?: JobPosition;
  type?: SharingType;
}

// AI分析原始文本响应
export interface AnalyzeSharingResponse {
  success: boolean;
  data: AIAnalysisResult;
  message?: string;
}

// ==================== 常量配置 ====================

// 默认分页大小
export const DEFAULT_PAGE_SIZE = 10;

// 最大分页大小
export const MAX_PAGE_SIZE = 50;

// AI分析置信度阈值（低于此值需要人工审核）
export const AI_CONFIDENCE_THRESHOLD = 0.7;

// 核心看点最大字数
export const CORE_SUMMARY_MAX_LENGTH = 100;

// 真实原声摘录最大数量
export const MAX_REPRESENTATIVE_QUOTES = 2;
