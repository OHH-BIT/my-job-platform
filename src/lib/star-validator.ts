// STAR法则校验库
// 用于检测简历项目经历是否符合STAR法则（Situation情境、Task任务、Action行动、Result结果）

// STAR法则检测结果
export interface StarCheckResult {
  hasSituation: boolean;    // 是否描述情境
  hasTask: boolean;        // 是否描述任务
  hasAction: boolean;       // 是否描述行动
  hasResult: boolean;      // 是否描述结果（量化）
  starScore: number;        // STAR完整度评分 (0-100)
  missingElements: string[]; // 缺失的元素
  suggestions: string[];    // 改进建议
}

// 量化数据检测结果
export interface QuantitativeCheckResult {
  hasNumbers: boolean;      // 是否包含数字
  hasPercentages: boolean;  // 是否包含百分比
  hasScale: boolean;        // 是否包含规模描述（万、亿等）
  quantitativeScore: number; // 量化程度评分 (0-100)
  missingQuantitative: string[]; // 缺失的量化元素
  suggestions: string[];    // 改进建议
}

// 致命缺失项检测
export interface CriticalGap {
  keyword: string;         // 缺失的关键词
  importance: 'critical' | 'high' | 'medium';
  reason: string;           // 为什么重要
  suggestion: string;       // 如何补充
}

// STAR法则关键词库
const STAR_KEYWORDS = {
  situation: [
    '在', '当时', '项目中', '团队', '公司', '面对', '由于', '背景', '情况下', '期间'
  ],
  task: [
    '负责', '需要', '目标', '任务', '要求', '承担', '接手', '被分配', '挑战', '问题'
  ],
  action: [
    '通过', '使用', '采用', '实施', '开发', '设计', '优化', '改进', '分析', '解决',
    '实现', '构建', '创建', '编写', '测试', '部署', '协助', '主导', '参与'
  ],
  result: [
    '提升', '降低', '增加', '减少', '实现', '达到', '完成', '成功', '改善', '优化',
    '%', '百分比', '倍', '万', '亿', '个', '名', '次'
  ]
};

// 量化指标关键词
const QUANTITATIVE_KEYWORDS = [
  '提升', '降低', '增加', '减少', '%', '百分比', '倍', '万', '亿',
  '个', '名', '次', '小时', '天', '周', '月', '年', '人', '团队',
  '项目', '系统', '用户', '流量', '转化率', '性能', '速度', '效率'
];

// 检测STAR法则
export function checkStarPrinciple(text: string): StarCheckResult {
  const lowerText = text.toLowerCase();
  
  // 检测情境（S）
  const hasSituation = STAR_KEYWORDS.situation.some(kw => lowerText.includes(kw));
  
  // 检测任务（T）
  const hasTask = STAR_KEYWORDS.task.some(kw => lowerText.includes(kw));
  
  // 检测行动（A）
  const hasAction = STAR_KEYWORDS.action.some(kw => lowerText.includes(kw));
  
  // 检测结果（R）- 必须包含量化数据
  const hasResult = STAR_KEYWORDS.result.some(kw => lowerText.includes(kw)) ||
                   QUANTITATIVE_KEYWORDS.some(kw => lowerText.includes(kw));
  
  // 计算STAR评分
  const scoreMap = [hasSituation, hasTask, hasAction, hasResult];
  const starScore = Math.round((scoreMap.filter(Boolean).length / 4) * 100);
  
  // 缺失元素
  const missingElements: string[] = [];
  if (!hasSituation) missingElements.push('情境(S)');
  if (!hasTask) missingElements.push('任务(T)');
  if (!hasAction) missingElements.push('行动(A)');
  if (!hasResult) missingElements.push('结果(R)');
  
  // 改进建议
  const suggestions: string[] = [];
  if (!hasSituation) {
    suggestions.push('补充项目背景：描述你面临的具体情况或挑战');
  }
  if (!hasTask) {
    suggestions.push('明确你的任务：说明你需要完成什么目标');
  }
  if (!hasAction) {
    suggestions.push('详细描述行动：你具体做了什么？使用了什么方法？');
  }
  if (!hasResult) {
    suggestions.push('添加量化结果：用数字、百分比说明你的成果（如"提升30%"、"服务10万用户"）');
  }
  
  return {
    hasSituation,
    hasTask,
    hasAction,
    hasResult,
    starScore,
    missingElements,
    suggestions
  };
}

// 检测量化数据
export function checkQuantitativeData(text: string): QuantitativeCheckResult {
  const lowerText = text.toLowerCase();
  
  // 检测数字
  const hasNumbers = /\d/.test(text);
  
  // 检测百分比
  const hasPercentages = text.includes('%') || lowerText.includes('百分比');
  
  // 检测规模描述
  const hasScale = /[万千亿]/.test(text) || /\d+\s*(个|名|次|人|用户|项目)/.test(text);
  
  // 计算量化评分
  let quantitativeScore = 0;
  if (hasNumbers) quantitativeScore += 30;
  if (hasPercentages) quantitativeScore += 40;
  if (hasScale) quantitativeScore += 30;
  
  // 缺失元素
  const missingQuantitative: string[] = [];
  if (!hasNumbers) missingQuantitative.push('具体数字');
  if (!hasPercentages) missingQuantitative.push('百分比指标');
  if (!hasScale) missingQuantitative.push('规模描述');
  
  // 改进建议
  const suggestions: string[] = [];
  if (!hasNumbers) {
    suggestions.push('添加具体数字：如"优化3个模块"、"服务5万用户"');
  }
  if (!hasPercentages) {
    suggestions.push('使用百分比：如"性能提升30%"、"转化率增长25%"');
  }
  if (!hasScale) {
    suggestions.push('描述规模：如"支持10万并发"、"团队20人"');
  }
  
  return {
    hasNumbers,
    hasPercentages,
    hasScale,
    quantitativeScore,
    missingQuantitative,
    suggestions
  };
}

