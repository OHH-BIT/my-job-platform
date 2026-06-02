// 简历匹配诊断器相关类型定义

// 诊断结果
export interface DiagnosisResult {
  overallScore: number; // 综合匹配分 (0-100)
  grade: string; // 评级：极具竞争力/值得投递/需要优化/不匹配
  strengths: StrengthItem[]; // 亮点分析
  gaps: GapItem[]; // 缺失项预警
  suggestions: SuggestionItem[]; // AI优化建议
  keywordMatchRate: number; // 关键词匹配率
}

// 亮点分析项
export interface StrengthItem {
  id: string;
  keyword: string;
  context: string; // 简历中的上下文
  relevanceScore: number; // 相关度评分 (0-100)
}

// 缺失项预警
export interface GapItem {
  id: string;
  keyword: string;
  importance: "high" | "medium" | "low"; // 重要性
  reason: string; // 为什么重要
  suggestion: string; // 如何补充
}

// AI优化建议
export interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  impact: string; // 预期提升效果
  priority: "high" | "medium" | "low";
}

// 诊断请求（扩展版：增加用户阶段信息）
export interface DiagnosisRequest {
  resumeText: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string[];
  // 新增：用户阶段信息（用于阶段感知逻辑）
  userGrade?: string;      // 年级：大一/大二/大三/大四/研究生一年级/研究生二年级/研究生三年级
  userDegree?: string;     // 学历：bachelor/master/phd等
}

// 诊断状态
export interface DiagnosisState {
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
  result: DiagnosisResult | null;
  error: string | null;
}

// 关键词库
export interface KeywordLibrary {
  technical: string[]; // 技术关键词
  soft: string[]; // 软技能关键词
  industry: string[]; // 行业关键词
  tools: string[]; // 工具关键词
}
