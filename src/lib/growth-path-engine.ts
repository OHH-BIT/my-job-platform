/**
 * 智能动态成长路径规划系统 - 核心算法引擎（v2.0）
 * 
 * v2.0 重构：
 * 1. 删除所有Mock数据（loadUserProfile/loadJobBenchmark）
 * 2. 接收前端传递的真实用户画像和目标岗位
 * 3. 差距分析引擎：逐项比对技能、维度、经验
 * 4. 个性化路径生成：基于用户真实年龄、工龄、职业阶段
 */

import {
  UserProfile,
  JobBenchmark,
  GrowthPath,
  SkillGap,
  PathNode,
  LearningResource,
  NodeType,
  PriorityLevel,
  PathStatus,
  calculateGapLevel,
  isCriticalGap
} from '../data/growth-path-models';

// ============================================
// 1. 核心服务类：GrowthPathEngine
// ============================================

export class GrowthPathEngine {
  private userProfile: UserProfile;
  private jobBenchmark: JobBenchmark;

  constructor(userProfile: UserProfile, jobBenchmark: JobBenchmark) {
    this.userProfile = userProfile;
    this.jobBenchmark = jobBenchmark;
  }

  // ============================================
  // 差距分析引擎（Gap Analysis）
  // ============================================

  /**
   * 计算用户与目标岗位的匹配度 + 差距分析
   */
  calculateMatchScore(): {
    overallScore: number;
    dimensionMatch: {
      professional: number;
      communication: number;
      leadership: number;
      innovation: number;
      resilience: number;
    };
    skillGaps: SkillGap[];
    strengthAreas: string[];
    improvementAreas: string[];
  } {
    const dimensionMatch = this.calculateDimensionMatch();
    const skillGaps = this.analyzeSkillGaps();
    const overallScore = this.calculateOverallScore(dimensionMatch, skillGaps);
    const strengthAreas = this.identifyStrengths(dimensionMatch, skillGaps);
    const improvementAreas = this.identifyImprovements(dimensionMatch, skillGaps);

    return { overallScore, dimensionMatch, skillGaps, strengthAreas, improvementAreas };
  }

  private calculateDimensionMatch() {
    const user = this.userProfile.dimensionScores;
    const required = this.jobBenchmark.dimensionRequirements;
    return {
      professional: this.calcDim(user.professional, required.professional),
      communication: this.calcDim(user.communication, required.communication),
      leadership: this.calcDim(user.leadership, required.leadership),
      innovation: this.calcDim(user.innovation, required.innovation),
      resilience: this.calcDim(user.resilience, required.resilience),
    };
  }

  private calcDim(userScore: number, requiredScore: number): number {
    if (requiredScore === 0) return 100;
    return Math.min(Math.round((userScore / requiredScore) * 100), 100);
  }

