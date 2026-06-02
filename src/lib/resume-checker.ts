// AI简历智能诊断算法库（修正版）
// 核心原则：100%忠实于用户原始文本，禁止凭空生成经历或技能

import { ResumeDiagnosisReport, ResumeCheckerRequest, CompetitivenessScore, RadarChartData, StrengthAnalysis, RiskPoint, ModificationGuidance } from '@/types/resume-checker';
import { checkStarPrinciple, checkQuantitativeData, checkCriticalGaps } from './star-validator';
import { analyzeResume, ResumeAnalysisReport as NewResumeAnalysisReport } from './resume-analyzer';

// 调试模式 - 开发阶段开启，生产环境关闭
const DEBUG_MODE = true;

// 使用新的高精度分析引擎
let USE_NEW_ANALYZER = true; // 设置为 true 以使用新的分析引擎

// ==================== 工具函数 ====================

/**
 * 转义正则表达式中的特殊字符
 * @param str - 需要转义的字符串
 * @returns 转义后的字符串，可直接用于正则表达式
 */
function escapeRegExp(str: string): string {
  // 需要转义的特殊字符：\ . * + ? ^ $ { } ( ) [ ] | /
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 严格的文本提取函数 - 只从原始文本中提取，不生成任何虚假内容
function extractTextFacts(resumeText: string): {
  detectedSkills: string[];
  detectedProjects: string[];
  detectedExperiences: string[];
  textLength: number;
  sentenceCount: number;
  hasEducation: boolean;
  hasProjects: boolean;
  hasInternship: boolean;
  hasQuantitativeData: boolean;
  rawText: string;
} {
  const text = resumeText;
  const textLower = text.toLowerCase();
  
  // 调试日志：输出原始文本
  if (DEBUG_MODE) {
    console.log('========== 简历诊断调试信息 ==========');
    console.log('原始文本长度:', text.length);
    console.log('原始文本前500字符:', text.substring(0, 500));
    console.log('-------------------------------------------');
  }
  
  // 1. 检测技能 - ONLY extract skills that EXPLICITLY appear in text
  const skillKeywords = [
    'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'Go', 'C++', 'C#',
    'Spring', 'MySQL', 'Redis', 'MongoDB', 'Docker', 'Kubernetes', 'CI/CD', '微服务', '分布式',
    'HTML', 'CSS', 'Sass', 'Less', 'Webpack', 'Vite', 'Rollup',
    'Git', 'Linux', 'Shell', 'AWS', 'Azure', 'GCP',
    '机器学习', '深度学习', 'TensorFlow', 'PyTorch', '数据分析'
  ];
  
  const detectedSkills = skillKeywords.filter(skill => {
    // 转义技能名中的特殊字符（如 C++ 的 +）
    const escapedSkill = escapeRegExp(skill);
    const regex = new RegExp(escapedSkill, 'i');
    return regex.test(text);
  });
  
  if (DEBUG_MODE) {
    console.log('检测到的技能（仅从文本中提取）:', detectedSkills);
    console.log('技能检测依据：以上技能关键词在原文中明确出现');
  }
  
  // 2. 检测项目经历 - ONLY extract project names/titles that EXPLICITLY appear
  const projectPatterns = [
    /项目[:：]\s*(.+?)(?:\n|$)/gi,
    /项目经历[:：]\s*\n([\s\S]*?)(?=\n\s*\n|$)/gi,
    /(.+?项目)[:：]/gi,
    /\d+\.\s*(.+?)(?:\n|$)/g  // 编号列表可能是项目
  ];
  
  const detectedProjects: string[] = [];
  projectPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const projectName = match[1] || match[0];
      if (projectName && projectName.length > 3 && projectName.length < 100) {
        detectedProjects.push(projectName.trim());
      }
    }
  });
  
  if (DEBUG_MODE) {
    console.log('检测到的项目（仅从文本中提取）:', detectedProjects);
    console.log('项目检测依据：从"项目："、"项目经历："等标题后提取');
  }
  
  // 3. 检测经历 - ONLY extract experiences that EXPLICITLY appear
  const experiencePatterns = [
    /实习[:：]\s*(.+?)(?:\n|$)/gi,
    /工作经历[:：]\s*\n([\s\S]*?)(?=\n\s*\n|$)/gi,
    /(.+公司)\s*[-—]\s*(.+?)(?:\n|$)/gi,
    /(.+实习)\s*[-—]\s*(.+?)(?:\n|$)/gi
  ];
  
  const detectedExperiences: string[] = [];
  experiencePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const exp = match[0];
      if (exp && exp.length > 5 && exp.length < 200) {
        detectedExperiences.push(exp.trim());
      }
    }
  });
  
  if (DEBUG_MODE) {
    console.log('检测到的经历（仅从文本中提取）:', detectedExperiences);
    console.log('经历检测依据：从"实习："、"工作经历："等标题后提取');
  }
  
  // 4. 检测基本结构
  const hasEducation = /教育背景|学历|学校|专业|毕业/i.test(text);
  const hasProjects = /项目|project/i.test(text);
  const hasInternship = /实习|internship|工作经历/i.test(text);
  const hasQuantitativeData = /\d+%|\d+万|\d+亿|\d+倍|[0-9]+,[0-9]+/i.test(text);
  
  const textLength = text.length;
  const sentenceCount = (text.match(/[。！？\n]+/g) || []).length;
  
  if (DEBUG_MODE) {
    console.log('---------- 结构检测结果 ----------');
    console.log('是否有教育背景:', hasEducation, '(依据: 文本中包含"教育背景/学历/学校/专业/毕业")');
    console.log('是否有项目经历:', hasProjects, '(依据: 文本中包含"项目/project")');
    console.log('是否有实习经历:', hasInternship, '(依据: 文本中包含"实习/internship/工作经历")');
    console.log('是否有量化数据:', hasQuantitativeData, '(依据: 文本中包含数字+%/万/亿/倍)');
    console.log('文本长度:', textLength, '字符');
    console.log('句子数量:', sentenceCount, '句');
    console.log('==========================================');
  }
  
  return {
    detectedSkills,
    detectedProjects,
    detectedExperiences,
    textLength,
    sentenceCount,
    hasEducation,
    hasProjects,
    hasInternship,
    hasQuantitativeData,
    rawText: text
  };
}

