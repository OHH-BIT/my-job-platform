// 岗位匹配算法

import { UserProfile, JobMatchResult, DimensionScores } from "@/types/user-profile";

// 岗位数据类型（从 match/page.tsx 导入的结构）
export interface JobPosition {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: {
    skills: string[];
    experience: string;
    education: string;
  };
  radarData: {
    technical: number;
    framework: number;
    design: number;
    communication: number;
    learning: number;
  };
  // 新增：岗位所需的软性素质
  softRequirements?: {
    communication: number;  // 沟通要求 (0-100)
    resilience: number;       // 抗压要求 (0-100)
    leadership: number;      // 领导要求 (0-100)
    innovation: number;      // 创新要求 (0-100)
  };
}

// 将用户的 DimensionScores 映射到岗位的 radarData
function mapUserToJobRadar(userScores: DimensionScores, job: JobPosition) {
  return {
    technical: userScores.professional,  // 专业技能 -> 技术能力
    framework: userScores.innovation,    // 创新思维 -> 框架掌握
    design: userScores.communication,    // 沟通协作 -> 设计能力（这里需要根据岗位调整）
    communication: userScores.communication,
    learning: userScores.resilience       // 抗压能力 -> 学习能力
  };
}

// 计算单个维度的匹配度
function calculateDimensionMatch(userValue: number, jobValue: number): number {
  // 用户能力 >= 岗位要求：100%匹配
  // 用户能力 < 岗位要求：按比例计算，最低30%
  if (userValue >= jobValue) {
    return 100;
  }
  return Math.max(30, Math.round((userValue / jobValue) * 100));
}

// 生成匹配理由
function generateMatchReasons(userProfile: UserProfile, job: JobPosition): string[] {
  const reasons: string[] = [];
  const { dimensionScores, basicInfo } = userProfile;

  // 检查专业匹配
  const majorMatch = checkMajorMatch(basicInfo.major, job);
  if (majorMatch) {
    reasons.push(`你的${basicInfo.major}专业与岗位要求高度匹配`);
  }

  // 检查能力维度
  if (dimensionScores.professional >= 70) {
    reasons.push("你的专业技能得分较高，适合技术性岗位");
  }
  if (dimensionScores.communication >= 70) {
    reasons.push("你的沟通协作能力突出，适合需要团队协作的岗位");
  }
  if (dimensionScores.leadership >= 70) {
    reasons.push("你具备较强的领导力潜质，适合管理或协调类岗位");
  }
  if (dimensionScores.innovation >= 70) {
    reasons.push("你的创新思维能力强，适合需要创造力的岗位");
  }
  if (dimensionScores.resilience >= 70) {
    reasons.push("你的抗压能力优秀，能适应高强度工作环境");
  }

  return reasons.slice(0, 3); // 最多返回3条理由
}

// 生成差距分析
function generateGaps(userProfile: UserProfile, job: JobPosition): string[] {
  const gaps: string[] = [];
  const { dimensionScores } = userProfile;

  // 对比岗位要求
  const jobRadar = job.radarData;
  const userMapped = mapUserToJobRadar(dimensionScores, job);

  Object.entries(jobRadar).forEach(([key, value]) => {
    const userValue = userMapped[key as keyof typeof userMapped];
    if (userValue < value - 10) {
      const labels: Record<string, string> = {
        technical: "技术能力",
        framework: "框架掌握",
        design: "设计能力",
        communication: "沟通能力",
        learning: "学习能力"
      };
      gaps.push(`建议提升${labels[key]}（当前${userValue} vs 要求${value}）`);
    }
  });

  return gaps.slice(0, 2); // 最多返回2条差距
}

// 检查专业是否匹配
function checkMajorMatch(major: string, job: JobPosition): boolean {
  const techMajors = ["计算机", "软件", "人工智能", "数据", "电子信息", "通信", "自动化", "数学", "统计学"];
  const designMajors = ["设计", "艺术", "美术"];
  const businessMajors = ["管理", "经济", "金融", "营销"];

  const isTechJob = job.title.includes("开发") || job.title.includes("算法") || job.title.includes("工程师");
  const isDesignJob = job.title.includes("设计") || job.title.includes("UI") || job.title.includes("UX");
  const isBusinessJob = job.title.includes("产品") || job.title.includes("运营") || job.title.includes("市场");

  if (isTechJob) {
    return techMajors.some(m => major.includes(m));
  }
  if (isDesignJob) {
    return designMajors.some(m => major.includes(m));
  }
  if (isBusinessJob) {
    return businessMajors.some(m => major.includes(m)) || true; // 业务岗专业限制较宽
  }

  return true; // 其他岗位默认匹配
}

