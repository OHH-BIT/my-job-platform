/**
 * AI 回答文本清洗与格式化工具
 * 功能：去除冗余字符、格式化 Markdown、保留核心排版
 */

/**
 * 清洗 AI 回答中的多余字符
 * @param text AI 原始回答文本
 * @returns 清洗后的文本
 */
export function cleanAIResponse(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. 去除多余的 Markdown 标记（保留必要的格式）
  // 去除多余的 # 号（标题标记）
  cleaned = cleaned.replace(/#{1,6}\s*/g, '');

  // 去除多余的 ** 包裹（但保留成对的出现）
  // 只去除孤立的 * 或 **（没有配对的）
  cleaned = cleaned.replace(/(?<!\*)\*{1,2}(?!\*)/g, '');

  // 2. 清理转义符
  // 去除 \n 字面量（不是真正的换行符）
  cleaned = cleaned.replace(/\\n/g, '\n');
  // 去除 \" 和 \'
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/\\'/g, "'");
  // 去除其他的反斜杠转义
  cleaned = cleaned.replace(/\\([^\\])/g, '$1');

  // 3. 清理无意义的占位符
  // 去除 [placeholder] 或 {{placeholder}} 等模板占位符
  cleaned = cleaned.replace(/\[([^\]]*)\]/g, '$1');
  cleaned = cleaned.replace(/\{\{([^\}]*)\}\}/g, '$1');
  // 去除 <placeholder> 标签
  cleaned = cleaned.replace(/<placeholder[^>]*>.*?<\/placeholder>/gi, '');

  // 4. 规范化换行符
  // 将多个连续换行符合并为最多两个（一个空行）
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  // 去除行首行尾的空格
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
  // 去除开头和结尾的空行
  cleaned = cleaned.trim();

  // 5. 清理多余的列表标记
  // 将 * 或 - 开头的列表项统一格式
  cleaned = cleaned.replace(/^\s*[\*\-]\s+/gm, '• ');

  // 6. 清理特殊符号
  // 去除零宽字符
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // 去除多余的 &nbsp;
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  // 去除 HTML 注释
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // 7. 保留核心 Markdown 格式
  // 确保 **加粗** 格式正确（去除多余的 *）
  cleaned = cleaned.replace(/\*{3,}/g, '**');
  // 确保 __斜体__ 格式正确
  cleaned = cleaned.replace(/_{3,}/g, '__');

  return cleaned;
}

/**
 * 将清洗后的文本转换为 HTML（简单 Markdown 解析）
 * 支持：**加粗**、*斜体*、• 列表、换行
 * @param text 清洗后的文本
 * @returns HTML 字符串
 */
export function textToHTML(text: string): string {
  if (!text) return '';

  let html = text;

  // 转义 HTML 特殊字符（防止 XSS）
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 处理 **加粗**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 处理 *斜体*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // 处理 `代码`
  html = html.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');

  // 处理换行
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测列表项
    if (line.trim().startsWith('• ')) {
      if (!inList) {
        result.push('<ul class="list-disc pl-5 space-y-1 my-2">');
        inList = true;
      }
      result.push(`<li class="text-gray-700">${line.trim().substring(2)}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }

      // 空行
      if (line.trim() === '') {
        result.push('<div class="h-2"></div>');
      } else {
        // 普通段落
        result.push(`<p class="mb-2">${line}</p>`);
      }
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('');
}

/**
 * 完整的 AI 回答处理流程
 * 1. 清洗文本
 * 2. 转换为 HTML
 * @param text AI 原始回答
 * @returns 处理后的 HTML 字符串
 */
export function processAIResponse(text: string): string {
  const cleaned = cleanAIResponse(text);
  return textToHTML(cleaned);
}

/**
 * React 组件使用的 Hook：处理 AI 回答
 * @param content AI 回答内容
 * @returns 包含 HTML 字符串的对象
 */
export function useProcessedAIResponse(content: string) {
  const html = processAIResponse(content);
  return { __html: html };
}
