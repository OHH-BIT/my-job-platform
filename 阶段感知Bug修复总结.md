# 阶段感知Bug修复总结报告

## 问题描述
"智能画像"与"AI诊断报告"模块中，建议内容与用户年级/学历严重不匹配（例如给博士生推荐大三实习）。

## 修复完成时间
2026-06-01

## 修复工程师
AI Assistant (Tencent Career Companion Team)

---

## 修复方案概述

### 核心原则
1. **阶段感知逻辑** - 所有建议必须根据用户年级和学历动态调整
2. **禁止低龄化建议** - 禁止给博士生推荐"打基础"、"参加社团"
3. **禁止超龄化建议** - 禁止给大一学生推荐"正式实习"、"全职工作"
4. **明确建议标签** - 所有建议都标注"【建议】"前缀

### 技术架构
```
用户年级/学历
    ↓
CareerStage 枚举 (计算职业阶段)
    ↓
CareerStageConfig (阶段配置)
    ↓
阶段感知建议生成器 (调整建议内容)
    ↓
验证与过滤 (过滤不适合的建议)
```

---

## 已修复的文件清单（4个核心文件 + 1个工具库）

### 1. `src/types/user-profile.ts` ✅
**修改内容**：
- 新增 `DegreeType` 类型（学历类型：high_school/associate/bachelor/master/phd/postdoc）
- 新增 `CareerStage` 枚举（职业阶段：freshman_sophomore/junior_senior/master/phd/postdoc）
- 新增 `CareerStageConfig` 接口（阶段配置）
- 扩展 `BasicInfo` 接口（增加 `degree` 和 `careerStage` 字段）
- 新增工具函数：
  - `calculateCareerStage(grade, degree)` - 计算职业阶段
  - `getCareerStageConfig(stage)` - 获取阶段配置
  - `isAdviceAppropriateForStage(advice, stage)` - 验证建议是否适合
  - `generateStageAwareAdvice(grade, degree, template)` - 生成阶段感知建议

**代码行数**：~300行（新增）

### 2. `src/lib/career-stage-utils.ts` ✅ (新建文件)
**文件功能**：
- 职业阶段感知工具库（独立模块，方便复用）
- 提供岗位匹配权重调整：`adjustJobMatchWeight(grade, degree, jobType)`
- 提供建议生成器：`generateStageAwareAdviceList(grade, degree, count)`
- 提供建议验证器：`validateAdviceList(adviceList, grade, degree)`
- 提供调试工具：`debugCareerStage(grade, degree)`

**代码行数**：~250行（新建）

### 3. `src/lib/resume-checker.ts` ✅
**修改内容**：
- 修改 `diagnoseResumeDeeply()` 函数（第136行）：获取 `userGrade` 和 `userDegree` 参数
- 修改 `generateNextSteps()` 函数（第671行）：根据用户阶段生成不同的下一步建议
  - 大一/大二：建议"课程项目"、"打基础"、"社团活动"
  - 大三/大四：建议"实习"、"秋招"、"算法题"
  - 硕士：建议"科研"、"研究型实习"、"专家岗"
  - 博士：建议"顶会论文"、"产业界合作"、"Research Intern"
- 修改 `generateGuidanceBasedOnFacts()` 函数（第549行）：根据用户阶段调整修改指导内容

**代码行数**：~800行（修改）

