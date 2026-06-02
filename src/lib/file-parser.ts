/**
 * 文件解析工具库
 * 支持在浏览器端解析 PDF 和 Word 文档，提取纯净的文本内容
 */

// PDF.js 类型声明
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

/**
 * PDF 文件解析器
 * 使用 pdfjs-dist 在浏览器端解析 PDF 文件
 */
export async function parsePDFFile(file: File): Promise<string> {
  try {
    // 动态导入 pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    
    // 设置 worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    
    // 将 File 转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    
    // 遍历每一页
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // 提取文本内容，保持基本结构
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `=== 第 ${pageNum} 页 ===\n${pageText}\n\n`;
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF 解析失败:', error);
    throw new Error(`PDF 解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * Word 文件解析器
 * 使用 mammoth.js 在浏览器端解析 .docx 文件
 */
export async function parseWordFile(file: File): Promise<string> {
  try {
    // 动态导入 mammoth
    const mammoth = await import('mammoth');
    
    // 将 File 转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 使用 mammoth 提取文本（保持基本格式）
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages && result.messages.length > 0) {
      console.warn('Word 解析警告:', result.messages);
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('Word 解析失败:', error);
    throw new Error(`Word 解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * Word .doc 文件解析器（旧格式）
 * 注意：.doc 格式较老，mammoth 可能不支持，这里提供备选方案
 */
export async function parseDocFile(file: File): Promise<string> {
  try {
    // 尝试使用 mammoth（可能不支持 .doc）
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('DOC 解析失败:', error);
    // 备选方案：提示用户转换为 .docx
    throw new Error(
      '.doc 格式解析失败（该格式较老）。请将文件转换为 .docx 格式后重新上传。\n\n' +
      '转换方法：用 Word 打开 .doc 文件，点击"文件" -> "另存为" -> 选择 ".docx" 格式。'
    );
  }
}

/**
 * 通用文件解析入口
 * 根据文件类型自动选择解析器
 */
export async function parseFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  console.log('开始解析文件:', file.name, '类型:', file.type, '大小:', file.size, 'bytes');
  
  // 判断文件类型并选择解析器
  if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
    return await parsePDFFile(file);
  } else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await parseWordFile(file);
  } else if (fileName.endsWith('.doc') || fileType === 'application/msword') {
    return await parseDocFile(file);
  } else {
    throw new Error(`不支持的文件格式: ${file.name}。仅支持 PDF、DOC、DOCX 格式。`);
  }
}

/**
 * 文件类型和大小验证
 * @returns 验证结果和错误信息
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  // 检查文件大小
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `文件大小超过 10MB 限制。当前文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }
  
  // 检查文件类型
  const supportedTypes = [
    '.pdf',
    '.doc',
    '.docx',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const isSupported = supportedTypes.some(type => 
    fileName.endsWith(type) || fileType === type
  );
  
  if (!isSupported) {
    return {
      isValid: false,
      error: `不支持的文件格式: ${file.name}。仅支持 PDF、DOC、DOCX 格式。`
    };
  }
  
  return { isValid: true };
}

/**
 * 解析进度回调函数类型
 */
export type ParseProgressCallback = (progress: {
  stage: 'reading' | 'parsing' | 'extracting' | 'complete';
  percent: number;
  message: string;
}) => void;

/**
 * 带进度的文件解析
 * 用于显示解析进度条
 */
export async function parseFileWithProgress(
  file: File, 
  onProgress?: ParseProgressCallback
): Promise<string> {
  try {
    // 阶段 1: 读取文件
    onProgress?.({
      stage: 'reading',
      percent: 10,
      message: '正在读取文件...'
    });
    
    // 验证文件
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // 阶段 2: 开始解析
    onProgress?.({
      stage: 'parsing',
      percent: 30,
      message: '正在解析文件格式...'
    });
    
    // 解析文件
    const text = await parseFile(file);
    
    // 阶段 3: 提取文本完成
    onProgress?.({
      stage: 'extracting',
      percent: 80,
      message: '正在提取文本内容...'
    });
    
    // 简单清理文本（去除过多空行）
    const cleanedText = cleanExtractedText(text);
    
    // 阶段 4: 完成
    onProgress?.({
      stage: 'complete',
      percent: 100,
      message: '解析完成！'
    });
    
    return cleanedText;
  } catch (error) {
    console.error('文件解析失败:', error);
    throw error;
  }
}

/**
 * 清理提取的文本
 * 去除过多空行、多余空格等
 */
function cleanExtractedText(text: string): string {
  return text
    // 去除多余空行（超过2个连续换行符减为2个）
    .replace(/\n{3,}/g, '\n\n')
    // 去除行首行尾空格
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    // 去除多余空格
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

/**
 * 检测提取的文本质量
 * 返回文本是否看起来像有效的简历内容
 */
export function checkExtractedTextQuality(text: string): {
  isLikelyResume: boolean;
  confidence: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let confidence = 0;
  
  // 检查文本长度
  if (text.length < 100) {
    warnings.push('提取的文本过短（<100字符），可能解析不完整');
    confidence -= 30;
  } else if (text.length < 500) {
    warnings.push('提取的文本较短（<500字符），请检查是否解析完整');
    confidence -= 10;
  } else {
    confidence += 20;
  }
  
  // 检查是否包含简历关键词
  const resumeKeywords = [
    '简历', 'resume', 'cv', '教育', 'education', '经历', 'experience',
    '项目', 'project', '技能', 'skill', '工作', 'work', '实习', 'internship',
    '学校', 'school', '大学', 'university', '公司', 'company', '职位', 'position'
  ];
  
  const matchedKeywords = resumeKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (matchedKeywords.length >= 3) {
    confidence += 30;
  } else if (matchedKeywords.length >= 1) {
    confidence += 15;
    warnings.push('未检测到足够的简历关键词，请确认上传的是简历文件');
  } else {
    warnings.push('未检测到简历相关内容，请确认上传的是简历文件');
    confidence -= 20;
  }
  
  // 检查是否包含中文字符（针对中文简历）
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (hasChinese) {
    confidence += 10;
  }
  
  // 检查是否包含英文字母（针对英文简历）
  const hasEnglish = /[a-zA-Z]/.test(text);
  if (hasEnglish) {
    confidence += 10;
  }
  
  // 最终判断
  const isLikelyResume = confidence > 0;
  
  return {
    isLikelyResume,
    confidence: Math.max(0, Math.min(100, confidence)),
    warnings
  };
}
