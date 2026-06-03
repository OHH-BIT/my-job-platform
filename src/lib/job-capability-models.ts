/**
 * 岗位能力模型 — 为核心目标岗位预设"能力标签集"
 *
 * 每个岗位定义三类标签：
 *  - requiredTags：必需能力标签（缺失会显著降低匹配度）
 *  - preferredTags：加分能力标签（拥有可提升匹配度）
 *  - bonusTags：额外加分标签（锦上添花）
 */

// ============================================
// 类型定义
// ============================================

export interface JobCapabilityModel {
  positionId: string;
  title: string;
  category: 'technical' | 'product' | 'design' | 'business' | 'emerging';
  description: string;
  typicalCompanies: string[];
  salaryRange: string;
  requiredTags: string[];
  preferredTags: string[];
  bonusTags: string[];
  recommendedProjects: string[];
}

// ============================================
// 核心岗位能力模型
// ============================================

export const JOB_CAPABILITY_MODELS: JobCapabilityModel[] = [
  {
    positionId: 'data_analyst',
    title: '数据分析师',
    category: 'technical',
    description: '通过数据挖掘和分析，驱动业务决策。需要扎实的统计学基础和数据处理能力。',
    typicalCompanies: ['腾讯', '字节跳动', '美团', '快手', '小红书'],
    salaryRange: '15-35K/月',
    requiredTags: ['sql', 'python', 'data_analysis', 'data_visualization', 'excel'],
    preferredTags: ['math', 'data_structure', 'ml', 'r', 'math_modeling', 'data_project'],
    bonusTags: ['kaggle', 'big_company_intern', 'ppt', 'pytorch', 'llm'],
    recommendedProjects: ['math_modeling', 'kaggle', 'data_project', 'big_company_intern'],
  },
  {
    positionId: 'frontend_dev',
    title: '前端开发工程师',
    category: 'technical',
    description: '负责Web产品的前端开发与优化，需要扎实的JavaScript基础和主流框架经验。',
    typicalCompanies: ['腾讯', '字节跳动', '阿里', '美团', '拼多多'],
    salaryRange: '18-40K/月',
    requiredTags: ['javascript', 'html_css', 'react'],
    preferredTags: ['typescript', 'nextjs', 'vue', 'tailwindcss', 'git', 'nodejs', 'data_structure'],
    bonusTags: ['full_stack_project', 'personal_project', 'big_company_intern', 'docker', 'linux'],
    recommendedProjects: ['full_stack_project', 'personal_project', 'hackathon', 'big_company_intern'],
  },
  {
    positionId: 'backend_dev',
    title: '后端开发工程师',
    category: 'technical',
    description: '负责服务端架构设计与开发，需要扎实的计算机基础和系统设计能力。',
    typicalCompanies: ['腾讯', '阿里', '字节跳动', '华为', '美团'],
    salaryRange: '20-45K/月',
    requiredTags: ['java', 'sql', 'data_structure', 'linux', 'git'],
    preferredTags: ['springboot', 'docker', 'go', 'cpp', 'python', 'k8s', 'nodejs'],
    bonusTags: ['big_company_intern', 'acm', 'personal_project', 'research_project'],
    recommendedProjects: ['full_stack_project', 'personal_project', 'acm', 'big_company_intern', 'research_project'],
  },
  {
    positionId: 'ai_engineer',
    title: 'AI算法工程师',
    category: 'technical',
    description: '从事机器学习/深度学习算法研究与落地，需要扎实的数学和编程基础。',
    typicalCompanies: ['腾讯AI Lab', '字节AI', '百度', '商汤', '旷视'],
    salaryRange: '30-60K/月',
    requiredTags: ['python', 'ml', 'dl', 'math'],
    preferredTags: ['pytorch', 'tensorflow', 'data_analysis', 'sql', 'data_structure', 'paper'],
    bonusTags: ['nlp', 'cv', 'llm', 'kaggle', 'research_project', 'paper', 'math_modeling'],
    recommendedProjects: ['kaggle', 'ai_project', 'research_project', 'paper', 'math_modeling', 'patent'],
  },
  {
    positionId: 'nlp_engineer',
    title: 'NLP/大模型工程师',
    category: 'technical',
    description: '从事自然语言处理、大语言模型应用研发，是当前最热门的方向之一。',
    typicalCompanies: ['智谱AI', '月之暗面', '百度', '阿里', '字节跳动'],
    salaryRange: '35-70K/月',
    requiredTags: ['python', 'ml', 'dl', 'nlp'],
    preferredTags: ['pytorch', 'llm', 'data_structure', 'sql', 'linux', 'git'],
    bonusTags: ['paper', 'research_project', 'kaggle', 'data_analysis', 'cv'],
    recommendedProjects: ['ai_project', 'research_project', 'paper', 'kaggle', 'hackathon'],
  },
  {
    positionId: 'product_manager',
    title: '产品经理',
    category: 'product',
    description: '负责产品规划、需求分析和项目管理，需要敏锐的用户洞察力和沟通协调能力。',
    typicalCompanies: ['腾讯', '字节跳动', '阿里', '美团', '小红书'],
    salaryRange: '18-40K/月',
    requiredTags: ['data_analysis', 'ppt', 'writing'],
    preferredTags: ['figma', 'data_visualization', 'excel', 'big_company_intern', 'student_org', 'dachuang'],
    bonusTags: ['hackathon', 'innovation_comp', 'challenge_cup', 'full_stack_project', 'startup_intern', 'video_editing'],
    recommendedProjects: ['big_company_intern', 'student_org', 'dachuang', 'innovation_comp', 'challenge_cup'],
  },
  {
    positionId: 'ui_designer',
    title: 'UI/UX设计师',
    category: 'design',
    description: '负责产品视觉设计和用户体验优化，需要优秀的审美和设计工具操作能力。',
    typicalCompanies: ['腾讯', '字节跳动', '网易', '小红书', '蚂蚁集团'],
    salaryRange: '15-35K/月',
    requiredTags: ['figma', 'photoshop'],
    preferredTags: ['illustrator', 'sketch', 'after_effects', 'html_css', 'javascript', 'tailwindcss'],
    bonusTags: ['blender', 'video_editing', 'personal_project', 'dachuang', 'hackathon'],
    recommendedProjects: ['personal_project', 'dachuang', 'hackathon', 'innovation_comp'],
  },
  {
    positionId: 'devops',
    title: 'DevOps工程师',
    category: 'technical',
    description: '负责CI/CD流水线、基础设施自动化和运维平台建设。',
    typicalCompanies: ['腾讯云', '阿里云', '华为云', '字节跳动'],
    salaryRange: '20-45K/月',
    requiredTags: ['linux', 'docker', 'git'],
    preferredTags: ['k8s', 'python', 'go', 'nodejs', 'sql'],
    bonusTags: ['big_company_intern', 'personal_project', 'research_project'],
    recommendedProjects: ['personal_project', 'full_stack_project', 'big_company_intern'],
  },
  {
    positionId: 'fullstack_dev',
    title: '全栈开发工程师',
    category: 'technical',
    description: '独立完成前后端开发，需要广泛的技术栈和系统设计能力。',
    typicalCompanies: ['蚂蚁集团', '字节跳动', '快手', '创业公司'],
    salaryRange: '20-45K/月',
    requiredTags: ['javascript', 'html_css', 'react', 'sql', 'git'],
    preferredTags: ['nodejs', 'nextjs', 'python', 'java', 'go', 'typescript', 'docker', 'linux', 'tailwindcss'],
    bonusTags: ['full_stack_project', 'personal_project', 'big_company_intern', 'k8s'],
    recommendedProjects: ['full_stack_project', 'personal_project', 'hackathon', 'big_company_intern'],
  },
  {
    positionId: 'data_engineer',
    title: '数据工程师',
    category: 'technical',
    description: '负责数据仓库建设、ETL流程和数据管道开发。',
    typicalCompanies: ['腾讯', '阿里', '字节跳动', '快手', '拼多多'],
    salaryRange: '20-45K/月',
    requiredTags: ['sql', 'python', 'linux', 'git'],
    preferredTags: ['java', 'go', 'spark', 'docker', 'k8s', 'data_analysis', 'data_structure'],
    bonusTags: ['big_company_intern', 'personal_project', 'kaggle', 'research_project'],
    recommendedProjects: ['data_project', 'full_stack_project', 'big_company_intern', 'kaggle'],
  },
];

// ============================================
// 便捷访问
// ============================================

/** 根据 positionId 查找岗位模型 */
export function getJobModel(positionId: string): JobCapabilityModel | undefined {
  return JOB_CAPABILITY_MODELS.find(m => m.positionId === positionId);
}

/** 获取所有岗位 ID 列表 */
export function getAllPositionIds(): string[] {
  return JOB_CAPABILITY_MODELS.map(m => m.positionId);
}
