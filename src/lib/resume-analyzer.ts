/**
 * 高精度简历分析引擎
 * 基于规则的结构化信息抽取 + 多维度深度诊断
 * 
 * 核心功能：
 * 1. 基于规则的结构化信息抽取（Regex + 关键词匹配）
 * 2. STAR法则量化检测
 * 3. JD岗位匹配度比对
 * 4. 排版与规范性审查
 */

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

// ==================== 类型定义 ====================

export interface ExtractedResumeInfo {
  // 基本信息
  basicInfo: {
    name?: string;
    phone?: string;
    email?: string;
    education?: {
      school?: string;
      major?: string;
      degree?: string;
      graduationYear?: string;
    }[];
  };
  
  // 经历板块
  experiences: {
    type: 'work' | 'internship' | 'project';
    title: string;
    company?: string;
    duration?: string;
    description: string;
    rawText: string;
  }[];
  
  // 技能清单
  skills: string[];
  
  // 原始文本
  rawText: string;
  
  // 提取置信度
  extractionConfidence: number;
}

export interface STARAnalysisResult {
  starScore: number;
  missingElements: string[];
  suggestions: string[];
  details: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
}

export interface JDMatchResult {
  matchedKeywords: string[];
  missingKeywords: string[];
  matchScore: number;
  suggestions: string[];
}

export interface FormatAnalysisResult {
  formatScore: number;
  issues: {
    type: 'symbol' | 'paragraph' | 'title' | 'spacing';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    suggestion: string;
  }[];
}

export interface ResumeAnalysisReport {
  extractedInfo: ExtractedResumeInfo;
  starAnalysis: STARAnalysisResult;
  jdMatch?: JDMatchResult;
  formatAnalysis: FormatAnalysisResult;
  overallScore: number;
  suggestions: string[];
}

// ==================== 第一步：基于规则的结构化信息抽取 ====================

/**
 * 从简历文本中提取结构化信息
 * 使用正则表达式和关键词匹配
 */
export function extractResumeInfo(resumeText: string): ExtractedResumeInfo {
  const rawText = resumeText;
  const textLower = rawText.toLowerCase();
  
  // 1. 提取基本信息
  const basicInfo = extractBasicInfo(rawText);
  
  // 2. 提取经历板块（工作经历、实习经验、项目经历）
  const experiences = extractExperiences(rawText);
  
  // 3. 提取技能清单
  const skills = extractSkills(rawText);
  
  // 4. 计算提取置信度
  const extractionConfidence = calculateExtractionConfidence(basicInfo, experiences, skills, rawText);
  
  return {
    basicInfo,
    experiences,
    skills,
    rawText,
    extractionConfidence
  };
}

/**
 * 提取基本信息（姓名、联系方式、学历、毕业院校）
 */
function extractBasicInfo(text: string): ExtractedResumeInfo['basicInfo'] {
  const info: ExtractedResumeInfo['basicInfo'] = {
    education: []
  };
  
  // 1. 提取姓名（假设姓名在文本开头，2-4个中文字符）
  const nameMatch = text.match(/^([\u4e00-\u9fa5]{2,4})\s*[\n\r]/);
  if (nameMatch) {
    info.name = nameMatch[1];
  }
  
  // 2. 提取手机号（中国手机号格式）
  const phoneMatch = text.match(/1[3-9]\d{9}/);
  if (phoneMatch) {
    info.phone = phoneMatch[0];
  }
  
  // 3. 提取邮箱
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    info.email = emailMatch[0];
  }
  
  // 4. 提取教育背景（学校、专业、学历、毕业年份）
  const educationSection = extractSection(text, ['教育背景', '教育经历', '教育', 'Education']);
  if (educationSection) {
    const education = parseEducationSection(educationSection);
    info.education = education;
  }
  
  return info;
}

/**
 * 提取文本中的某个章节（通过标题识别）
 */
function extractSection(text: string, titleKeywords: string[]): string | null {
  for (const keyword of titleKeywords) {
    // 匹配标题行（可能包含冒号、空格等）
    // 转义关键词中的特殊字符，避免正则语法错误
    const escapedKeyword = escapeRegExp(keyword);
    const regex = new RegExp(
      `(^|\\n)\\s*${escapedKeyword}\\s*[:：]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*[\\u4e00-\\u9fa5]{2,10}\\s*[:：]?\\s*\\n|$)`,
      'i'
    );
    const match = text.match(regex);
    if (match && match[2]) {
      return match[2].trim();
    }
  }
  return null;
}

