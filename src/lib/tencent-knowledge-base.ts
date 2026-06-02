// 腾讯及互联网大厂招聘知识库
// 用于智能问答助手的底层知识检索

// 知识条目接口
export interface KnowledgeItem {
  id: string;
  category: 'recruitment' | 'benefits' | 'business' | 'interview' | 'career';
  question: string;           // 标准问题
  keywords: string[];        // 关键词（用于匹配）
  answer: string;            // 标准答案
  followUpQuestions?: string[]; // 后续引导问题
  source?: string;            // 信息来源（增加可信度）
}

// ============ 校招/实习时间线 ============
const RECRUITMENT_TIMELINE: KnowledgeItem[] = [
  {
    id: 'recruit_1',
    category: 'recruitment',
    question: '腾讯校招时间线是什么？',
    keywords: ['校招', '时间', ' timeline', '什么时候', '开始', '截止'],
    answer: `腾讯校园招聘通常有以下时间节点：\n\n🗓️ **春招（3-5月）**\n- 3月初：发布春招公告\n- 3月中旬：网申开启\n- 4月：笔试+面试\n- 5月：Offer发放\n\n🗓️ **秋招（8-11月）**\n- 8月底：发布秋招公告\n- 9月：网申开启+校园宣讲\n- 10-11月：笔试+面试\n- 11月底：Offer发放\n\n💡 **建议**：提前3-6个月准备，关注「腾讯招聘」官网和微信公众号`,
    followUpQuestions: ['腾讯有哪些岗位方向？', '如何准备腾讯面试？'],
    source: '腾讯招聘官网 2024'
  },
  {
    id: 'recruit_2',
    category: 'recruitment',
    question: '腾讯实习时间线是什么？',
    keywords: ['实习', 'intern', '暑期', '寒假', '什么时候', '时间'],
    answer: `腾讯实习项目时间线：\n\n🌞 **暑期实习（6-8月）**\n- 3月：发布实习公告\n- 4月：网申截止\n- 5月：面试+Offer\n- 6-8月：实习期（3个月）\n\n❄️ **寒假实习（1-2月）**\n- 11月：发布实习公告\n- 12月：网申截止\n- 1月：面试+Offer\n- 1-2月：实习期（1-2个月）\n\n💰 **实习待遇**：\n- 本科生：200-300元/天\n- 研究生：300-400元/天\n- 博士生：400-500元/天\n- 提供免费班车、食堂、住宿补贴`,
    followUpQuestions: ['实习转正难吗？', '实习有房补吗？'],
    source: '腾讯招聘官网 2024'
  }
];

// ============ 薪资福利体系 ============
const BENEFITS_INFO: KnowledgeItem[] = [
  {
    id: 'benefit_1',
    category: 'benefits',
    question: '腾讯的薪资福利怎么样？',
    keywords: ['薪资', '工资', '待遇', '福利', '薪水', '收入', '薪酬'],
    answer: `腾讯的薪资福利体系（以校招/实习生为例）：\n\n💰 **薪资构成**：\n- 基本工资（月薪）\n- 年终奖（3-6个月工资）\n- 股票激励（正式员工）\n- 各种补贴\n\n🏠 **安居计划**（正式员工）：\n- 提供免息购房借款（最高50万）\n- 或租房补贴（每月数千元）\n\n🚌 **其他福利**：\n- 免费班车（深圳、北京等）\n- 免费三餐+下午茶\n- 年度体检+商业保险\n- 带薪年假（10-15天）\n- 团建活动经费\n\n💡 **注意**：具体薪资因岗位、级别、地点而异，建议面试时HR会详细说明`,
    followUpQuestions: ['腾讯实习生有房补吗？', '腾讯的年终奖有多少？'],
    source: '腾讯招聘官网 + 员工分享'
  },
  {
    id: 'benefit_2',
    category: 'benefits',
    question: '腾讯实习生有房补吗？',
    keywords: ['实习', '房补', '住宿', '租房', '补贴'],
    answer: `腾讯实习生福利待遇：\n\n🏠 **住宿**：\n- 部分城市（如深圳）提供免费宿舍或住宿补贴\n- 或提供租房补贴（每月1000-2000元）\n\n🚌 **其他福利**：\n- 免费班车（早晚接送）\n- 免费三餐+下午茶/夜宵\n- 实习工资：200-400元/天（视学历而定）\n- 团队活动经费\n\n💡 **建议**：具体政策因城市、部门而异，入职前HR会说明`,
    followUpQuestions: ['腾讯实习转正难吗？', '实习期间能转正比例？'],
    source: '腾讯实习生分享 2024'
  }
];