**关键代码段**（示例）：
```typescript
// 第671行：generateNextSteps 函数（阶段感知版）
function generateNextSteps(risks: RiskPoint[], userGrade?: string, userDegree?: string): string[] {
  const steps: string[] = [];
  
  if (userGrade && userDegree) {
    if (userGrade === '大一' || userGrade === '大二') {
      // 大一/大二：探索期 - 不应该建议实习
      steps.push('【建议】可以做一些课程项目或自学项目，不需要急于实习');
      steps.push('【建议】打好基础，学习一门编程语言（如Python、Java）');
    } else if (userGrade === '大三' || userGrade === '大四') {
      // 大三/大四：实战期 - 应该建议实习和求职准备
      steps.push('【建议】补充实习经历描述，现在是大三/大四找实习的黄金期');
      steps.push('【建议】刷算法题，准备秋招/春招面试');
    } else if (userDegree === 'master') {
      // 硕士：深化期
      steps.push('【建议】准备专家岗/校招SP offer冲刺，提升技术深度');
      steps.push('【建议】可以申请研究型实习（Research Intern）');
    } else if (userDegree === 'phd') {
      // 博士：专家期
      steps.push('【建议】您的学术研究能力很强，但建议补充工业界落地项目经验');
      steps.push('【建议】可以考虑申请研究型实习（Research Intern）或产学研合作');
    }
  }
  
  return steps;
}
```

### 4. `src/types/resume-checker.ts` ✅
**修改内容**：
- 扩展 `ResumeCheckerRequest` 接口（第4行）：新增 `userGrade?: string` 和 `userDegree?: string` 字段

**代码行数**：~20行（修改）

### 5. `阶段感知功能验证指南.md` ✅ (新建文档)
**文档内容**：
- 详细的验证测试方法（4个测试场景）
- 临时添加"年级"和"学历"选择框的方法
- 验证检查清单（8项）
- 已知限制和未来改进建议

**文档长度**：~300行

---

## 阶段感知逻辑详解

### CareerStage 枚举（5个阶段）

| 阶段 | 枚举值 | 对应年级 | 学历要求 | 关注领域 |
|------|---------|----------|----------|----------|
| 探索期 | freshman_sophomore | 大一/大二 | bachelor | 通识学习、社团活动、初步接触编程 |
| 实战期 | junior_senior | 大三/大四 | bachelor | 大厂实习、秋招准备、完善简历项目 |
| 深化期 | master | 研究生一至三年级 | master | 深度科研、发表高质量论文、研究型实习 |
| 专家期 | phd | 博士一至五年级 | phd | 顶会论文、产学研合作、专家岗冲刺 |
| 顶级专家期 | postdoc | 博士后 | postdoc | 顶级科研成果、学术领军、高端人才引进 |

### 禁止的建议类型（部分示例）

**大一/大二禁止**：
- ❌ 正式实习
- ❌ 全职工作
- ❌ 秋招/春招
- ❌ 算法题刷题

**博士禁止**：
- ❌ 通识学习
- ❌ 社团活动
- ❌ 打基础
- ❌ 基础执行类工作
- ❌ 入门级岗位

### 岗位匹配权重调整

| 阶段 | 科研类 | 实习类 | 全职类 | 入门级 | 专家级 |
|------|--------|--------|--------|--------|--------|
| 大一/大二 | 0.2 | 0.1 | 0.0 | 0.3 | 0.0 |
| 大三/大四 | 0.3 | 0.8 | 0.6 | 0.9 | 0.2 |
| 硕士 | 0.7 | 0.6 | 0.8 | 0.5 | 0.6 |
| 博士 | 0.9 | 0.4 | 0.9 | 0.1 | 0.95 |
| 博士后 | 1.0 | 0.1 | 1.0 | 0.0 | 1.0 |

---

## 验证测试结果

### 测试1：大一学生 ❌（未测试 - 需要临时UI）
**状态**：待测试
**阻塞原因**：`resume-checker/page.tsx` 没有"年级"和"学历"选择框
**解决方案**：按照《阶段感知功能验证指南.md》中的"方法1"临时添加UI

### 测试2：博士生 ❌（未测试 - 需要临时UI）
**状态**：待测试
**阻塞原因**：同上
**解决方案**：同上

### 测试3：大三学生 ❌（未测试 - 需要临时UI）
**状态**：待测试
**阻塞原因**：同上
**解决方案**：同上

### 测试4：硕士生 ❌（未测试 - 需要临时UI）
**状态**：待测试
**阻塞原因**：同上
**解决方案**：同上

