export const dynamic = 'force-static';

/**
 * AI 动态出题引擎 API
 * POST /api/ai-interview/generate-questions
 * 
 * 接收岗位、简历、面试类型、难度参数，调用 AI 生成定制化面试题
 */

import { NextRequest, NextResponse } from "next/server";
import { JOB_POSITIONS } from "@/lib/job-matching";
import { generateText, buildQuestionGeneratorPrompt, parseAIJSON } from "@/lib/ai-service";

// ============================================
// 兜底题目（AI 不可用时的演示模式）
// ============================================

function getFallbackQuestions(
  jobTitle: string,
  interviewType: string,
  difficulty: string,
  resumeText: string,
  count: number
): Array<{ question: string; type: string }> {
  // 从简历中提取关键词用于个性化兜底题目
  const skills: string[] = [];
  const projects: string[] = [];
  
  if (resumeText) {
    const skillPattern = /(?:掌握|熟悉|精通|了解|使用|熟练)\s*([^，。、\n]+)/g;
    let match;
    while ((match = skillPattern.exec(resumeText)) !== null && skills.length < 5) {
      skills.push(match[1].trim());
    }
    const projectPattern = /(?:项目|实习|实践|开发|设计|搭建)\s*[：:]?\s*([^，。\n]{4,30})/g;
    while ((match = projectPattern.exec(resumeText)) !== null && projects.length < 3) {
      projects.push(match[1].trim());
    }
  }

  const questions: Array<{ question: string; type: string }> = [
    {
      question: `请先做一个简短的自我介绍，重点谈谈你为什么对腾讯的${jobTitle}岗位感兴趣，以及你认为自己有哪些核心竞争力。`,
      type: "自我介绍",
    },
  ];

  if (interviewType === "technical") {
    if (skills.length > 0) {
      questions.push({
        question: `你在简历中提到你${skills[0]}方面有一定经验，能否详细讲讲你是如何学习和应用这项技术的？在实际项目中遇到过什么技术难点？`,
        type: "技术深挖",
      });
    } else {
      questions.push({
        question: `对于${jobTitle}这个岗位，你认为最重要的技术能力是什么？你目前在这些方面掌握到什么程度？`,
        type: "技术基础",
      });
    }
    if (projects.length > 0) {
      questions.push({
        question: `我注意到你参与过"${projects[0]}"相关的工作，请详细描述一下这个项目的技术架构、你负责的模块，以及项目中遇到的最大技术挑战和你的解决方案。`,
        type: "项目深挖",
      });
    }
    if (difficulty === "hard" || difficulty === "stress") {
      questions.push({
        question: `如果现在让你从零开始设计一个高并发的系统，你会如何考虑架构选型？在性能、可用性和一致性之间你会如何做权衡？`,
        type: "系统设计",
      });
    }
    questions.push({
      question: `你认为${jobTitle}工程师最需要具备的三个核心素质是什么？结合你的经历说说你在这些方面的表现。`,
      type: "综合素质",
    });
  } else {
    // 行为面试
    if (projects.length > 0) {
      questions.push({
        question: `在"${projects[0]}"这个项目中，你是如何与团队成员协作的？有没有遇到过意见不合的情况？你是如何处理的？`,
        type: "团队协作",
      });
    } else {
      questions.push({
        question: `请讲一个你在团队合作中遇到意见分歧的经历。你是如何沟通协调，最终达成一致的？`,
        type: "团队协作",
      });
    }
    questions.push({
      question: `在你过往的学习或实习经历中，有没有遇到过特别困难或压力很大的情况？你是如何应对的？最终结果如何？`,
      type: "抗压能力",
    });
    if (difficulty !== "easy") {
      questions.push({
        question: `你认为自己最大的不足是什么？你是如何认识到这个不足的？目前采取了什么措施来改进？`,
        type: "自我认知",
      });
    }
    questions.push({
        question: `未来3-5年，你的职业规划是怎样的？为什么选择腾讯作为你职业生涯的重要一步？`,
        type: "职业规划",
      });
  }

  // 截取到请求数量
  return questions.slice(0, count);
}

// ============================================
// POST 处理
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobPosition, interviewType, difficultyLevel, resumeText, questionCount } = body;

    // 参数验证
    if (!jobPosition || !interviewType || !difficultyLevel) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数：jobPosition、interviewType、difficultyLevel" },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(parseInt(questionCount) || 5, 3), 10);

    // 查找岗位信息
    const targetJob = JOB_POSITIONS.find((job) => job.id === jobPosition || job.title === jobPosition);
    const jobTitle = targetJob?.title || jobPosition;
    const jobDescription = targetJob?.description || "";
    const jobRequirements = targetJob?.requirements?.skills || [];

    // 调用 AI 生成题目
    let questions: Array<{ question: string; type: string; isFollowUp?: boolean }>;

    try {
      const systemPrompt = buildQuestionGeneratorPrompt({
        jobPosition: jobTitle,
        interviewType,
        difficultyLevel,
        resumeText: resumeText || "",
        questionCount: count,
        jobDescription,
        jobRequirements,
      });

      const userMessage = `请根据以上信息，生成 ${count} 道面试题，严格以 JSON 数组格式返回。`;

      const aiResponse = await generateText(systemPrompt, userMessage, {
        temperature: 0.8,
        maxTokens: 2000,
      });

      // 解析 AI 返回的 JSON
      const parsed = parseAIJSON(aiResponse);

      if (Array.isArray(parsed) && parsed.length > 0) {
        questions = parsed.map((item: any, index: number) => ({
          id: `q_${index + 1}`,
          question: item.question || item.content || `第${index + 1}题`,
          type: item.type || item.category || "综合考察",
          isFollowUp: false,
        }));
      } else {
        throw new Error("AI 返回格式异常");
      }
    } catch (aiError) {
      console.error("AI 出题失败，使用兜底题目:", aiError);
      // 使用兜底题目
      questions = getFallbackQuestions(jobTitle, interviewType, difficultyLevel, resumeText || "", count).map((q, i) => ({
        id: `q_${i + 1}`,
        ...q,
        isFollowUp: false,
      }));
    }

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: any) {
    console.error("生成面试题失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "生成面试题失败" },
      { status: 500 }
    );
  }
}