// 主诊断函数 - 严格基于用户原始文本（修复版：加入阶段感知逻辑）
export function diagnoseResumeDeeply(request: ResumeCheckerRequest): ResumeDiagnosisReport {
  const { resumeText, jobTitle, jobDescription, userGrade, userDegree } = request;
  
  // 调试日志：输出用户阶段信息
  if (DEBUG_MODE) {
    console.log('[CareerStage] ========== 简历诊断（阶段感知版）==========');
    console.log('[CareerStage] 用户输入: grade=', userGrade, ', degree=', userDegree);
  }
  
  // 使用新的高精度分析引擎
  if (USE_NEW_ANALYZER) {
    return diagnoseResumeDeeplyWithNewAnalyzer(request);
  }
  
  // 第一步：提取文本事实（100%忠实于原始文本）
  const textFacts = extractTextFacts(resumeText);
  
  // 调试日志：输出提取结果
  if (DEBUG_MODE) {
    console.log('========== 开始生成诊断报告 ==========');
    console.log('提取的事实:', textFacts);
    console.log('-------------------------------------------');
  }
  
  // 第二步：计算各维度得分（基于提取的事实，不凭空生成）
  const dimensions = calculateDimensionsBasedOnFacts(textFacts, jobTitle);
  
  // 第三步：计算综合评分和评级
  const score = calculateOverallScore(dimensions, jobTitle);
  
  // 第四步：生成雷达图数据
  const radarData = generateRadarData(dimensions, jobTitle);
  
  // 第五步：分析亮点（ONLY based on detected facts）
  const strengths = analyzeStrengthsBasedOnFacts(textFacts, jobTitle, jobDescription);
  
  // 第六步：识别风险点（基于事实缺失，不虚构问题）
  const starResult = checkStarPrinciple(resumeText);
  const quantitativeResult = checkQuantitativeData(resumeText);
  const criticalGaps = jobDescription ? checkCriticalGaps(resumeText, jobDescription) : [];
  const risks = identifyRisksBasedOnFacts(textFacts, starResult, quantitativeResult, criticalGaps);
  
  // 第七步：生成修改指导（区分事实与建议，加入阶段感知）
  const guidance = generateGuidanceBasedOnFacts(textFacts, risks, starResult, quantitativeResult, jobTitle, userGrade, userDegree);
  
  // 第八步：生成总体评价（基于实际得分，不夸大）
  const summary = generateSummaryBasedOnFacts(score, strengths.length, risks.length, textFacts);
  
  // 第九步：下一步建议（加入阶段感知）
  const nextSteps = generateNextSteps(risks, userGrade, userDegree);
  
  return {
    id: `diagnosis_${Date.now()}`,
    timestamp: new Date(),
    score,
    radarData,
    strengths,
    risks,
    guidance,
    summary,
    nextSteps
  };
}

/**
 * 使用新的高精度分析引擎进行诊断
 */