// ============ 事业群业务区别 ============
const BUSINESS_INFO: KnowledgeItem[] = [
  {
    id: 'business_1',
    category: 'business',
    question: '腾讯各大事业群有什么区别？',
    keywords: ['事业群', 'WXG', 'IEG', 'PCG', 'CSIG', 'TEG', 'CDG', '业务'],
    answer: `腾讯主要事业群及业务区别：\n\n📱 **WXG（微信事业群）**\n- 负责：微信、微信支付、小程序\n- 特点：用户量大（10亿+），技术挑战高\n- 地点：广州、深圳\n\n🎮 **IEG（互动娱乐事业群）**\n- 负责：王者荣耀、和平精英等游戏\n- 特点：收入主力，创意密集\n- 地点：深圳、上海、成都\n\n📺 **PCG（平台与内容事业群）**\n- 负责：QQ、腾讯视频、腾讯新闻\n- 特点：内容生态，产品导向\n- 地点：深圳、北京\n\n☁️ **CSIG（云与智慧产业事业群）**\n- 负责：腾讯云、企业微信、腾讯会议\n- 特点：To B业务，技术驱动\n- 地点：深圳、北京、上海\n\n🔧 **TEG（技术工程事业群）**\n- 负责：基础技术平台、运维、安全\n- 特点：技术底座，支撑全公司\n- 地点：深圳、北京\n\n💰 **CDG（企业发展事业群）**\n- 负责：金融科技、广告、投资\n- 特点：商业变现，金融属性\n- 地点：深圳、北京`,
    followUpQuestions: ['WXG和IEG哪个更好？', 'CSIG的云计算岗位怎么样？'],
    source: '腾讯官网 + 公开资料'
  },
  {
    id: 'business_2',
    category: 'business',
    question: '鹅厂是什么意思？',
    keywords: ['鹅厂', '腾讯', '外号'],
    answer: `“鹅厂”是腾讯的昵称/外号：\n\n🦢 **来源**：\n- 腾讯的Logo是一只企鹅\n- 网友谐音“企鹅”→“鹅”\n- 因此昵称“鹅厂”\n\n🏢 **类似昵称**：\n- 阿里 → 猫厂（天猫猫）\n- 百度 → 狼厂（狼性文化）\n- 网易 → 猪厂（网易味央猪）\n\n💡 **使用场景**：在求职论坛、社交平台上，大家常用“鹅厂”指代腾讯`,
    followUpQuestions: ['腾讯的企业文化是什么？', '腾讯的工作氛围怎么样？'],
    source: '网络文化'
  }
];

// ============ 面试流程与考察重点 ============
const INTERVIEW_INFO: KnowledgeItem[] = [
  {
    id: 'interview_1',
    category: 'interview',
    question: '腾讯面试流程是什么？',
    keywords: ['面试', '流程', '几轮', '笔试', '初试', '复试', 'HR面'],
    answer: `腾讯校招/社招面试流程（技术岗为例）：\n\n📝 **第1轮：笔试**（部分岗位）\n- 时间：网申后1-2周\n- 内容：算法题（LeetCode中等难度）+ 性格测试\n- 通过率：约30-50%\n\n💻 **第2轮：初试**（技术面）\n- 时间：笔试后1-2周\n- 内容：项目经历 + 算法题 + 技术深度\n- 重点：基础知识、项目细节、 coding能力\n\n🎯 **第3轮：复试**（技术面/交叉面）\n- 时间：初试后1-2周\n- 内容：更深入的技术探讨 + 系统设计\n- 重点：架构能力、技术广度、解决问题能力\n\n🤝 **第4轮：HR面**\n- 时间：复试后1周内\n- 内容：价值观匹配 + 职业规划 + 薪资期望\n- 重点：文化契合度、稳定性、沟通表达\n\n🎉 **第5轮：Offer**\n- 时间：HR面后1-2周\n- 内容：发放Offer + 谈薪资\n\n💡 **总时长**：从网申到Offer约1-2个月`,
    followUpQuestions: ['腾讯面试考什么算法题？', '如何准备腾讯技术面？'],
    source: '腾讯招聘官网 + 面经分享'
  },
  {
    id: 'interview_2',
    category: 'interview',
    question: '非科班怎么投技术岗？',
    keywords: ['非科班', '转行', '专业不对口', '自学', '如何'],
    answer: `非科班（非计算机专业）投技术岗的建议：\n\n✅ **可行路径**：\n1. **补基础**：自学计算机核心课程（数据结构、操作系统、网络）\n2. **做项目**：GitHub上有实际项目（2-3个完整项目）\n3. **刷算法**：LeetCode刷300+题（Medium难度为主）\n4. **找实习**：先找小公司实习，再投大厂\n\n📌 **投递策略**：\n- 投前端/测试/运维等对专业限制较宽的岗位\n- 在简历中突出自学经历和项目经验\n- 附上GitHub/技术博客链接\n\n💪 **成功案例**：很多腾讯工程师是机械、物理、数学专业转行的\n\n💡 **关键**：技术能力 > 专业背景，只要能证明实力就有机会`,
    followUpQuestions: ['自学前端需要多久？', '如何准备技术面试项目？'],
    source: '知乎 + 牛客网经验分享'
  }
];

