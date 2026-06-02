/**
 * CareerAdviceEngine 测试脚本
 * 
 * 测试用例：
 * 1. 大三 + 计算机 + 前端开发 + 技术创新
 * 2. 大一 + 设计 + 产品经理 + 用户体验
 * 3. 博士 + 计算机 + 算法工程师 + 技术创新
 * 4. 英语专业 + 前端开发（转行场景）
 * 5. 考古学博士 + 博物馆馆长（冷门组合，测试兜底机制）
 */

// 模拟 UserProfileForAdvice
const testCases = [
  {
    name: '测试用例1：大三 + 计算机 + 前端开发 + 技术创新',
    userProfile: {
      grade: '大三',
      degree: 'bachelor',
      major: '计算机科学与技术',
      expectedPosition: '前端开发工程师',
      interests: ['技术创新', '前端性能优化']
    },
    skills: {
      technicalSkills: ['React', 'JavaScript', 'CSS'],
      softSkills: ['沟通', '团队协作'],
      tools: ['Git', 'Webpack'],
      hasInternship: false, // 无实习经历
      hasProject: true,
      hasResearch: false
    },
    scores: {
      professional: 65, // 专业技能中等
      communication: 70,
      leadership: 60,
      innovation: 55, // 创新思维较低（量化不足）
      resilience: 70,
      overall: 65
    }
  },
  {
    name: '测试用例2：大一 + 设计 + 产品经理 + 用户体验',
    userProfile: {
      grade: '大一',
      degree: 'bachelor',
      major: '工业设计',
      expectedPosition: '产品经理',
      interests: ['用户体验', '交互设计']
    },
    skills: {
      technicalSkills: ['Axure', 'Sketch'],
      softSkills: ['沟通'],
      tools: ['Figma'],
      hasInternship: false,
      hasProject: false,
      hasResearch: false
    },
    scores: {
      professional: 50, // 专业技能较低
      communication: 65,
      leadership: 55,
      innovation: 60,
      resilience: 65,
      overall: 55
    }
  },
  {
    name: '测试用例3：博士 + 计算机 + 算法工程师 + 技术创新',
    userProfile: {
      grade: '博二',
      degree: 'phd',
      major: '计算机科学与技术',
      expectedPosition: '算法工程师',
      interests: ['技术创新', '机器学习']
    },
    skills: {
      technicalSkills: ['Python', 'TensorFlow', 'PyTorch'],
      softSkills: ['沟通', '英语'],
      tools: ['Git', 'Docker'],
      hasInternship: false, // 无工业界实习
      hasProject: true,
      hasResearch: true // 有科研经历
    },
    scores: {
      professional: 80, // 专业技能高
      communication: 70,
      leadership: 65,
      innovation: 75,
      resilience: 75,
      overall: 80
    }
  },
  {
    name: '测试用例4：英语专业 + 前端开发（转行场景）',
    userProfile: {
      grade: '大四',
      degree: 'bachelor',
      major: '英语',
      expectedPosition: '前端开发工程师',
      interests: ['技术创新', '前端开发']
    },
    skills: {
      technicalSkills: ['HTML', 'CSS', 'JavaScript'], // 技能较少
      softSkills: ['英语', '沟通'],
      tools: ['VS Code'],
      hasInternship: false,
      hasProject: false,
      hasResearch: false
    },
    scores: {
      professional: 45, // 专业技能低（转行）
      communication: 75,
      leadership: 60,
      innovation: 55,
      resilience: 70,
      overall: 55
    }
  },
  {
    name: '测试用例5：考古学博士 + 博物馆馆长（冷门组合，测试兜底机制）',
    userProfile: {
      grade: '博三',
      degree: 'phd',
      major: '考古学',
      expectedPosition: '博物馆馆长',
      interests: ['文物保护', '历史研究']
    },
    skills: {
      technicalSkills: ['考古发掘', '文物鉴定'],
      softSkills: ['沟通', '研究'],
      tools: ['GIS', '考古软件'],
      hasInternship: false,
      hasProject: true,
      hasResearch: true
    },
    scores: {
      professional: 85,
      communication: 75,
      leadership: 70,
      innovation: 80,
      resilience: 80,
      overall: 85
    }
  }
];