function diagnoseResumeDeeplyWithNewAnalyzer(request: ResumeCheckerRequest): ResumeDiagnosisReport {
  const { resumeText, jobTitle, jobDescription, userGrade, userDegree } = request;
  
  // 使用新的分析引擎
  const analysisResult = analyzeResume(resumeText, jobDescription);
  
  if (DEBUG_MODE) {
    console.log('[NewAnalyzer] ========== 使用新分析引擎 ==========');
    console.log('[NewAnalyzer] 提取的信息:', analysisResult.extractedInfo);
    console.log('[NewAnalyzer] STAR分析:', analysisResult.starAnalysis);
    console.log('[NewAnalyzer] JD匹配:', analysisResult.jdMatch);
    console.log('[NewAnalyzer] 排版分析:', analysisResult.formatAnalysis);
    console.log('[NewAnalyzer] 综合评分:', analysisResult.overallScore);
  }
  
  // 将新的分析结果转换为原有的报告格式
  const score: CompetitivenessScore = {
    overall: analysisResult.overallScore,
    grade: analysisResult.overallScore >= 85 ? '极具竞争力' : 
           analysisResult.overallScore >= 70 ? '潜力股' :
           analysisResult.overallScore >= 55 ? '待优化' : '不匹配',
    gradeColor: analysisResult.overallScore >= 85 ? '#10b981' : 
               analysisResult.overallScore >= 70 ? '#3b82f6' :
               analysisResult.overallScore >= 55 ? '#f59e0b' : '#ef4444',
    dimensions: {
      professionalMatch: analysisResult.extractedInfo.basicInfo.education?.length > 0 ? 80 : 40,
      projectExperience: analysisResult.extractedInfo.experiences.filter(e => e.type === 'project').length > 0 ? 80 : 40,
      skillStack: analysisResult.extractedInfo.skills.length > 5 ? 80 : 40,
      softSkills: 70, // 暂时固定
      quantitativeData: analysisResult.starAnalysis.details.result ? 80 : 40,
      formatting: analysisResult.formatAnalysis.formatScore
    }
  };
  
  // 生成雷达图数据
  const radarData: RadarChartData = {
    labels: ['专业匹配度', '项目经历', '技能栈', '软实力', '量化数据', '排版规范'],
    userValues: [
      score.dimensions.professionalMatch,
      score.dimensions.projectExperience,
      score.dimensions.skillStack,
      score.dimensions.softSkills,
      score.dimensions.quantitativeData,
      score.dimensions.formatting
    ],
    standardValues: [70, 75, 70, 65, 60, 70]
  };
  
  // 分析亮点
  const strengths: StrengthAnalysis[] = [];
  
  if (analysisResult.extractedInfo.skills.length > 0) {
    strengths.push({
      id: 'strength_skills',
      title: '简历中包含技能清单',
      description: `检测到 ${analysisResult.extractedInfo.skills.length} 项技能：${analysisResult.extractedInfo.skills.slice(0, 5).join('、')}`,
      evidence: `原文依据：检测到技能关键词`,
      impact: analysisResult.extractedInfo.skills.length >= 5 ? 'high' : 'medium',
      category: 'skill'
    });
  }
  
  if (analysisResult.extractedInfo.experiences.length > 0) {
    strengths.push({
      id: 'strength_experience',
      title: '简历中包含经历描述',
      description: `检测到 ${analysisResult.extractedInfo.experiences.length} 段经历`,
      evidence: `原文依据：检测到经历章节`,
      impact: 'high',
      category: 'experience'
    });
  }
  
  // 识别风险点
  const risks: RiskPoint[] = [];
  
  if (analysisResult.extractedInfo.experiences.length === 0) {
    risks.push({
      id: 'risk_no_experience',
      title: '未检测到经历',
      description: '简历中未包含任何工作或项目经历',
      severity: 'critical',
      evidence: '事实：未检测到经历章节',
      impact: '缺乏经历会降低竞争力'
    });
  }
  
  if (analysisResult.starAnalysis.starScore < 60) {
    risks.push({
      id: 'risk_star',
      title: 'STAR法则遵循度低',
      description: `STAR法则评分 ${analysisResult.starAnalysis.starScore} 分，缺失：${analysisResult.starAnalysis.missingElements.join('、')}`,
      severity: 'major',
      evidence: '事实：经历描述缺乏STAR结构',
      impact: 'HR无法清晰理解你的贡献'
    });
  }
  
  if (analysisResult.formatAnalysis.issues.length > 0) {
    risks.push({
      id: 'risk_format',
      title: '排版存在问题',
      description: `检测到 ${analysisResult.formatAnalysis.issues.length} 个排版问题`,
      severity: 'minor',
      evidence: '事实：排版分析检测到问题',
      impact: '影响简历可读性'
    });
  }
  
  // 生成修改指导
  const guidance: ModificationGuidance[] = [];
  
  for (const suggestion of analysisResult.suggestions.slice(0, 5)) {
    guidance.push({
      id: `guidance_${guidance.length}`,
      title: '优化建议',
      originalText: '(请查看简历原文)',
      suggestedText: suggestion,
      reason: '基于分析结果生成的优化建议',
      method: '综合',
      expectedImprovement: '预计提升简历质量'
    });
  }
  
  // 生成总体评价
  const summary = `你的简历综合得分 ${analysisResult.overallScore} 分。${
    analysisResult.overallScore >= 70 ? '表现良好。' : '需要优化。'
  } 检测到 ${analysisResult.extractedInfo.skills.length} 项技能，${
    analysisResult.extractedInfo.experiences.length
  } 段经历。`;
  
  // 生成下一步建议
  const nextSteps = analysisResult.suggestions.slice(0, 5);
  
  return {
    id: `diagnosis_${Date.now()}`,
    timestamp: new Date(),
    score,
    radarData,
    strengths,
    risks,
    guidance,
    summary,
    nextSteps
  };
}

