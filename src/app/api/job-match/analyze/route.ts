import { NextRequest, NextResponse } from 'next/server';

/**
 * 岗位匹配分析 API
 * 
 * 核心功能：
 * 1. 接收用户的智能画像数据
 * 2. 基于画像数据进行真实的向量匹配或加权打分
 * 3. 返回按匹配度排序的岗位列表
 */

// ============================================
// 标准岗位库（示例）
// ============================================
const STANDARD_JOBS = [
  {
    id: 'job-001',
    title: '高级后端开发工程师',
    company: '腾讯',
    location: '深圳',
    salary: '30-50K/月',
    requiredSkills: ['Go', '分布式系统', '微服务', 'MySQL'],
    preferredSkills: ['Kubernetes', 'gRPC', 'Redis'],
    softSkills: ['抗压能力', '团队协作', '问题解决'],
    responsibilities: ['设计和开发高并发分布式系统', '优化系统性能', '参与技术选型'],
    requirements: {
      communication: 7, // 要求沟通能力评分 7/10
      stressResistance: 8, // 要求抗压能力 8/10
      learningAbility: 7,
      innovation: 6,
    },
  },
  {
    id: 'job-002',
    title: '前端开发工程师',
    company: '字节跳动',
    location: '北京',
    salary: '25-40K/月',
    requiredSkills: ['React', 'TypeScript', 'HTML/CSS', '性能优化'],
    preferredSkills: ['Next.js', 'WebGL', '移动端适配'],
    softSkills: ['沟通能力', '学习能力', '创造力'],
    responsibilities: ['开发和维护前端应用', '优化用户体验', '参与前端架构设计'],
    requirements: {
      communication: 8,
      stressResistance: 6,
      learningAbility: 8,
      innovation: 7,
    },
  },
  {
    id: 'job-003',
    title: 'AI算法研究员',
    company: '腾讯AI Lab',
    location: '深圳',
    salary: '35-60K/月',
    requiredSkills: ['机器学习', 'Python', '深度学习', '数学基础'],
    preferredSkills: ['顶会论文', 'TensorFlow/PyTorch', 'NLP/CV'],
    softSkills: ['创新思维', '技术领导力', '逻辑思维'],
    responsibilities: ['开展前沿AI研究', '发表顶会论文', '推动技术落地'],
    requirements: {
      communication: 6,
      stressResistance: 7,
      learningAbility: 9,
      innovation: 9,
    },
  },
  {
    id: 'job-004',
    title: '全栈开发工程师',
    company: '蚂蚁集团',
    location: '杭州',
    salary: '28-45K/月',
    requiredSkills: ['React', 'Node.js', '数据库', '系统 design'],
    preferredSkills: ['云服务', 'Docker', 'CI/CD'],
    softSkills: ['全局思维', '快速学习', '团队合作'],
    responsibilities: ['全栈功能开发', '系统架构设计', '跨团队协作'],
    requirements: {
      communication: 7,
      stressResistance: 7,
      learningAbility: 8,
      innovation: 7,
    },
  },
];

