// 简历匹配诊断算法（修正版）
// 核心原则：100%忠实于用户原始文本，禁止凭空生成经历或技能

import { DiagnosisResult, DiagnosisRequest, KeywordLibrary } from "@/types/resume-diagnosis";

// 调试模式
const DEBUG_MODE = true;

// 关键词库（可以根据不同岗位定制）
const KEYWORD_LIBRARY: Record<string, KeywordLibrary> = {
  "frontend": {
    technical: ["JavaScript", "TypeScript", "React", "Vue", "HTML", "CSS", "Node.js", "Webpack", "Vite"],
    soft: ["沟通", "团队协作", "问题解决", "学习能力", "抗压能力"],
    industry: ["前端开发", "Web开发", "移动端", "响应式设计", "用户体验"],
    tools: ["Figma", "Git", "VS Code", "Chrome DevTools", "npm"]
  },
  "backend": {
    technical: ["Java", "Go", "C++", "Python", "数据库", "MySQL", "Redis", "微服务", "分布式"],
    soft: ["逻辑思维", "问题分析", "系统设计", "团队协作"],
    industry: ["后端开发", "服务器", "高并发", "性能优化", "架构设计"],
    tools: ["Docker", "Kubernetes", "Linux", "Git", "Jenkins"]
  },
  "ai": {
    technical: ["Python", "PyTorch", "TensorFlow", "机器学习", "深度学习", "NLP", "CV"],
    soft: ["研究能力", "创新思维", "数学基础", "论文阅读"],
    industry: ["人工智能", "算法", "数据挖掘", "模型训练", "A/B测试"],
    tools: ["Jupyter", "Pandas", "NumPy", "Matplotlib", "GPU"]
  },
  "default": {
    technical: ["编程", "算法", "数据结构", "系统设计"],
    soft: ["沟通", "团队协作", "学习能力", "问题解决"],
    industry: ["互联网", "软件", "技术"],
    tools: ["Git", "Linux", "数据库"]
  }
};

// 严格的文本提取函数 - 只从原始文本中提取
function extractTextFactsDiagnosis(resumeText: string, jobId: string) {
  const text = resumeText;
  
  // 调试日志
  if (DEBUG_MODE) {
    console.log('[Diagnosis] ========== 简历诊断调试信息 ==========');
    console.log('[Diagnosis] 原始文本长度:', text.length);
    console.log('[Diagnosis] 岗位ID:', jobId);
  }
  
  // 获取岗位关键词库
  const jobKeywords = KEYWORD_LIBRARY[jobId] || KEYWORD_LIBRARY["default"];
  
  // 1. 检测技术关键词 - 只提取文本中明确出现的
  const matchedTechnical = jobKeywords.technical.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (DEBUG_MODE) {
    console.log('[Diagnosis] 检测到的技术关键词（仅从文本中提取）:', matchedTechnical);
  }
  
  // 2. 检测软技能关键词
  const matchedSoft = jobKeywords.soft.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (DEBUG_MODE) {
    console.log('[Diagnosis] 检测到的软技能关键词:', matchedSoft);
  }
  
  // 3. 检测项目经历
  const hasProject = /项目|project/i.test(text);
  const projectCount = (text.match(/项目|project/gi) || []).length;
  
  // 4. 检测实习/工作经历
  const hasInternship = /实习|internship|工作经历/i.test(text);
  
  // 5. 检测量化数据
  const hasQuantitative = /\d+%|\d+万|\d+亿|\d+倍|[0-9]+,[0-9]+/i.test(text);
  
  if (DEBUG_MODE) {
    console.log('[Diagnosis] 结构检测: 项目=' + hasProject + ', 实习=' + hasInternship + ', 量化=' + hasQuantitative);
    console.log('[Diagnosis] ==========================================');
  }
  
  return {
    matchedTechnical,
    matchedSoft,
    hasProject,
    projectCount,
    hasInternship,
    hasQuantitative,
    jobKeywords
  };
}