// 基于事实计算维度得分
function calculateDimensionsBasedOnFacts(textFacts: any, jobTitle?: string) {
  const { detectedSkills, hasEducation, hasProjects, hasInternship, hasQuantitativeData, textLength, sentenceCount } = textFacts;
  
  // 1. 专业匹配度 - 基于实际检测到的内容
  let professionalMatch = 30; // 基础分（内容存在即有分）
  if (hasEducation) professionalMatch += 20;
  if (hasProjects) professionalMatch += 15;
  if (hasInternship) professionalMatch += 15;
  if (jobTitle && detectedSkills.length > 0) {
    // 只有明确检测到与岗位相关的技能才加分
    const jobLower = jobTitle.toLowerCase();
    if (jobLower.includes('前端') && detectedSkills.some(s => ['React', 'Vue', 'Angular', 'TypeScript', 'JavaScript'].includes(s))) {
      professionalMatch += 20;
    }
    if (jobLower.includes('后端') && detectedSkills.some(s => ['Java', 'Python', 'Node.js', 'Go', 'Spring'].includes(s))) {
      professionalMatch += 20;
    }
  }
  professionalMatch = Math.min(professionalMatch, 100);
  
  // 2. 项目经历 - 基于实际项目数量
  let projectExperience = 20;
  const projectCount = textFacts.detectedProjects.length;
  if (projectCount >= 3) projectExperience += 30;
  else if (projectCount >= 2) projectExperience += 20;
  else if (projectCount >= 1) projectExperience += 10;
  else if (!hasProjects) projectExperience = 10; // 未检测到项目经历，分数很低
  projectExperience = Math.min(projectExperience, 100);
  
  // 3. 技能栈 - 基于实际检测到的技能数量
  let skillStack = 20;
  skillStack += Math.min(detectedSkills.length * 8, 60); // 每个技能8分，最多60分
  if (detectedSkills.length === 0) skillStack = 15; // 未检测到技能，分数很低
  skillStack = Math.min(skillStack, 100);
  
  // 4. 软实力 - 基于文本中是否包含软技能关键词
  const softKeywords = ['沟通', '协作', '领导力', '解决问题', '创新', '抗压', '学习能力强', '自驱', '责任心', '团队合作', '项目管理'];
  const matchedSoft = softKeywords.filter(kw => textFacts.rawText.includes(kw));
  let softSkills = 30;
  softSkills += Math.min(matchedSoft.length * 10, 50);
  if (matchedSoft.length === 0) softSkills = 25; // 未检测到软技能描述
  softSkills = Math.min(softSkills, 100);
  
  // 5. 量化数据 - 基于实际检测到的量化指标
  let quantitativeData = 10;
  if (hasQuantitativeData) quantitativeData += 40;
  const numbers = textFacts.rawText.match(/\d+/g) || [];
  if (numbers.length >= 10) quantitativeData += 30;
  else if (numbers.length >= 5) quantitativeData += 20;
  else if (numbers.length >= 2) quantitativeData += 10;
  if (!hasQuantitativeData) quantitativeData = 15; // 未检测到量化数据，分数很低
  quantitativeData = Math.min(quantitativeData, 100);
  
  // 6. 排版规范 - 基于文本长度和句子数量
  let formatting = 40;
  if (textLength >= 1000) formatting += 20;
  else if (textLength >= 500) formatting += 10;
  else formatting -= 20; // 内容太少
  
  if (sentenceCount >= 15) formatting += 20;
  else if (sentenceCount >= 10) formatting += 10;
  else formatting -= 15; // 句子太少
  
  formatting = Math.max(Math.min(formatting, 100), 0);
  
  if (DEBUG_MODE) {
    console.log('---------- 维度得分计算（基于事实） ----------');
    console.log('专业匹配度:', professionalMatch, '(依据: 教育=' + hasEducation + ', 项目=' + hasProjects + ', 实习=' + hasInternship + ')');
    console.log('项目经历:', projectExperience, '(依据: 检测到' + projectCount + '个项目)');
    console.log('技能栈:', skillStack, '(依据: 检测到' + detectedSkills.length + '个技能)');
    console.log('软实力:', softSkills, '(依据: 检测到' + matchedSoft.length + '个软技能关键词)');
    console.log('量化数据:', quantitativeData, '(依据: hasQuantitative=' + hasQuantitativeData + ', 数字数量=' + numbers.length + ')');
    console.log('排版规范:', formatting, '(依据: 文本长度=' + textLength + ', 句子数=' + sentenceCount + ')');
    console.log('==========================================');
  }
  
  return {
    professionalMatch,
    projectExperience,
    skillStack,
    softSkills,
    quantitativeData,
    formatting
  };
}

// 计算综合评分
function calculateOverallScore(dimensions: any, jobTitle?: string): CompetitivenessScore {
  const weights = {
    professionalMatch: 0.20,
    projectExperience: 0.25,
    skillStack: 0.20,
    softSkills: 0.15,
    quantitativeData: 0.10,
    formatting: 0.10
  };
  
  const overall = Math.round(
    dimensions.professionalMatch * weights.professionalMatch +
    dimensions.projectExperience * weights.projectExperience +
    dimensions.skillStack * weights.skillStack +
    dimensions.softSkills * weights.softSkills +
    dimensions.quantitativeData * weights.quantitativeData +
    dimensions.formatting * weights.formatting
  );
  
  let grade: '潜力股' | '极具竞争力' | '待优化' | '不匹配';
  let gradeColor: string;
  
  if (overall >= 85) {
    grade = '极具竞争力';
    gradeColor = '#10b981';
  } else if (overall >= 70) {
    grade = '潜力股';
    gradeColor = '#3b82f6';
  } else if (overall >= 55) {
    grade = '待优化';
    gradeColor = '#f59e0b';
  } else {
    grade = '不匹配';
    gradeColor = '#ef4444';
  }
  
  return {
    overall,
    grade,
    gradeColor,
    dimensions
  };
}

// 生成雷达图数据
function generateRadarData(dimensions: any, jobTitle?: string): RadarChartData {
  const labels = ['专业匹配度', '项目经历', '技能栈', '软实力', '量化数据', '排版规范'];
  
  const userValues = [
    dimensions.professionalMatch,
    dimensions.projectExperience,
    dimensions.skillStack,
    dimensions.softSkills,
    dimensions.quantitativeData,
    dimensions.formatting
  ];
  
  let standardValues = [70, 75, 70, 65, 60, 70];
  
  if (jobTitle) {
    const jobLower = jobTitle.toLowerCase();
    if (jobLower.includes('前端')) {
      standardValues = [75, 80, 85, 65, 70, 75];
    } else if (jobLower.includes('后端')) {
      standardValues = [75, 80, 85, 65, 70, 75];
    } else if (jobLower.includes('算法')) {
      standardValues = [85, 75, 80, 70, 75, 70];
    }
  }
  
  return {
    labels,
    userValues,
    standardValues
  };
}