// ============================================
// POST 处理函数
// ============================================
export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();
    const { userProfile, analysisResult } = body;

    // 2. 验证必需参数
    if (!userProfile && !analysisResult) {
      return NextResponse.json(
        { error: '缺少必需参数：userProfile 或 analysisResult' },
        { status: 400 }
      );
    }

    // 3. 执行岗位匹配算法
    const matchResults = calculateJobMatches(userProfile, analysisResult);

    // 4. 返回结果
    return NextResponse.json({
      success: true,
      data: {
        matchResults,
        totalJobs: STANDARD_JOBS.length,
        matchedJobs: matchResults.length,
      },
    });

  } catch (error: any) {
    console.error('岗位匹配 API 错误：', error);
    
    // 防御性编程：返回标准 JSON 错误，而不是 HTML
    return NextResponse.json(
      { 
        error: error.message || '岗位匹配服务暂时不可用', 
        code: 500,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================
// 核心匹配算法
// ============================================
function calculateJobMatches(userProfile: any, analysisResult: any): any[] {
  const allJobs = STANDARD_JOBS;

  // 为每个岗位计算匹配得分
  const results = allJobs.map(job => {
    let score = 0;
    let reasons: string[] = [];

    // 1. 硬技能匹配 (权重 50%)
    const skillScore = calculateHardSkillMatch(
      userProfile?.skills || '',
      analysisResult?.skillsAnalysis || [],
      job.requiredSkills,
      job.preferredSkills
    );
    score += skillScore * 0.5;
    if (skillScore > 60) {
      reasons.push(`硬技能匹配度 ${(skillScore).toFixed(0)}%，符合岗位技术要求`);
    }

    // 2. 软实力与驱动力匹配 (权重 30%)
    const softSkillScore = calculateSoftSkillMatch(
      userProfile?.grade || '',
      analysisResult?.competitiveness?.dimensions || {},
      job.requirements
    );
    score += softSkillScore * 0.3;
    if (softSkillScore > 60) {
      reasons.push(`软实力评估 ${softSkillScore.toFixed(0)} 分，符合岗位文化要求`);
    }

    // 3. 经历关键词匹配 (权重 20%)
    const experienceScore = calculateExperienceMatch(
      userProfile?.projects || '',
      analysisResult?.projectReview || [],
      job.responsibilities
    );
    score += experienceScore * 0.2;
    if (experienceScore > 60) {
      reasons.push(`项目经历相关度 ${experienceScore.toFixed(0)}%，有相关实战经验`);
    }

    // 返回匹配结果
    return {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      matchScore: Math.round(score),
      matchLevel: score >= 80 ? '高' : score >= 60 ? '中' : '低',
      reasons: reasons.length > 0 ? reasons : ['匹配度较低，建议提升相关技能'],
      gaps: generateGaps(job, userProfile, analysisResult),
    };
  });

  // 按匹配分数降序排列
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

// ============================================
// 硬技能匹配计算
// ============================================
function calculateHardSkillMatch(
  userSkillsText: string,
  skillsAnalysis: any[],
  requiredSkills: string[],
  preferredSkills: string[]
): number {
  let score = 0;
  const userSkills = userSkillsText.toLowerCase();

  // 检查必需技能
  const matchedRequired = requiredSkills.filter(skill => 
    userSkills.includes(skill.toLowerCase()) ||
    skillsAnalysis.some(s => s.name.toLowerCase().includes(skill.toLowerCase()) && s.mastery !== '缺失')
  );
  score += (matchedRequired.length / requiredSkills.length) * 70;

  // 检查优先技能
  const matchedPreferred = preferredSkills.filter(skill =>
    userSkills.includes(skill.toLowerCase()) ||
    skillsAnalysis.some(s => s.name.toLowerCase().includes(skill.toLowerCase()) && s.mastery === '精通')
  );
  score += (matchedPreferred.length / preferredSkills.length) * 30;

  return Math.round(score);
}

// ============================================
// 软实力匹配计算
// ============================================
function calculateSoftSkillMatch(
  userGrade: string,
  dimensions: any,
  jobRequirements: any
): number {
  let score = 0;

  // 基于年级和竞争力维度评估软实力
  // 简化逻辑：根据实际项目情况调整
  
  // 沟通能力（基于年级）
  const communicationScore = userGrade.includes('大') ? 6 : 7; // 本科生6分，研究生7分
  score += (communicationScore / jobRequirements.communication) * 25;

  // 抗压能力（基于经验维度）
  const stressScore = dimensions.experience || 70;
  score += (stressScore / (jobRequirements.stressResistance * 10)) * 25;

  // 学习能力（基于技能维度）
  const learningScore = dimensions.skills || 70;
  score += (learningScore / (jobRequirements.learningAbility * 10)) * 25;

  // 创新思维（基于年级）
  const innovationScore = userGrade.includes('博士') ? 8 : userGrade.includes('研') ? 7 : 6;
  score += (innovationScore / jobRequirements.innovation) * 25;

  return Math.round(score);
}

// ============================================
// 经历关键词匹配计算
// ============================================
function calculateExperienceMatch(
  userProjects: string,
  projectReview: any[],
  jobResponsibilities: string[]
): number {
  if (!userProjects) return 0;

  let score = 0;
  const userText = userProjects.toLowerCase();

  // 检查项目描述是否包含岗位职责关键词
  const matchedResponsibilities = jobResponsibilities.filter(resp =>
    resp.toLowerCase().split(' ').some(word => userText.includes(word))
  );

  score = (matchedResponsibilities.length / jobResponsibilities.length) * 100;

  // 加成：如果项目复盘中有量化成果
  if (projectReview && projectReview.length > 0) {
    const hasQuantified = projectReview.some(p =>
      p.quantifiedResults && p.quantifiedResults.length > 0
    );
    if (hasQuantified) score += 20;
  }

  return Math.round(Math.min(score, 100));
}

// ============================================
// 生成差距分析
// ============================================
function generateGaps(job: any, userProfile: any, analysisResult: any): string[] {
  const gaps: string[] = [];

  // 检查缺失的必需技能
  const userSkills = (userProfile?.skills || '').toLowerCase();
  const missingSkills = job.requiredSkills.filter((skill: string) =>
    !userSkills.includes(skill.toLowerCase()) &&
    (!analysisResult?.skillsAnalysis || !analysisResult.skillsAnalysis.some(
      (s: any) => s.name.toLowerCase().includes(skill.toLowerCase()) && s.mastery !== '缺失'
    ))
  );

  if (missingSkills.length > 0) {
    gaps.push(`缺失关键技能：${missingSkills.join('、')}`);
  }

  // 检查项目经历
  if (!userProfile?.projects) {
    gaps.push('建议补充项目经历，提升实战经验');
  }

  return gaps;
}
