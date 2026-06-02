"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, Lightbulb, TrendingUp, Copy, Share2, Download, Loader2, FileCheck, AlertTriangle } from "lucide-react";
import { diagnoseResumeDeeply } from "@/lib/resume-checker";
import { ResumeDiagnosisReport, ResumeCheckerRequest, DiagnosisProcess } from "@/types/resume-checker";
import ReactECharts from "echarts-for-react";
import { parseFileWithProgress, checkExtractedTextQuality, validateFile } from "@/lib/file-parser";

export default function ResumeCheckerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resumeText, setResumeText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<{
    stage: 'reading' | 'parsing' | 'extracting' | 'complete';
    percent: number;
    message: string;
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<ResumeDiagnosisReport | null>(null);
  const [process, setProcess] = useState<DiagnosisProcess>({
    isAnalyzing: false,
    currentStep: 0,
    totalSteps: 5,
    stepDescription: "",
    progress: 0
  });

  // 从URL参数获取岗位信息
  const jobId = searchParams.get("jobId");
  const jobTitle = searchParams.get("jobTitle");
  const jobDescription = searchParams.get("jobDescription");

  // 如果有岗位信息，显示提示
  const hasJobContext = jobId && jobTitle;

  // 处理文件上传并解析
  const handleFileUpload = useCallback(async (file: File) => {
    // 验证文件
    const validation = validateFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setUploadedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParseProgress(null);
    
    try {
      // 解析文件并提取文本
      const text = await parseFileWithProgress(file, (progress) => {
        setParseProgress(progress);
      });
      
      // 检查提取的文本质量
      const quality = checkExtractedTextQuality(text);
      
      if (!quality.isLikelyResume) {
        setParseError(
          `警告：提取的内容可能不是一个简历文件。\n\n` +
          `置信度：${quality.confidence}%\n` +
          `问题：${quality.warnings.join('；')}\n\n` +
          `建议：请确认上传的是简历文件（PDF或Word格式）。`
        );
        setResumeText(text); // 仍然设置文本，让用户决定是否继续
      } else if (quality.warnings.length > 0) {
        // 有警告但可能是简历
        console.warn('简历解析警告:', quality.warnings);
        setResumeText(text);
      } else {
        // 解析成功
        setResumeText(text);
      }
      
    } catch (error) {
      console.error('文件解析失败:', error);
      setParseError(
        error instanceof Error ? error.message : '文件解析失败，请重试或手动粘贴文本。'
      );
      setResumeText(""); // 解析失败，清空文本
    } finally {
      setIsParsing(false);
    }
  }, []);

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // 开始诊断
  const handleStartDiagnosis = () => {
    if (!resumeText.trim()) {
      alert("请先上传简历或粘贴简历文本");
      return;
    }

    setIsDiagnosing(true);
    setDiagnosisResult(null);
    
    // 模拟诊断过程
    const steps = [
      { step: 0, description: "正在提取关键技能...", progress: 20 },
      { step: 1, description: "正在比对岗位模型...", progress: 40 },
      { step: 2, description: "正在分析项目经历...", progress: 60 },
      { step: 3, description: "正在识别风险点...", progress: 80 },
      { step: 4, description: "正在生成优化建议...", progress: 100 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setProcess({
          isAnalyzing: true,
          currentStep: step.step,
          totalSteps: 5,
          stepDescription: step.description,
          progress: step.progress
        });

        if (index === steps.length - 1) {
          // 诊断完成，生成结果
          setTimeout(() => {
            const request: ResumeCheckerRequest = {
              resumeText,
              jobId: jobId || undefined,
              jobTitle: jobTitle ? decodeURIComponent(jobTitle) : undefined,
              jobDescription: jobDescription ? decodeURIComponent(jobDescription) : undefined
            };
            
            const result = diagnoseResumeDeeply(request);
            setDiagnosisResult(result);
            setIsDiagnosing(false);
          }, 500);
        }
      }, (index + 1) * 800);
    });
  };

  // 复制建议
  const handleCopySuggestion = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制到剪贴板");
  };

  // 渲染评分仪表盘
  const renderScoreGauge = (score: number, grade: string, color: string) => {
    const option = {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          itemStyle: {
            color: color
          },
          progress: {
            show: true,
            width: 18
          },
          pointer: {
            show: false
          },
          axisLine: {
            lineStyle: {
              width: 18,
              color: [[1, '#e5e7eb']]
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          title: {
            show: false
          },
          detail: {
            valueAnimation: true,
            width: '60%',
            lineHeight: 40,
            borderRadius: 8,
            offsetCenter: [0, '-15%'],
            fontSize: 40,
            fontWeight: 'bold',
            formatter: `{value}分\n${grade}`,
            color: color
          },
          data: [
            {
              value: score,
              name: grade
            }
          ]
        }
      ]
    };

    return (
      <ReactECharts
        option={option}
        style={{ height: '250px' }}
        opts={{ renderer: 'svg' }}
      />
    );
  };

  // 渲染雷达图
  const renderRadarChart = (radarData: any) => {
    const option = {
      radar: {
        indicator: radarData.labels.map((label: string) => ({ name: label, max: 100 })),
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: '#666',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: ['rgba(0, 0, 0, 0.1)']
          }
        },
        splitArea: {
          show: false
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.2)'
          }
        }
      },
      series: [
        {
          type: 'radar',
          symbolSize: 8,
          data: [
            {
              value: radarData.userValues,
              name: '你的简历能力值',
              areaStyle: {
                color: 'rgba(59, 130, 246, 0.3)'
              },
              lineStyle: {
                color: '#3b82f6',
                width: 2
              },
              itemStyle: {
                color: '#3b82f6'
              }
            },
            {
              value: radarData.standardValues,
              name: '目标岗位标准值',
              areaStyle: {
                color: 'rgba(239, 68, 68, 0.3)'
              },
              lineStyle: {
                color: '#ef4444',
                width: 2,
                type: 'dashed'
              },
              itemStyle: {
                color: '#ef4444'
              }
            }
          ]
        }
      ]
    };

    return (
      <ReactECharts
        option={option}
        style={{ height: '350px', maxHeight: '50vh' }}
        opts={{ renderer: 'svg' }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 返回首页
              </button>
              <h1 className="text-2xl font-bold text-gray-900">AI简历智能诊断</h1>
            </div>
            <div className="text-sm text-gray-500">
              上传简历，30秒获取大厂HR视角的诊断报告
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {!diagnosisResult && !isDiagnosing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-2">
                📄 上传你的简历
              </h2>
              <p className="text-gray-600 text-center mb-8">
                支持 PDF、Word 格式，或直接粘贴简历文本
              </p>

              {/* Job Context Hint */}
              {hasJobContext && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
                    <Sparkles className="w-5 h-5" />
                    已关联岗位：{decodeURIComponent(jobTitle || "")}
                  </div>
                  <p className="text-sm text-blue-700">
                    AI将基于该岗位的JD进行深度诊断，提供针对性优化建议
                  </p>
                </div>
              )}

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                {isParsing ? (
                  // 解析进度显示
                  <div className="py-8">
                    <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {parseProgress?.message || '正在解析文件...'}
                    </p>
                    {parseProgress && (
                      <div className="w-64 mx-auto mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${parseProgress.percent}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{parseProgress.percent}% 完成</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // 正常上传区域
                  <>
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      拖拽文件到此处，或
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer ml-1">
                        点击上传
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                          className="hidden"
                          disabled={isParsing}
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500">
                      支持 PDF、Word 格式（.pdf, .doc, .docx）
                    </p>
                  </>
                )}
              </div>

              {/* Parse Error Display */}
              {parseError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-1">文件解析失败</p>
                      <p className="text-sm text-red-700 whitespace-pre-line">{parseError}</p>
                      <button
                        onClick={() => {
                          setParseError(null);
                          setResumeText("");
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                      >
                        手动粘贴文本
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload Success Indicator */}
              {uploadedFile && !isParsing && !parseError && resumeText && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        文件 "{uploadedFile.name}" 解析成功
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        已提取 {resumeText.length} 字符，已自动填充到下方文本框
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">或者</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  直接粘贴简历文本
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="请粘贴你的简历全文，或描述你的教育背景、技能、项目经历等..."
                  className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 提示：简历内容越详细，诊断结果越准确
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleStartDiagnosis}
                disabled={!resumeText.trim()}
                className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-6 h-6" />
                开始AI诊断
              </button>
            </div>
          </motion.div>
        )}

        {/* Diagnosing Animation */}
        {isDiagnosing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center py-20"
          >
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI正在诊断中...</h3>
              <p className="text-lg text-gray-600 mb-8">{process.stepDescription}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${process.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{process.progress}% 完成</p>

              {/* Steps Indicator */}
              <div className="flex justify-center gap-2 mt-8">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      step < process.currentStep
                        ? "bg-green-500"
                        : step === process.currentStep
                        ? "bg-blue-600 scale-125"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Diagnosis Result */}
        {diagnosisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">诊断报告已生成</h2>
              <p className="text-gray-600">基于大厂HR视角深度分析</p>
            </div>

            {/* Score Gauge */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                综合竞争力评分
              </h3>
              {renderScoreGauge(
                diagnosisResult.score.overall,
                diagnosisResult.score.grade,
                diagnosisResult.score.gradeColor
              )}
              <p className="text-center text-gray-600 mt-4 max-w-2xl mx-auto">
                {diagnosisResult.summary}
              </p>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                能力雷达图对比
              </h3>
              <p className="text-center text-gray-600 mb-4">
                蓝色：你的简历能力值 | 红色：目标岗位标准值
              </p>
              {renderRadarChart(diagnosisResult.radarData)}
            </div>

            {/* Strengths */}
            {diagnosisResult.strengths.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  亮点分析（优势）
                </h3>
                <div className="space-y-4">
                  {diagnosisResult.strengths.map((strength) => (
                    <div
                      key={strength.id}
                      className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl"
                    >
                      <div className="font-bold text-green-900 mb-1">{strength.title}</div>
                      <div className="text-sm text-green-800 mb-2">{strength.description}</div>
                      <div className="text-xs text-green-700 bg-green-100 inline-block px-2 py-1 rounded">
                        证据：{strength.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {diagnosisResult.risks.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  扣分项/风险点
                </h3>
                <div className="space-y-4">
                  {diagnosisResult.risks.map((risk) => (
                    <div
                      key={risk.id}
                      className={`p-4 border-l-4 rounded-r-xl ${
                        risk.severity === 'critical'
                          ? 'bg-red-50 border-red-500'
                          : risk.severity === 'major'
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="font-bold text-gray-900 mb-1">{risk.title}</div>
                      <div className="text-sm text-gray-700 mb-2">{risk.description}</div>
                      <div className="text-xs text-red-700 bg-red-100 inline-block px-2 py-1 rounded">
                        影响：{risk.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guidance */}
            {diagnosisResult.guidance.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                  AI针对性修改指导
                </h3>
                <div className="space-y-6">
                  {diagnosisResult.guidance.map((guide) => (
                    <div key={guide.id} className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                      <div className="font-bold text-gray-900 mb-3">{guide.title}</div>
                      
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">原文：</div>
                        <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                          {guide.originalText}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">建议修改为：</div>
                        <div className="text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200 flex items-start justify-between gap-2">
                          <span>{guide.suggestedText}</span>
                          <button
                            onClick={() => handleCopySuggestion(guide.suggestedText)}
                            className="flex-shrink-0 p-1 hover:bg-green-100 rounded"
                          >
                            <Copy className="w-4 h-4 text-green-600" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">为什么这样改：</span>{guide.reason}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">{guide.expectedImprovement}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">下一步建议</h3>
              <ol className="space-y-3">
                {diagnosisResult.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 mt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setDiagnosisResult(null);
                  setResumeText("");
                  setUploadedFile(null);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                重新诊断
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                下载报告
              </button>
              <button
                onClick={() => {
                  // 分享功能 - 实际应该生成分享链接
                  alert("分享功能开发中...");
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                分享报告
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
