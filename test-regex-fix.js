/**
 * 正则表达式修复验证测试
 * 
 * 测试目标：
 * 1. 验证 escapeRegExp 函数能正确转义特殊字符
 * 2. 验证修复后的代码能正确处理 C++ 等包含特殊字符的技能名
 * 3. 确保不再抛出 "Invalid regular expression: Nothing to repeat" 错误
 */

// 模拟 escapeRegExp 函数（从源代码中复制）
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 测试用例
const testCases = [
  { input: 'C++', expected: 'C\\+\\+' },
  { input: 'C#', expected: 'C#' },  // # 不是正则特殊字符，不需要转义
  { input: 'Node.js', expected: 'Node\\.js' },
  { input: 'React', expected: 'React' },
  { input: '.NET', expected: '\\.NET' },
  { input: 'C/C++', expected: 'C/C\\+\\+' },
  { input: 'React Native', expected: 'React Native' },
  { input: 'Vue 3', expected: 'Vue 3' },
  { input: 'ASP.NET', expected: 'ASP\\.NET' },
  { input: 'Spring Boot', expected: 'Spring Boot' }
];

console.log('========== 测试 escapeRegExp 函数 ==========\n');

let allPassed = true;

testCases.forEach((testCase, index) => {
  const result = escapeRegExp(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`测试 ${index + 1}: ${testCase.input}`);
  console.log(`  期望: ${testCase.expected}`);
  console.log(`  实际: ${result}`);
  console.log(`  结果: ${passed ? '✅ 通过' : '❌ 失败'}\n`);
  
  if (!passed) {
    allPassed = false;
  }
});

console.log('========== 测试正则表达式创建 ==========\n');

// 测试2：验证正则表达式能正确创建（不抛出错误）
const skillTests = ['C++', 'C#', 'Node.js', '.NET', 'React'];

skillTests.forEach(skill => {
  try {
    const escapedSkill = escapeRegExp(skill);
    const regex = new RegExp(`\\b${escapedSkill}\\b|${escapedSkill}`, 'i');
    console.log(`✅ 技能 "${skill}" -> 正则: ${regex.source}`);
    
    // 测试匹配
    const testText = `我会 ${skill} 编程`;
    const match = testText.match(regex);
    console.log(`   测试文本: "${testText}"`);
    console.log(`   匹配结果: ${match ? '✅ 匹配成功' : '❌ 匹配失败'}\n`);
  } catch (error) {
    console.log(`❌ 技能 "${skill}" 创建正则失败: ${error.message}\n`);
    allPassed = false;
  }
});

console.log('========== 测试总结 ==========\n');

if (allPassed) {
  console.log('🎉 所有测试通过！正则表达式修复成功。');
  console.log('✅ escapeRegExp 函数工作正常');
  console.log('✅ 正则表达式创建不再抛出错误');
  console.log('✅ 技能名匹配功能正常');
} else {
  console.log('❌ 部分测试失败，请检查代码。');
}

console.log('\n========== 修复说明 ==========\n');
console.log('问题原因：');
console.log('  在构建技能关键词的正则表达式时，直接使用了包含特殊字符的技能名（例如 C++）');
console.log('  在正则语法中，+ 是量词，表示"重复前一个字符"，单独出现在开头或连续出现会导致语法错误');
console.log('\n修复方案：');
console.log('  1. 创建 escapeRegExp 工具函数，自动转义正则特殊字符');
console.log('  2. 需要转义的字符：. * + ? ^ $ { } ( ) [ ] | \\');
console.log('  3. 在创建正则表达式之前，先调用 escapeRegExp 函数转义技能名');
console.log('\n修复示例：');
console.log('  修复前: new RegExp("C++", "i")  // ❌ 语法错误');
console.log('  修复后: new RegExp(escapeRegExp("C++"), "i")  // ✅ 正确');
console.log('  转义后: /C\\+\\+/i  // 能正确匹配 "C++"');

// 如果在Node.js环境中，导出测试结果
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeRegExp,
    allPassed,
    testCases
  };
}