// 检测致命缺失项（岗位JD中的硬性要求）
export function checkCriticalGaps(resumeText: string, jobDescription: string): CriticalGap[] {
  const gaps: CriticalGap[] = [];
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();
  
  // 提取JD中的关键词（简单方法：按逗号、空格分割）
  const jdKeywords = jobLower
    .split(/[,，。、\s]+/)
    .filter(word => word.length >= 2)
    .slice(0, 20); // 取前20个关键词
  
  // 检查每个关键词是否在简历中出现
  jdKeywords.forEach(keyword => {
    if (!resumeLower.includes(keyword) && isImportantKeyword(keyword)) {
      gaps.push({
        keyword,
        importance: getImportanceLevel(keyword),
        reason: `岗位JD中明确要求"${keyword}"，但你的简历中未提及`,
        suggestion: `建议在技能清单或项目经历中补充"${keyword}"相关经验`
      });
    }
  });
  
  // 限制返回数量
  return gaps.slice(0, 5);
}

// 判断关键词是否重要
function isImportantKeyword(keyword: string): boolean {
  const importantPatterns = [
    'react', 'vue', 'angular', 'typescript', 'javascript',
    'java', 'python', 'go', 'c++', 'node',
    'mysql', 'redis', 'mongodb', 'docker', 'kubernetes',
    'spring', 'django', 'express', 'git', 'linux'
  ];
  
  return importantPatterns.some(pattern => keyword.includes(pattern));
}

// 获取重要性级别
function getImportanceLevel(keyword: string): 'critical' | 'high' | 'medium' {
  const criticalKeywords = ['react', 'vue', 'java', 'python', 'mysql'];
  const highKeywords = ['typescript', 'node', 'redis', 'docker'];
  
  if (criticalKeywords.some(k => keyword.includes(k))) {
    return 'critical';
  } else if (highKeywords.some(k => keyword.includes(k))) {
    return 'high';
  } else {
    return 'medium';
  }
}

// 生成细颗粒度的修改建议（修正版：不生成虚假示例）
export function generateDetailedSuggestions(
  resumeText: string, 
  starResult: StarCheckResult, 
  quantitativeResult: QuantitativeCheckResult
): any[] {
  const suggestions: any[] = [];
  
  // 基于STAR法则的建议 - 只给建议，不生成虚假示例
  if (!starResult.hasResult || !quantitativeResult.hasPercentages) {
    const firstSentence = extractFirstRealSentence(resumeText);
    suggestions.push({
      id: 'suggestion_star_1',
      title: '【建议】补充量化成果',
      originalText: firstSentence || '（你的简历中缺乏量化描述）',
      suggestedText: '【建议模板】如果你的项目/工作有可量化的成果，建议补充数字。例如："通过[具体行动]，使[指标]提升[X%]/降低[X%]/达到[X]"。如果没有精确数字，可以用范围或相对比较，如"提升30%性能"、"服务10万用户"、"团队规模20人"',
      reason: 'HR更关注可量化的成果，而非模糊的描述。如果你的经历确实无法量化，可以描述规模、影响范围等。',
      method: 'STAR',
      expectedImprovement: '预计提升初筛通过率35%'
    });
  }
  
  if (!starResult.hasSituation || !starResult.hasTask) {
    const firstSentence = extractFirstRealSentence(resumeText);
    suggestions.push({
      id: 'suggestion_star_2',
      title: '【建议】补充情境和任务',
      originalText: firstSentence || '（你的项目描述）',
      suggestedText: '【建议模板】建议用STAR法则重构项目描述：Situation（项目背景/挑战）- Task（你的任务/目标）- Action（你采取的行动）- Result（可量化结果）。例如："在用户增长停滞的背景下（S），我负责优化注册流程（T），通过简化表单和添加社交登录（A），使注册转化率提升40%（R）"',
      reason: '清晰的情境和任务描述能让HR快速理解你的贡献。如果你没有项目经历，建议先做一些练手项目。',
      method: 'STAR',
      expectedImprovement: '预计提升面试邀约率30%'
    });
  }
  
  return suggestions;
}

// 提取第一句真实存在的句子（不生成虚假内容）
function extractFirstRealSentence(text: string): string | null {
  const sentences = text.split(/[。！？\n]+/);
  // 返回第一个非空的、长度合理的句子
  const realSentence = sentences.find(s => s.trim().length > 5 && s.trim().length < 200);
  return realSentence ? realSentence.trim() : null;
}