// 基于事实分析亮点 - 不虚构任何亮点
function analyzeStrengthsBasedOnFacts(textFacts: any, jobTitle?: string, jobDescription?: string): StrengthAnalysis[] {
  const strengths: StrengthAnalysis[] = [];
  const { detectedSkills, hasProjects, hasInternship, hasQuantitativeData, rawText } = textFacts;
  
  // 1. 技术亮点 - 仅当明确检测到技术关键词时才提及
  if (detectedSkills.length > 0) {
    const skillEvidence = detectedSkills.slice(0, 3).join('、');
    strengths.push({
      id: 'strength_1',
      title: '简历中提及技术技能',
      description: `在你的简历中检测到以下技术关键词：${skillEvidence}。${detectedSkills.length > 3 ? '等' : ''}这些技能在求职时可能会被关注。`,
      evidence: `原文依据：检测到"${skillEvidence}"等关键词`,
      impact: detectedSkills.length >= 3 ? 'high' : 'medium',
      category: 'skill'
    });
  }
  
  // 2. 项目经历亮点 - 仅当明确检测到项目时才提及
  if (hasProjects && textFacts.detectedProjects.length > 0) {
    const projectEvidence = textFacts.detectedProjects.slice(0, 2).join('、');
    strengths.push({
      id: 'strength_2',
      title: '简历中包含项目经历',
      description: `检测到项目经历描述，如"${projectEvidence}"。有项目经历可以展示实际操作能力。`,
      evidence: `原文依据：检测到"项目"关键词及"${projectEvidence}"等内容`,
      impact: 'high',
      category: 'project'
    });
  }
  
  // 3. 量化数据亮点 - 仅当明确检测到量化数据时才提及
  if (hasQuantitativeData) {
    strengths.push({
      id: 'strength_3',
      title: '简历中包含量化描述',
      description: '检测到简历中有数字、百分比等量化描述，这可以让成果更具体。',
      evidence: '原文依据：检测到数字、%/万/亿等量化指标',
      impact: 'high',
      category: 'achievement'
    });
  }
  
  // 4. 教育背景亮点 - 仅当明确检测到教育信息时提及
  if (textFacts.hasEducation) {
    const educationKeywords = rawText.match(/(985|211|硕士|博士|本科|大专)/gi);
    const educationEvidence = educationKeywords ? educationKeywords.slice(0, 2).join('、') : '教育背景';
    strengths.push({
      id: 'strength_4',
      title: '简历中包含教育背景',
      description: '检测到教育背景信息，这是求职的基本要求。',
      evidence: `原文依据：检测到"${educationEvidence}"等教育相关信息`,
      impact: 'medium',
      category: 'education'
    });
  }
  
  // 5. 实习经历亮点 - 仅当明确检测到实习时才提及
  if (hasInternship) {
    strengths.push({
      id: 'strength_5',
      title: '简历中包含实习/工作经历',
      description: '检测到实习或工作经历描述，实际工作经验是求职的重要加分项。',
      evidence: '原文依据：检测到"实习"或"工作经历"关键词',
      impact: 'high',
      category: 'experience'
    });
  }
  
  // 重要：如果没有检测到任何亮点，不强行列举虚假亮点
  if (strengths.length === 0) {
    strengths.push({
      id: 'strength_empty',
      title: '简历内容较为简单',
      description: '当前简历内容较少，未检测到明显的亮点。建议补充项目经历、技能描述等内容。',
      evidence: '原文依据：简历文本长度仅' + rawText.length + '字符，缺乏关键章节',
      impact: 'low',
      category: 'skill'
    });
  }
  
  if (DEBUG_MODE) {
    console.log('---------- 亮点分析（基于事实） ----------');
    console.log('检测到', strengths.length, '个亮点');
    strengths.forEach(s => console.log('- ' + s.title + ' (依据: ' + s.evidence + ')'));
    console.log('==========================================');
  }
  
  return strengths.slice(0, 5);
}