  /**
   * 分析技能差距 - 核心逻辑
   * 支持模糊匹配：js→JavaScript, ts→TypeScript, 中文别名等
   */
  private analyzeSkillGaps(): SkillGap[] {
    const gaps: SkillGap[] = [];
    const userSkillsMap = new Map(
      this.userProfile.skills.map(s => [s.name.toLowerCase(), s])
    );

    // 别名映射：用户可能使用的缩写/别名 → 标准技能名
    const aliases: Record<string, string[]> = {
      'javascript': ['js', 'javascript', 'es6', 'es2015', 'ecmascript'],
      'typescript': ['ts', 'typescript'],
      'react': ['react', 'reactjs', 'react.js', 'react hooks'],
      'vue': ['vue', 'vuejs', 'vue.js', 'vue3'],
      'node.js': ['node', 'nodejs', 'node.js'],
      'python': ['python', 'py'],
      'java': ['java', 'jdk', 'jvm'],
      'css': ['css', 'css3', 'scss', 'sass', 'less', 'stylus'],
      'html': ['html', 'html5'],
      'go': ['go', 'golang'],
      'sql': ['sql', 'mysql', 'postgresql', 'postgres', 'pg', 'mssql', 'sqlite'],
      'mysql': ['mysql', 'mariadb'],
      'redis': ['redis'],
      'docker': ['docker', 'container', '容器'],
      'kubernetes': ['k8s', 'kubernetes', 'k8'],
      'git': ['git', 'github', 'gitlab'],
      'webpack': ['webpack'],
      'vite': ['vite'],
      'next.js': ['next.js', 'nextjs', 'next'],
      'spring boot': ['springboot', 'spring boot', 'spring'],
      '分布式系统': ['分布式', '分布式系统', '微服务架构', '分布式架构'],
      '微服务': ['微服务', 'microservice', 'microservices'],
      '性能优化': ['性能优化', '性能', '前端性能', 'web性能'],
      '机器学习': ['机器学习', 'ml', 'machine learning'],
      '深度学习': ['深度学习', 'dl', 'deep learning'],
      'pytorch/tensorflow': ['pytorch', 'tensorflow', 'tf', '深度学习框架'],
      'nlp/cv': ['nlp', 'cv', '自然语言处理', '计算机视觉'],
      '大模型': ['大模型', 'llm', 'chatgpt', 'gpt', 'langchain', 'rag'],
      'figma': ['figma', 'sketch', 'xd'],
      '数据分析': ['数据分析', 'data analysis', '统计学'],
      '数据可视化': ['数据可视化', 'echarts', 'd3', 'tableau', 'power bi', 'matplotlib'],
      '原型设计': ['原型设计', 'axure', 'axure/figma', '原型'],
      '需求分析': ['需求分析', 'prd', '需求'],
      '项目管理': ['项目管理', 'project management', 'scrum', 'agile', '敏捷'],
      '内容策划': ['内容策划', '内容运营', '文案'],
      '用户增长': ['用户增长', '增长黑客', 'growth'],
      '文案写作': ['文案', '文案写作', 'copywriting'],
      '单元测试': ['单元测试', 'jest', 'vitest', 'testing'],
      '系统架构': ['系统架构', '架构设计', 'architecture', 'system design'],
    };

    for (const req of this.jobBenchmark.requiredSkills) {
      // 精确匹配
      let userSkill = userSkillsMap.get(req.name.toLowerCase());

      // 模糊匹配：检查用户技能是否是岗位要求技能的别名
      if (!userSkill) {
        const standardName = req.name.toLowerCase();
        const aliasList = aliases[standardName] || [standardName];
        for (const alias of aliasList) {
          userSkill = userSkillsMap.get(alias.toLowerCase());
          if (userSkill) break;
        }
      }

      // 反向模糊匹配：检查岗位要求是否是用户技能的某个别名
      if (!userSkill) {
        for (const [userKey, userVal] of userSkillsMap) {
          const userAliases = aliases[userKey] || [userKey];
          if (userAliases.some(a => a.toLowerCase() === req.name.toLowerCase())) {
            userSkill = userVal;
            break;
          }
        }
      }

      // 子串包含匹配（兜底）
      if (!userSkill) {
        for (const [userKey, userVal] of userSkillsMap) {
          if (req.name.toLowerCase().includes(userKey) || userKey.includes(req.name.toLowerCase())) {
            userSkill = userVal;
            break;
          }
        }
      }

      const currentLevel = userSkill ? userSkill.level : 0;
      const requiredLevel = req.minLevel;
      const gapScore = Math.max(requiredLevel - currentLevel, 0);

      gaps.push({
        skillName: req.name,
        currentLevel,
        requiredLevel,
        gapScore,
        gapLevel: calculateGapLevel(currentLevel, requiredLevel),
        suggestion: this.buildSkillSuggestion(req.name, currentLevel, requiredLevel, req.isRequired),
      });
    }

    return gaps.sort((a, b) => b.gapScore - a.gapScore);
  }

  private buildSkillSuggestion(name: string, current: number, required: number, isRequired: boolean): string {
    const gap = required - current;
    if (gap <= 0) return `你的${name}技能已达标（${current}分），可继续深化。`;
    if (gap <= 10) return `${name}接近达标（差距${gap}分），建议通过实战巩固。`;
    if (gap <= 30) return `${name}有中等差距（差距${gap}分），建议系统学习+实践。`;
    if (gap <= 50) return `${name}差距较大（差距${gap}分），需要制定专项学习计划。`;
    return `${name}严重不达标（差距${gap}分），${isRequired ? '这是必须掌握的技能' : '建议优先学习'}。`;
  }

