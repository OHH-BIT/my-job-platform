# AI 模拟面试舱 - 配置和使用指南

## 📋 功能概述

AI 模拟面试舱是一个智能面试模拟系统，使用大语言模型（LLM）模拟真实的腾讯面试官，帮助用户提升面试技巧。

### 核心功能

1. **智能面试官**：AI 面试官基于用户简历和岗位 JD，进行个性化提问
2. **实时对话**：支持实时对话，AI 根据回答进行动态追问
3. **面试报告**：面试结束后生成详细的复盘报告，包括逐题点评和优化建议
4. **多种模式**：支持行为面试、技术面试，以及初级、中级、压力面等多种难度

---

## 🔧 配置 AI 大模型

要使用真实的 AI 功能，需要配置大模型 API Key。

### 1. 选择大模型提供商

系统使用 OpenAI SDK，兼容所有支持 OpenAI 协议的大模型：

- **OpenAI**：`https://api.openai.com/v1`
- **通义千问（阿里云）**：`https://dashscope.aliyuncs.com/compatible-mode/v1`
- **DeepSeek**：`https://api.deepseek.com/v1`
- **其他**：任何支持 OpenAI 协议的 API

### 2. 配置 .env 文件

在 `.env` 文件中添加以下配置：

```bash
# AI 大模型配置
OPENAI_API_KEY=你的API Key
OPENAI_BASE_URL=你的API Base URL（可选，默认为 OpenAI）
```

#### 示例配置

**OpenAI**：
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
```

**通义千问**：
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

**DeepSeek**：
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
```

### 3. 获取 API Key

- **OpenAI**：访问 https://platform.openai.com/api-keys 获取
- **通义千问**：访问 https://dashscope.aliyun.com/ 获取
- **DeepSeek**：访问 https://platform.deepseek.com/ 获取

---

## 🚀 使用流程

### 1. 启动面试

访问 `/mock-interview/config` 页面，配置面试参数：

- **目标岗位**：选择你要模拟的岗位（如：前端开发工程师）
- **面试类型**：选择行为面试或技术面试
- **难度等级**：选择初级（友好宽松）、中级（标准难度）或压力面（高压挑战）
- **题目数量**：选择 3-10 题（建议 5 题）

点击 **"🚀 开始模拟面试"** 按钮，系统将：
1. 生成面试会话 ID
2. 调用 AI 生成第一个问题（自我介绍）
3. 跳转到面试对话页面

### 2. 进行面试

在面试对话页面（`/mock-interview/chat/[sessionId]`）：

1. **AI 面试官提问**：AI 会基于你的简历和岗位 JD 提问
2. **输入回答**：在输入框中输入你的回答（支持多行，Enter 发送，Shift+Enter 换行）
3. **AI 追问**：AI 会根据你的回答进行动态追问
4. **结束面试**：点击"结束"按钮或完成所有题目后自动结束

### 3. 查看报告

面试结束后，系统会自动生成复盘报告，并跳转到报告页面（`/mock-interview/report/[sessionId]`）。

报告包含：

- **综合得分**：总体评分（0-100）
- **维度雷达图**：逻辑思维、语言表达、专业技能、岗位匹配度、抗压能力
- **总体反馈**：AI 对整体表现的评价
- **改进建议**：针对性的改进建议
- **逐题精评**：每道题的详细点评，包括：
  - 得分（0-100）
  - 回答亮点
  - 回答不足
  - **优化话术示范**（满分参考回答）

---

## 📁 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── mock-interview/
│   │       ├── start/route.ts          # 开始面试 API
│   │       ├── answer/route.ts        # 回答面试问题 API
│   │       ├── complete/[sessionId]/route.ts  # 结束面试并生成报告 API
│   │       └── report/[sessionId]/route.ts   # 获取报告 API
│   └── mock-interview/
│       ├── config/page.tsx            # 面试配置页面
│       ├── chat/[sessionId]/page.tsx # 面试对话页面
│       └── report/[sessionId]/page.tsx # 报告展示页面
└── lib/
    ├── ai-service.ts                  # AI 服务模块（核心）
    └── job-matching.ts               # 岗位数据