// 基于事实识别风险 - 不虚构风险
function identifyRisksBasedOnFacts(
  textFacts: any, 
  starResult: any, 
  quantitativeResult: any, 
  criticalGaps: any[]
): RiskPoint[] {
  const risks: RiskPoint[] = [];
  const { hasProjects, hasInternship, hasQuantitativeData, textLength, sentenceCount, detectedSkills, rawText } = textFacts;
  
  // 1. 内容过少风险（事实：文本太短）
  if (textLength < 500 || sentenceCount < 10) {
    risks.push({
      id: 'risk_1',
      title: '简历内容过少',
      description: `你的简历目前仅有${textLength}字符、${sentenceCount}个句子，内容偏少。HR可能无法充分了解你的能力。`,
      severity: 'critical',
      evidence: `事实：简历文本长度=${textLength}字符，句子数=${sentenceCount}句`,
      impact: 'HR平均6秒扫描一份简历，内容过少会直接被跳过'
    });
  }
  
  // 2. 缺乏项目经历风险（事实：未检测到项目）
  if (!hasProjects) {
    risks.push({
      id: 'risk_2',
      title: '未检测到项目经历',
      description: '简历中未提及"项目"相关内容。项目经历是展示技术能力的重要部分。',
      severity: 'major',
      evidence: '事实：简历文本中未出现"项目"或"project"关键词',
      impact: '缺乏项目经历会让HR质疑你的实际开发能力'
    });
  }
  
  // 3. 缺乏技能描述风险（事实：未检测到技能关键词）
  if (detectedSkills.length === 0) {
    risks.push({
      id: 'risk_3',
      title: '未检测到具体技能',
      description: '简历中未提及具体的技术技能（如编程语言、框架等）。HR无法快速判断你的技术栈。',
      severity: 'major',
      evidence: '事实：简历文本中未出现常见技术关键词（React、Python、Java等）',
      impact: '缺乏技能列表会降低简历通过初筛的概率'
    });
  }
  
  // 4. 缺乏量化数据风险（事实：未检测到数字/百分比）
  if (!hasQuantitativeData) {
    risks.push({
      id: 'risk_4',
      title: '未检测到量化成果',
      description: '简历中缺乏数字、百分比等量化描述。量化成果可以让你的贡献更具体、更有说服力。',
      severity: 'major',
      evidence: '事实：简历文本中未出现数字+%、万、亿等量化指标',
      impact: '缺乏量化数据会降低HR对你贡献价值的判断'
    });
  }
  
  // 5. 缺乏实习/工作经历风险（事实：未检测到工作经验）
  if (!hasInternship && textLength > 200) {
    risks.push({
      id: 'risk_5',
      title: '未检测到实习/工作经历',
      description: '简历中未提及实习或工作经历。对于应届生，实习经历很重要；对于社招，工作经历是必需。',
      severity: 'major',
      evidence: '事实：简历文本中未出现"实习"或"工作经历"关键词',
      impact: '缺乏工作经验描述会降低你的竞争力'
    });
  }
  
  // 6. STAR法则缺失风险（如果项目存在但缺乏STAR结构）
  if (hasProjects && starResult.starScore < 50) {
    risks.push({
      id: 'risk_star',
      title: '项目描述缺乏STAR结构',
      description: `你的项目描述缺乏完整的STAR结构（情境-任务-行动-结果），评分${starResult.starScore}分。缺失：${starResult.missingElements.join('、')}。`,
      severity: 'critical',
      evidence: `事实：项目描述中未完整包含"背景/目标/行动/结果"等要素`,
      impact: 'HR无法清晰理解你的项目贡献，降低面试邀约率'
    });
  }
  
  // 7. 致命缺失项（岗位JD要求但简历中完全没有）
  criticalGaps.forEach((gap, index) => {
    risks.push({
      id: `risk_critical_${index}`,
      title: `缺失岗位关键要求：${gap.keyword}`,
      description: gap.reason,
      severity: gap.importance === 'critical' ? 'critical' : 'major',
      evidence: `事实：岗位JD中包含"${gap.keyword}"，但简历中未出现该关键词`,
      impact: `岗位JD明确要求，缺失将直接导致初筛不通过`
    });
  });
  
  if (DEBUG_MODE) {
    console.log('---------- 风险识别（基于事实） ----------');
    console.log('检测到', risks.length, '个风险点');
    risks.forEach(r => console.log('- ' + r.title + ' (依据: ' + r.evidence + ')'));
    console.log('==========================================');
  }
  
  return risks.slice(0, 8);
}

