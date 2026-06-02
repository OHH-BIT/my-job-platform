"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 个人能力测试组件
 * 
 * 功能：结合大学生活实际，测试用户的软实力与职业驱动力
 * 维度：社团/学生会组织协调、学科竞赛抗压、小组作业协作、职业价值观等
 */

// ============================================
// 测试题目配置
// ============================================
const TEST_SECTIONS = [
  {
    id: "org_coordination",
    title: "社团/学生会组织协调能力",
    icon: "🏛️",
    description: "考察你在社团或学生会中的组织、协调、领导能力",
    questions: [
      {
        id: "org_1",
        question: "你曾负责过社团活动或学生会项目的整体策划吗？",
        options: [
          { label: "A. 从未负责过", score: 0 },
          { label: "B. 协助过他人策划", score: 30 },
          { label: "C. 独立策划过小型活动（<50人）", score: 60 },
          { label: "D. 独立策划过中型活动（50-200人）", score: 85 },
          { label: "E. 独立策划过大型活动（>200人）或有系列品牌活动经验", score: 100 },
        ],
      },
      {
        id: "org_2",
        question: "在社团/学生会工作中，你如何协调不同部门或成员之间的冲突？",
        options: [
          { label: "A. 我通常回避冲突，让他人解决", score: 10 },
          { label: "B. 我会向上级反映，由上级决定", score: 30 },
          { label: "C. 我会主动沟通，寻求双方都能接受的方案", score: 70 },
          { label: "D. 我会组织会议，引导各方达成共识", score: 90 },
        ],
      },
      {
        id: "org_3",
        question: "你是否有过「拉赞助」或「外部资源对接」的经验？",
        options: [
          { label: "A. 没有", score: 0 },
          { label: "B. 协助过他人拉赞助", score: 30 },
          { label: "C. 成功拉到过小额赞助（<5000元）", score: 60 },
          { label: "D. 成功拉到过中额赞助（5000-2万元）", score: 85 },
          { label: "E. 有丰富的赞助经验（>2万元或品牌合作）", score: 100 },
        ],
      },
    ],
  },
  {
    id: "competition_stress",
    title: "学科竞赛与科研抗压能力",
    icon: "🏆",
    description: "考察你在高压竞赛或科研环境下的表现",
    questions: [
      {
        id: "comp_1",
        question: "你参加过哪些高水平的学科竞赛？（可多选对应的分值取最高）",
        options: [
          { label: "A. 未参加过任何竞赛", score: 0 },
          { label: "B. 校级竞赛", score: 40 },
          { label: "C. 省级/市级竞赛", score: 65 },
          { label: "D. 国家级竞赛（如ACM/数学建模/挑战杯）", score: 85 },
          { label: "E. 国际级竞赛或顶级会议论文发表", score: 100 },
        ],
      },
      {
        id: "comp_2",
        question: "在竞赛或科研项目中，遇到技术瓶颈时你的典型反应是？",
        options: [
          { label: "A. 感到焦虑，等待队友或老师帮助", score: 10 },
          { label: "B. 尝试1-2种方法，不行就放弃", score: 30 },
          { label: "C. 查阅资料，尝试多种方案解决", score: 60 },
          { label: "D. 系统性排查，必要时寻求外部专家意见", score: 85 },
          { label: "E. 将瓶颈转化为创新点，甚至产出论文/专利", score: 100 },
        ],
      },
      {
        id: "comp_3",
        question: "你是否有过「通宵赶项目/比赛」的经历？频率如何？",
        options: [
          { label: "A. 从未", score: 20 },
          { label: "B. 1-2次，感到非常痛苦", score: 40 },
          { label: "C. 3-5次，能接受但希望减少", score: 60 },
          { label: "D. 经常通宵，已适应高压节奏", score: 80 },
          { label: "E. 通宵是常态，我享受冲刺的过程", score: 100 },
        ],
      },
    ],
  },
  {
    id: "team_collaboration",
    title: "小组作业沟通协作倾向",
    icon: "👥",
    description: "考察你在团队项目中的协作风格与沟通能力",
    questions: [
      {
        id: "team_1",
        question: "在小组作业中，你通常扮演什么角色？",
        options: [
          { label: "A. 划水党，能少做就少做", score: 0 },
          { label: "B. 执行者，完成分配的任务", score: 40 },
          { label: "C. 协调者，推动小组按时交付", score: 70 },
          { label: "D. 领导者，组建团队并分配任务", score: 90 },
        ],
      },
      {
        id: "team_2",
        question: "如果组员不配合或「摆烂」，你会如何处理？",
        options: [
          { label: "A. 忍了，自己多做点", score: 20 },
          { label: "B. 向老师告状", score: 30 },
          { label: "C. 私下沟通，了解原因并寻求解决方案", score: 65 },
          { label: "D. 重新分工，甚至重组团队", score: 85 },
          { label: "E. 将「摆烂」转化为项目管理案例写进简历", score: 100 },
        ],
      },
      {
        id: "team_3",
        question: "你需要向小组展示成果（答辩/PPT演讲），你的感受是？",
        options: [
          { label: "A. 极度紧张，希望逃避", score: 10 },
          { label: "B. 紧张但能完成", score: 35 },
          { label: "C. 正常发挥，不讨厌也不喜欢", score: 60 },
          { label: "D. 享受演讲，能带动现场气氛", score: 85 },
          { label: "E. 主动争取答辩机会，视其为展示舞台", score: 100 },
        ],
      },
    ],
  },
  {
    id: "career_values",
    title: "职业价值观与驱动力",
    icon: "🎯",
    description: "考察你的职业价值观、工作动机和长远规划",
    questions: [
      {
        id: "value_1",
        question: "你选择职业时，最看重的因素是？（选最重要的一项）",
        options: [
          { label: "A. 薪资待遇", score: 20, value: "salary" },
          { label: "B. 工作稳定性", score: 40, value: "stability" },
          { label: "C. 成长空间与学习机会", score: 75, value: "growth" },
          { label: "D. 工作意义与社会影响力", score: 85, value: "impact" },
          { label: "E. 创新创业，改变世界", score: 100, value: "innovation" },
        ],
      },
      {
        id: "value_2",
        question: "你理想的工作节奏是？",
        options: [
          { label: "A. 朝九晚五，周末双休，工作生活平衡", score: 30 },
          { label: "B. 适度加班，但为了成长可以接受", score: 60 },
          { label: "C. 项目制，忙时很忙闲时很闲", score: 75 },
          { label: "D. 全力投入，用高强度换取高回报", score: 90 },
        ],
      },
      {
        id: "value_3",
        question: "5年后，你希望自己成为什么样的人？",
        options: [
          { label: "A. 还没想清楚", score: 10 },
          { label: "B. 稳定的中产阶级，有房有车", score: 40 },
          { label: "C. 某领域的技术专家", score: 70 },
          { label: "D. 技术管理复合人才（如技术总监）", score: 85 },
          { label: "E. 创业者/自由职业者", score: 100 },
        ],
      },
    ],
  },
];