/**
 * 解析教育背景章节
 */
function parseEducationSection(sectionText: string): ExtractedResumeInfo['basicInfo']['education'] {
  const education: ExtractedResumeInfo['basicInfo']['education'] = [];
  
  // 尝试按行分割（每行可能是一个教育经历）
  const lines = sectionText.split(/[\n\r]+/).filter(line => line.trim().length > 0);
  
  for (const line of lines) {
    const edu: NonNullable<ExtractedResumeInfo['basicInfo']['education']>[0] = {};
    
    // 提取学校名称（常见学校关键词）
    const schoolMatch = line.match(/(北京大学|清华大学|复旦大学|上海交通大学|浙江大学|中国科学技术大学|南京大学|武汉大学|华中科技大学|中山大学|四川大学|天津大学|西安交通大学|哈尔滨工业大学|同济大学|北京航空航天大学|北京师范大学|厦门大学|东南大学|大连理工大学|华东师范大学|中国农业大学|华南理工大学|北京理工大学|重庆大学|湖南大学|吉林大学|山东大学|中南大学|北京交通大学|电子科技大学|中国人民大学|北京科技大学|南京理工大学|华东理工大学|上海财经大学|南京航空航天大学|东北大学|中国海洋大学|西北工业大学|北京邮电大学|哈尔滨工程大学|南京农业大学|华中农业大学|中国地质大学|武汉理工大学|上海大学|西南交通大学|暨南大学|北京化工大学|苏州大学|中国石油大学|东华大学|郑州大学|华中师范大学|西北大学|中国矿业大学|南京师范大学|河海大学|西南大学|南昌大学|深圳大学|云南大学|福州大学|北京工业大学|北京师范大学|江南大学|合肥工业大学|华中师范大学)/);
    if (schoolMatch) {
      edu.school = schoolMatch[1];
    }
    
    // 提取学历（本科、硕士、博士等）
    const degreeMatch = line.match(/(本科|硕士|博士|大专|高中|中专|技校)/);
    if (degreeMatch) {
      edu.degree = degreeMatch[1];
    }
    
    // 提取专业
    const majorMatch = line.match(/(计算机|软件|信息|电子|通信|自动化|机械|土木|建筑|金融|经济|管理|法律|医学|药学|生物|化学|物理|数学|英语|日语|德语|法语|俄语|朝鲜语|西班牙语|葡萄牙语|阿拉伯语|印度语)/);
    if (majorMatch) {
      edu.major = majorMatch[1];
    }
    
    // 提取毕业年份
    const yearMatch = line.match(/(20\\d{2})\\s*年?\\s*[-至]?\\s*(20\\d{2})?/);
    if (yearMatch) {
      edu.graduationYear = yearMatch[1] + (yearMatch[2] ? '-' + yearMatch[2] : '');
    }
    
    if (edu.school || edu.major || edu.degree) {
      education.push(edu);
    }
  }
  
  return education;
}

/**
 * 提取经历板块（工作经历、实习经验、项目经历）
 */
function extractExperiences(text: string): ExtractedResumeInfo['experiences'] {
  const experiences: ExtractedResumeInfo['experiences'] = [];
  
  // 定义要提取的章节标题关键词
  const sectionKeywords = [
    { keyword: '工作经历', type: 'work' as const },
    { keyword: '实习经历', type: 'internship' as const },
    { keyword: '实习经验', type: 'internship' as const },
    { keyword: '项目经历', type: 'project' as const },
    { keyword: '项目经验', type: 'project' as const },
    { keyword: '工作经验', type: 'work' as const }
  ];
  
  for (const { keyword, type } of sectionKeywords) {
    const sectionText = extractSection(text, [keyword]);
    if (sectionText) {
      // 解析该章节下的各个经历
      const parsedExperiences = parseExperienceSection(sectionText, type, keyword);
      experiences.push(...parsedExperiences);
    }
  }
  
  return experiences;
}

/**
 * 解析经历章节（将文本分割为多个经历）
 */