// 基于事实生成修改指导 - 明确区分事实与建议（修复版：加入阶段感知）
function generateGuidanceBasedOnFacts(
  textFacts: any,
  risks: RiskPoint[],
  starResult: any,
  quantitativeResult: any,
  jobTitle?: string,
  userGrade?: string,
  userDegree?: string
): ModificationGuidance[] {
  const guidance: ModificationGuidance[] = [];
  const { rawText, detectedSkills, hasProjects, hasQuantitativeData } = textFacts;
  
  // 调试日志：输出阶段信息
  if (DEBUG_MODE && userGrade && userDegree) {
    console.log('[CareerStage] 生成修改指导（阶段感知）: grade=', userGrade, ', degree=', userDegree);
  }
  
  // 1. 如果缺乏项目经历，给出建议（明确标注"建议"，并根据阶段调整）
  if (!hasProjects) {
    let suggestedText = '【建议】如果你有项目经验，建议在简历中添加"项目经历"章节，描述2-3个项目，每个项目包含：项目背景、你的角色、使用的技术、项目成果（用数字描述）';
    
    // 根据阶段调整建议
    if (userGrade === '大一' || userGrade === '大二') {
      suggestedText = '【建议】可以做一些课程项目或自学项目来积累经验。不需要急于实习，当前重点是打好基础。建议做一些小项目，如：课程设计、编程作业、自学练手项目等';
    } else if (userGrade === '大三' || userGrade === '大四') {
      suggestedText = '【建议】现在是找实习的黄金窗口期！建议尽快完善简历，投递大厂的日常实习岗位积累实战经验。同时补充2-3个项目经历到简历中';
    } else if (userDegree === 'master' || userDegree === 'phd') {
      suggestedText = '【建议】建议深化科研项目经历，突出技术难度、创新点和学术价值。如果是博士生，建议准备顶会论文发表';
    }
    
    guidance.push({
      id: 'guidance_1',
      title: '建议补充项目经历',
      originalText: '（你的简历中未提及项目经历）',
      suggestedText,
      reason: '项目经历是展示技术能力的关键。如果你确实没有项目经验，建议先做一些练手项目。',
      method: '结构',
      expectedImprovement: '预计提升简历完整度40%'
    });
  }
  
  // 2. 如果缺乏量化数据，给出建议
  if (!hasQuantitativeData) {
    const exampleSentence = extractFirstSentence(rawText);
    let suggestedText = '【建议】如果你的项目/工作有可量化的成果，建议补充数字。例如："优化接口性能，响应时间从500ms降低到200ms（提升60%）"';
    
    // 根据阶段调整建议
    if (userDegree === 'phd') {
      suggestedText = '【建议】顶会论文和科研项目建议添加量化数据，如：引用数、影响因子、项目经费、合作机构数量等。例如："发表顶会论文X篇，总引用数Y次，影响因子Z"';
    } else if (userDegree === 'master') {
      suggestedText = '【建议】科研项目建议添加量化数据，如：论文数量、项目参与度、实验结果提升等。例如："参与X个科研项目，发表Y篇论文，实验准确率提升Z%"';
    }
    
    guidance.push({
      id: 'guidance_2',
      title: '建议添加量化数据',
      originalText: exampleSentence || '（你的简历中缺乏量化描述）',
      suggestedText,
      reason: '量化数据让HR直观了解你的贡献价值。如果你的经历确实无法量化，可以用"服务X用户"、"支持X并发"等方式描述规模。',
      method: '量化',
      expectedImprovement: '预计提升HR好感度35%'
    });
  }
  
  // 3. 如果缺乏技能列表，给出建议
  if (detectedSkills.length === 0) {
    let suggestedText = '【建议】在简历中添加"技能清单"章节，列出你掌握的技术，如：编程语言（Python、Java）、框架（React、Spring）、工具（Git、Docker）等';
    
    // 根据阶段调整建议
    if (userGrade === '大一' || userGrade === '大二') {
      suggestedText = '【建议】建议打好基础，学习一门编程语言（如Python、Java、C++）。不需要急于掌握太多框架，先把基础打牢';
    }
    
    guidance.push({
      id: 'guidance_3',
      title: '建议列出技术技能',
      originalText: '（你的简历中未提及具体技术技能）',
      suggestedText,
      reason: 'HR快速筛选简历时会关注技能关键词是否匹配岗位要求。',
      method: '关键词',
      expectedImprovement: '预计提升初筛通过率30%'
    });
  }
  
  // 4. 如果项目存在但缺乏STAR，给出改进建议
  if (hasProjects && starResult.starScore < 75) {
    const projectSentence = extractFirstProjectSentence(rawText);
    guidance.push({
      id: 'guidance_star',
      title: '建议用STAR法则重构项目描述',
      originalText: projectSentence || '（你的项目描述）',
      suggestedText: '【建议】按照STAR法则重新描述项目：Situation（项目背景）- Task（你的任务）- Action（你采取的行动）- Result（可量化的结果）。例如："在用户增长停滞的背景下（S），我负责优化注册流程（T），通过简化表单和添加社交登录（A），使注册转化率提升40%（R）"',
      reason: 'STAR法则是描述项目经历的标准框架，能让HR清晰理解你的贡献。',
      method: 'STAR',
      expectedImprovement: '预计提升面试邀约率45%'
    });
  }
  
  // 5. 如果内容过少，给出扩充建议
  if (rawText.length < 800) {
    let suggestedText = '【建议】扩充简历到800-1200字。建议结构：1.个人信息 2.教育背景（学校、专业、相关课程） 3.技能清单 4.项目经历（2-3个，每个3-5句话） 5.实习/工作经历 6.获奖情况（如有）';
    
    // 根据阶段调整建议
    if (userGrade === '大一' || userGrade === '大二') {
      suggestedText = '【建议】可以丰富简历内容，如：加入的社团、参加的活动、自学的技术、课程项目等。不需要急于实习，可以写一些校园经历';
    }
    
    guidance.push({
      id: 'guidance_content',
      title: '建议扩充简历内容',
      originalText: '（你的简历内容较少）',
      suggestedText,
      reason: '内容过少会让HR认为你缺乏经验或不够认真。',
      method: '结构',
      expectedImprovement: '预计提升HR阅读体验50%'
    });
  }
  
  if (DEBUG_MODE) {
    console.log('---------- 修改建议（区分事实与建议，阶段感知） ----------');
    console.log('生成', guidance.length, '条修改建议');
    guidance.forEach(g => console.log('- ' + g.title + '\n  原文: ' + g.originalText + '\n  建议: ' + g.suggestedText));
    console.log('==========================================');
    console.log('========== 诊断报告生成完成 ==========');
  }
  
  return guidance.slice(0, 8);
}

// 辅助函数：提取第一句话（用于示例）
function extractFirstSentence(text: string): string | null {
  const sentences = text.split(/[。！？\n]+/);
  const firstSentence = sentences.find(s => s.trim().length > 10);
  return firstSentence ? firstSentence.trim() : null;
}

// 辅助函数：提取第一个项目描述句子
function extractFirstProjectSentence(text: string): string | null {
  const projectMatch = text.match(/(项目|project)[:：]?\s*([^\n]+)/i);
  if (projectMatch) return projectMatch[0];
  
  const sentences = text.split(/[。！？\n]+/);
  const projectSentence = sentences.find(s => s.includes('项目') || s.includes('负责') || s.includes('开发'));
  return projectSentence ? projectSentence.trim() : null;
}

// 基于事实生成总体评价
function generateSummaryBasedOnFacts(score: CompetitivenessScore, strengthCount: number, riskCount: number, textFacts: any): string {
  const { textLength, detectedSkills, hasProjects, hasInternship } = textFacts;
  
  if (score.overall >= 85) {
    return `你的简历综合得分${score.overall}分，表现优秀。检测到${detectedSkills.length}项技能、${hasProjects ? '有项目经历' : '无项目经历'}、${hasInternship ? '有实习经历' : '无实习经历'}。`;
  } else if (score.overall >= 70) {
    return `你的简历综合得分${score.overall}分，有潜力。但检测到简历中${!hasProjects ? '缺乏项目经历' : ''}${!hasProjects && !hasInternship ? '、' : ''}${!hasInternship ? '缺乏实习经历' : ''}。建议补充后再次诊断。`;
  } else if (score.overall >= 55) {
    return `你的简历综合得分${score.overall}分，需要优化。简历内容较少（${textLength}字符），建议参考AI指导认真修改后再投递。`;
  } else {
    return `你的简历综合得分${score.overall}分，与岗位要求差距较大。简历内容过于简单，建议重新梳理经历并补充详细信息。`;
  }
}