```

---

## 🔍 技术实现

### 后端 API

#### 1. 开始面试 API（`/api/mock-interview/start`）

- **方法**：POST
- **请求体**：
  ```json
  {
    "config": {
      "targetJobId": "frontend_engineer",
      "type": "technical",
      "difficulty": "medium",
      "questionCount": 5
    },
    "userProfile": {
      "resumeText": "简历文本",
      "basicInfo": {...},
      "skills": [...],
      "projects": [...]
    }
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "sessionId": "session_xxx",
    "firstQuestion": "AI 生成的第一个问题"
  }
  ```

#### 2. 回答面试问题 API（`/api/mock-interview/answer`）

- **方法**：POST
- **请求体**：
  ```json
  {
    "sessionId": "session_xxx",
    "message": "候选人的回答",
    "isVoice": false
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "nextQuestion": "AI 生成的下一个问题",
    "isCompleted": false
  }
  ```

#### 3. 结束面试并生成报告 API（`/api/mock-interview/complete/[sessionId]`）

- **方法**：POST
- **响应**：
  ```json
  {
    "success": true,
    "report": {
      "sessionId": "session_xxx",
      "score": {...},
      "questionReviews": [...],
      "overallFeedback": "...",
      "improvementSuggestions": [...],
      "generatedAt": 1234567890
    }
  }
  ```

### AI 服务模块（`src/lib/ai-service.ts`）

核心函数：

- `generateText(systemPrompt, userMessage, options)`：生成文本（非流式）
- `generateTextStream(systemPrompt, userMessage, onChunk, options)`：生成文本（流式）
- `buildInterviewerPrompt(config, userProfile, targetJob)`：构建面试官 Prompt
- `buildReportPrompt(conversationText)`：构建报告生成 Prompt

---

## 🐛 故障排查

### 1. 404 错误

**问题**：访问 `/mock-interview/config` 或 `/mock-interview/chat/[sessionId]` 时出现 404 错误。

**原因**：前端页面文件缺失。

**解决**：确保以下文件存在：
- `src/app/mock-interview/config/page.tsx`
- `src/app/mock-interview/chat/[sessionId]/page.tsx`
- `src/app/mock-interview/report/[sessionId]/page.tsx`

### 2. AI 服务调用失败

**问题**：面试开始后，AI 面试官没有提问，或者提示"演示模式"。

**原因**：未配置 API Key，或 API Key 配置错误。

**解决**：
1. 检查 `.env` 文件中的 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL` 是否正确
2. 重启开发服务器（修改 `.env` 后需要重启）
3. 检查 API Key 是否有效，余额是否充足

### 3. API 请求 404 错误

**问题**：前端调用 `/api/mock-interview/start` 等 API 时出现 404 错误。

**原因**：API 路由文件缺失或路径错误。

**解决**：确保以下文件存在：
- `src/app/api/mock-interview/start/route.ts`
- `src/app/api/mock-interview/answer/route.ts`
- `src/app/api/mock-interview/complete/[sessionId]/route.ts`
- `src/app/api/mock-interview/report/[sessionId]/route.ts`

### 4. 类型错误

**问题**：TypeScript 编译错误，提示类型不匹配。

**原因**：类型定义不一致。

**解决**：检查 `src/types/mock-interview.ts` 文件是否存在，类型定义是否正确。

---

## 📝 演示模式

如果没有配置 API Key，系统会自动运行在"演示模式"：

- **开始面试**：返回默认的面试问题（不调用 AI）
- **回答面试**：返回模拟的面试问题（不调用 AI）
- **生成报告**：返回模拟的面试报告（不调用 AI）

演示模式可以帮助你快速体验系统功能，但实际使用时建议配置真实的 API Key。

---

## 🎯 优化建议

### 1. 提升 AI 回答质量

- 使用更强大的模型（如 `gpt-4` 或 `qwen-max`）
- 优化 System Prompt，增加更多约束和示例
- 调整 `temperature` 参数（建议 0.7 左右）

### 2. 支持流式响应

当前实现是非流式的（等待 AI 完全生成后再返回）。可以改为流式响应（SSE），提升用户体验：

- 修改 API 路由，使用 `stream: true`
- 前端使用 `EventSource` 或 `fetch` 接收流式数据
- 实时渲染 AI 生成的文本（打字机效果）

### 3. 持久化存储

当前实现使用内存存储（全局变量），重启服务器后会丢失数据。建议：

- 使用数据库（MySQL、PostgreSQL 等）存储面试会话和报告
- 使用 Redis 缓存面试会话（临时数据）

### 4. 支持语音面试

- 集成语音识别（ASR）服务，将语音转为文本
- 集成语音合成（TTS）服务，将 AI 文本转为语音
- 实现语音面试模式，更贴近真实面试场景

---

## 📞 获取帮助

如果你在配置或使用过程中遇到任何问题，请：

1. 查看本文档的"故障排查"章节
2. 检查浏览器控制台（F12）和服务器日志，查看详细错误信息
3. 确保已正确配置 `.env` 文件，并重启开发服务器

---

## 🎉 开始使用

现在你已经了解了如何配置和使用 AI 模拟面试舱，快去体验吧！

**快速开始**：

1. 配置 `.env` 文件，添加 API Key
2. 重启开发服务器（`npm run dev`）
3. 访问 `http://localhost:3000/mock-interview/config`
4. 配置面试参数，点击"开始模拟面试"
5. 开始你的 AI 模拟面试之旅！

祝你好运！🍀
