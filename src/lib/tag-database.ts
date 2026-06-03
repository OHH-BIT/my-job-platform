/**
 * 标签数据库 — 大学生常见技能、项目经历、目标岗位
 *
 * 每个标签附带 Emoji 图标，用于前端展示。
 * 标签按类别分组，支持用户画像的多维度标签选择。
 */

// ============================================
// 标签基础类型
// ============================================

export type TagCategory = 'skill' | 'project' | 'position';

export interface Tag {
  id: string;        // 唯一标识（slug 形式）
  name: string;      // 显示名称
  emoji: string;     // 图标
  category: TagCategory;
  keywords?: string[]; // 别名/关键词，用于模糊匹配
}

// ============================================
// 技能标签库（Skill Tags）
// ============================================

export const SKILL_TAGS: Tag[] = [
  // --- 编程语言 ---
  { id: 'python', name: 'Python', emoji: '🐍', category: 'skill', keywords: ['py', 'python3'] },
  { id: 'javascript', name: 'JavaScript', emoji: '⚡', category: 'skill', keywords: ['js', 'es6', 'typescript', 'ts'] },
  { id: 'java', name: 'Java', emoji: '☕', category: 'skill', keywords: ['jdk', 'spring'] },
  { id: 'cpp', name: 'C/C++', emoji: '⚙️', category: 'skill', keywords: ['c语言', 'c++', 'clang'] },
  { id: 'go', name: 'Go', emoji: '🦫', category: 'skill', keywords: ['golang'] },
  { id: 'rust', name: 'Rust', emoji: '🦀', category: 'skill' },
  { id: 'sql', name: 'SQL', emoji: '🗃️', category: 'skill', keywords: ['mysql', 'postgresql', '数据库', 'db'] },
  { id: 'r', name: 'R语言', emoji: '📊', category: 'skill', keywords: ['rstudio'] },
  { id: 'swift', name: 'Swift', emoji: '🍎', category: 'skill' },
  { id: 'kotlin', name: 'Kotlin', emoji: '🟣', category: 'skill' },

  // --- 前端框架 ---
  { id: 'react', name: 'React', emoji: '⚛️', category: 'skill', keywords: ['react.js', 'reactjs'] },
  { id: 'vue', name: 'Vue', emoji: '💚', category: 'skill', keywords: ['vue.js', 'vue3', 'vue2'] },
  { id: 'nextjs', name: 'Next.js', emoji: '▲', category: 'skill', keywords: ['next'] },
  { id: 'angular', name: 'Angular', emoji: '🅰️', category: 'skill' },
  { id: 'tailwindcss', name: 'Tailwind CSS', emoji: '🎨', category: 'skill', keywords: ['tailwind', 'css3'] },
  { id: 'html_css', name: 'HTML/CSS', emoji: '🌐', category: 'skill', keywords: ['html5', 'css', '前端基础'] },
  { id: 'typescript', name: 'TypeScript', emoji: '🔷', category: 'skill', keywords: ['ts'] },

  // --- 后端/全栈 ---
  { id: 'springboot', name: 'Spring Boot', emoji: '🍃', category: 'skill', keywords: ['spring', 'java后端'] },
  { id: 'nodejs', name: 'Node.js', emoji: '🟩', category: 'skill', keywords: ['express', 'nest'] },
  { id: 'django', name: 'Django', emoji: '🎸', category: 'skill', keywords: ['flask', 'python后端'] },
  { id: 'docker', name: 'Docker', emoji: '🐳', category: 'skill', keywords: ['容器化', 'container'] },
  { id: 'k8s', name: 'Kubernetes', emoji: '☸️', category: 'skill', keywords: ['k8s', '容器编排'] },
  { id: 'linux', name: 'Linux', emoji: '🐧', category: 'skill', keywords: ['shell', 'bash', 'ubuntu', '服务器'] },
  { id: 'git', name: 'Git', emoji: '📦', category: 'skill', keywords: ['版本控制', 'github'] },

  // --- AI / 数据 ---
  { id: 'pytorch', name: 'PyTorch', emoji: '🔥', category: 'skill', keywords: ['torch', '深度学习框架'] },
  { id: 'tensorflow', name: 'TensorFlow', emoji: '🧠', category: 'skill', keywords: ['tf', 'tf2'] },
  { id: 'ml', name: '机器学习', emoji: '🤖', category: 'skill', keywords: ['ml', '机器学习算法', 'sklearn', 'scikit'] },
  { id: 'dl', name: '深度学习', emoji: '🔮', category: 'skill', keywords: ['deep learning', 'dnn', 'cnn', 'rnn', 'transformer'] },
  { id: 'nlp', name: 'NLP', emoji: '💬', category: 'skill', keywords: ['自然语言处理', '大语言模型', 'llm', 'gpt'] },
  { id: 'cv', name: '计算机视觉', emoji: '👁️', category: 'skill', keywords: ['computer vision', '图像识别', '目标检测'] },
  { id: 'data_analysis', name: '数据分析', emoji: '📈', category: 'skill', keywords: ['pandas', 'numpy', '数据处理', '数据清洗'] },
  { id: 'data_visualization', name: '数据可视化', emoji: '📉', category: 'skill', keywords: ['echarts', 'matplotlib', 'tableau', 'bi'] },
  { id: 'llm', name: '大模型应用', emoji: '✨', category: 'skill', keywords: ['chatgpt', 'prompt engineering', 'rag'] },

  // --- 设计工具 ---
  { id: 'figma', name: 'Figma', emoji: '🎨', category: 'skill', keywords: ['原型设计', 'ui设计'] },
  { id: 'photoshop', name: 'PS', emoji: '🖼️', category: 'skill', keywords: ['photoshop', 'adobe ps', '图像处理'] },
  { id: 'sketch', name: 'Sketch', emoji: '✏️', category: 'skill' },
  { id: 'after_effects', name: 'AE', emoji: '🎬', category: 'skill', keywords: ['after effects', '动效设计'] },
  { id: 'illustrator', name: 'AI', emoji: '🖌️', category: 'skill', keywords: ['illustrator', '矢量设计', 'adobe ai'] },
  { id: 'blender', name: 'Blender', emoji: '🧊', category: 'skill', keywords: ['3d建模'] },

  // --- 通用软技能 ---
  { id: 'data_structure', name: '数据结构与算法', emoji: '🧩', category: 'skill', keywords: ['leetcode', '算法', '数据结构'] },
  { id: 'excel', name: 'Excel', emoji: '📊', category: 'skill', keywords: ['spreadsheet', '表格'] },
  { id: 'ppt', name: 'PPT', emoji: '📑', category: 'skill', keywords: ['powerpoint', '演示'] },
  { id: 'writing', name: '文案写作', emoji: '✍️', category: 'skill', keywords: ['写作', '内容创作'] },
  { id: 'video_editing', name: '视频剪辑', emoji: '🎥', category: 'skill', keywords: ['pr', 'premiere', '剪映'] },
  { id: 'math', name: '数学建模', emoji: '📐', category: 'skill', keywords: ['matlab', '数学分析', '运筹学'] },
];