// 主诊断函数（修正版）
export function diagnoseResume(request: DiagnosisRequest): DiagnosisResult {
  const { resumeText, jobId, jobRequirements } = request;
  
  // 第一步：提取文本事实
  const textFacts = extractTextFactsDiagnosis(resumeText, jobId);
  
  // 第二步：计算关键词匹配率（基于事实）
  const keywordMatchRate = calculateKeywordMatchRateBasedOnFacts(resumeText, jobRequirements, textFacts);
  
  // 第三步：生成亮点分析（基于事实）
  const strengths = generateStrengthsBasedOnFacts(resumeText, textFacts);
  
  // 第四步：生成缺失项预警（基于事实）
  const gaps = generateGapsBasedOnFacts(resumeText, textFacts, jobRequirements);
  
  // 第五步：生成AI优化建议（区分事实与建议）
  const suggestions = generateSuggestionsBasedOnFacts(gaps, keywordMatchRate, textFacts);
  
  // 第六步：计算综合评分
  const overallScore = calculateOverallScore(keywordMatchRate, strengths.length, gaps.length);
  
  // 第七步：获取评级
  const grade = getGrade(overallScore);
  
  if (DEBUG_MODE) {
    console.log('[Diagnosis] ========== 诊断结果 ==========');
    console.log('[Diagnosis] 综合评分:', overallScore);
    console.log('[Diagnosis] 评级:', grade);
    console.log('[Diagnosis] 亮点数量:', strengths.length);
    console.log('[Diagnosis] 缺失项数量:', gaps.length);
    console.log('[Diagnosis] =============================');
  }
  
  return {
    overallScore,
    grade,
    strengths,
    gaps,
    suggestions,
    keywordMatchRate
  };
}

// 基于事实计算关键词匹配率
function calculateKeywordMatchRateBasedOnFacts(resumeText: string, jobRequirements: string[], textFacts: any): number {
  if (jobRequirements.length === 0) return 0;
  
  const matchedKeywords = jobRequirements.filter(req => 
    resumeText.toLowerCase().includes(req.toLowerCase())
  );
  
  const rate = Math.round((matchedKeywords.length / jobRequirements.length) * 100);
  
  if (DEBUG_MODE) {
    console.log('[Diagnosis] 关键词匹配率:', rate + '%', '(匹配:' + matchedKeywords.length + '/' + jobRequirements.length + ')');
  }
  
  return rate;
}

// 基于事实生成亮点分析 - 不虚构亮点
function generateStrengthsBasedOnFacts(resumeText: string, textFacts: any): any[] {
  const strengths: any[] = [];
  let id = 1;
  
  // 1. 技术关键词亮点 - 仅当检测到时才添加
  textFacts.matchedTechnical.forEach((keyword: string) => {
    // 查找关键词在简历中的真实上下文
    const index = resumeText.toLowerCase().indexOf(keyword.toLowerCase());
    const start = Math.max(0, index - 20);
    const end = Math.min(resumeText.length, index + keyword.length + 20);
    const context = resumeText.substring(start, end);
    
    strengths.push({
      id: `strength-${id++}`,
      keyword,
      context: `...${context}...`,
      relevanceScore: 90,
      evidence: `原文依据：简历中包含"${keyword}"关键词` // 新增：提供证据
    });
  });
  
  // 2. 软技能关键词亮点
  textFacts.matchedSoft.forEach((keyword: string) => {
    const index = resumeText.toLowerCase().indexOf(keyword.toLowerCase());
    const start = Math.max(0, index - 20);
    const end = Math.min(resumeText.length, index + keyword.length + 20);
    const context = resumeText.substring(start, end);
    
    strengths.push({
      id: `strength-${id++}`,
      keyword,
      context: `...${context}...`,
      relevanceScore: 75,
      evidence: `原文依据：简历中包含"${keyword}"关键词`
    });
  });
  
  // 3. 如果没有检测到任何亮点，不强行列举虚假亮点
  if (strengths.length === 0) {
    strengths.push({
      id: `strength-${id++}`,
      keyword: '简历内容较少',
      context: resumeText.substring(0, 100),
      relevanceScore: 30,
      evidence: `原文依据：简历文本长度仅${resumeText.length}字符，未检测到明显亮点`
    });
  }
  
  if (DEBUG_MODE) {
    console.log('[Diagnosis] 亮点分析（基于事实）:', strengths.length, '个亮点');
  }
  
  return strengths.slice(0, 5);
}