// 生成下一步建议（修复版：加入阶段感知逻辑）
function generateNextSteps(risks: RiskPoint[], userGrade?: string, userDegree?: string): string[] {
  const steps: string[] = [];
  
  // 导入阶段感知工具（动态导入避免循环依赖）
  // 注意：这里使用require而不是import，因为函数在模块内部
  let stageAwareAdvice = '';
  
  // 如果有用户阶段信息，生成阶段感知的建议
  if (userGrade && userDegree) {
    // 根据阶段生成不同的建议
    if (userGrade === '大一' || userGrade === '大二') {
      // 大一/大二：探索期 - 不应该建议实习
      if (risks.some(r => r.id === 'risk_2' || r.title.includes('项目'))) {
        steps.push('【建议】可以做一些课程项目或自学项目，不需要急于实习');
      }
      if (risks.some(r => r.id === 'risk_3' || r.title.includes('技能'))) {
        steps.push('【建议】打好基础，学习一门编程语言（如Python、Java）');
      }
      steps.push('【建议】参加社团活动，提升软技能');
      steps.push('【建议】利用寒暑假参加社会实践或志愿服务');
    } else if (userGrade === '大三' || userGrade === '大四') {
      // 大三/大四：实战期 - 应该建议实习和求职准备
      if (risks.some(r => r.id === 'risk_4' || r.title.includes('量化'))) {
        steps.push('【建议】为项目/工作经历添加量化数据（数字、百分比）');
      }
      if (risks.some(r => r.id === 'risk_2' || r.title.includes('项目'))) {
        steps.push('【建议】补充2-3个项目经历，每个项目3-5句话');
      }
      if (risks.some(r => r.id === 'risk_3' || r.title.includes('技能'))) {
        steps.push('【建议】在简历中明确列出技术技能清单');
      }
      if (risks.some(r => r.id === 'risk_5' || r.title.includes('实习'))) {
        steps.push('【建议】补充实习经历描述，现在是大三/大四找实习的黄金期');
      }
      steps.push('【建议】刷算法题，准备秋招/春招面试');
      steps.push('【建议】完善简历后，积极投递大厂日常实习岗位');
    } else if (userDegree === 'master') {
      // 硕士：深化期 - 应该建议科研和专家岗准备
      if (risks.some(r => r.id === 'risk_4' || r.title.includes('量化'))) {
        steps.push('【建议】为科研项目/论文添加量化数据（引用数、影响力等）');
      }
      if (risks.some(r => r.id === 'risk_2' || r.title.includes('项目'))) {
        steps.push('【建议】补充深度科研项目经历，突出技术难度和创新点');
      }
      steps.push('【建议】准备专家岗/校招SP offer冲刺，提升技术深度');
      steps.push('【建议】可以申请研究型实习（Research Intern）');
    } else if (userDegree === 'phd') {
      // 博士：专家期 - 应该建议顶会论文和产业合作
      if (risks.some(r => r.id === 'risk_4' || r.title.includes('量化'))) {
        steps.push('【建议】为顶会论文/科研项目添加量化数据（引用、影响力）');
      }
      steps.push('【建议】您的学术研究能力很强，但建议补充工业界落地项目经验');
      steps.push('【建议】可以考虑申请研究型实习（Research Intern）或产学研合作');
      steps.push('【建议】准备顶会论文发表，提升学术影响力');
    } else {
      // 其他情况：通用建议（兜底）
      if (risks.some(r => r.id === 'risk_4' || r.title.includes('量化'))) {
        steps.push('【建议】为项目/工作经历添加量化数据（数字、百分比）');
      }
      if (risks.some(r => r.id === 'risk_2' || r.title.includes('项目'))) {
        steps.push('【建议】补充2-3个项目经历，每个项目3-5句话');
      }
      if (risks.some(r => r.id === 'risk_3' || r.title.includes('技能'))) {
        steps.push('【建议】在简历中明确列出技术技能清单');
      }
      if (risks.some(r => r.id === 'risk_5' || r.title.includes('实习'))) {
        steps.push('【建议】补充实习/工作经历描述');
      }
    }
  } else {
    // 如果没有用户阶段信息，使用通用建议（但避免低龄化建议）
    if (risks.some(r => r.id === 'risk_4' || r.title.includes('量化'))) {
      steps.push('【建议】为项目/工作经历添加量化数据（数字、百分比）');
    }
    if (risks.some(r => r.id === 'risk_2' || r.title.includes('项目'))) {
      steps.push('【建议】补充2-3个项目经历，每个项目3-5句话');
    }
    if (risks.some(r => r.id === 'risk_3' || r.title.includes('技能'))) {
      steps.push('【建议】在简历中明确列出技术技能清单');
    }
    if (risks.some(r => r.id === 'risk_5' || r.title.includes('实习'))) {
      steps.push('【建议】补充实习/工作经历描述');
    }
  }
  
  steps.push('修改完成后，建议再次使用AI诊断工具验证优化效果');
  
  // 调试日志
  if (DEBUG_MODE) {
    console.log('[CareerStage] 生成的下一步建议（阶段感知）:', steps);
  }
  
  return steps;
}
