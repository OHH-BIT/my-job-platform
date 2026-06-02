/**
 * 岗位基准库 API
 * GET /api/job-benchmarks?title=xxx
 * GET /api/job-benchmarks?category=xxx
 * 
 * 提供覆盖多个细分领域和职级的真实岗位能力模型
 */

import { NextRequest, NextResponse } from 'next/server';
import { JobBenchmark } from '@/data/growth-path-models';

// ============================================
// 真实岗位基准数据库
// 数据来源：基于主流招聘平台真实JD提炼的标准能力模型
// ============================================

const jobBenchmarks: JobBenchmark[] = [
  // ==================== 技术类 ====================
  {
    id: 'job_frontend_senior',
    jobTitle: '高级前端开发工程师',
    companyLevel: '大厂',
    department: '技术',
    requiredSkills: [
      { name: 'JavaScript', minLevel: 85, weight: 0.25, isRequired: true },
      { name: 'TypeScript', minLevel: 80, weight: 0.20, isRequired: true },
      { name: 'React', minLevel: 80, weight: 0.20, isRequired: true },
      { name: 'CSS', minLevel: 85, weight: 0.15, isRequired: true },
      { name: '性能优化', minLevel: 75, weight: 0.15, isRequired: true },
      { name: 'Webpack/Vite', minLevel: 70, weight: 0.10, isRequired: false },
      { name: 'Next.js', minLevel: 65, weight: 0.10, isRequired: false },
      { name: 'Node.js', minLevel: 60, weight: 0.10, isRequired: false },
      { name: '单元测试', minLevel: 65, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '用户体验意识', minLevel: 80, weight: 0.3 },
      { name: '沟通协作', minLevel: 70, weight: 0.3 },
      { name: '创新思维', minLevel: 70, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 80, communication: 65, leadership: 60, innovation: 75, resilience: 70 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['计算机科学与技术', '软件工程', '电子信息工程'] },
    experienceRequirement: { minYears: 3, preferredCompanies: ['腾讯', '阿里巴巴', '字节跳动', '美团', '拼多多'] },
    salaryRange: { min: 25000, max: 45000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'job_frontend_mid',
    jobTitle: '前端开发工程师',
    companyLevel: '大厂',
    department: '技术',
    requiredSkills: [
      { name: 'JavaScript', minLevel: 75, weight: 0.25, isRequired: true },
      { name: 'CSS', minLevel: 80, weight: 0.20, isRequired: true },
      { name: 'HTML', minLevel: 85, weight: 0.15, isRequired: true },
      { name: 'React', minLevel: 70, weight: 0.20, isRequired: true },
      { name: 'TypeScript', minLevel: 65, weight: 0.15, isRequired: false },
      { name: 'Vue', minLevel: 65, weight: 0.15, isRequired: false },
    ],
    softSkills: [
      { name: '用户体验意识', minLevel: 70, weight: 0.3 },
      { name: '沟通协作', minLevel: 65, weight: 0.3 },
      { name: '学习能力', minLevel: 70, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 70, communication: 60, leadership: 50, innovation: 65, resilience: 60 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['计算机科学与技术', '软件工程'] },
    experienceRequirement: { minYears: 1, preferredCompanies: [] },
    salaryRange: { min: 15000, max: 30000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'job_backend_senior',
    jobTitle: '高级后端开发工程师',
    companyLevel: '大厂',
    department: '技术',
    requiredSkills: [
      { name: 'Go', minLevel: 80, weight: 0.20, isRequired: true },
      { name: '分布式系统', minLevel: 80, weight: 0.20, isRequired: true },
      { name: '微服务', minLevel: 75, weight: 0.15, isRequired: true },
      { name: 'MySQL', minLevel: 80, weight: 0.15, isRequired: true },
      { name: 'Redis', minLevel: 75, weight: 0.10, isRequired: true },
      { name: '消息队列', minLevel: 70, weight: 0.10, isRequired: true },
      { name: 'Kubernetes', minLevel: 65, weight: 0.10, isRequired: false },
      { name: 'gRPC', minLevel: 60, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '抗压能力', minLevel: 80, weight: 0.3 },
      { name: '团队协作', minLevel: 75, weight: 0.3 },
      { name: '系统思维', minLevel: 80, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 85, communication: 65, leadership: 70, innovation: 75, resilience: 80 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['计算机科学与技术', '软件工程'] },
    experienceRequirement: { minYears: 3, preferredCompanies: ['腾讯', '阿里巴巴', '字节跳动'] },
    salaryRange: { min: 30000, max: 55000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'job_fullstack_senior',
    jobTitle: '高级全栈工程师',
    companyLevel: '大厂',
    department: '技术',
    requiredSkills: [
      { name: 'JavaScript', minLevel: 85, weight: 0.20, isRequired: true },
      { name: 'TypeScript', minLevel: 80, weight: 0.15, isRequired: true },
      { name: 'React', minLevel: 80, weight: 0.15, isRequired: true },
      { name: 'Node.js', minLevel: 80, weight: 0.15, isRequired: true },
      { name: '数据库', minLevel: 75, weight: 0.15, isRequired: true },
      { name: '系统架构', minLevel: 70, weight: 0.10, isRequired: true },
      { name: 'Docker', minLevel: 65, weight: 0.10, isRequired: false },
      { name: 'CI/CD', minLevel: 60, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '团队协作', minLevel: 75, weight: 0.3 },
      { name: '问题解决', minLevel: 80, weight: 0.3 },
      { name: '沟通能力', minLevel: 70, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 85, communication: 70, leadership: 70, innovation: 80, resilience: 75 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['计算机科学与技术', '软件工程', '电子信息工程'] },
    experienceRequirement: { minYears: 3, preferredCompanies: ['腾讯', '阿里巴巴', '字节跳动'] },
    salaryRange: { min: 30000, max: 50000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'job_java_backend',
    jobTitle: 'Java后端开发工程师',
    companyLevel: '大厂',
    department: '技术',
    requiredSkills: [
      { name: 'Java', minLevel: 80, weight: 0.25, isRequired: true },
      { name: 'Spring Boot', minLevel: 80, weight: 0.20, isRequired: true },
      { name: 'MySQL', minLevel: 80, weight: 0.15, isRequired: true },
      { name: 'Redis', minLevel: 70, weight: 0.10, isRequired: true },
      { name: '分布式系统', minLevel: 70, weight: 0.15, isRequired: true },
      { name: '消息队列', minLevel: 65, weight: 0.10, isRequired: false },
      { name: 'JVM调优', minLevel: 60, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '抗压能力', minLevel: 75, weight: 0.3 },
      { name: '团队协作', minLevel: 70, weight: 0.3 },
      { name: '学习能力', minLevel: 70, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 80, communication: 60, leadership: 60, innovation: 65, resilience: 75 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['计算机科学与技术', '软件工程'] },
    experienceRequirement: { minYears: 2, preferredCompanies: [] },
    salaryRange: { min: 20000, max: 40000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  // ==================== AI/算法类 ====================
  {
    id: 'job_ai_researcher',
    jobTitle: 'AI算法研究员',
    companyLevel: '大厂',
    department: 'AI Lab',
    requiredSkills: [
      { name: 'Python', minLevel: 85, weight: 0.15, isRequired: true },
      { name: '机器学习', minLevel: 85, weight: 0.25, isRequired: true },
      { name: '深度学习', minLevel: 85, weight: 0.25, isRequired: true },
      { name: 'PyTorch/TensorFlow', minLevel: 80, weight: 0.15, isRequired: true },
      { name: '论文阅读与写作', minLevel: 80, weight: 0.15, isRequired: true },
      { name: 'NLP/CV', minLevel: 75, weight: 0.10, isRequired: true },
      { name: '大模型', minLevel: 70, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '创新思维', minLevel: 85, weight: 0.3 },
      { name: '学术写作', minLevel: 80, weight: 0.3 },
      { name: '技术领导力', minLevel: 70, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 90, communication: 60, leadership: 70, innovation: 90, resilience: 70 },
    educationRequirement: { minDegree: 'master', preferredMajors: ['计算机科学与技术', '人工智能', '数学', '统计学'] },
    experienceRequirement: { minYears: 1, preferredCompanies: ['腾讯AI Lab', '百度研究院', '阿里达摩院'] },
    salaryRange: { min: 35000, max: 70000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'job_ml_engineer',
    jobTitle: '机器学习工程师',
    companyLevel: '大厂',
    department: '技术',
    requiredSkills: [
      { name: 'Python', minLevel: 80, weight: 0.20, isRequired: true },
      { name: '机器学习', minLevel: 80, weight: 0.20, isRequired: true },
      { name: 'SQL', minLevel: 75, weight: 0.15, isRequired: true },
      { name: '特征工程', minLevel: 75, weight: 0.15, isRequired: true },
      { name: '深度学习', minLevel: 70, weight: 0.10, isRequired: false },
      { name: 'Spark', minLevel: 65, weight: 0.10, isRequired: false },
      { name: '数据可视化', minLevel: 60, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '数据分析思维', minLevel: 80, weight: 0.3 },
      { name: '团队协作', minLevel: 70, weight: 0.3 },
      { name: '业务理解力', minLevel: 70, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 80, communication: 60, leadership: 55, innovation: 75, resilience: 70 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['计算机科学与技术', '统计学', '数学'] },
    experienceRequirement: { minYears: 2, preferredCompanies: [] },
    salaryRange: { min: 25000, max: 50000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  // ==================== 产品类 ====================
  {
    id: 'job_product_manager',
    jobTitle: '产品经理',
    companyLevel: '大厂',
    department: '产品',
    requiredSkills: [
      { name: '需求分析', minLevel: 80, weight: 0.25, isRequired: true },
      { name: '原型设计', minLevel: 75, weight: 0.15, isRequired: true },
      { name: '数据分析', minLevel: 70, weight: 0.20, isRequired: true },
      { name: '项目管理', minLevel: 75, weight: 0.15, isRequired: true },
      { name: 'SQL', minLevel: 60, weight: 0.10, isRequired: false },
      { name: '竞品分析', minLevel: 70, weight: 0.10, isRequired: false },
      { name: 'Axure/Figma', minLevel: 65, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '沟通协调', minLevel: 85, weight: 0.3 },
      { name: '用户洞察', minLevel: 80, weight: 0.3 },
      { name: '商业思维', minLevel: 75, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 75, communication: 85, leadership: 70, innovation: 80, resilience: 75 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['计算机科学与技术', '工商管理', '心理学', '统计学'] },
    experienceRequirement: { minYears: 2, preferredCompanies: [] },
    salaryRange: { min: 20000, max: 40000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  // ==================== 数据类 ====================
  {
    id: 'job_data_analyst',
    jobTitle: '数据分析师',
    companyLevel: '大厂',
    department: '数据',
    requiredSkills: [
      { name: 'SQL', minLevel: 85, weight: 0.25, isRequired: true },
      { name: 'Python', minLevel: 75, weight: 0.20, isRequired: true },
      { name: '数据可视化', minLevel: 75, weight: 0.15, isRequired: true },
      { name: '统计学', minLevel: 70, weight: 0.15, isRequired: true },
      { name: 'Excel', minLevel: 80, weight: 0.10, isRequired: true },
      { name: 'Tableau/Power BI', minLevel: 65, weight: 0.10, isRequired: false },
      { name: 'A/B测试', minLevel: 60, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '逻辑思维', minLevel: 80, weight: 0.3 },
      { name: '业务理解力', minLevel: 75, weight: 0.3 },
      { name: '沟通表达', minLevel: 70, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 75, communication: 75, leadership: 50, innovation: 65, resilience: 65 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['统计学', '数学', '计算机科学与技术', '经济学'] },
    experienceRequirement: { minYears: 1, preferredCompanies: [] },
    salaryRange: { min: 15000, max: 30000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  // ==================== 设计类 ====================
  {
    id: 'job_ui_designer',
    jobTitle: 'UI/UX设计师',
    companyLevel: '大厂',
    department: '设计',
    requiredSkills: [
      { name: 'Figma', minLevel: 85, weight: 0.25, isRequired: true },
      { name: '视觉设计', minLevel: 80, weight: 0.20, isRequired: true },
      { name: '交互设计', minLevel: 75, weight: 0.20, isRequired: true },
      { name: '用户体验研究', minLevel: 70, weight: 0.15, isRequired: true },
      { name: '设计系统', minLevel: 70, weight: 0.10, isRequired: false },
      { name: '动效设计', minLevel: 60, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '审美能力', minLevel: 85, weight: 0.3 },
      { name: '用户同理心', minLevel: 80, weight: 0.3 },
      { name: '沟通表达', minLevel: 70, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 80, communication: 70, leadership: 55, innovation: 85, resilience: 65 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['视觉传达设计', '工业设计', '交互设计', '计算机'] },
    experienceRequirement: { minYears: 2, preferredCompanies: [] },
    salaryRange: { min: 15000, max: 35000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  // ==================== 运营类 ====================
  {
    id: 'job_product_operations',
    jobTitle: '产品运营',
    companyLevel: '大厂',
    department: '运营',
    requiredSkills: [
      { name: '内容策划', minLevel: 75, weight: 0.20, isRequired: true },
      { name: '数据分析', minLevel: 70, weight: 0.20, isRequired: true },
      { name: '项目管理', minLevel: 70, weight: 0.15, isRequired: true },
      { name: '用户增长', minLevel: 70, weight: 0.15, isRequired: true },
      { name: 'SQL', minLevel: 55, weight: 0.10, isRequired: false },
      { name: '文案写作', minLevel: 65, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '执行力', minLevel: 80, weight: 0.3 },
      { name: '沟通协调', minLevel: 75, weight: 0.3 },
      { name: '创新思维', minLevel: 70, weight: 0.2 },
    ],
    dimensionRequirements: { professional: 65, communication: 80, leadership: 65, innovation: 75, resilience: 70 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['市场营销', '新闻传播', '工商管理'] },
    experienceRequirement: { minYears: 1, preferredCompanies: [] },
    salaryRange: { min: 12000, max: 25000, currency: 'CNY' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  // ==================== 实习/应届生岗位 ====================
  {
    id: 'job_frontend_intern',
    jobTitle: '前端开发实习生',
    companyLevel: '大厂',
    department: '技术',
    requiredSkills: [
      { name: 'HTML', minLevel: 70, weight: 0.20, isRequired: true },
      { name: 'CSS', minLevel: 70, weight: 0.20, isRequired: true },
      { name: 'JavaScript', minLevel: 65, weight: 0.25, isRequired: true },
      { name: 'React', minLevel: 55, weight: 0.15, isRequired: false },
      { name: 'Vue', minLevel: 55, weight: 0.15, isRequired: false },
      { name: 'Git', minLevel: 50, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '学习能力', minLevel: 75, weight: 0.4 },
      { name: '团队协作', minLevel: 65, weight: 0.3 },
      { name: '责任心', minLevel: 70, weight: 0.3 },
    ],
    dimensionRequirements: { professional: 55, communication: 55, leadership: 40, innovation: 60, resilience: 55 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['计算机科学与技术', '软件工程'] },
    experienceRequirement: { minYears: 0, preferredCompanies: [] },
    salaryRange: { min: 200, max: 400, currency: 'CNY/天' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'job_backend_intern',
    jobTitle: '后端开发实习生',
    companyLevel: '大厂',
    department: '技术',
    requiredSkills: [
      { name: 'Java', minLevel: 65, weight: 0.20, isRequired: true },
      { name: 'Python', minLevel: 60, weight: 0.15, isRequired: false },
      { name: 'Go', minLevel: 55, weight: 0.15, isRequired: false },
      { name: '数据库', minLevel: 60, weight: 0.20, isRequired: true },
      { name: 'Git', minLevel: 50, weight: 0.10, isRequired: false },
      { name: 'Linux', minLevel: 55, weight: 0.10, isRequired: false },
    ],
    softSkills: [
      { name: '学习能力', minLevel: 75, weight: 0.4 },
      { name: '团队协作', minLevel: 65, weight: 0.3 },
      { name: '责任心', minLevel: 70, weight: 0.3 },
    ],
    dimensionRequirements: { professional: 55, communication: 55, leadership: 40, innovation: 60, resilience: 55 },
    educationRequirement: { minDegree: 'bachelor', preferredMajors: ['计算机科学与技术', '软件工程'] },
    experienceRequirement: { minYears: 0, preferredCompanies: [] },
    salaryRange: { min: 200, max: 400, currency: 'CNY/天' },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', isActive: true,
  },
];

// ============================================
// GET /api/job-benchmarks?title=xxx&category=xxx
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const category = searchParams.get('category');

    // 按标题模糊匹配
    if (title) {
      const matchedJobs = jobBenchmarks.filter(job =>
        job.jobTitle.includes(title) || title.includes(job.jobTitle)
      );
      if (matchedJobs.length === 0) {
        return NextResponse.json(
          { success: false, error: `未找到与"${title}"匹配的岗位` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: matchedJobs, total: matchedJobs.length });
    }

    // 按分类筛选
    if (category) {
      const categoryMap: Record<string, string> = {
        'tech': '技术', 'ai': 'AI Lab', 'product': '产品', 'data': '数据',
        'design': '设计', 'operations': '运营', 'intern': '实习生',
      };
      const dept = categoryMap[category];
      const matchedJobs = dept
        ? jobBenchmarks.filter(job => job.department.includes(dept) || job.jobTitle.includes('实习'))
        : jobBenchmarks;
      return NextResponse.json({ success: true, data: matchedJobs, total: matchedJobs.length });
    }

    // 返回所有岗位
    return NextResponse.json({ success: true, data: jobBenchmarks, total: jobBenchmarks.length });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: '查询岗位基准失败', details: error.message }, { status: 500 });
  }
}