// ============================================
// 项目经历标签库（Project Tags）
// ============================================

export const PROJECT_TAGS: Tag[] = [
  // --- 竞赛类 ---
  { id: 'math_modeling', name: '数学建模', emoji: '🏆', category: 'project', keywords: ['美赛', '国赛', 'mcm', 'icm'] },
  { id: 'acm', name: 'ACM竞赛', emoji: '🥇', category: 'project', keywords: ['icpc', '程序设计竞赛', '蓝桥杯'] },
  { id: 'kaggle', name: 'Kaggle竞赛', emoji: '🥈', category: 'project', keywords: ['数据竞赛', '数据挖掘竞赛'] },
  { id: 'hackathon', name: '黑客松', emoji: '💻', category: 'project', keywords: ['编程马拉松', '创客'] },

  // --- 科研/论文 ---
  { id: 'paper', name: '发表论文', emoji: '📄', category: 'project', keywords: ['论文', '期刊', 'sci', 'ei', '顶会', '顶刊'] },
  { id: 'patent', name: '专利', emoji: '💡', category: 'project', keywords: ['发明专利', '实用新型'] },
  { id: 'research_project', name: '科研项目', emoji: '🔬', category: 'project', keywords: ['实验室', '课题组', '纵向课题'] },

  // --- 创新创业 ---
  { id: 'dachuang', name: '大创项目', emoji: '🚀', category: 'project', keywords: ['大学生创新创业', '国家级大创', '省级大创'] },
  { id: 'innovation_comp', name: '互联网+', emoji: '🌐', category: 'project', keywords: ['互联网+大赛', '双创'] },
  { id: 'challenge_cup', name: '挑战杯', emoji: '🏅', category: 'project', keywords: ['课外学术科技作品'] },

  // --- 工程实践 ---
  { id: 'personal_project', name: '个人开源项目', emoji: '🔧', category: 'project', keywords: ['github项目', '开源贡献', 'side project'] },
  { id: 'full_stack_project', name: '全栈项目', emoji: '🏗️', category: 'project', keywords: ['前后端', 'web开发', '全栈开发'] },
  { id: 'mobile_project', name: 'App开发项目', emoji: '📱', category: 'project', keywords: ['小程序', 'android', 'ios', 'flutter'] },
  { id: 'ai_project', name: 'AI实战项目', emoji: '🤖', category: 'project', keywords: ['机器学习项目', '深度学习项目', '模型训练'] },
  { id: 'data_project', name: '数据分析项目', emoji: '📊', category: 'project', keywords: ['数据挖掘', '数据报告'] },

  // --- 实习/社会实践 ---
  { id: 'big_company_intern', name: '大厂实习', emoji: '🏢', category: 'project', keywords: ['大厂', '互联网大厂', '腾讯', '阿里', '字节', '百度'] },
  { id: 'startup_intern', name: '创业公司实习', emoji: '💡', category: 'project', keywords: ['创业公司', '初创公司', 'startup'] },
  { id: 'student_org', name: '学生会/社团', emoji: '🤝', category: 'project', keywords: ['学生会', '社团', '部长', '主席'] },
  { id: 'volunteer', name: '志愿服务', emoji: '❤️', category: 'project', keywords: ['公益活动', '社会实践'] },
];