// 主匹配函数：计算用户画像与所有岗位的匹配度
export function calculateJobMatches(userProfile: UserProfile, jobs: JobPosition[]): JobMatchResult[] {
  const results: JobMatchResult[] = jobs.map(job => {
    // 1. 计算硬性要求匹配（专业、技能）
    const majorScore = checkMajorMatch(userProfile.basicInfo.major, job) ? 100 : 50;

    // 2. 计算能力维度匹配
    const userMapped = mapUserToJobRadar(userProfile.dimensionScores, job);
    const dimensionScores = Object.entries(job.radarData).map(([key, jobValue]) => {
      const userValue = userMapped[key as keyof typeof userMapped];
      return calculateDimensionMatch(userValue, jobValue);
    });

    const avgDimensionScore = dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length;

    // 3. 计算职业价值观匹配
    const valueScore = calculateValueMatch(userProfile.careerValues, job);

    // 4. 综合得分（权重：硬性要求30% + 能力维度50% + 价值观20%）
    const totalScore = Math.round(
      majorScore * 0.3 +
      avgDimensionScore * 0.5 +
      valueScore * 0.2
    );

    // 5. 生成匹配理由和差距
    const reasons = generateMatchReasons(userProfile, job);
    const gaps = generateGaps(userProfile, job);

    return {
      jobId: job.id,
      matchScore: Math.min(100, totalScore),
      dimensionMatch: {
        professional: dimensionScores[0], // technical
        communication: dimensionScores[3], // communication
        leadership: dimensionScores[1],   // framework (近似)
        innovation: dimensionScores[4],   // learning (近似)
        resilience: dimensionScores[2]    // design (近似)
      },
      reasons,
      gaps
    };
  });

  // 按匹配度降序排序
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

// 计算职业价值观匹配度
function calculateValueMatch(careerValues: UserProfile["careerValues"], job: JobPosition): number {
  // 根据岗位类型判断价值观偏好
  const isHighPressure = job.title.includes("算法") || job.title.includes("开发");
  const isStable = job.department.includes("CSIG") || job.department.includes("云");

  let score = 70; // 基础分

  if (isHighPressure && careerValues.challenge >= 4) score += 15;
  if (isStable && careerValues.stability >= 4) score += 15;
  if (careerValues.growth >= 4) score += 10;

  return Math.min(100, score);
}

// 模拟岗位数据（从 match/page.tsx 迁移并增强）
export const JOB_POSITIONS: JobPosition[] = [
  {
    id: "frontend",
    title: "前端开发工程师",
    department: "微信事业群 / WXG",
    description: "负责微信、QQ 等产品的 Web 前端开发，需要扎实的 JavaScript/TypeScript 基础和 React/Vue 框架经验。",
    requirements: {
      skills: ["JavaScript", "TypeScript", "React", "Vue", "CSS", "HTML"],
      experience: "有前端项目经验，了解前端工程化",
      education: "本科及以上，计算机相关专业优先",
    },
    radarData: {
      technical: 90,
      framework: 85,
      design: 60,
      communication: 70,
      learning: 80,
    },
    softRequirements: {
      communication: 70,
      resilience: 75,
      leadership: 50,
      innovation: 80
    }
  },
  {
    id: "backend",
    title: "后端开发工程师",
    department: "云与智慧产业事业群 / CSIG",
    description: "负责腾讯云后台服务开发，需要扎实的计算机基础和分布式系统知识。",
    requirements: {
      skills: ["Java", "Go", "C++", "分布式", "数据库", "微服务"],
      experience: "有后端开发经验，了解高并发系统设计",
      education: "本科及以上，计算机/软件工程相关专业",
    },
    radarData: {
      technical: 95,
      framework: 70,
      design: 40,
      communication: 65,
      learning: 75,
    },
    softRequirements: {
      communication: 60,
      resilience: 80,
      leadership: 55,
      innovation: 70
    }
  },
  {
    id: "ai",
    title: "AI/算法工程师",
    department: "AI Lab / 机器学习平台",
    description: "从事机器学习、深度学习算法研发，需要扎实的数学基础和编程能力。",
    requirements: {
      skills: ["Python", "PyTorch", "TensorFlow", "机器学习", "数学", "算法"],
      experience: "有算法竞赛或论文发表经历优先",
      education: "硕士及以上，AI/数学/统计相关专业",
    },
    radarData: {
      technical: 95,
      framework: 60,
      design: 30,
      communication: 55,
      learning: 90,
    },
    softRequirements: {
      communication: 50,
      resilience: 85,
      leadership: 45,
      innovation: 95
    }
  },
  {
    id: "product",
    title: "产品经理",
    department: "平台与内容事业群 / PCG",
    description: "负责产品设计和管理，需要敏锐的用户洞察力和优秀的需求分析能力。",
    requirements: {
      skills: ["产品设计", "需求分析", "数据分析", "原型设计", "沟通协调"],
      experience: "有产品实习经验，了解互联网产品流程",
      education: "本科及以上，专业不限",
    },
    radarData: {
      technical: 40,
      framework: 30,
      design: 85,
      communication: 95,
      learning: 80,
    },
    softRequirements: {
      communication: 95,
      resilience: 70,
      leadership: 90,
      innovation: 85
    }
  },
  {
    id: "design",
    title: "UI/UX设计师",
    department: "互动娱乐事业群 / IEG",
    description: "负责游戏和产品的视觉设计，需要优秀的审美和用户体验意识。",
    requirements: {
      skills: ["Figma", "Sketch", "Photoshop", "交互设计", "视觉设计"],
      experience: "有设计作品集，了解设计系统",
      education: "本科及以上，设计相关专业",
    },
    radarData: {
      technical: 30,
      framework: 25,
      design: 95,
      communication: 80,
      learning: 70,
    },
    softRequirements: {
      communication: 80,
      resilience: 65,
      leadership: 60,
      innovation: 90
    }
  },
];
