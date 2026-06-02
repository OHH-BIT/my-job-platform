// AI简历智能诊断系统 - 类型定义

// 简历诊断请求（扩展版：增加用户年级和学历信息）
export interface ResumeCheckerRequest {
  resumeText: string;
  resumeFile?: File;
  jobId?: string;
  jobTitle?: string;
  jobDescription?: string;
  jobRequirements?: string[];
  // 新增：用户阶段信息（用于阶段感知逻辑）
  userGrade?: string;      // 年级：大一/大二/大三/大四/研究生一年级/研究生二年级/研究生三年级
  userDegree?: string;     // 学历：bachelor/master/phd等
}

// 综合竞争力评分
export interface CompetitivenessScore {
  overall: number; // 总分 (0-100)
  grade: '潜力股' | '极具竞争力' | '待优化' | '不匹配';
  gradeColor: string; // 评级对应的颜色
  dimensions: {
    professionalMatch: number; // 专业匹配度 (0-100)
    projectExperience: number; // 项目经历 (0-100)
    skillStack: number; // 技能栈 (0-100)
    softSkills: number; // 软实力 (0-100)
    quantitativeData: number; // 量化数据 (0-100)
    formatting: number; // 排版规范 (0-100)
  };
}

// 雷达图数据
export interface RadarChartData {
  labels: string[];
  userValues: number[];
  standardValues: number[];
}

// 亮点分析（深度剖析）
export interface StrengthAnalysis {
  id: string;
  title: string;
  description: string;
  evidence: string; // 简历中的证据
  impact: 'high' | 'medium' | 'low';
  category: 'skill' | 'experience' | 'education' | 'project' | 'achievement';
}

// 扣分项/风险点
export interface RiskPoint {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  evidence?: string; // 问题描述
  impact: string; // 对求职的影响
}

// AI针对性修改指导
export interface ModificationGuidance {
  id: string;
  title: string;
  originalText: string; // 原文
  suggestedText: string; // 建议修改后的文本
  reason: string; // 为什么这样改
  method: 'STAR' | '量化' | '关键词' | '结构' | '语言';
  expectedImprovement: string; // 预期提升效果
}

// 完整的诊断报告
export interface ResumeDiagnosisReport {
  id: string;
  timestamp: Date;
  score: CompetitivenessScore;
  radarData: RadarChartData;
  strengths: StrengthAnalysis[];
  risks: RiskPoint[];
  guidance: ModificationGuidance[];
  summary: string; // 总体评价
  nextSteps: string[]; // 下一步建议
}

// 诊断状态
export interface DiagnosisProcess {
  isAnalyzing: boolean;
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  progress: number;
}

// 上传文件类型
export interface UploadedFile {
  file: File;
  preview?: string;
  text?: string;
  error?: string;
}