  private calculateOverallScore(dimMatch: any, skillGaps: SkillGap[]): number {
    const dimWeights = { professional: 0.35, communication: 0.15, leadership: 0.15, innovation: 0.20, resilience: 0.15 };
    const dimScore =
      dimMatch.professional * dimWeights.professional +
      dimMatch.communication * dimWeights.communication +
      dimMatch.leadership * dimWeights.leadership +
      dimMatch.innovation * dimWeights.innovation +
      dimMatch.resilience * dimWeights.resilience;

    let skillScore = 100;
    for (const gap of skillGaps) {
      if (this.jobBenchmark.requiredSkills.find(s => s.name === gap.skillName)?.isRequired) {
        if (gap.gapLevel === 'critical') skillScore -= 20;
        else if (gap.gapLevel === 'high') skillScore -= 10;
        else if (gap.gapLevel === 'medium') skillScore -= 5;
      }
    }
    skillScore = Math.max(skillScore, 0);

    return Math.round((dimScore * 0.6 + skillScore * 0.4) * 100) / 100;
  }

  private identifyStrengths(dimMatch: any, skillGaps: SkillGap[]): string[] {
    const s: string[] = [];
    if (dimMatch.professional >= 80) s.push('专业技能强');
    if (dimMatch.communication >= 80) s.push('沟通协作能力优秀');
    if (dimMatch.innovation >= 80) s.push('创新思维活跃');
    if (dimMatch.resilience >= 80) s.push('抗压能力强');
    const mastered = skillGaps.filter(g => g.gapScore <= 0);
    if (mastered.length > 0) s.push(`已掌握${mastered.map(g => g.skillName).join('、')}`);
    return s;
  }

  private identifyImprovements(dimMatch: any, skillGaps: SkillGap[]): string[] {
    const i: string[] = [];
    if (dimMatch.professional < 60) i.push('专业技能需要提升');
    if (dimMatch.communication < 60) i.push('沟通协作能力需要加强');
    if (dimMatch.innovation < 60) i.push('创新思维需要激发');
    const critical = skillGaps.filter(g => isCriticalGap(g));
    if (critical.length > 0) i.push(`急需提升${critical.map(g => g.skillName).join('、')}`);
    return i;
  }

  // ============================================
  // 个性化路径生成（基于真实年龄/工龄/职业阶段）
  // ============================================