function parseExperienceSection(sectionText: string, type: 'work' | 'internship' | 'project', sectionTitle: string): ExtractedResumeInfo['experiences'] {
  const experiences: ExtractedResumeInfo['experiences'] = [];
  
  // 尝试按空行分割（每个经历之间通常有空行）
  const blocks = sectionText.split(/\n\s*\n+/);
  
  for (const block of blocks) {
    if (block.trim().length < 10) continue; // 跳过太短的内容
    
    const experience: NonNullable<ExtractedResumeInfo['experiences']>[0] = {
      type,
      title: '',
      description: block.trim(),
      rawText: block.trim()
    };
    
    // 尝试提取标题（通常在第一行）
    const lines = block.split(/[\n\r]+/);
    if (lines.length > 0) {
      experience.title = lines[0].trim();
      
      // 尝试提取公司名称（标题中可能包含公司名）
      const companyMatch = experience.title.match(/(.+?)\s*[-—]\s*(.+)/);
      if (companyMatch) {
        experience.company = companyMatch[1].trim();
        experience.title = companyMatch[2].trim();
      }
    }
    
    // 尝试提取时间段
    const durationMatch = block.match(/(20\d{2})\\.(\\d{1,2})?\\s*[-至～~]\\s*(20\\d{2})\\.(\\d{1,2})?|至今/);
    if (durationMatch) {
      experience.duration = durationMatch[0];
    }
    
    experiences.push(experience);
  }
  
  return experiences;
}

/**
 * 提取技能清单
 * 扫描全文，提取出所有的技术栈名词
 */
function extractSkills(text: string): string[] {
  const skills: string[] = [];
  
  // 定义常见的技术栈关键词
  const skillKeywords = [
    // 编程语言
    'Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
    'PHP', 'Ruby', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'Lua', 'Dart', 'Objective-C',
    // 前端框架
    'React', 'Vue', 'Angular', 'jQuery', 'Bootstrap', 'Tailwind', 'Sass', 'Less', 'Webpack',
    'Vite', 'Rollup', 'Parcel', 'Next.js', 'Nuxt.js', 'Gatsby', 'D3.js', 'ECharts',
    // 后端框架
    'Spring', 'Spring Boot', 'Spring Cloud', 'Django', 'Flask', 'Express', 'Koa', 'Nest.js',
    'Laravel', 'Ruby on Rails', 'ASP.NET', 'Gin', 'Echo', 'Beego',
    // 数据库
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 'SQLite', 'Cassandra',
    'Elasticsearch', 'Neo4j', 'InfluxDB', 'HBase', 'Memcached',
    // 中间件/消息队列
    'Kafka', 'RabbitMQ', 'RocketMQ', 'ActiveMQ', 'ZeroMQ', 'NATS',
    // 容器/编排
    'Docker', 'Kubernetes', 'Podman', 'Swarm', 'Helm',
    // CI/CD
    'Jenkins', 'GitLab CI', 'GitHub Actions', 'Travis CI', 'CircleCI', 'Argo CD',
    // 云平台
    'AWS', 'Azure', 'GCP', '阿里云', '腾讯云', '华为云', '百度云',
    // 版本控制
    'Git', 'SVN', 'Mercurial', 'Perforce',
    // 测试
    'Jest', 'Mocha', 'Cypress', 'Selenium', 'JUnit', 'TestNG', 'PyTest', 'Postman',
    // 机器学习/AI
    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
    'OpenCV', 'NLTK', 'Spacy', 'Hugging Face', 'Transformer',
    // 其他工具
    'Linux', 'Unix', 'Windows', 'MacOS', 'Nginx', 'Apache', 'Tomcat', 'IIS',
    'VS Code', 'IntelliJ IDEA', 'Eclipse', 'Visual Studio', 'Xcode', 'Android Studio',
    // 软技能（中文）
    '沟通', '协作', '领导力', '解决问题', '创新', '抗压', '学习能力强', '自驱', '责任心', '团队合作', '项目管理'
  ];
  
  // 扫描文本，提取匹配的技能
  for (const skill of skillKeywords) {
    // 使用正则表达式进行全词匹配（避免部分匹配）
    // 先转义技能名中的特殊字符（如 C++ 的 +）
    const escapedSkill = escapeRegExp(skill);
    const regex = new RegExp(`\\b${escapedSkill}\\b|${escapedSkill}`, 'i');
    if (regex.test(text)) {
      skills.push(skill);
    }
  }
  
  // 去重
  return [...new Set(skills)];
}

/**
 * 计算信息提取的置信度
 */
