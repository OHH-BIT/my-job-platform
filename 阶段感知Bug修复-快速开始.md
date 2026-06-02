# 阶段感知Bug修复 - 快速开始指南

## 🚨 Bug描述
**问题**：AI诊断报告给博士生推荐"大三实习"，给大一学生推荐"正式工作"。
**原因**：诊断算法没有考虑用户的年级和学历，生成了不匹配的建议。
**修复**：引入"阶段感知逻辑"，根据用户年级和学历动态调整建议内容。

---

## ✅ 修复完成内容

### 1. 核心代码修复（4个文件）
- ✅ `src/types/user-profile.ts` - 新增CareerStage枚举和阶段配置
- ✅ `src/lib/career-stage-utils.ts` - 新建阶段感知工具库
- ✅ `src/lib/resume-checker.ts` - 修改诊断算法，加入阶段感知
- ✅ `src/types/resume-checker.ts` - 扩展请求接口，增加userGrade和userDegree字段

### 2. 文档和测试指南（2个文档）
- ✅ `阶段感知功能验证指南.md` - 详细的测试验证步骤
- ✅ `阶段感知Bug修复总结.md` - 完整的修复总结报告

---

## 🚀 快速测试（5分钟）

### 问题：页面上没有"年级"和"学历"选择框？
**答案**：需要临时修改代码添加UI。按照以下步骤操作：

### 步骤1：修改 `src/app/resume-checker/page.tsx`
在简历文本框上方添加以下代码（临时测试用）：

```tsx
{/* 临时添加：年级和学历选择（用于测试阶段感知功能） */}
<div className="mb-4 flex gap-4">
  <div className="flex-1">
    <label className="block text-sm font-medium mb-1">年级（测试用）</label>
    <select 
      value={userGrade} 
      onChange={(e) => setUserGrade(e.target.value)}
      className="w-full p-2 border rounded"
    >
      <option value="">请选择年级</option>
      <option value="大一">大一</option>
      <option value="大二">大二</option>
      <option value="大三">大三</option>
      <option value="大四">大四</option>
      <option value="研究生一年级">研究生一年级</option>
      <option value="研究生二年级">研究生二年级</option>
      <option value="研究生三年级">研究生三年级</option>
    </select>
  </div>
  <div className="flex-1">
    <label className="block text-sm font-medium mb-1">学历（测试用）</label>
    <select 
      value={userDegree} 
      onChange={(e) => setUserDegree(e.target.value)}
      className="w-full p-2 border rounded"
    >
      <option value="">请选择学历</option>
      <option value="bachelor">本科（Bachelor）</option>
      <option value="master">硕士（Master）</option>
      <option value="phd">博士（PhD）</option>
      <option value="postdoc">博士后（Postdoc）</option>
    </select>
  </div>
</div>
```

### 步骤2：添加状态管理
在组件顶部添加：
```tsx
const [userGrade, setUserGrade] = useState<string>("");
const [userDegree, setUserDegree] = useState<string>("");
```

### 步骤3：修改诊断函数调用
找到调用 `diagnoseResumeDeeply` 的地方，修改为：
```tsx
const report = diagnoseResumeDeeply({
  resumeText,
  jobTitle,
  jobDescription,
  userGrade,  // 新增
  userDegree   // 新增
});
```

### 步骤4：运行测试
1. 启动开发服务器：`npm run dev`
2. 访问 `http://localhost:3000/resume-checker`
3. 选择年级和学历
4. 粘贴测试简历文本
5. 点击"开始AI诊断"
6. 查看诊断报告中的建议是否合理

---

## 🧪 测试案例（复制粘贴用）

### 测试1：大一学生（不应收到"实习"建议）
```
张三
大一学生
计算机科学与技术专业
掌握C语言基础
参加过学校编程社团
```

**预期**：建议包含"课程项目"、"打基础"，**不包含**"实习"、"全职工作"

---

