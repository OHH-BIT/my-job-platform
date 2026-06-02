/**
 * AI 模拟面试舱 - 类型定义
 * 包含：面试报告、评分、会话等类型
 */

// ============================================
// 面试评分
// ============================================

export interface InterviewScore {
  overall: number;       // 总体评分 (0-100)
  dimensions: {
    logicalThinking: number;      // 逻辑思维 (0-100)
    languageExpression: number;    // 语言表达 (0-100)
    professionalSkills: number;    // 专业技能 (0-100)
    jobMatch: number;             // 岗位匹配度 (0-100)
    stressResistance: number;     // 抗压能力 (0-100)
  };
  feedback: string;      // 反馈意见
  improvement: string[]; // 改进建议
}

// ============================================
// 题目评审
// ============================================

export interface QuestionReview {
  questionIndex: number;   // 题目索引
  score: number;          // 得分 (0-100)
  question: string;       // 面试官提问
  answer: string;         // 候选人回答
  highlights: string[];   // 回答亮点
  gaps: string[];         // 回答不足
  suggestedAnswer: string; // 优化话术示范
}

// ============================================
// 面试报告
// ============================================

export interface InterviewReport {
  sessionId: string;
  userId: string;
  targetJobId: string;
  startTime: number;
  endTime: number;
  
  // 总体评分
  score: InterviewScore;      // 总体评分
  dimensionScores: {
    professional: number;    // 专业技能 (0-100)
    communication: number;   // 沟通能力 (0-100)
    logic: number;           // 逻辑思维 (0-100)
    culture: number;         // 文化匹配 (0-100)
  };
  
  // 详细评分
  scores: InterviewScore[];
  
  // 面试总结
  overallFeedback: string;    // 总体反馈
  strengths: string[];       // 优势
  weaknesses: string[];      // 不足
  improvementSuggestions: string[];  // 改进建议
  
  // 逐题精评
  questionReviews: QuestionReview[];
  
  // 面试记录
  messages: InterviewMessage[];
}

// ============================================
// 面试消息
// ============================================

export interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: number;
  isVoice?: boolean;
}

// ============================================
// 面试会话
// ============================================

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  status: 'in_progress' | 'completed';
  messages: InterviewMessage[];
  startTime: number;
  endTime?: number;
  report?: InterviewReport;
  currentQuestionIndex: number;
  userProfile: any;
}

// ============================================
// 面试配置
// ============================================

export interface InterviewConfig {
  targetJobId: string;
  interviewDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  focusAreas: string[];
  questionCount: number;
}

// ============================================
// 动态出题引擎 - 新增类型
// ============================================

/** AI生成的单道面试题 */
export interface GeneratedQuestion {
  question: string;
  type: string;       // 考察点，如 "项目深挖"、"基础概念"、"系统设计"、"行为素质" 等
  isFollowUp?: boolean; // 是否为追问
  parentId?: string;    // 追问的父题目ID
}

/** AI追问决策 */
export interface FollowUpDecision {
  shouldFollowUp: boolean;
  followUpQuestion?: string;
  reason?: string;     // 为什么追问
}

/** 出题API请求参数 */
export interface GenerateQuestionsRequest {
  jobPosition: string;
  interviewType: 'technical' | 'behavioral';
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'stress';
  resumeText: string;
  questionCount: number;
}

/** 出题API响应 */
export interface GenerateQuestionsResponse {
  success: boolean;
  questions: GeneratedQuestion[];
  error?: string;
}