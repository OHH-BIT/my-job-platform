"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, CheckCircle, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { diagnoseResume } from "@/lib/resume-diagnosis";
import { DiagnosisResult, DiagnosisRequest } from "@/types/resume-diagnosis";
import { JobPosition } from "@/lib/job-matching";

interface ResumeDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPosition;
}

export default function ResumeDiagnosisModal({ isOpen, onClose, job }: ResumeDiagnosisModalProps) {
  const [resumeText, setResumeText] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  // 开始诊断
  const handleStartDiagnosis = () => {
    if (!resumeText.trim()) {
      alert("请先粘贴或输入你的简历内容");
      return;
    }

    setIsDiagnosing(true);
    setDiagnosisResult(null);
    setProgress(0);
    setCurrentStep("正在解析简历内容...");

    // 模拟诊断过程
    const steps = [
      { progress: 20, message: "正在解析简历内容..." },
      { progress: 40, message: "正在提取关键词..." },
      { progress: 60, message: "正在比对岗位要求..." },
      { progress: 80, message: "正在生成诊断报告..." },
      { progress: 100, message: "诊断完成！" }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setProgress(step.progress);
        setCurrentStep(step.message);

        if (index === steps.length - 1) {
          // 诊断完成，生成结果
          const request: DiagnosisRequest = {
            resumeText,
            jobId: job.id,
            jobTitle: job.title,
            jobDescription: job.description,
            jobRequirements: job.requirements.skills
          };

          const result = diagnoseResume(request);
          setDiagnosisResult(result);
          setIsDiagnosing(false);
        }
      }, (index + 1) * 800);
    });
  };

  // 关闭模态框
  const handleClose = () => {
    setResumeText("");
    setDiagnosisResult(null);
    setIsDiagnosing(false);
    setProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">测测我的简历通过率</h2>
              <p className="text-sm text-gray-500 mt-1">{job.title} - {job.department}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 80px)" }}>
            {!diagnosisResult && !isDiagnosing && (
              <>
                {/* Input Area */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    粘贴你的简历内容
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="请粘贴你的简历文本内容，或者描述你的教育背景、技能、项目经历等..."
                    className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    💡 提示：粘贴的简历内容越详细，诊断结果越准确
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleStartDiagnosis}
                  disabled={!resumeText.trim()}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  开始诊断
                </button>
              </>
            )}

            {/* Diagnosing Animation */}
            {isDiagnosing && (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">AI正在诊断中...</h3>
                <p className="text-sm text-gray-600 mb-6">{currentStep}</p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{progress}% 完成</p>
              </div>
            )}

            {/* Diagnosis Result */}
            {diagnosisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Overall Score */}
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {diagnosisResult.overallScore}分
                  </div>
                  <div className="text-lg font-medium text-gray-900 mb-1">
                    {diagnosisResult.grade}
                  </div>
                  <p className="text-sm text-gray-600">
                    关键词匹配率：{diagnosisResult.keywordMatchRate}%
                  </p>
                </div>

                {/* Strengths */}
                {diagnosisResult.strengths.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-xl">
                    <h4 className="font-semibold text-sm mb-3 text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      亮点分析
                    </h4>
                    <ul className="space-y-2">
                      {(() => {
                        // 临时调试代码：打印所有的 key 值
                        const keys = diagnosisResult.strengths.map(item => item.id);
                        const hasDuplicate = new Set(keys).size !== keys.length;
                        const hasEmpty = keys.some(k => !k);
                        console.log('[Debug] Strengths keys:', keys);
                        console.log('[Debug] Has duplicate keys:', hasDuplicate);
                        console.log('[Debug] Has empty keys:', hasEmpty);
                        
                        if (hasDuplicate || hasEmpty) {
                          console.error('[Error] Duplicate or empty keys detected in strengths!', keys);
                        }
                        
                        return diagnosisResult.strengths.map((strength) => (
                          <li key={strength.id || `strength-fallback-${Math.random()}`} className="text-sm text-green-700">
                            <span className="font-medium">✓ {strength.keyword}</span>
                            <p className="text-xs text-green-600 mt-1">{strength.context}</p>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                )}

                {/* Gaps */}
                {diagnosisResult.gaps.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-xl">
                    <h4 className="font-semibold text-sm mb-3 text-red-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      缺失项预警
                    </h4>
                    <ul className="space-y-2">
                      {(() => {
                        // 临时调试代码：打印所有的 key 值
                        const keys = diagnosisResult.gaps.map(item => item.id);
                        const hasDuplicate = new Set(keys).size !== keys.length;
                        const hasEmpty = keys.some(k => !k);
                        console.log('[Debug] Gaps keys:', keys);
                        console.log('[Debug] Has duplicate keys:', hasDuplicate);
                        console.log('[Debug] Has empty keys:', hasEmpty);
                        
                        if (hasDuplicate || hasEmpty) {
                          console.error('[Error] Duplicate or empty keys detected in gaps!', keys);
                        }
                        
                        return diagnosisResult.gaps.map((gap) => (
                          <li key={gap.id || `gap-fallback-${Math.random()}`} className="text-sm text-red-700">
                            <span className="font-medium">⚠ {gap.keyword}</span>
                            <p className="text-xs text-red-600 mt-1">{gap.reason}</p>
                            <p className="text-xs text-red-500 mt-0.5">{gap.suggestion}</p>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {diagnosisResult.suggestions.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <h4 className="font-semibold text-sm mb-3 text-yellow-800 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      AI优化建议
                    </h4>
                    <ul className="space-y-3">
                      {(() => {
                        // 临时调试代码：打印所有的 key 值
                        const keys = diagnosisResult.suggestions.map(item => item.id);
                        const hasDuplicate = new Set(keys).size !== keys.length;
                        const hasEmpty = keys.some(k => !k);
                        console.log('[Debug] Suggestions keys:', keys);
                        console.log('[Debug] Has duplicate keys:', hasDuplicate);
                        console.log('[Debug] Has empty keys:', hasEmpty);
                        
                        if (hasDuplicate || hasEmpty) {
                          console.error('[Error] Duplicate or empty keys detected in suggestions!', keys);
                        }
                        
                        return diagnosisResult.suggestions.map((suggestion) => (
                          <li key={suggestion.id || `suggestion-fallback-${Math.random()}`} className="text-sm">
                            <div className="font-medium text-yellow-900">{suggestion.title}</div>
                            <p className="text-xs text-yellow-700 mt-1">{suggestion.description}</p>
                            <p className="text-xs text-yellow-600 mt-0.5 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {suggestion.impact}
                            </p>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                )}

                {/* Re-diagnose Button */}
                <button
                  onClick={() => {
                    setDiagnosisResult(null);
                    setResumeText("");
                  }}
                  className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  重新诊断
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
