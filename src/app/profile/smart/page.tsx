"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import JobMatchReport from "@/components/JobMatchReport";
import AbilityTest from "@/components/AbilityTest";

// ============================================
// 年级选项常量
// ============================================
const GRADE_OPTIONS = [
  "大一", "大二", "大三", "大四", 
  "研一", "研二", "研三", "博士"
];

// ============================================
// 职业阶段判定
// ============================================
function getCareerStage(grade: string): string {
  if (grade === "大一" || grade === "大二") return "undergraduate_explore";
  if (grade === "大三" || grade === "大四") return "undergraduate_sprint";
  if (grade === "研一" || grade === "研二" || grade === "研三") return "master_development";
  if (grade === "博士") return "phd_expert";
  return "undergraduate_explore";
}

// ============================================
// 主组件
// ============================================
export default function SmartProfilePage() {
  // 步骤：input-basic -> input-test -> analyzing -> result
  const [step, setStep] = useState<"input-basic" | "input-test" | "analyzing" | "result">("input-basic");
  
  const [formData, setFormData] = useState({
    grade: "",
    major: "",
    school: "",
    targetPosition: "",
    skills: "",
    projects: "",
    resumeText: "",
  });
  
  const [abilityTestResult, setAbilityTestResult] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 基础信息提交 -> 进入能力测试
  const handleBasicSubmit = useCallback(() => {
    if (!formData.resumeText || !formData.grade || !formData.major || !formData.targetPosition) {
      setError("请填写完整的基础信息（简历原文、年级、专业、目标岗位）");
      return;
    }
    setError(null);
    setStep("input-test");
  }, [formData]);

  // 能力测试完成 -> 触发AI分析
  const handleTestComplete = useCallback((result: any) => {
    setAbilityTestResult(result);
    setStep("analyzing");
    setError(null);
    handleAnalyze(result);
  }, [formData]);

  // AI分析（融合简历+测试双源数据）
  const handleAnalyze = useCallback(async (testResult: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: formData.resumeText || null,
          userProfile: {
            grade: formData.grade,
            major: formData.major,
            school: formData.school,
            targetPosition: formData.targetPosition,
            skills: formData.skills,
            projects: formData.projects,
          },
          assessmentResults: testResult,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API调用失败: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "分析失败");

      const careerStage = getCareerStage(formData.grade);
      const stageName = 
        careerStage === "undergraduate_explore" ? "本科探索期" :
        careerStage === "undergraduate_sprint" ? "本科冲刺期" :
        careerStage === "master_development" ? "硕士深造期" : "博士专家期";

      const result = {
        ...data.data,
        careerStage,
        stageName,
        abilityTestResult: testResult,
        jobRecommendations: generateJobRecommendations(data.data, formData, testResult),
      };

      setAnalysisResult(result);
      setStep("result");

    } catch (err: any) {
      console.error("AI分析失败:", err);
      setError(err.message || "分析失败，请重试");
      setStep("input-test");
    }
  }, [formData]);

  // 生成岗位推荐（融合画像数据）
  function generateJobRecommendations(aiAnalysis: any, userData: any, testResult: any): any[] {
    const jobDatabase = [
      {
        title: "高级后端开发工程师",
        company: "腾讯",
        location: "深圳",
        requiredSkills: ["Go", "分布式系统", "微服务"],
        preferredSkills: ["Kubernetes", "gRPC"],
        softSkills: ["抗压能力", "团队协作"],
      },
      {
        title: "前端开发工程师",
        company: "字节跳动",
        location: "北京",
        requiredSkills: ["React", "TypeScript", "性能优化"],
        preferredSkills: ["Next.js", "WebGL"],
        softSkills: ["沟通能力", "学习能力"],
      },
      {
        title: "AI算法研究员",
        company: "腾讯AI Lab",
        location: "深圳",
        requiredSkills: ["机器学习", "Python", "论文发表"],
        preferredSkills: ["深度学习框架", "顶会论文"],
        softSkills: ["创新思维", "技术领导力"],
      },
    ];

    return jobDatabase.map(job => {
      const hardSkillMatch = calculateHardSkillMatch(aiAnalysis.skillsAnalysis, job.requiredSkills, job.preferredSkills);
      const softSkillMatch = calculateSoftSkillMatch(testResult, job.softSkills);
      const experienceMatch = calculateExperienceMatch(userData.projects, job);
      const matchScore = Math.round(hardSkillMatch * 0.5 + softSkillMatch * 0.3 + experienceMatch * 0.2);
      
      return {
        title: job.title,
        company: job.company,
        location: job.location,
        matchScore,
        hardSkillMatch,
        softSkillMatch,
        experienceMatch,
        recommendationReason: generateRecommendationReason(aiAnalysis, userData, job, hardSkillMatch, softSkillMatch),
        gaps: generateGaps(userData, job, hardSkillMatch, softSkillMatch),
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  function calculateHardSkillMatch(skillsAnalysis: any[], required: string[], preferred: string[]): number {
    if (!skillsAnalysis || skillsAnalysis.length === 0) return 50;
    const reqScore = required.filter(skill =>
      skillsAnalysis.some((sa: any) =>
        sa.name.toLowerCase().includes(skill.toLowerCase()) &&
        (sa.mastery === "精通" || sa.mastery === "熟练")
      )
    ).length / required.length * 100;
    const prefScore = preferred.filter(skill =>
      skillsAnalysis.some((sa: any) =>
        sa.name.toLowerCase().includes(skill.toLowerCase()) &&
        (sa.mastery === "精通" || sa.mastery === "熟练")
      )
    ).length / preferred.length * 100;
    return Math.round(reqScore * 0.7 + prefScore * 0.3);
  }

  function calculateSoftSkillMatch(testResult: any, jobSoftSkills: string[]): number {
    if (!testResult || !testResult.dimensions) return 50;
    const mapping: Record<string, number> = {
      "抗压能力": testResult.dimensions.competitionStress || 0,
      "团队协作": testResult.dimensions.teamCollaboration || 0,
      "沟通能力": testResult.dimensions.teamCollaboration || 0,
      "组织协调": testResult.dimensions.orgCoordination || 0,
      "创新能力": testResult.dimensions.careerValues || 0,
      "学习能力": testResult.dimensions.competitionStress || 0,
      "技术领导力": (testResult.dimensions.orgCoordination + testResult.dimensions.careerValues) / 2,
    };
    let total = 0;
    jobSoftSkills.forEach(skill => { total += mapping[skill] || 50; });
    return jobSoftSkills.length > 0 ? Math.round(total / jobSoftSkills.length) : 50;
  }

  function calculateExperienceMatch(projects: string, job: any): number {
    if (!projects) return 50;
    const jobKeywords = [...job.requiredSkills, ...job.preferredSkills].map((s: string) => s.toLowerCase());
    const matchCount = jobKeywords.filter((k: string) => projects.toLowerCase().includes(k)).length;
    return Math.min(Math.round(matchCount / jobKeywords.length * 100), 100);
  }

  function generateRecommendationReason(aiAnalysis: any, formData: any, job: any, hard: number, soft: number): string {
    let reason = `推荐"${job.title}"岗位`;
    if (hard >= 80 && aiAnalysis.skillsAnalysis) {
      const matched = aiAnalysis.skillsAnalysis.filter((sa: any) =>
        job.requiredSkills.some((s: string) => sa.name.toLowerCase().includes(s.toLowerCase())) &&
        (sa.mastery === "精通" || sa.mastery === "熟练")
      );
      if (matched.length > 0) {
        reason += `，因为你的画像显示：${matched.map((ms: any) => `${ms.name}（${ms.evidence}）`).join("；")}`;
      }
    }
    if (soft >= 70) {
      reason += `，且你的能力测试显示软实力得分${soft}分，符合该岗位要求`;
    }
    return reason + "。";
  }

  function generateGaps(formData: any, job: any, hard: number, soft: number): string[] {
    const gaps: string[] = [];
    if (hard < 60) {
      const missing = job.requiredSkills.filter((s: string) =>
        !(formData.skills || "").toLowerCase().includes(s.toLowerCase())
      );
      if (missing.length > 0) gaps.push(`补充${missing.join("、")}技能`);
    }
    if (soft < 50) {
      gaps.push(`提升${job.softSkills.join("、")}等软实力（你测试得分${soft}分，建议针对性训练）`);
    }
    if (gaps.length === 0) gaps.push("画像与岗位高度匹配，建议准备面试案例");
    return gaps;
  }

  // ============================================
  // 渲染：基础信息输入
  // ============================================
  if (step === "input-basic") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧠 智能画像分析
            </h1>
            <p className="text-gray-600 mb-8">填写真实信息，完成能力测试，获取全景画像分析报告</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">❌ {error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* 简历原文 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">简历原文（必填）</label>
                <textarea value={formData.resumeText}
                  onChange={e => setFormData({ ...formData, resumeText: e.target.value })}
                  placeholder="请粘贴完整简历原文，AI将严格基于此分析..." rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
                  <select value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">请选择</option>
                    {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">专业</label>
                  <input type="text" value={formData.major}
                    onChange={e => setFormData({ ...formData, major: e.target.value })}
                    placeholder="如：计算机科学与技术"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学校</label>
                  <input type="text" value={formData.school}
                    onChange={e => setFormData({ ...formData, school: e.target.value })}
                    placeholder="如：清华大学"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">目标岗位</label>
                  <input type="text" value={formData.targetPosition}
                    onChange={e => setFormData({ ...formData, targetPosition: e.target.value })}
                    placeholder="如：后端开发工程师"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* 技能 & 项目 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">技能列表（逗号分隔）</label>
                <input type="text" value={formData.skills}
                  onChange={e => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="如：React, TypeScript, Node.js"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">项目经历</label>
                <textarea value={formData.projects}
                  onChange={e => setFormData({ ...formData, projects: e.target.value })}
                  placeholder="如：电商管理系统 - 负责前端开发" rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* 下一步按钮 */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleBasicSubmit}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl">
                下一步：完成能力测试 →
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ============================================
  // 渲染：能力测试
  // ============================================
  if (step === "input-test") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <AbilityTest onComplete={handleTestComplete} />
          <div className="mt-4 text-center">
            <button onClick={() => setStep("input-basic")}
              className="text-sm text-gray-500 hover:text-gray-700">
              ← 返回修改基础信息
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 渲染：分析中
  // ============================================
  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 正在融合分析中...</h2>
          <p className="text-gray-600">基于简历事实 + 能力测试数据生成全景画像</p>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // 渲染：结果页面
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 标题 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 全景智能画像报告</h1>
          <p className="text-gray-600">基于简历事实 + 能力测试的双源数据分析</p>
          {analysisResult.abilityTestResult && (
            <div className="mt-4 inline-block px-4 py-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-800">
                能力测试综合得分：{analysisResult.abilityTestResult.overallScore}分
              </span>
            </div>
          )}
        </motion.div>

        {/* 竞争力评分 */}
        {analysisResult.competitiveness ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 市场竞争力评分</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{analysisResult.competitiveness.overall ?? '-'}</div>
              <div className="text-gray-600">综合得分</div>
            </div>
            {Object.entries(analysisResult.competitiveness.dimensions || {}).map(([key, value]: [string, any]) => (
              <div key={key} className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">{value ?? '-'}</div>
                <div className="text-gray-600">{key === "education" ? "学历" : key === "experience" ? "经验" : "技能"}</div>
              </div>
            ))}
          </div>
        </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 市场竞争力评分</h2>
            <div className="text-center text-gray-500 py-6">暂无竞争力评分数据</div>
          </motion.div>
        )}

        {/* 能力测试结果展示 */}
        {analysisResult.abilityTestResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🧪 能力测试详情</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { key: "orgCoordination", label: "组织协调", icon: "🏛️" },
                { key: "competitionStress", label: "竞赛抗压", icon: "🏆" },
                { key: "teamCollaboration", label: "团队协作", icon: "👥" },
                { key: "careerValues", label: "职业价值观", icon: "🎯" },
              ].map(dim => (
                <div key={dim.key} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">{dim.icon}</div>
                  <div className="text-xl font-bold text-indigo-600">
                    {analysisResult.abilityTestResult.dimensions[dim.key]}
                  </div>
                  <div className="text-sm text-gray-600">{dim.label}</div>
                </div>
              ))}
            </div>
            {analysisResult.abilityTestResult.highlights?.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg mb-4">
                <p className="text-sm font-medium text-green-800">✅ 亮点：{analysisResult.abilityTestResult.highlights.join("、")}</p>
              </div>
            )}
            {analysisResult.abilityTestResult.gaps?.length > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-800">⚡ 待提升：{analysisResult.abilityTestResult.gaps.join("、")}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* 技能掌握度 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 技能掌握度分析</h2>
          <div className="space-y-4">
            {analysisResult.skillsAnalysis?.map((skill: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{skill.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="text-blue-600">📋 证据：</span>{skill.evidence}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  skill.mastery === "精通" ? "bg-green-100 text-green-800" :
                  skill.mastery === "熟练" ? "bg-blue-100 text-blue-800" :
                  skill.mastery === "了解" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                }`}>{skill.mastery}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 项目复盘 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📁 项目经历复盘</h2>
          {analysisResult.projectReview?.map((proj: any, i: number) => (
            <div key={i} className="mb-6 last:mb-0">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{proj.name}</h3>
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">关键贡献</h4>
                <ul className="space-y-2">{proj.contributions?.map((c: string, j: number) => (
                  <li key={j} className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span><span>{c}</span></li>
                ))}</ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">量化成果</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{proj.quantifiedResults?.map((r: any, j: number) => (
                  <div key={j} className="p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-green-800">{r.metric}</div>
                    <div className="text-green-700">{r.value}</div>
                  </div>
                ))}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* 提升建议 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">💡 精准提升建议</h2>
          <div className="space-y-6">{analysisResult.advice?.map((item: any, i: number) => (
            <div key={i} className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">问题：{item.problem}</h3>
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">具体行动</h4>
                <ol className="space-y-2">{item.actions?.map((a: string, j: number) => (
                  <li key={j} className="flex items-start gap-2"><span className="text-orange-600 font-medium">{j+1}.</span><span>{a}</span></li>
                ))}</ol>
              </div>
              <div className="p-3 bg-white rounded-lg"><span className="text-sm font-medium text-green-700">预期效果：{item.outcome}</span></div>
            </div>
          ))}</div>
        </motion.div>

        {/* 岗位匹配报告 */}
        <JobMatchReport userProfile={formData} analysisResult={analysisResult} />

        {/* 重新分析 */}
        <div className="text-center">
          <button onClick={() => { setStep("input-basic"); setAnalysisResult(null); setAbilityTestResult(null); setError(null); }}
            className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800">
            ← 重新分析
          </button>
        </div>
      </div>
    </div>
  );
}