function calculateExtractionConfidence(
  basicInfo: ExtractedResumeInfo['basicInfo'],
  experiences: ExtractedResumeInfo['experiences'],
  skills: string[],
  rawText: string
): number {
  let confidence = 0;
  
  // 基本信心分数
  if (basicInfo.name) confidence += 20;
  if (basicInfo.phone) confidence += 15;
  if (basicInfo.email) confidence += 15;
  if (basicInfo.education && basicInfo.education.length > 0) confidence += 20;
  
  // 经历信心分数
  if (experiences.length > 0) {
    confidence += Math.min(experiences.length * 10, 30);
  }
  
  // 技能信心分数
  if (skills.length > 0) {
    confidence += Math.min(skills.length * 2, 20);
  }
  
  // 文本长度信心分数
  if (rawText.length > 1000) confidence += 10;
  else if (rawText.length > 500) confidence += 5;
  
  return Math.min(confidence, 100);
}

// ==================== 第二步：多维度的深度诊断逻辑 ====================

/**
 * STAR法则量化检测
 * 遍历用户的"工作/项目经历"段落，检测是否包含具体的数字和强动作词
 */
export function analyzeSTARPrinciple(experiences: ExtractedResumeInfo['experiences']): STARAnalysisResult {
  const result: STARAnalysisResult = {
    starScore: 0,
    missingElements: [],
    suggestions: [],
    details: {
      situation: false,
      task: false,
      action: false,
      result: false
    }
  };
  
  if (experiences.length === 0) {
    result.starScore = 0;
    result.missingElements.push('未检测到任何经历');
    result.suggestions.push('请在简历中添加工作或项目经历');
    return result;
  }
  
  // 遍历每个经历，检测STAR元素
  let totalScore = 0;
  let experienceCount = 0;
  
  for (const exp of experiences) {
    const description = exp.description;
    
    // 检测 Situation（情境）- 关键词：背景、情境、情况下、面对
    const hasSituation = /背景|情境|情况下|面对|当时|项目初期|起初/.test(description);
    
    // 检测 Task（任务）- 关键词：负责、任务、目标、需要
    const hasTask = /负责|任务|目标|需要|旨在|目的是|为了/.test(description);
    
    // 检测 Action（行动）- 关键词：实现、开发、设计、优化、构建
    const hasAction = /实现|开发|设计|优化|构建|编写|创建|完成|参与|主导|推动/.test(description);
    
    // 检测 Result（结果）- 关键词：提升、降低、增加、减少、实现、完成
    const hasResult = /提升|降低|增加|减少|实现|完成|达到|获得|成功|效果|收益/.test(description);
    
    // 检测量化数据（数字、百分比等）
    const hasQuantitative = /\d+%|\d+万|\d+亿|\d+倍|[0-9]+,[0-9]+|\d+人|\d+个/.test(description);
    
    // 计算该经历的分数
    let expScore = 0;
    if (hasSituation) expScore += 20;
    if (hasTask) expScore += 20;
    if (hasAction) expScore += 20;
    if (hasResult) expScore += 20;
    if (hasQuantitative) expScore += 20;
    
    totalScore += expScore;
    experienceCount++;
    
    // 更新全局检测结果（只要有一个经历包含该元素，就认为整体有）
    if (hasSituation) result.details.situation = true;
    if (hasTask) result.details.task = true;
    if (hasAction) result.details.action = true;
    if (hasResult) result.details.result = true;
  }
  
  // 计算平均分
  result.starScore = experienceCount > 0 ? Math.round(totalScore / experienceCount) : 0;
  
  // 检查缺失的元素
  if (!result.details.situation) {
    result.missingElements.push('Situation（情境/背景）');
    result.suggestions.push('建议在经历描述中补充项目背景或情境说明');
  }
  if (!result.details.task) {
    result.missingElements.push('Task（任务/目标）');
    result.suggestions.push('建议在经历描述中明确说明你的任务或目标');
  }
  if (!result.details.action) {
    result.missingElements.push('Action（行动/措施）');
    result.suggestions.push('建议在经历描述中详细描述你采取的具体行动');
  }
  if (!result.details.result) {
    result.missingElements.push('Result（结果/成果）');
    result.suggestions.push('建议在经历描述中补充可量化的成果或结果');
  }
  
  return result;
}

/**
 * JD岗位匹配度比对
 * 提取JD中的高频硬技能关键词，与简历中提取的"技能清单"进行交叉比对
 */
