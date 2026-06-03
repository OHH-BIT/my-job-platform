/**
 * 网页搜索服务 - 支持 Tavily Search API
 * 
 * 用途：为 AI 问答提供实时联网检索能力，确保回答基于真实信息
 * 配置：在 .env 中设置 TAVILY_API_KEY
 * 
 * Tavily 免费额度：每月 1000 次搜索
 * 申请地址：https://tavily.com
 */

// ============================================
// 类型定义
// ============================================

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface WebSearchResponse {
  success: boolean;
  results: SearchResult[];
  query: string;
  searchUsed: boolean;
}

// ============================================
// Tavily Search API
// ============================================

async function searchTavily(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY 未配置');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[WebSearch] Tavily API 错误: ${response.status} ${errorText}`);
    throw new Error(`搜索服务异常 (${response.status})`);
  }

  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    return [];
  }

  return data.results.map((r: any) => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.content || r.snippet || '',
    score: r.score,
  }));
}

// ============================================
// 百度搜索 API（备选方案，当 Tavily 不可用时）
// ============================================

async function searchBaidu(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const apiKey = process.env.BAIDU_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error('BAIDU_SEARCH_API_KEY 未配置');
  }

  const response = await fetch(
    `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `请帮我搜索以下内容，返回最相关的${maxResults}条结果：${query}` }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`百度搜索 API 异常 (${response.status})`);
  }

  const data = await response.json();
  // 百度 API 返回格式不同，此处做兼容处理
  const content = data.result || data.choices?.[0]?.message?.content || '';
  return [{ title: '百度搜索结果', url: '', snippet: content }];
}

// ============================================
// 统一搜索入口
// ============================================

/**
 * 执行网页搜索（优先 Tavily，失败时尝试百度）
 * @param query 搜索关键词
 * @param maxResults 最大结果数
 * @returns 搜索结果
 */
export async function webSearch(query: string, maxResults: number = 5): Promise<WebSearchResponse> {
  const startTime = Date.now();

  // 确定搜索关键词：去掉常见的聊天前缀
  const cleanedQuery = query
    .replace(/^(请|帮我|请问|你知道|告诉我|我想知道|帮我查一下|搜一下)\s*/gi, '')
    .trim();

  // 1. 优先使用 Tavily
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const results = await searchTavily(cleanedQuery, maxResults);
      const elapsed = Date.now() - startTime;
      console.log(`[WebSearch] Tavily 搜索完成 (${elapsed}ms)，找到 ${results.length} 条结果`);
      return {
        success: true,
        results,
        query: cleanedQuery,
        searchUsed: true,
      };
    } catch (error: any) {
      console.warn('[WebSearch] Tavily 搜索失败:', error.message);
    }
  }

  // 2. 备选：百度搜索
  const baiduKey = process.env.BAIDU_SEARCH_API_KEY;
  if (baiduKey) {
    try {
      const results = await searchBaidu(cleanedQuery, maxResults);
      const elapsed = Date.now() - startTime;
      console.log(`[WebSearch] 百度搜索完成 (${elapsed}ms)，找到 ${results.length} 条结果`);
      return {
        success: true,
        results,
        query: cleanedQuery,
        searchUsed: true,
      };
    } catch (error: any) {
      console.warn('[WebSearch] 百度搜索失败:', error.message);
    }
  }

  // 3. 无搜索服务可用
  return {
    success: false,
    results: [],
    query: cleanedQuery,
    searchUsed: false,
  };
}

/**
 * 判断问题是否需要联网搜索
 * 时事类、数据类、具体事实类问题优先搜索
 */
export function needsWebSearch(query: string): boolean {
  const timeSensitivePatterns = [
    /最新|最新版|今年|2024|2025|2026|最近|近日|刚刚|当前/,
    /多少|多少钱|薪资|待遇|收入|工资|年薪/,
    /时间|什么时候|截止|开始|开放|报名|投递/,
    /政策|规定|变化|更新|调整|改革|新/,
    /数据|统计|排名|比例|百分比|增长率/,
    /在哪里|怎么去|地址|地点|位置/,
    /新闻|事件|消息|发布|官宣/,
    /哪家|哪个公司|哪家公司|哪家企业/,
  ];

  return timeSensitivePatterns.some(pattern => pattern.test(query));
}

/**
 * 检查搜索服务是否可用
 */
export function isSearchAvailable(): boolean {
  return !!(process.env.TAVILY_API_KEY || process.env.BAIDU_SEARCH_API_KEY);
}