  generateGrowthPath(matchResult: any): GrowthPath {
    const pathNodes = this.generatePathNodes(matchResult.skillGaps);

    return {
      id: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userProfile.userId,
      targetJobId: this.jobBenchmark.id,
      targetJobTitle: this.jobBenchmark.jobTitle,
      matchAnalysis: {
        overallMatchScore: matchResult.overallScore,
        dimensionMatch: matchResult.dimensionMatch,
        skillGaps: matchResult.skillGaps,
        strengthAreas: matchResult.strengthAreas,
        improvementAreas: matchResult.improvementAreas,
      },
      pathNodes,
      status: 'not_started',
      currentNodeIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 根据用户真实职业阶段生成差异化的路径节点
   */
  private generatePathNodes(skillGaps: SkillGap[]): PathNode[] {
    const nodes: PathNode[] = [];
    let order = 0;
    const careerStage = this.userProfile.basicInfo.careerStage;
    const workYears = this.userProfile.basicInfo.workYears;

    // 根据职业阶段调整策略
    if (careerStage === 'freshman_sophomore' || workYears === 0) {
      // === 应届生/大一二：基础技能落地 ===
      const criticalGaps = skillGaps.filter(g => isCriticalGap(g));
      for (const gap of criticalGaps) {
        nodes.push(this.createSkillNode(gap, order++, 'beginner'));
      }
      const mediumGaps = skillGaps.filter(g => g.gapLevel === 'medium');
      for (const gap of mediumGaps) {
        nodes.push(this.createSkillNode(gap, order++, 'beginner'));
      }
      // 应届生重点：基础项目 + 面试准备
      nodes.push(this.createProjectNode(skillGaps, order++, '基础实战项目（适合入门）'));
      nodes.push(this.createInterviewNode(order++, '校招面试准备（算法+八股文+项目介绍）'));
      nodes.push(this.createNetworkingNode(order++, '参加技术社区/校园招聘宣讲会'));

    } else if (careerStage === 'junior_senior' && workYears <= 2) {
      // === 大三四/1-2年经验：技能补齐+项目深化 ===
      const criticalGaps = skillGaps.filter(g => isCriticalGap(g));
      for (const gap of criticalGaps) {
        nodes.push(this.createSkillNode(gap, order++, 'intermediate'));
      }
      nodes.push(this.createProjectNode(skillGaps, order++, '进阶实战项目（适合有基础的开发者）'));
      const mediumGaps = skillGaps.filter(g => g.gapLevel === 'medium');
      for (const gap of mediumGaps) {
        nodes.push(this.createSkillNode(gap, order++, 'intermediate'));
      }
      nodes.push(this.createInterviewNode(order++, '社招面试准备（算法+系统设计+行为面）'));
      if (this.jobBenchmark.jobTitle.includes('高级') || this.jobBenchmark.jobTitle.includes('资深')) {
        nodes.push(this.createCertNode(order++));
      }

    } else if (careerStage === 'master' || (workYears > 2 && workYears <= 5)) {
      // === 硕士/3-5年经验：高阶能力+架构思维 ===
      const criticalGaps = skillGaps.filter(g => isCriticalGap(g));
      for (const gap of criticalGaps) {
        nodes.push(this.createSkillNode(gap, order++, 'advanced'));
      }
      // 高阶：架构设计/技术深度
      nodes.push(this.createArchitectureNode(order++));
      nodes.push(this.createProjectNode(skillGaps, order++, '高阶实战项目（体现架构能力和技术深度）'));
      const mediumGaps = skillGaps.filter(g => g.gapLevel === 'medium');
      for (const gap of mediumGaps) {
        nodes.push(this.createSkillNode(gap, order++, 'advanced'));
      }
      nodes.push(this.createInterviewNode(order++, '高级岗位面试准备（系统设计+技术方案评审+带人经验）'));
      nodes.push(this.createCertNode(order++));
      nodes.push(this.createNetworkingNode(order++, '参加技术大会/开源社区贡献'));

    } else {
      // === 博士/5年以上：专家路线/管理思维 ===
      const criticalGaps = skillGaps.filter(g => isCriticalGap(g));
      for (const gap of criticalGaps) {
        nodes.push(this.createSkillNode(gap, order++, 'advanced'));
      }
      nodes.push(this.createArchitectureNode(order++));
      nodes.push(this.createLeadershipNode(order++));
      nodes.push(this.createProjectNode(skillGaps, order++, '标杆项目（体现技术领导力和行业影响力）'));
      nodes.push(this.createInterviewNode(order++, '专家级面试准备（技术战略+团队建设+业务理解）'));
      nodes.push(this.createCertNode(order++));
      nodes.push(this.createNetworkingNode(order++, '建立行业影响力（技术博客/演讲/开源）'));
    }

    return nodes;
  }

  // ============================================
  // 路径节点工厂方法（针对不同职业阶段定制描述）
  // ============================================

  private createSkillNode(gap: SkillGap, order: number, difficulty: 'beginner' | 'intermediate' | 'advanced'): PathNode {
    const isCritical = isCriticalGap(gap);
    const diffLabel = difficulty === 'beginner' ? '从零开始' : difficulty === 'intermediate' ? '系统进阶' : '深度精通';
    const resources = this.getSkillResources(gap.skillName, gap.currentLevel, gap.requiredLevel, difficulty);

    return {
      id: `node_${Date.now()}_${order}`,
      nodeType: 'skill_learning',
      title: `学习${gap.skillName}`,
      description: `${diffLabel}学习${gap.skillName}。当前水平${gap.currentLevel}分，目标${gap.requiredLevel}分（差距${gap.gapScore}分）。${gap.suggestion}`,
      priority: isCritical ? 'high' : 'medium',
      relatedSkills: [gap.skillName],
      resources,
      completionCriteria: `通过${gap.skillName}相关学习，达到${gap.requiredLevel}分水平`,
      estimatedHours: isCritical ? 80 : 40,
      status: 'not_started', progress: 0, order,
    };
  }

  private createProjectNode(skillGaps: SkillGap[], order: number, description: string): PathNode {
    const topSkills = skillGaps.slice(0, 3).map(g => g.skillName).join('、');
    return {
      id: `node_${Date.now()}_${order}`,
      nodeType: 'project_practice',
      title: '完成实战项目',
      description: `${description}。综合运用${topSkills}等技能，积累真实项目经验。`,
      priority: 'high',
      relatedSkills: skillGaps.map(g => g.skillName),
      resources: this.getProjectResources(),
      completionCriteria: '完成一个完整项目，包含代码、文档、演示，可清晰展示能力',
      estimatedHours: 80,
      status: 'not_started', progress: 0, order,
    };
  }

  private createInterviewNode(order: number, description: string): PathNode {
    return {
      id: `node_${Date.now()}_${order}`,
      nodeType: 'interview_prep',
      title: '面试准备',
      description: `${description}。针对${this.jobBenchmark.jobTitle}岗位做针对性准备。`,
      priority: 'medium',
      relatedSkills: this.jobBenchmark.requiredSkills.map(s => s.name),
      resources: this.getInterviewResources(),
      completionCriteria: '完成算法练习、系统设计准备、自我介绍和项目介绍',
      estimatedHours: 40,
      status: 'not_started', progress: 0, order,
    };
  }

  private createCertNode(order: number): PathNode {
    return {
      id: `node_${Date.now()}_${order}`,
      nodeType: 'certification',
      title: '获取专业认证',
      description: `考取${this.jobBenchmark.jobTitle}相关认证，提升简历竞争力。`,
      priority: 'low',
      relatedSkills: this.jobBenchmark.requiredSkills.filter(s => s.isRequired).map(s => s.name),
      resources: this.getCertResources(),
      completionCriteria: '通过一项与目标岗位相关的专业认证考试',
      estimatedHours: 50,
      status: 'not_started', progress: 0, order,
    };
  }

  private createNetworkingNode(order: number, description: string): PathNode {
    return {
      id: `node_${Date.now()}_${order}`,
      nodeType: 'networking',
      title: '拓展技术人脉',
      description: description,
      priority: 'low',
      relatedSkills: [],
      resources: [
        { id: `res_${Date.now()}`, type: 'article', title: '参加技术社区/技术大会', difficulty: 'beginner' as const, durationHours: 20, isFree: true },
      ],
      completionCriteria: '参加至少2次技术活动或贡献1次开源项目',
      estimatedHours: 20,
      status: 'not_started', progress: 0, order,
    };
  }

  private createArchitectureNode(order: number): PathNode {
    return {
      id: `node_${Date.now()}_${order}`,
      nodeType: 'skill_learning',
      title: '系统架构与设计能力',
      description: `针对${this.jobBenchmark.jobTitle}岗位，深入学习系统架构设计、高可用方案、性能优化等高阶能力。`,
      priority: 'high',
      relatedSkills: ['系统架构', '分布式系统', '性能优化'],
      resources: this.getArchitectureResources(),
      completionCriteria: '掌握主流架构模式，能独立完成中型系统的架构设计方案',
      estimatedHours: 60,
      status: 'not_started', progress: 0, order,
    };
  }

  private createLeadershipNode(order: number): PathNode {
    return {
      id: `node_${Date.now()}_${order}`,
      nodeType: 'skill_learning',
      title: '技术领导力与管理思维',
      description: `培养技术团队管理能力，包括技术规划、代码评审、团队建设、跨部门沟通等。`,
      priority: 'medium',
      relatedSkills: ['技术领导力', '项目管理', '沟通能力'],
      resources: this.getLeadershipResources(),
      completionCriteria: '具备带领小团队完成技术项目的能力',
      estimatedHours: 40,
      status: 'not_started', progress: 0, order,
    };
  }

  // ============================================
  // 学习资源推荐（针对不同阶段定制）
  // ============================================

  private getSkillResources(skill: string, current: number, required: number, difficulty: 'beginner' | 'intermediate' | 'advanced'): LearningResource[] {
    const diff = difficulty;
    return [
      {
        id: `res_${Date.now()}_1`, type: 'course',
        title: `${skill} ${diff === 'beginner' ? '入门' : diff === 'intermediate' ? '进阶' : '精通'}课程`,
        difficulty: diff, durationHours: diff === 'beginner' ? 20 : 40, isFree: false,
      },
      {
        id: `res_${Date.now()}_2`, type: 'documentation',
        title: `${skill} 官方文档`,
        difficulty: diff === 'beginner' ? 'beginner' : 'intermediate' as const, durationHours: 15, isFree: true,
      },
      {
        id: `res_${Date.now()}_3`, type: 'project',
        title: `${skill} ${diff === 'beginner' ? '基础' : '综合'}实战项目`,
        difficulty: diff === 'beginner' ? 'beginner' : 'advanced' as const, durationHours: 30, isFree: true,
      },
    ];
  }

  private getProjectResources(): LearningResource[] {
    return [
      { id: `res_proj_${Date.now()}`, type: 'project', title: '实战项目推荐', difficulty: 'intermediate', durationHours: 80, isFree: true },
    ];
  }

  private getInterviewResources(): LearningResource[] {
    return [
      { id: `res_int_${Date.now()}`, type: 'course', title: '面试准备指南', difficulty: 'intermediate', durationHours: 30, isFree: true },
    ];
  }

  private getCertResources(): LearningResource[] {
    return [
      { id: `res_cert_${Date.now()}`, type: 'certification', title: '专业认证指南', difficulty: 'advanced', durationHours: 50, isFree: false },
    ];
  }

  private getArchitectureResources(): LearningResource[] {
    return [
      { id: `res_arch_${Date.now()}`, type: 'book', title: '系统架构设计经典书籍', difficulty: 'advanced', durationHours: 40, isFree: false },
      { id: `res_arch2_${Date.now()}`, type: 'course', title: '分布式系统设计课程', difficulty: 'advanced', durationHours: 30, isFree: false },
    ];
  }

  private getLeadershipResources(): LearningResource[] {
    return [
      { id: `res_lead_${Date.now()}`, type: 'book', title: '技术管理类书籍推荐', difficulty: 'intermediate', durationHours: 20, isFree: false },
    ];
  }
}

// ============================================
// 2. 对外API（不再提供Mock数据加载函数）
// ============================================

/**
 * 生成成长路径（接收前端传递的真实数据）
 * @deprecated 请使用 GrowthPathEngine 类直接调用
 */
export async function generateGrowthPathForUser(
  userProfile: UserProfile,
  jobBenchmark: JobBenchmark
): Promise<GrowthPath> {
  const engine = new GrowthPathEngine(userProfile, jobBenchmark);
  const matchResult = engine.calculateMatchScore();
  return engine.generateGrowthPath(matchResult);
}

// ============================================
// 3. 本地存储管理（保留，供前端使用）
// ============================================

export function saveGrowthPath(path: GrowthPath): void {
  if (typeof window !== 'undefined') {
    const paths = loadAllGrowthPaths();
    paths.push(path);
    localStorage.setItem('growth_paths', JSON.stringify(paths));
  }
}

export function loadAllGrowthPaths(): GrowthPath[] {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('growth_paths');
    return data ? JSON.parse(data) : [];
  }
  return [];
}

export function updatePathNodeStatus(
  pathId: string, nodeId: string, newStatus: PathStatus, progress: number
): GrowthPath | null {
  const paths = loadAllGrowthPaths();
  const idx = paths.findIndex(p => p.id === pathId);
  if (idx === -1) return null;

  const path = paths[idx];
  const nIdx = path.pathNodes.findIndex(n => n.id === nodeId);
  if (nIdx === -1) return null;

  path.pathNodes[nIdx].status = newStatus;
  path.pathNodes[nIdx].progress = progress;
  if (newStatus === 'in_progress' && !path.pathNodes[nIdx].startedAt) {
    path.pathNodes[nIdx].startedAt = new Date().toISOString();
  }
  if (newStatus === 'completed' && !path.pathNodes[nIdx].completedAt) {
    path.pathNodes[nIdx].completedAt = new Date().toISOString();
  }
  path.updatedAt = new Date().toISOString();

  const allDone = path.pathNodes.every(n => n.status === 'completed');
  if (allDone) {
    path.status = 'completed';
    path.completedAt = new Date().toISOString();
  } else {
    const ci = path.pathNodes.findIndex(n => n.status === 'in_progress' || n.status === 'not_started');
    path.currentNodeIndex = ci >= 0 ? ci : 0;
  }

  paths[idx] = path;
  localStorage.setItem('growth_paths', JSON.stringify(paths));
  return path;
}