export function analyzeJDMatch(resumeSkills: string[], jdText: string): JDMatchResult {
  const result: JDMatchResult = {
    matchedKeywords: [],
    missingKeywords: [],
    matchScore: 0,
    suggestions: []
  };
  
  if (!jdText || jdText.trim().length === 0) {
    return result;
  }
  
  // 从JD中提取关键技能词（与简历技能词库对比）
  const jdSkills = extractSkills(jdText); // 复用技能提取函数
  
  // 比对：找出匹配的和缺失的
  result.matchedKeywords = resumeSkills.filter(skill => 
    jdSkills.some(jdSkill => jdSkill.toLowerCase() === skill.toLowerCase())
  );
  
  result.missingKeywords = jdSkills.filter(jdSkill => 
    !resumeSkills.some(resumeSkill => resumeSkill.toLowerCase() === jdSkill.toLowerCase())
  );
  
  // 计算匹配分数
  if (jdSkills.length > 0) {
    result.matchScore = Math.round((result.matchedKeywords.length / jdSkills.length) * 100);
  }
  
  // 生成建议
  if (result.matchedKeywords.length > 0) {
    result.suggestions.push(`简历中命中了 ${result.matchedKeywords.length} 个JD关键词：${result.matchedKeywords.slice(0, 5).join('、')}${result.matchedKeywords.length > 5 ? '等' : ''}`);
  }
  
  if (result.missingKeywords.length > 0) {
    result.suggestions.push(`简历中缺失 ${result.missingKeywords.length} 个JD关键词：${result.missingKeywords.slice(0, 5).join('、')}${result.missingKeywords.length > 5 ? '等' : ''}。建议在简历中补充这些技能`);
  }
  
  return result;
}

/**
 * 排版与规范性审查
 * 检测文本中是否存在大量连续的特殊符号、过长的段落或不规范的标题命名
 */