// 基于事实生成缺失项预警 - 不虚构缺失项
function generateGapsBasedOnFacts(resumeText: string, textFacts: any, jobRequirements: string[]): any[] {
  const gaps: any[] = [];
  let id = 1;
  
  // 1. 检查技术要求中的缺失项（事实：jobRequirements中要求但简历中未出现）
  const missingTechnical = jobRequirements.filter(req => 
    !resumeText.toLowerCase().includes(req.toLowerCase())
  );
  
  missingTechnical.forEach(keyword => {
    gaps.push({
      id: `gap-${id++}`,
      keyword,
      importance: "high" as const,
      reason: `该岗位要求熟悉 ${keyword}，你的简历中未体现`,
      suggestion: `【建议】如果你有${keyword}经验，建议在技能或项目经历中补充关于"${keyword}"的描述`,
      evidence: `事实：岗位JD中包含"${keyword}"，但简历中未出现该关键词`
    });
  });
  
  // 2. 检查关键词库中的缺失项（仅作建议，不强制）
  textFacts.jobKeywords.technical.forEach((keyword: string) => {
    if (!resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      gaps.push({
        id: `gap-${id++}`,
        keyword,
        importance: "medium" as const,
        reason: `${keyword} 是该岗位常用的技术栈`,
        suggestion: `【建议】如果你有${keyword}经验，建议在简历中突出展示。如果沒有，可以考虑学习相关技术`,
        evidence: `事实：简历中未出现"${keyword}"关键词（该技术栈在岗位关键词库中）`
      });
    }
  });
  
  if (DEBUG_MODE) {
    console.log('[Diagnosis] 缺失项预警（基于事实）:', gaps.length, '个缺失项');
  }
  
  return gaps.slice(0, 5);
}

// 基于事实生成AI优化建议 - 明确区分事实与建议
function generateSuggestionsBasedOnFacts(gaps: any[], matchRate: number, textFacts: any): any[] {
  const suggestions = [];
  let id = 1;
  
  if (matchRate < 60) {
    suggestions.push({
      id: `suggestion-${id++}`,
      title: "【建议】补充关键技能关键词",
      description: "你的简历中缺少多个岗位要求的关键技能。【建议】在'技能清单'或'项目经历'中补充这些技能的描述",
      impact: "预计提升匹配度 15-20%",
      priority: "high" as const,
      note: "注意：以上为建议内容，请根据你的实际情况补充，不要虚构经历"
    });
  }
  
  if (gaps.length > 3) {
    suggestions.push({
      id: `suggestion-${id++}`,
      title: "【建议】增加项目经历描述",
      description: "【建议】如果你有项目经验，建议在项目经历中详细描述你如何使用这些技术解决问题。如果沒有项目经验，建议先做一些练手项目",
      impact: "预计提升匹配度 10-15%",
      priority: "high" as const,
      note: "注意：以上为建议内容，请根据你的实际情况补充"
    });
  }
  
  suggestions.push({
    id: `suggestion-${id++}`,
    title: "【建议】量化项目成果",
    description: "【建议】在项目经历中加入数据指标，如'提升性能30%'、'服务10万用户'等。如果无法量化，可以描述规模、影响范围等",
    impact: "预计提升简历吸引力 20%",
    priority: "medium" as const,
    note: "注意：以上为建议模板，请替换为你的真实数据"
  });
  
  if (DEBUG_MODE) {
    console.log('[Diagnosis] AI优化建议（区分事实与建议）:', suggestions.length, '条建议');
  }
  
  return suggestions;
}

// 计算综合评分
function calculateOverallScore(
  keywordMatchRate: number,
  strengthsCount: number,
  gapsCount: number
): number {
  // 基础分：关键词匹配率
  let score = keywordMatchRate * 0.6;
  
  // 亮点加分：每个亮点加5分
  score += Math.min(strengthsCount * 5, 20);
  
  // 缺失项减分：每个缺失项减3分
  score -= Math.min(gapsCount * 3, 20);
  
  // 确保在0-100范围内
  return Math.max(0, Math.min(100, Math.round(score)));
}

// 获取评级
function getGrade(score: number): string {
  if (score >= 85) return "极具竞争力";
  if (score >= 70) return "值得投递";
  if (score >= 50) return "需要优化";
  return "不匹配";
}
