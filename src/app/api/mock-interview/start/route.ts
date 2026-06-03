
import { NextRequest, NextResponse } from "next/server";
import { JOB_POSITIONS } from "@/lib/job-matching";
import { generateText, buildInterviewerPrompt } from "@/lib/ai-service";

// ============================================
// 类型定义
// ============================================

interface InterviewConfig {
  targetJobId: string;
  interviewDuration?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'stress';
  focusAreas?: string[];
  questionCount?: number;
  type?: 'behavioral' | 'technical';
}

interface UserProfileSnapshot {
  grade: string;
  major: string;
  expectedPosition: string;
  skills: string[];
  projects: any[];
  internships: any[];
  dimensionScores: {
    professional: number;
    communication: number;
    leadership: number;
    innovation: number;
    resilience: number;
  };
}

interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: number;
  isVoice?: boolean;
}

interface InterviewSession {
  id: string;
  config: InterviewConfig;
  status: 'in_progress' | 'completed';
  messages: InterviewMessage[];
  startTime: number;
  endTime?: number;
  report?: any;
  currentQuestionIndex: number;
  userProfile: any;
  questions?: Array<{ id: string; question: string; type: string; isFollowUp?: boolean }>;
}

type MessageRole = 'interviewer' | 'candidate';

// ============================================
// AI 模拟面试舱 - 开始面试 API
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, userProfile, preGeneratedQuestions } = body;

    // 验证参数
    if (!config || !userProfile) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数：config 或 userProfile" },
        { status: 400 }
      );
    }

    // 生成会话ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 获取目标岗位信息
    const targetJob = JOB_POSITIONS.find(job => job.id === config.targetJobId);
    if (!targetJob) {
      return NextResponse.json(
        { success: false, error: "未找到目标岗位信息" },
        { status: 404 }
      );
    }

    // 构建 AI 面试官的 System Prompt
    const systemPrompt = buildInterviewerPrompt(config, userProfile, targetJob);

    // 构建第一轮对话（AI面试官的第一个问题）
    const firstQuestion = await generateFirstQuestion(systemPrompt, userProfile, targetJob, config);

    // 创建面试会话
    const session: InterviewSession = {
      id: sessionId,
      config,
      status: "in_progress",
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: "interviewer",
          content: firstQuestion,
          timestamp: Date.now(),
        },
      ],
      startTime: Date.now(),
      userProfile,
      currentQuestionIndex: 0,
      questions: preGeneratedQuestions || [],
    };

    // TODO: 保存会话到数据库或Redis（当前演示使用内存存储）
    // 为简化演示，这里使用全局变量存储（生产环境应使用数据库）
    globalMockInterviews[sessionId] = session;

    return NextResponse.json({
      success: true,
      sessionId,
      firstQuestion,
    });
  } catch (error: any) {
    console.error("启动面试失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "启动面试失败" },
      { status: 500 }
    );
  }
}

// ============================================
// 构建 AI 面试官 Prompt（核心）
// ============================================

function buildInterviewerPromptOld(
  config: any,
  userProfile: any,
  targetJob: any
): string {
  // 使用 AI 服务模块中的函数
  return buildInterviewerPrompt(config, userProfile, targetJob);
}

// ============================================
// 生成第一个问题（调用AI）
// ============================================

async function generateFirstQuestion(
  systemPrompt: string,
  userProfile: any,
  targetJob: any,
  config: any
): Promise<string> {
  try {
    // 调用 AI 服务生成第一个问题
    const firstQuestion = await generateText(
      systemPrompt,
      "请开始面试，提出第一个问题（自我介绍）。",
      {
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    return firstQuestion.trim();
  } catch (error) {
    console.error("生成第一个问题失败:", error);
    // 返回兜底问题（演示模式）
    return `你好！欢迎参加腾讯${targetJob.title}岗位的${config.type === "behavioral" ? "行为面试" : "技术面试"}。

首先，请你做一个简单的自我介绍，包括你的教育背景、专业技能和相关的项目经历。

（演示模式：AI 服务调用失败，这是默认问题。请检查 API Key 配置）`;
  }
}

// ============================================
// 全局存储（演示用，生产环境应使用数据库）
// ============================================

declare global {
  var globalMockInterviews: Record<string, InterviewSession>;
}

global.globalMockInterviews = global.globalMockInterviews || {};
export const globalMockInterviews = global.globalMockInterviews;
