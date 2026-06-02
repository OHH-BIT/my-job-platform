/**
 * 简历精准靶向诊断引擎（支持流式输出）
 * 
 * 核心功能：
 * 1. 精准靶向诊断（基于结构化数据，而非原始文本）
 * 2. 流式输出（Streaming）消除等待焦虑
 * 3. 超时降级+本地规则引擎兜底
 */

// ==================== 类型定义 ====================

export interface DiagnosisStreamResponse {
  // 流式输出回调
  onProgress?: (chunk: string) => void;
  onComplete?: (report: DiagnosisReport) => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

export interface DiagnosisReport {
  // 综合评分
  score: {
    overall: number;
    dimensions: {
      professionalMatch: number;
      projectExperience: number;
      skillStack: number;
      softSkills: number;
      quantitativeData: number;
      formatting: number;
    };
  };
  
  // 亮点分析
  strengths: {
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  
  // 风险点
  risks: {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'major' | 'minor';
  }[];
  
  // 修改指导
  guidance: {
    id: string;
    title: string;
    originalText: string;
    suggestedText: string;
    reason: string;
  }[];
  
  // 元数据
  meta: {
    diagnosisTime: number;
    modelUsed: string;
    timeoutFallback: boolean;
  };
}

// ==================== 配置 ====================

const CONFIG = {
  // 超时时间（毫秒）
  timeout: 15000,
  
  // 流式输出配置
  stream: {
    enabled: true,
    chunkSize: 50, // 每次输出的字符数
    delay: 30, // 输出延迟（毫秒）
  },
  
  // 本地规则引擎配置
  localEngine: {
    enabled: true,
    fallbackThreshold: 0.6, // 评分低于此值时触发降级
  }
};

// ==================== 主诊断函数 ====================

/**
 * 精准靶向诊断（支持流式输出）
 * @param extractedData - 第一步提取的结构化数据
 * @param jobDescription - 岗位描述（可选）
 * @param options - 流式输出选项
 * @returns Promise<DiagnosisReport>
 */
export async function diagnoseWithStream(
  extractedData: any, // 来自 resume-extractor 的输出
  jobDescription?: string,
  options: DiagnosisStreamResponse = {}
): Promise<DiagnosisReport> {
  const startTime = Date.now();
  
  console.log('[Diagnosis] 开始诊断，结构化数据:', extractedData);
  
  // 1. 尝试使用 AI 进行诊断（带超时）
  try {
    const report = await diagnoseWithAI(extractedData, jobDescription, options);
    
    // 检查是否超时降级
    if (report.meta.timeoutFallback) {
      options.onTimeout?.();
    }
    
    return report;
  } catch (error) {
    console.warn('[Diagnosis] AI诊断失败，使用本地规则引擎:', error);
    
    // 2. 降级：使用本地规则引擎
    const fallbackReport = diagnoseWithLocalEngine(extractedData, jobDescription);
    
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
    
    return fallbackReport;
  }
}

/**
 * 使用 AI 进行诊断（带超时）
 */
async function diagnoseWithAI(
  extractedData: any,
  jobDescription?: string,
  options: DiagnosisStreamResponse = {}
): Promise<DiagnosisReport> {
  // 创建超时 Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Diagnosis timeout'));
    }, CONFIG.timeout);
  });
  
  // 创建诊断 Promise
  const diagnosisPromise = diagnoseWithAIStream(extractedData, jobDescription, options);
  
  // 竞速：谁先完成用谁
  try {
    const report = await Promise.race([diagnosisPromise, timeoutPromise]);
    return report;
  } catch (error) {
    if (error instanceof Error && error.message === 'Diagnosis timeout') {
      // 超时：使用本地规则引擎
      console.warn('[Diagnosis] AI诊断超时，降级到本地规则引擎');
      const fallbackReport = diagnoseWithLocalEngine(extractedData, jobDescription);
      fallbackReport.meta.timeoutFallback = true;
      return fallbackReport;
    }
    throw error;
  }
}

/**
 * 使用 AI 进行流式诊断
 */
async function diagnoseWithAIStream(
  extractedData: any,
  jobDescription?: string,
  options: DiagnosisStreamResponse = {}
): Promise<DiagnosisReport> {
  // 注意：这里是模拟实现，实际应该调用真实的 AI API
  // 由于当前项目没有后端，我们使用本地规则引擎模拟 AI 输出
  
  const report = diagnoseWithLocalEngine(extractedData, jobDescription);
  
  // 模拟流式输出
  if (CONFIG.stream.enabled && options.onProgress) {
    const reportText = JSON.stringify(report, null, 2);
    const chunks = splitIntoChunks(reportText, CONFIG.stream.chunkSize);
    
    for (const chunk of chunks) {
      options.onProgress(chunk);
      await sleep(CONFIG.stream.delay);
    }
  }
  
  options.onComplete?.(report);
  
  return report;
}

/**
 * 使用本地规则引擎进行诊断（兜底方案）
 */