export function analyzeFormat(resumeText: string): FormatAnalysisResult {
  const result: FormatAnalysisResult = {
    formatScore: 100,
    issues: []
  };
  
  // 1. 检测大量连续的特殊符号（如 ****、----、==== 等）
  const specialSymbolMatches = resumeText.match(/[*#\-=_=]{5,}/g);
  if (specialSymbolMatches && specialSymbolMatches.length > 0) {
    result.formatScore -= 10;
    result.issues.push({
      type: 'symbol',
      severity: 'minor',
      description: `检测到 ${specialSymbolMatches.length} 处连续的特殊符号`,
      suggestion: '建议使用更简洁的分隔方式，如空行或简单的横线'
    });
  }
  
  // 2. 检测过长的段落（超过 5 行未分段）
  const paragraphs = resumeText.split(/[\n\r]{2,}/);
  const longParagraphs = paragraphs.filter(p => p.split(/[\n\r]/).length > 5);
  if (longParagraphs.length > 0) {
    result.formatScore -= 15;
    result.issues.push({
      type: 'paragraph',
      severity: 'major',
      description: `检测到 ${longParagraphs.length} 个过长段落（超过5行未分段）`,
      suggestion: '建议将长段落拆分成多个短段落，提高可读性'
    });
  }
  
  // 3. 检测不规范的标题命名（标题行过长、包含特殊字符等）
  const lines = resumeText.split(/[\n\r]/);
  const titleLines = lines.filter(line => {
    const trimmed = line.trim();
    // 判断是否为标题（短且可能包含冒号、或全大写/加粗等）
    return trimmed.length > 0 && trimmed.length < 50 && 
           (/[:：]/.test(trimmed) || /^[A-Z\s]+$/.test(trimmed) || /[\u4e00-\u9fa5]{2,10}$/.test(trimmed));
  });
  
  const badTitles = titleLines.filter(title => {
    // 标题包含过多特殊字符
    return /[*#@$%^&()+={}[\]|\\/"'<>~`]/.test(title);
  });
  
  if (badTitles.length > 0) {
    result.formatScore -= 10;
    result.issues.push({
      type: 'title',
      severity: 'minor',
      description: `检测到 ${badTitles.length} 个标题包含不规范字符`,
      suggestion: '建议标题使用简洁的文字，避免特殊符号'
    });
  }
  
  // 4. 检测过多的空行（超过2个连续空行）
  const emptyLineMatches = resumeText.match(/\n{3,}/g);
  if (emptyLineMatches && emptyLineMatches.length > 2) {
    result.formatScore -= 5;
    result.issues.push({
      type: 'spacing',
      severity: 'minor',
      description: `检测到 ${emptyLineMatches.length} 处过多空行`,
      suggestion: '建议保持适当的行间距，通常1-2个空行即可'
    });
  }
  
  // 5. 检测字体大小不一致（通过检测异常缩进来判断）
  const indentLines = lines.filter(line => /^\s{8,}/.test(line));
  if (indentLines.length > 5) {
    result.formatScore -= 5;
    result.issues.push({
      type: 'spacing',
      severity: 'minor',
      description: '检测到多处异常缩进',
      suggestion: '建议统一使用一致的缩进格式'
    });
  }
  
  // 确保分数在合理范围内
  result.formatScore = Math.max(0, Math.min(100, result.formatScore));
  
  return result;
}

// ==================== 主分析函数 ====================

/**
 * 完整的简历分析流程
 * 整合所有分析步骤，生成完整的诊断报告
 */
export function analyzeResume(
  resumeText: string,
  jdText?: string
): ResumeAnalysisReport {
  // 第一步：基于规则的结构化信息抽取
  const extractedInfo = extractResumeInfo(resumeText);
  
  // 第二步：STAR法则量化检测
  const starAnalysis = analyzeSTARPrinciple(extractedInfo.experiences);
  
  // 第三步：JD岗位匹配度比对（如果提供了JD）
  const jdMatch = jdText ? analyzeJDMatch(extractedInfo.skills, jdText) : undefined;
  
  // 第四步：排版与规范性审查
  const formatAnalysis = analyzeFormat(resumeText);
  
  // 第五步：计算综合评分
  const overallScore = calculateOverallScore(extractedInfo, starAnalysis, jdMatch, formatAnalysis);
  
  // 第六步：生成优化建议
  const suggestions = generateSuggestions(extractedInfo, starAnalysis, jdMatch, formatAnalysis);
  
  return {
    extractedInfo,
    starAnalysis,
    jdMatch,
    formatAnalysis,
    overallScore,
    suggestions
  };
}

/**
 * 计算综合评分
 */
function calculateOverallScore(
  extractedInfo: ExtractedResumeInfo,
  starAnalysis: STARAnalysisResult,
  jdMatch: JDMatchResult | undefined,
  formatAnalysis: FormatAnalysisResult
): number {
  let score = 0;
  
  // 1. 结构化信息完整度（30%）
  const infoScore = extractedInfo.extractionConfidence * 0.3;
  score += infoScore;
  
  // 2. STAR法则遵循度（30%）
  const starScore = starAnalysis.starScore * 0.3;
  score += starScore;
  
  // 3. JD匹配度（20%，如果有JD的话）
  if (jdMatch) {
    const jdScore = jdMatch.matchScore * 0.2;
    score += jdScore;
  } else {
    score += 15; // 没有JD时给中等分数
  }
  
  // 4. 排版规范性（20%）
  const formatScore = formatAnalysis.formatScore * 0.2;
  score += formatScore;
  
  return Math.round(score);
}

/**
 * 生成优化建议
 */
function generateSuggestions(
  extractedInfo: ExtractedResumeInfo,
  starAnalysis: STARAnalysisResult,
  jdMatch: JDMatchResult | undefined,
  formatAnalysis: FormatAnalysisResult
): string[] {
  const suggestions: string[] = [];
  
  // 基于信息提取的建议
  if (extractedInfo.basicInfo.name && !extractedInfo.basicInfo.phone) {
    suggestions.push('建议在简历中添加联系电话');
  }
  if (extractedInfo.basicInfo.name && !extractedInfo.basicInfo.email) {
    suggestions.push('建议在简历中添加电子邮箱');
  }
  if (extractedInfo.experiences.length === 0) {
    suggestions.push('简历中未检测到任何经历，建议添加项目或工作经历');
  }
  if (extractedInfo.skills.length === 0) {
    suggestions.push('简历中未检测到技能清单，建议添加技能列表');
  }
  
  // 基于STAR分析的建议
  suggestions.push(...starAnalysis.suggestions);
  
  // 基于JD匹配的建议
  if (jdMatch && jdMatch.suggestions.length > 0) {
    suggestions.push(...jdMatch.suggestions);
  }
  
  // 基于排版分析的建议
  for (const issue of formatAnalysis.issues) {
    suggestions.push(issue.suggestion);
  }
  
  return suggestions;
}
