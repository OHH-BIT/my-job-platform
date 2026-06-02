// 前辈说 - 帖子共享内存存储
// 供 create 和 list API 共同使用
// 注意：服务器重启后数据丢失，生产环境应接入数据库

// ============================================
// 统一帖子类型（兼容 AI 分析卡片和用户发布帖）
// ============================================

export interface UnifiedPost {
  id: string;
  title?: string;
  content: string;
  images?: string[];
  tags?: string[];
  type?: string;
  company?: string;
  position?: string;
  topicTags?: string[];
  mentor?: {
    anonymousLabel?: string;
    currentCompany?: string;
    currentPosition?: string;
    yearsOfExperience?: number;
    avatar?: string;
  };
  aiAnalysis?: {
    recommendationScore?: number;
    salaryCompetitiveness?: number;
    workLifeBalance?: number;
    teamAtmosphere?: number;
    growthSpace?: number;
    interviewDifficulty?: number;
    coreSummary?: string;
    representativeQuotes?: string[];
    sanitizedContent?: string;
  };
  author?: {
    id: string;
    name: string;
    avatar: string;
    company?: string;
    position?: string;
  };
  likes: number;
  comments: number;
  createdAt: string;
  sharedAt?: string;
  isLiked: boolean;
  isAnonymous?: boolean;
}

// ============================================
// AI 分析的模拟卡片数据
// ============================================