### 测试2：博士生（不应收到"打基础"建议）
```
李四
博士三年级
计算机科学与技术专业
发表顶会论文3篇（SIGIR、WWW、ICDE）
研究方向：大规模图神经网络
精通PyTorch、TensorFlow
```

**预期**：建议包含"顶会论文"、"产业界合作"，**不包含**"打基础"、"参加社团"

---

### 测试3：大三学生（应收到"实习"建议）
```
王五
大三学生
软件工程专业
掌握Java、Spring Boot
参加过学校创新项目
缺乏实习经历
```

**预期**：建议包含"实习"、"秋招"、"算法题"

---

### 测试4：硕士生（应收到"科研"建议）
```
赵六
研究生一年级
人工智能专业
参与科研项目2个
发表EI论文1篇
缺乏产业界经验
```

**预期**：建议包含"科研"、"研究型实习"、"专家岗"

---

## 📋 验证检查清单

测试时，请确认以下内容：

- [ ] 大一学生不会收到"实习"建议
- [ ] 大一学生收到"课程项目"、"打基础"建议
- [ ] 大三学生收到"实习"、"秋招"建议
- [ ] 大三学生不会收到"打基础"建议
- [ ] 硕士生收到"科研"、"研究型实习"建议
- [ ] 博士生不会收到"打基础"、"参加社团"建议
- [ ] 博士生收到"顶会论文"、"产业界合作"建议
- [ ] 所有建议都标注"【建议】"前缀
- [ ] 浏览器控制台显示 `[CareerStage]` 调试信息

**如果任何一项失败**，请查看浏览器控制台错误信息，并参考《阶段感知功能验证指南.md》中的"如果测试失败"章节。

---

## 📚 详细文档

如果需要更详细的说明，请阅读以下文档：

1. **《阶段感知功能验证指南.md》** - 详细的测试验证步骤（推荐优先阅读）
2. **《阶段感知Bug修复总结.md》** - 完整的修复总结报告（了解技术细节）
3. **本文档** - 快速开始指南（5分钟上手）

---

## 🆘 常见问题（FAQ）

### Q1：为什么页面上没有"年级"和"学历"选择框？
**A**：因为这是临时测试版本。正式版本需要更新数据库和UI。当前需要手动修改代码添加选择框（参考本文档"快速测试"章节）。

### Q2：如何确认阶段感知逻辑是否生效？
**A**：打开浏览器控制台（F12），查看是否有 `[CareerStage]` 开头的日志。例如：
```
[CareerStage] 用户输入: grade=大一, degree=bachelor
[CareerStage] 生成的下一步建议（阶段感知）: ['【建议】可以做一些课程项目...']
```

### Q3：如果测试失败，应该怎么办？
**A**：
1. 检查浏览器控制台是否有错误信息
2. 确认 `userGrade` 和 `userDegree` 是否正确传递到 `diagnoseResumeDeeply` 函数
3. 查看《阶段感知功能验证指南.md》中的"如果测试失败"章节
4. 如果仍无法解决，请提供错误信息、测试简历文本、选择的年级/学历，联系开发团队

### Q4：另一个诊断模块 `resume-diagnosis.ts` 修复了吗？
**A**：还没有。当前只修复了 `resume-checker.ts`（用于 `/resume-checker` 页面）。`resume-diagnosis.ts`（用于简历诊断模态框）需要在接下来1-2天内修复。

### Q5：如何修复 `resume-diagnosis.ts`？
**A**：参考 `resume-checker.ts` 的修复模式，修改 `diagnoseResume` 函数，加入 `userGrade` 和 `userDegree` 参数，并在生成建议时调用阶段感知逻辑。预估工作量：~3小时。

---

## 📞 联系支持

如果遇到问题，请提供以下信息：
1. 浏览器控制台的完整错误日志（截图或文本）
2. 使用的测试简历文本（复制粘贴）
3. 选择的年级和学历
4. 诊断报告的实际输出（截图）

**修复团队**：Tencent Career Companion Team  
**修复工程师**：AI Assistant  
**修复完成时间**：2026-06-01  

---

**文档结束** | 祝您测试顺利！🎉