function diagnoseWithLocalEngine(
  extractedData: any,
  jobDescription?: string
): DiagnosisReport {
  const startTime = Date.now();
  
  console.log('[Diagnosis] 使用本地规则引擎进行诊断');
  
  // 1. 计算各维度得分
  const dimensions = calculateDimensions(extractedData);
  
  // 2. 计算综合评分
  const overallScore = Math.round(
    (dimensions.professionalMatch +
     dimensions.projectExperience +
     dimensions.skillStack +
     dimensions.softSkills +
     dimensions.quantitativeData +
     dimensions.formatting) / 6
  );
  
  // 3. 分析亮点
  const strengths = analyzeStrengths(extractedData);
  
  // 4. 识别风险点
  const risks = analyzeRisks(extractedData);
  
  // 5. 生成修改指导
  const guidance = generateGuidance(extractedData, risks);
  
  const report: DiagnosisReport = {
    score: {
      overall: overallScore,
      dimensions
    },
    strengths,
    risks,
    guidance,
    meta: {
      diagnosisTime: Date.now() - startTime,
      modelUsed: 'local-rule-engine',
      timeoutFallback: false
    }
  };
  
  return report;
}

// ==================== 辅助函数 ====================

/**
 * 计算各维度得分
 */
function calculateDimensions(data: any): DiagnosisReport['score']['dimensions'] {
  // 专业匹配度
  const professionalMatch = data.basicInfo?.education?.length > 0 ? 80 : 40;
  
  // 项目经历
  const projectCount = data.experiences?.filter((e: any) => e.type === 'project').length || 0;
  const projectExperience = projectCount > 0 ? Math.min(80, projectCount * 20) : 40;
  
  // 技能栈
  const skillCount = data.skills?.length || 0;
  const skillStack = skillCount > 0 ? Math.min(80, skillCount * 10) : 40;
  
  // 软实力（基于经历描述的质量）
  const softSkills = 70; // 简化处理
  
  // 量化数据（检查经历描述中是否有数字）
  const hasQuantitative = data.experiences?.some((e: any) => /\d+%|\d+万|\d+亿|\d+倍/.test(e.description));
  const quantitativeData = hasQuantitative ? 80 : 40;
  
  // 排版规范（简化处理）
  const formatting = 70;
  
  return {
    professionalMatch,
    projectExperience,
    skillStack,
    softSkills,
    quantitativeData,
    formatting
  };
}

/**
 * 分析亮点
 */
function analyzeStrengths(data: any): DiagnosisReport['strengths'] {
  const strengths: DiagnosisReport['strengths'] = [];
  
  // 亮点1：技能清单
  if (data.skills?.length > 0) {
    strengths.push({
      id: 'strength_skills',
      title: '简历中包含技能清单',
      description: `检测到 ${data.skills.length} 项技能：${data.skills.slice(0, 5).join('、')}`,
      impact: data.skills.length >= 5 ? 'high' : 'medium'
    });
  }
  
  // 亮点2：经历丰富
  if (data.experiences?.length > 0) {
    strengths.push({
      id: 'strength_experience',
      title: '简历中包含经历描述',
      description: `检测到 ${data.experiences.length} 段经历`,
      impact: 'high'
    });
  }
  
  return strengths;
}

/**
 * 分析风险点
 */
function analyzeRisks(data: any): DiagnosisReport['risks'] {
  const risks: DiagnosisReport['risks'] = [];
  
  // 风险1：无经历
  if (data.experiences?.length === 0) {
    risks.push({
      id: 'risk_no_experience',
      title: '未检测到经历',
      description: '简历中未包含任何工作或项目经历',
      severity: 'critical'
    });
  }
  
  // 风险2：技能过少
  if (data.skills?.length < 3) {
    risks.push({
      id: 'risk_few_skills',
      title: '技能清单过少',
      description: `仅检测到 ${data.skills?.length || 0} 项技能，建议补充`,
      severity: 'major'
    });
  }
  
  return risks;
}

/**
 * 生成修改指导
 */
function generateGuidance(data: any, risks: DiagnosisReport['risks']): DiagnosisReport['guidance'] {
  const guidance: DiagnosisReport['guidance'] = [];
  
  // 指导1：补充经历
  if (risks.some(r => r.id === 'risk_no_experience')) {
    guidance.push({
      id: 'guidance_add_experience',
      title: '补充经历描述',
      originalText: '(无)',
      suggestedText: '建议添加工作经历或项目经历，描述你的职责和成就',
      reason: '经历是简历的核心，HR需要了解你的实际工作经验'
    });
  }
  
  // 指导2：补充技能
  if (risks.some(r => r.id === 'risk_few_skills')) {
    guidance.push({
      id: 'guidance_add_skills',
      title: '补充技能清单',
      originalText: '(无)',
      suggestedText: '建议添加技能清单，列出你掌握的技术栈和工具',
      reason: '技能清单帮助HR快速了解你的技术能力'
    });
  }
  
  return guidance;
}

/**
 * 将文本分割成块
 */
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 睡眠函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清除诊断缓存
 */
export function clearDiagnosisCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('resume_diagnosis_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('[Diagnosis] 缓存已清除');
  } catch (error) {
    console.warn('清除缓存失败:', error);
  }
}