// 测试说明
console.log('============================================');
console.log('CareerAdviceEngine 测试脚本');
console.log('============================================');
console.log('');
console.log('测试目标：');
console.log('1. 验证画像特征提取与标签化机制');
console.log('2. 验证结构化诊断-建议映射矩阵');
console.log('3. 验证动态文案的智能组装');
console.log('4. 验证兜底机制（通用鼓励性话术）');
console.log('');
console.log('============================================');
console.log('');

// 由于无法直接导入 TypeScript 模块，这里只提供测试说明
// 实际测试需要在浏览器或 Node.js 环境中运行

console.log('请在浏览器或 Node.js 环境中运行以下代码进行测试：');
console.log('');
console.log('```typescript');
console.log('import { generateAdvice } from "@/lib/CareerAdviceEngine";');
console.log('');
console.log('// 测试用例1');
console.log('const advice1 = generateAdvice(testCases[0].userProfile, testCases[0].skills, testCases[0].scores);');
console.log('console.log(advice1);');
console.log('');
console.log('// 测试用例2');
console.log('const advice2 = generateAdvice(testCases[1].userProfile, testCases[1].skills, testCases[1].scores);');
console.log('console.log(advice2);');
console.log('');
console.log('// ... 其他测试用例');
console.log('```');
console.log('');
console.log('============================================');
console.log('测试预期结果：');
console.log('============================================');
console.log('');
console.log('测试用例1（大三+计算机+前端+技术创新）：');
console.log('- 时间维度：实战冲刺期');
console.log('- 赛道维度：前端工程赛道');
console.log('- 目标维度：前端开发岗');
console.log('- 短板维度：经历空白、量化不足');
console.log('- 匹配场景：B（实战冲刺期）');
console.log('- 建议内容：应包含"紧急突击岗位核心技能"、"立即补充工业界实战经验"、"运用STAR法则量化项目成果"');
console.log('- 兴趣提示：应包含"关注底层源码、关注前沿顶会"');
console.log('');
console.log('测试用例2（大一+设计+产品经理+用户体验）：');
console.log('- 时间维度：探索期');
console.log('- 赛道维度：产品设计赛道');
console.log('- 目标维度：产品经理岗');
console.log('- 短板维度：经历空白、硬技能缺失');
console.log('- 匹配场景：A（探索期）');
console.log('- 建议内容：应包含"夯实专业基础"、"积累初步实践经验"');
console.log('- 兴趣提示：应包含"关注用户研究、交互设计、可用性测试"');
console.log('');
console.log('测试用例3（博士+计算机+算法+技术创新）：');
console.log('- 时间维度：专家/科研期');
console.log('- 赛道维度：算法研究赛道');
console.log('- 目标维度：算法工程师岗');
console.log('- 短板维度：经历空白（无工业界实习）');
console.log('- 匹配场景：C（专家/科研期）');
console.log('- 建议内容：应包含"提升工程落地能力"、"申请研究型实习，结合产学研"');
console.log('- 兴趣提示：应包含"关注底层源码、关注前沿顶会"');
console.log('');
console.log('测试用例4（英语+前端-转行）：');
console.log('- 时间维度：实战冲刺期');
console.log('- 赛道维度：前端工程赛道（转行）');
console.log('- 目标维度：前端开发岗');
console.log('- 短板维度：经历空白、硬技能缺失');
console.log('- 匹配场景：D（转行场景）');
console.log('- 建议内容：应包含"弥补科班背景不足，突出自学能力"');
console.log('');
console.log('测试用例5（考古学博士+博物馆馆长-冷门）：');
console.log('- 时间维度：专家/科研期');
console.log('- 赛道维度：文化创意赛道（冷门）');
console.log('- 目标维度：其他岗（冷门）');
console.log('- 短板维度：无（或很少）');
console.log('- 匹配场景：无特定场景匹配');
console.log('- 建议内容：应返回兜底建议（通用鼓励性话术）"继续保持对技术的热爱，扎实走好每一步"');
console.log('- 重要：绝对不能出现违背常理的错乱建议（如"给博士生推荐参加普通社团"）');
console.log('');
console.log('============================================');
console.log('测试完成！');
console.log('============================================');