export const aiMockPosts: UnifiedPost[] = [
  {
    id: "ai_1",
    type: "interview_experience",
    company: "tencent",
    position: "frontend",
    topicTags: ["interview_pitfalls", "team_atmosphere"],
    mentor: {
      anonymousLabel: "18届学长",
      currentCompany: "腾讯",
      currentPosition: "前端开发工程师",
      yearsOfExperience: 6,
      avatar: "/avatars/mentor1.jpg",
    },
    aiAnalysis: {
      recommendationScore: 85,
      salaryCompetitiveness: 88,
      workLifeBalance: 65,
      teamAtmosphere: 90,
      growthSpace: 82,
      interviewDifficulty: 78,
      coreSummary: "腾讯前端面试重视基础和项目深度，算法难度中等偏上，项目经历是关键加分项。",
      representativeQuotes: ["面试官更看重你解决问题的思路，而不是答案本身"],
      sanitizedContent: "腾讯前端面试主要考察React、TypeScript和算法。一面重点聊项目经历，二面手写代码加系统设计，三面HR面。整体体验不错，面试官很专业。",
    },
    originalContent: "腾讯前端面试主要考察React、TypeScript和算法...",
    content: "腾讯前端面试主要考察React、TypeScript和算法。一面重点聊项目经历，二面手写代码加系统设计，三面HR面。整体体验不错，面试官很专业。",
    likes: 42,
    comments: 12,
    createdAt: "2026-05-28T10:00:00Z",
    sharedAt: "2026-05-28T10:00:00Z",
    isLiked: false,
    isAnonymous: true,
  },
  {
    id: "ai_2",
    type: "work_life",
    company: "byte_dance",
    position: "backend",
    topicTags: ["overtime", "work_life_balance"],
    mentor: {
      anonymousLabel: "5年后端老兵",
      currentCompany: "字节跳动",
      currentPosition: "后端开发工程师",
      yearsOfExperience: 5,
      avatar: "/avatars/mentor2.jpg",
    },
    aiAnalysis: {
      recommendationScore: 72,
      salaryCompetitiveness: 95,
      workLifeBalance: 45,
      teamAtmosphere: 75,
      growthSpace: 80,
      coreSummary: "字节薪资确实有竞争力，但工作节奏快，加班是常态。适合想要快速成长的年轻人。",
      representativeQuotes: ["薪资给到位了，加班也就能接受了", "弹性工作制是反义词"],
      sanitizedContent: "字节的薪资在行业里确实很有竞争力，但加班也确实多。不过项目很有挑战性，学到的东西也多。",
    },
    originalContent: "字节的薪资在行业里确实很有竞争力...",
    content: "字节的薪资在行业里确实很有竞争力，但加班也确实多。不过项目很有挑战性，学到的东西也多。技术栈很新，能接触到大流量高并发的场景。",
    likes: 28,
    comments: 8,
    createdAt: "2026-05-25T14:30:00Z",
    sharedAt: "2026-05-25T14:30:00Z",
    isLiked: true,
    isAnonymous: true,
  },
  {
    id: "ai_3",
    type: "interview_tips",
    company: "alibaba",
    position: "fullstack",
    topicTags: ["interview_pitfalls", "salary_truth"],
    mentor: {
      anonymousLabel: "22届学姐",
      currentCompany: "阿里巴巴",
      currentPosition: "全栈开发工程师",
      yearsOfExperience: 4,
      avatar: "/avatars/mentor3.jpg",
    },
    aiAnalysis: {
      recommendationScore: 90,
      salaryCompetitiveness: 82,
      workLifeBalance: 70,
      teamAtmosphere: 85,
      growthSpace: 88,
      coreSummary: "简历要针对岗位JD做关键词匹配，突出量化成果。面试时自信表达比纠结细节更重要。",
      representativeQuotes: ["简历用STAR法则写，面试官一看就懂", "拿到5个Offer靠的是简历优化和面试准备"],
      sanitizedContent: "分享简历优化经验。STAR法则写简历效果很好，项目成果要量化。面试准备包括算法、项目复盘、系统设计。",
    },
    originalContent: "分享简历优化经验...",
    content: "分享简历优化经验。STAR法则写简历效果很好，项目成果要量化。面试准备包括算法、项目复盘、系统设计。拿到5个Offer的关键是针对性准备每个公司的面试重点。",
    likes: 65,
    comments: 23,
    createdAt: "2026-05-20T09:15:00Z",
    sharedAt: "2026-05-20T09:15:00Z",
    isLiked: false,
    isAnonymous: true,
  },
  {
    id: "ai_4",
    type: "team_culture",
    company: "huawei",
    position: "ai_engineer",
    topicTags: ["team_atmosphere", "growth_space"],
    mentor: {
      anonymousLabel: "3年AI工程师",
      currentCompany: "华为",
      currentPosition: "AI工程师",
      yearsOfExperience: 3,
      avatar: "/avatars/mentor4.jpg",
    },
    aiAnalysis: {
      recommendationScore: 78,
      salaryCompetitiveness: 80,
      workLifeBalance: 55,
      teamAtmosphere: 72,
      growthSpace: 90,
      coreSummary: "华为AI团队技术氛围浓厚，能接触到前沿项目。但管理风格偏传统，自由度不如互联网公司。",
      representativeQuotes: ["在这里真的能学到很多前沿AI技术"],
      sanitizedContent: "华为AI团队技术氛围浓厚，项目涉及大模型、计算机视觉等前沿领域。团队同事都很强，能学到很多。",
    },
    originalContent: "华为AI团队技术氛围浓厚...",
    content: "华为AI团队技术氛围浓厚，项目涉及大模型、计算机视觉等前沿领域。团队同事都很强，能学到很多。不过管理相对严格，加班也是有的。",
    likes: 38,
    comments: 15,
    createdAt: "2026-05-18T16:00:00Z",
    sharedAt: "2026-05-18T16:00:00Z",
    isLiked: false,
    isAnonymous: true,
  },
  {
    id: "ai_5",
    type: "career_growth",
    company: "meituan",
    position: "product_manager",
    topicTags: ["growth_space", "work_life_balance"],
    mentor: {
      anonymousLabel: "4年产品经理",
      currentCompany: "美团",
      currentPosition: "产品经理",
      yearsOfExperience: 4,
      avatar: "/avatars/mentor5.jpg",
    },
    aiAnalysis: {
      recommendationScore: 82,
      salaryCompetitiveness: 78,
      workLifeBalance: 68,
      teamAtmosphere: 80,
      growthSpace: 85,
      coreSummary: "美团产品体系成熟，新人有完善的培养机制。从外卖到到店到优选，业务线丰富，晋升通道清晰。",
      representativeQuotes: ["美团的产品体系确实很成熟，新人成长快"],
      sanitizedContent: "美团产品体系成熟，新人培养机制完善。从外卖到到店到优选，业务线丰富。晋升通道相对清晰。",
    },
    originalContent: "美团产品体系成熟...",
    content: "美团产品体系成熟，新人培养机制完善。从外卖到到店到优选，业务线丰富。晋升通道相对清晰。每周都有产品分享会，能学到很多同行经验。",
    likes: 31,
    comments: 9,
    createdAt: "2026-05-15T11:00:00Z",
    sharedAt: "2026-05-15T11:00:00Z",
    isLiked: false,
    isAnonymous: true,
  },
];

// ============================================
// 用户发布的帖子存储（通过 create API 写入）
// ============================================

export const userPosts: UnifiedPost[] = [];