// ============ 职业发展 ============
const CAREER_INFO: KnowledgeItem[] = [
  {
    id: 'career_1',
    category: 'career',
    question: '腾讯的职业发展路径是什么？',
    keywords: ['职业发展', '晋升', '级别', 'T3', 'T4', '初级', '高级'],
    answer: `腾讯职业发展体系：\n\n📊 **技术序列（T序列）**：\n- T1-T2：入门级（应届生）\n- T3.1-T3.2：工程师（3-5年）\n- T4.1-T4.2：高级工程师（5-8年）\n- T5.1-T5.2：专家工程师（8-12年）\n- T6+：杰出科学家/架构师\n\n📈 **晋升周期**：\n- T1→T2：约1-2年\n- T2→T3：约2-3年\n- T3→T4：约3-5年\n- T4→T5：约4-6年\n\n💡 **晋升标准**：\n- 技术能力 + 项目贡献 + 影响力 + 领导力\n- 需要述职答辩（PPT汇报）\n- 由晋升委员会评审`,
    followUpQuestions: ['腾讯的工作压力大吗？', '如何平衡工作和生活？'],
    source: '腾讯内部公开资料'
  }
];

// 合并所有知识库
export const TENCENT_KNOWLEDGE_BASE: KnowledgeItem[] = [
  ...RECRUITMENT_TIMELINE,
  ...BENEFITS_INFO,
  ...BUSINESS_INFO,
  ...INTERVIEW_INFO,
  ...CAREER_INFO
];

// 知识库检索函数
export function searchKnowledgeBase(query: string): KnowledgeItem | null {
  const lowerQuery = query.toLowerCase();
  
  // 1. 精确匹配问题
  const exactMatch = TENCENT_KNOWLEDGE_BASE.find(item => 
    item.question.toLowerCase() === lowerQuery
  );
  if (exactMatch) return exactMatch;
  
  // 2. 关键词匹配（计算匹配度）
  const matches = TENCENT_KNOWLEDGE_BASE.map(item => {
    const matchedKeywords = item.keywords.filter(kw => 
      lowerQuery.includes(kw.toLowerCase())
    );
    return {
      item,
      score: matchedKeywords.length / item.keywords.length
    };
  });
  
  // 3. 返回最高匹配度的条目（阈值>0.3）
  matches.sort((a, b) => b.score - a.score);
  if (matches[0] && matches[0].score > 0.3) {
    return matches[0].item;
  }
  
  return null; // 未找到匹配
}

// 获取引导式问题（初始化或空闲时展示）
export function getGuideQuestions(): string[] {
  return [
    '鹅厂实习有房补吗？',
    '非科班怎么投技术岗？',
    '腾讯面试流程是什么？',
    'WXG和IEG哪个更好？',
    '腾讯的薪资福利怎么样？'
  ];
}

// 获取后续问题（根据当前回答）
export function getFollowUpQuestions(currentItem: KnowledgeItem): string[] {
  return currentItem.followUpQuestions || getGuideQuestions().slice(0, 3);
}

// 兜底回复
export function getFallbackResponse(): string {
  return `这个问题涉及到具体的业务细节，建议你：\n\n1️⃣ **前往腾讯招聘官网**查看最新公告（https://careers.tencent.com）\n2️⃣ **换个关于求职技巧的问题**问我，比如：\n   - "如何准备技术面试？"\n   - "简历怎么写才能通过初筛？"\n   - "腾讯有哪些岗位方向？"\n\n我会尽力帮你解答求职相关的问题~ 🤖`;
}