// ============================================
// 类型定义
// ============================================
export interface AbilityTestResult {
  overallScore: number; // 综合能力得分 0-100
  dimensions: {
    orgCoordination: number;    // 组织协调 0-100
    competitionStress: number;    // 竞赛抗压 0-100
    teamCollaboration: number;    // 团队协作 0-100
    careerValues: number;         // 职业价值观匹配度 0-100
  };
  details: {
    sectionId: string;
    sectionTitle: string;
    score: number;
    answers: { questionId: string; score: number; label: string }[];
  }[];
  highlights: string[]; // 亮点标签
  gaps: string[];       // 待提升维度
}

// ============================================
// 主组件
// ============================================
interface AbilityTestProps {
  onComplete: (result: AbilityTestResult) => void;
  initialData?: Partial<AbilityTestResult>;
}

export default function AbilityTest({ onComplete, initialData }: AbilityTestProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { score: number; label: string }>>(
    initialData ? reconstructAnswers(initialData) : {}
  );
  const [showResult, setShowResult] = useState(!!initialData);

  const totalSections = TEST_SECTIONS.length;
  const progress = ((currentSection + 1) / totalSections) * 100;

  // 选择答案
  const handleSelect = (questionId: string, score: number, label: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { score, label } }));
  };

  // 下一题 / 提交
  const handleNext = () => {
    const currentQs = TEST_SECTIONS[currentSection].questions;
    const allAnswered = currentQs.every((q) => answers[q.id]);

    if (!allAnswered) {
      alert("请完成当前部分的所有题目后再继续");
      return;
    }

    if (currentSection < totalSections - 1) {
      setCurrentSection((prev) => prev + 1);
    } else {
      // 所有部分完成，计算结果
      const result = calculateResult();
      setShowResult(true);
      onComplete(result);
    }
  };

  // 上一题
  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  };

  // 计算结果
  const calculateResult = (): AbilityTestResult => {
    const details = TEST_SECTIONS.map((section) => {
      const sectionAnswers = section.questions.map((q) => ({
        questionId: q.id,
        score: answers[q.id]?.score || 0,
        label: answers[q.id]?.label || "",
      }));
      const avgScore =
        sectionAnswers.reduce((sum, a) => sum + a.score, 0) / sectionAnswers.length;
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        score: Math.round(avgScore),
        answers: sectionAnswers,
      };
    });

    const dimensions = {
      orgCoordination: details.find((d) => d.sectionId === "org_coordination")?.score || 0,
      competitionStress: details.find((d) => d.sectionId === "competition_stress")?.score || 0,
      teamCollaboration: details.find((d) => d.sectionId === "team_collaboration")?.score || 0,
      careerValues: details.find((d) => d.sectionId === "career_values")?.score || 0,
    };

    const overallScore = Math.round(
      (dimensions.orgCoordination +
        dimensions.competitionStress +
        dimensions.teamCollaboration +
        dimensions.careerValues) /
        4
    );

    // 生成亮点与差距
    const highlights: string[] = [];
    const gaps: string[] = [];
    if (dimensions.orgCoordination >= 70) highlights.push("组织协调能力强");
    else if (dimensions.orgCoordination < 40) gaps.push("组织协调能力待提升");
    if (dimensions.competitionStress >= 70) highlights.push("抗压能力强，适合高强度环境");
    else if (dimensions.competitionStress < 40) gaps.push("需提升抗压与问题解决能力");
    if (dimensions.teamCollaboration >= 70) highlights.push("团队协作与沟通能力强");
    else if (dimensions.teamCollaboration < 40) gaps.push("需提升团队协作与表达能力");
    if (dimensions.careerValues >= 70) highlights.push("职业价值观清晰，内驱力强");
    else if (dimensions.careerValues < 40) gaps.push("需明确职业价值观与长远规划");

    return {
      overallScore,
      dimensions,
      details,
      highlights,
      gaps,
    };
  };

  // 当前部分
  const section = TEST_SECTIONS[currentSection];

  // ============================================
  // 渲染：测试结果
  // ============================================
  if (showResult) {
    const result = calculateResult();
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🧪 个人能力测试结果
        </h2>

        {/* 综合得分 */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {result.overallScore}
          </div>
          <div className="text-gray-600">综合能力得分</div>
        </div>

        {/* 各维度得分 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { key: "orgCoordination", label: "组织协调", icon: "🏛️" },
            { key: "competitionStress", label: "竞赛抗压", icon: "🏆" },
            { key: "teamCollaboration", label: "团队协作", icon: "👥" },
            { key: "careerValues", label: "职业价值观", icon: "🎯" },
          ].map((dim) => (
            <div key={dim.key} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-1">{dim.icon}</div>
              <div className="text-xl font-bold text-indigo-600">
                {result.dimensions[dim.key as keyof typeof result.dimensions]}
              </div>
              <div className="text-sm text-gray-600">{dim.label}</div>
            </div>
          ))}
        </div>

        {/* 亮点 */}
        {result.highlights.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ 你的亮点</h3>
            <ul className="space-y-1">
              {result.highlights.map((h, i) => (
                <li key={i} className="text-sm text-green-700">
                  • {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 待提升 */}
        {result.gaps.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">⚡ 待提升维度</h3>
            <ul className="space-y-1">
              {result.gaps.map((g, i) => (
                <li key={i} className="text-sm text-orange-700">
                  • {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => {
            setShowResult(false);
            setCurrentSection(0);
            setAnswers({});
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← 重新测试
        </button>
      </motion.div>
    );
  }

  // ============================================
  // 渲染：测试题目
  // ============================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-8"
    >
      {/* 头部 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 个人能力测试
        </h2>
        <p className="text-gray-600">
          完成以下测试，帮助我们更全面地了解你的软实力与职业驱动力
        </p>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            {section.icon} {section.title}
          </span>
          <span>
            {currentSection + 1} / {totalSections}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 部分描述 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">{section.description}</p>
      </div>

      {/* 题目列表 */}
      <div className="space-y-6 mb-8">
        {section.questions.map((question, qIndex) => (
          <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="font-medium text-gray-900 mb-3">
              {qIndex + 1}. {question.question}
            </div>
            <div className="space-y-2">
              {question.options.map((option) => (
                <label
                  key={option.label}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    answers[question.id]?.label === option.label
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "hover:bg-gray-50 border-2 border-transparent"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id]?.label === option.label}
                    onChange={() => handleSelect(question.id, option.score, option.label)}
                    className="text-blue-600"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentSection === 0}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← 上一部份
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {currentSection < totalSections - 1 ? "下一部份 →" : "完成测试 ✓"}
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// 工具函数
// ============================================
function reconstructAnswers(initialData: Partial<AbilityTestResult>): Record<string, { score: number; label: string }> {
  // 从 initialData 重建 answers（简化处理，实际应从 details 恢复）
  return {};
}