### 代码编译检查 ✅
**状态**：通过
**检查结果**：
- `src/types/user-profile.ts` - 无编译错误
- `src/lib/resume-checker.ts` - 无编译错误
- TypeScript 类型检查通过

---

## 已知限制与未来工作

### 限制1：`resume-diagnosis.ts` 未完全修复
**描述**：另一个诊断模块 `resume-diagnosis.ts`（被 `ResumeDiagnosisModal.tsx` 使用）尚未加入阶段感知逻辑。
**影响**：如果用户通过"简历诊断模态框"触发诊断，可能仍会收到不匹配的建议。
**修复优先级**：高（需要在接下来1-2天内完成）
**预估工作量**：~3小时（需要修改 `resume-diagnosis.ts` 和 `resume-diagnosis.ts`）

### 限制2：UI界面未更新
**描述**：当前 `resume-checker/page.tsx` 可能没有"年级"和"学历"选择框，用户无法输入这些信息。
**影响**：无法测试阶段感知功能（除非手动修改代码）。
**修复优先级**：中（可以先临时修改代码进行测试）
**预估工作量**：~1小时（添加选择框和状态管理）

### 限制3：数据持久化缺失
**描述**：用户的年级和学历信息需要保存到数据库，当前可能只是临时状态。
**影响**：用户刷新页面后，阶段感知功能失效。
**修复优先级**：低（可以先使用临时状态）
**预估工作量**：~4小时（需要修改数据库schema、API、前端表单）

---

## 下一步行动计划

### 立即行动（今天完成）
1. ✅ **完成文档编写** - 《阶段感知功能验证指南.md》已创建
2. ⏳ **临时修改UI** - 在 `resume-checker/page.tsx` 中添加"年级"和"学历"选择框（参考验证指南）
3. ⏳ **执行测试1-4** - 按照验证指南中的测试步骤，验证阶段感知功能

### 短期行动（本周完成）
4. ⏳ **修复 `resume-diagnosis.ts`** - 按照相同的模式修改另一个诊断模块
5. ⏳ **更新 `ResumeDiagnosisModal.tsx`** - 确保模态框也传入用户阶段信息
6. ⏳ **添加单元测试** - 为 `career-stage-utils.ts` 添加单元测试

### 长期行动（本月完成）
7. ⏳ **优化UI界面** - 在用户画像页面添加"年级"和"学历"选择框，并保存到数据库
8. ⏳ **更新数据库schema** - 在 `user_profiles` 表中添加 `grade` 和 `degree` 字段
9. ⏳ **端到端测试** - 使用Cypress或Playwright进行端到端测试

---

## 附件清单

1. ✅ `阶段感知功能验证指南.md` - 详细测试指南（300行）
2. ✅ `src/types/user-profile.ts` - 类型定义（修改）
3. ✅ `src/lib/career-stage-utils.ts` - 工具库（新建）
4. ✅ `src/lib/resume-checker.ts` - 诊断算法（修改）
5. ✅ `src/types/resume-checker.ts` - 请求接口（修改）

---

## 总结

本次修复成功引入了"阶段感知逻辑"，确保AI诊断建议严格贴合用户当前的真实求学阶段。核心成果包括：

1. **类型系统扩展** - 新增 `CareerStage` 枚举和 `CareerStageConfig` 接口
2. **工具库创建** - 独立的 `career-stage-utils.ts` 工具库，提供完整的阶段感知功能
3. **诊断算法修复** - 修改 `resume-checker.ts`，在3个关键函数中加入阶段感知逻辑
4. **验证文档编写** - 详细的测试指南，帮助QA团队验证修复效果

**待完成工作**：
- 修复 `resume-diagnosis.ts`（另一个诊断模块）
- 临时修改UI以进行测试
- 执行4个测试场景

**预估剩余工作量**：~6小时（修复+测试）

---

**报告结束**

修复工程师：AI Assistant
审核状态：待审核
下一步：执行测试验证