// ============================================
// 目标岗位标签库（Position Tags）
// ============================================

export const POSITION_TAGS: Tag[] = [
  // --- 技术研发 ---
  { id: 'frontend_dev', name: '前端开发', emoji: '🖥️', category: 'position', keywords: ['前端工程师', 'web开发', 'h5'] },
  { id: 'backend_dev', name: '后端开发', emoji: '⚙️', category: 'position', keywords: ['后端工程师', '服务端', '服务端开发'] },
  { id: 'fullstack_dev', name: '全栈开发', emoji: '🔧', category: 'position', keywords: ['全栈工程师'] },
  { id: 'mobile_dev', name: '移动端开发', emoji: '📱', category: 'position', keywords: ['app开发', 'ios开发', 'android开发', '小程序开发'] },
  { id: 'data_analyst', name: '数据分析师', emoji: '📊', category: 'position', keywords: ['数据分析', 'da', '商业分析'] },
  { id: 'data_engineer', name: '数据工程师', emoji: '🗄️', category: 'position', keywords: ['数据开发', '数仓', '大数据'] },
  { id: 'ai_engineer', name: 'AI算法工程师', emoji: '🤖', category: 'position', keywords: ['算法工程师', 'ml工程师', '机器学习工程师'] },
  { id: 'cv_engineer', name: '计算机视觉工程师', emoji: '👁️', category: 'position', keywords: ['cv', '图像算法', '视觉算法'] },
  { id: 'nlp_engineer', name: 'NLP工程师', emoji: '💬', category: 'position', keywords: ['自然语言', '文本算法', '大模型工程师'] },
  { id: 'devops', name: 'DevOps工程师', emoji: '🔄', category: 'position', keywords: ['运维', 'sre', '平台工程'] },
  { id: 'security_engineer', name: '安全工程师', emoji: '🔐', category: 'position', keywords: ['网络安全', '渗透测试'] },
  { id: 'qa_engineer', name: '测试工程师', emoji: '🧪', category: 'position', keywords: ['质量保证', '自动化测试'] },
  { id: 'embedded_dev', name: '嵌入式开发', emoji: '🔌', category: 'position', keywords: ['嵌入式', 'iot', '物联网'] },

  // --- 产品/设计 ---
  { id: 'product_manager', name: '产品经理', emoji: '📋', category: 'position', keywords: ['pm', '产品'] },
  { id: 'product_ops', name: '产品运营', emoji: '📈', category: 'position', keywords: ['运营', '用户运营', '内容运营'] },
  { id: 'ui_designer', name: 'UI设计师', emoji: '🎨', category: 'position', keywords: ['界面设计', '视觉设计'] },
  { id: 'ux_designer', name: 'UX设计师', emoji: '🧑‍🎨', category: 'position', keywords: ['交互设计', '用户体验'] },
  { id: 'game_designer', name: '游戏策划', emoji: '🎮', category: 'position', keywords: ['游戏设计', '关卡设计'] },
  { id: 'game_dev', name: '游戏开发', emoji: '🕹️', category: 'position', keywords: ['unity', 'unreal', '游戏程序员'] },

  // --- 商务/市场 ---
  { id: 'marketing', name: '市场营销', emoji: '📣', category: 'position', keywords: ['市场', '品牌', '推广'] },
  { id: 'hr', name: '人力资源', emoji: '👥', category: 'position', keywords: ['人事', '招聘', 'hrbp'] },
  { id: 'consultant', name: '咨询顾问', emoji: '💼', category: 'position', keywords: ['管理咨询', '战略咨询', '四大'] },
  { id: 'finance', name: '金融/投行', emoji: '💰', category: 'position', keywords: ['投行', '券商', '基金', 'vc', 'pe'] },
  { id: 'accounting', name: '财务/会计', emoji: '📒', category: 'position', keywords: ['审计', 'cpa'] },
  { id: 'teacher', name: '教育/培训', emoji: '👩‍🏫', category: 'position', keywords: ['教师', '讲师', '培训师'] },

  // --- 交叉/新兴 ---
  { id: 'prompt_engineer', name: 'Prompt工程师', emoji: '✨', category: 'position', keywords: ['提示词工程师', 'ai应用开发'] },
  { id: 'lowcode_dev', name: '低代码开发', emoji: '🧱', category: 'position', keywords: ['低代码', '无代码', 'nocode'] },
];

// ============================================
// 按类别分组的便捷访问
// ============================================

export const ALL_TAGS: Tag[] = [...SKILL_TAGS, ...PROJECT_TAGS, ...POSITION_TAGS];

/** 根据类别获取标签列表 */
export function getTagsByCategory(category: TagCategory): Tag[] {
  switch (category) {
    case 'skill': return SKILL_TAGS;
    case 'project': return PROJECT_TAGS;
    case 'position': return POSITION_TAGS;
  }
}

/** 根据 ID 查找标签 */
export function getTagById(id: string): Tag | undefined {
  return ALL_TAGS.find(t => t.id === id);
}

/** 模糊搜索标签（按名称或关键词） */
export function searchTags(query: string, category?: TagCategory): Tag[] {
  const pool = category ? getTagsByCategory(category) : ALL_TAGS;
  const q = query.toLowerCase().trim();
  if (!q) return pool;
  return pool.filter(tag =>
    tag.name.toLowerCase().includes(q) ||
    tag.id.includes(q) ||
    tag.keywords?.some(kw => kw.toLowerCase().includes(q))
  );
}
