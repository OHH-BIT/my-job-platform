--
-- 统一身份认证与云端数据同步 - 数据迁移脚本
-- 
-- 功能：将现有的本地模拟数据（localStorage、JSON文件）迁移至带user_id的云数据库中
-- 适用场景：用户首次登录时，检测到本地历史数据，提示合并到云端账号
-- 

-- ============================================
-- 迁移场景说明
-- ============================================

/*
场景1：用户通过微信/QQ登录，检测到本地有历史数据（localStorage中的user_profile、career_path、job_applications等）
  -> 提示："检测到您有本地求职档案，是否将其合并至当前云端账号？"
  -> 用户选择"合并" -> 调用迁移脚本，将本地数据插入云端数据库，关联新用户的UID
  -> 用户选择"跳过" -> 不迁移，使用空账号

场景2：用户通过邮箱/手机号注册，之前从未使用过系统（无本地数据）
  -> 不提示，直接创建空账号

场景3：用户通过新方式登录（如微信登录后，又用手机号登录），检测到已有关联账号
  -> 自动关联，不需要迁移

本脚本演示场景1的迁移过程。
*/

-- ============================================
-- 1. 准备工作：创建测试用户（模拟微信登录后的新账号）
-- ============================================

-- 假设用户通过微信登录，系统自动创建账号
-- 这里手动插入一个测试用户，模拟微信登录后的状态

INSERT INTO `users` (
  `uid`,
  `wechat_open_id`,
  `wechat_union_id`,
  `nickname`,
  `avatar_url`,
  `gender`,
  `status`,
  `email_verified`,
  `phone_verified`,
  `source`,
  `created_at`,
  `updated_at`,
  `last_login_at`,
  `login_count`
) VALUES (
  UUID(),                        -- uid（自动生成）
  'wechat_open_id_test_12345',  -- 微信OpenID（模拟）
  'wechat_union_id_test_12345', -- 微信UnionID（模拟）
  '微信测试用户',                  -- 昵称
  'https://example.com/avatar.jpg', -- 头像URL
  'unknown',                     -- 性别
  'active',                      -- 状态（微信登录直接激活）
  0,                             -- 邮箱未验证
  0,                             -- 手机号未验证
  'wechat',                      -- 来源
  NOW(),                         -- 创建时间
  NOW(),                         -- 更新时间
  NOW(),                         -- 最后登录时间
  1                              -- 登录次数
);

-- 获取刚插入的用户UID（用于后续迁移）
-- 在实际应用程序中，这个UID是从API响应中获取的
-- 这里使用变量模拟
SET @user_id = LAST_INSERT_ID();

SELECT @user_id AS '新用户的UID（用于迁移）';

-- ============================================
-- 2. 模拟本地数据（从localStorage读取）
-- ============================================

/*
在实际前端应用中，本地数据存储在localStorage中，格式如下：
{
  "user_profile": { ... },      // 用户画像数据
  "career_path": { ... },      // 成长路径数据
  "job_applications": [ ... ], // 投递记录数据（数组）
  "interview_reviews": [ ... ]  // 面试复盘数据（数组）
}

本脚本使用变量模拟这些数据。
*/

-- 2.1 模拟用户画像数据（user_profile）
SET @local_profile = '{
  "basicInfo": {
    "grade": "大三",
    "degree": "bachelor",
    "major": "计算机科学",
    "expectedPosition": "前端开发工程师",
    "interests": ["Web开发", "人工智能"]
  },
  "dimensionScores": {
    "professional": 85,
    "communication": 78,
    "leadership": 65,
    "innovation": 72,
    "resilience": 80
  },
  "careerValues": {
    "workLifeBalance": 4,
    "challenge": 5,
    "stability": 3,
    "growth": 5,
    "salary": 4
  },
  "completedAt": "2026-03-15T10:00:00Z",
  "reportGenerated": true
}';

-- 2.2 模拟成长路径数据（career_path）
SET @local_career_path = '{
  "targetJobId": "job-001",
  "targetJobTitle": "前端开发工程师",
  "analyzedAt": "2026-03-15T11:00:00Z",
  "overallGapScore": 65,
  "timeline": [
    {
      "id": "tl-001",
      "title": "大三下",
      "date": "2026-03",
      "isCurrent": true,
      "isCompleted": false,
      "tasks": [
        {
          "id": "task-001",
          "title": "学习React 18+新特性",
          "description": "学习Concurrent Mode、Suspense、Server Components",
          "priority": "P0",
          "status": "in_progress"
        }
      ]
    }
  ]
}';

-- 2.3 模拟投递记录数据（job_applications，数组）
SET @local_applications = '[
  {
    "id": "app-001",
    "company": "腾讯",
    "companyLogo": "https://logo.clearbit.com/tencent.com",
    "position": "前端开发工程师",
    "positionType": "fulltime",
    "city": "深圳",
    "salaryRange": "30-40w",
    "appliedDate": "2026-03-15T10:00:00Z",
    "channel": "campus_recruitment",
    "status": "interviewing",
    "statusUpdatedAt": "2026-03-28T14:30:00Z",
    "daysSinceUpdate": 5,
    "interviews": [
      {
        "id": "int-001",
        "round": 1,
        "type": "phone_screening",
        "interviewer": "HR李小姐",
        "startedAt": "2026-03-20T10:05:00Z",
        "endedAt": "2026-03-20T10:35:00Z",
        "result": "passed"
      }
    ],
    "currentRound": 2,
    "notes": "腾讯WXG前端岗，通过校园招聘投递",
    "tags": ["腾讯", "前端", "WXG"]
  }
]';

-- 2.4 模拟面试复盘数据（interview_reviews，数组）
SET @local_interview_reviews = '[
  {
    "id": "ir-001",
    "interviewId": "int-001",
    "generatedAt": "2026-03-20T16:00:00Z",
    "model": "gpt-4o",
    "confidence": 0.85,
    "overallScore": 82,
    "dimensionScores": [
      {
        "dimension": "communication_clarity",
        "score": 88,
        "feedback": "表达清晰，逻辑性强"
      }
    ],
    "highlights": ["自我介绍结构清晰", "对腾讯的了解比较深入"],
    "weaknesses": ["期望薪资表述略显直接"],
    "actionItems": [
      {
        "id": "action-001",
        "priority": "medium",
        "category": "prepare_questions",
        "title": "准备技术面试的自我介绍",
        "description": "准备1分钟和3分钟两个版本的技术自我介绍",
        "completed": false
      }
    ]
  }
]';

-- ============================================
-- 3. 执行迁移：将本地数据插入云端数据库
-- ============================================

-- 3.1 迁移用户画像（user_profiles表）
INSERT INTO `user_profiles` (
  `id`,
  `user_id`,
  `profile_data`,
  `is_active`,
  `completed_at`,
  `report_generated`,
  `created_at`,
  `updated_at`
)
VALUES (
  UUID(),              -- id（自动生成）
  @user_id,           -- user_id（关联新用户）
  @local_profile,      -- profile_data（JSON格式）
  1,                   -- is_active（当前活跃画像）
  JSON_UNQUOTE(JSON_EXTRACT(@local_profile, '$.completedAt')), -- completed_at
  JSON_UNQUOTE(JSON_EXTRACT(@local_profile, '$.reportGenerated')), -- report_generated
  NOW(),               -- created_at
  NOW()                -- updated_at
);

SET @profile_id = LAST_INSERT_ID();
SELECT @profile_id AS '迁移后的画像ID';

-- 3.2 迁移成长路径（career_paths表）
INSERT INTO `career_paths` (
  `id`,
  `user_id`,
  `path_data`,
  `is_active`,
  `target_job_id`,
  `target_job_title`,
  `created_at`,
  `updated_at`
)
VALUES (
  UUID(),                    -- id（自动生成）
  @user_id,                 -- user_id（关联新用户）
  @local_career_path,       -- path_data（JSON格式）
  1,                         -- is_active（当前活跃成长路径）
  JSON_UNQUOTE(JSON_EXTRACT(@local_career_path, '$.targetJobId')), -- target_job_id
  JSON_UNQUOTE(JSON_EXTRACT(@local_career_path, '$.targetJobTitle')), -- target_job_title
  NOW(),                     -- created_at
  NOW()                      -- updated_at
);

SET @career_path_id = LAST_INSERT_ID();
SELECT @career_path_id AS '迁移后的成长路径ID';

-- 3.3 迁移投递记录（job_applications表）
-- 注意：本地数据中的id是旧的，迁移后需要生成新的UUID
-- 这里使用循环遍历JSON数组，逐条插入

-- 初始化变量
SET @i = 0;
SET @len = JSON_LENGTH(@local_applications);

-- 循环遍历投递记录数组
WHILE @i < @len DO
  -- 生成新的application_id
  SET @new_application_id = UUID();
  
  -- 插入投递记录
  INSERT INTO `job_applications` (
    `id`,
    `user_id`,
    `company`,
    `company_logo`,
    `position`,
    `position_type`,
    `city`,
    `salary_range`,
    `applied_date`,
    `channel`,
    `status`,
    `status_updated_at`,
    `days_since_update`,
    `interviews`,
    `current_round`,
    `notes`,
    `tags`,
    `created_at`,
    `updated_at`
  )
  SELECT
    @new_application_id,
    @user_id,
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].company'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].companyLogo'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].position'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].positionType'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].city'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].salaryRange'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].appliedDate'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].channel'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].status'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].statusUpdatedAt'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].daysSinceUpdate'))),
    JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].interviews')), -- JSON字段，不需要UNQUOTE
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].currentRound'))),
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].notes'))),
    JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].tags')), -- JSON字段
    NOW(),
    NOW()
  FROM DUAL;
  
  -- 3.3.1 迁移时间线节点（timeline_nodes表）
  -- 注意：这里简化，实际应该从job_applications中提取timelineNodes
  -- 为演示目的，这里插入一个示例时间线节点
  INSERT INTO `timeline_nodes` (
    `id`,
    `user_id`,
    `application_id`,
    `type`,
    `title`,
    `description`,
    `date`,
    `created_at`
  )
  VALUES (
    UUID(),
    @user_id,
    @new_application_id,
    'application',
    CONCAT('投递', JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].company'))), JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].position')))),
    '通过校园招聘投递',
    JSON_UNQUOTE(JSON_EXTRACT(@local_applications, CONCAT('$[', @i, '].appliedDate'))),
    NOW()
  );
  
  -- 递增计数器
  SET @i = @i + 1;
END WHILE;

-- 查询迁移后的投递记录
SELECT `id`, `user_id`, `company`, `position`, `status` FROM `job_applications` WHERE `user_id` = @user_id;

-- ============================================
-- 4. 验证迁移结果
-- ============================================

-- 4.1 查询用户完整信息（使用视图）
SELECT * FROM `v_user_full_info` WHERE `uid` = @user_id;

-- 4.2 查询用户画像
SELECT `id`, `user_id`, `profile_data`, `is_active` FROM `user_profiles` WHERE `user_id` = @user_id;

-- 4.3 查询成长路径
SELECT `id`, `user_id`, `path_data`, `is_active`, `target_job_title` FROM `career_paths` WHERE `user_id` = @user_id;

-- 4.4 查询投递记录
SELECT `id`, `user_id`, `company`, `position`, `status`, `applied_date` FROM `job_applications` WHERE `user_id` = @user_id;

-- 4.5 查询时间线节点
SELECT `id`, `user_id`, `application_id`, `type`, `title`, `date` FROM `timeline_nodes` WHERE `user_id` = @user_id;

-- ============================================
-- 5. 清理测试数据（可选，用于重复测试）
-- ============================================

/*
-- 如果需要重复测试，可以清理刚才插入的数据
DELETE FROM `timeline_nodes` WHERE `user_id` = @user_id;
DELETE FROM `job_applications` WHERE `user_id` = @user_id;
DELETE FROM `career_paths` WHERE `user_id` = @user_id;
DELETE FROM `user_profiles` WHERE `user_id` = @user_id;
DELETE FROM `users` WHERE `uid` = @user_id;
*/

-- ============================================
-- 6. 迁移完成提示
-- ============================================

SELECT 
  '迁移完成！' AS message,
  CONCAT('用户UID：', @user_id) AS user_id,
  '已迁移数据：1条画像、1条成长路径、1条投递记录、1条时间线节点' AS migrated_data;

-- ============================================
-- 附录：应用程序层迁移代码示例（Next.js API Route）
-- ============================================

/*
// 文件：src/app/api/auth/merge-data/route.ts
// 功能：接收前端发送的本地数据，执行迁移

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise'; // 或使用Prisma、TypeORM等ORM

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份（从JWT中获取uid）
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyJWT(token); // 验证JWT，获取payload
    const uid = payload.uid; // 用户ID
    
    // 2. 解析请求体（本地数据）
    const body = await request.json();
    const { localProfile, localCareerPath, localApplications } = body;
    
    // 3. 执行迁移（调用存储过程或逐表插入）
    const pool = new Pool({ /* 数据库连接配置 */ });
    
    // 3.1 迁移用户画像
    if (localProfile) {
      await pool.execute(`
        INSERT INTO user_profiles (id, user_id, profile_data, is_active, completed_at, report_generated, created_at, updated_at)
        VALUES (UUID(), ?, ?, 1, ?, ?, NOW(), NOW())
      `, [uid, JSON.stringify(localProfile), localProfile.completedAt, localProfile.reportGenerated]);
    }
    
    // 3.2 迁移成长路径
    if (localCareerPath) {
      await pool.execute(`
        INSERT INTO career_paths (id, user_id, path_data, is_active, target_job_id, target_job_title, created_at, updated_at)
        VALUES (UUID(), ?, ?, 1, ?, ?, NOW(), NOW())
      `, [uid, JSON.stringify(localCareerPath), localCareerPath.targetJobId, localCareerPath.targetJobTitle]);
    }
    
    // 3.3 迁移投递记录（可能有多条）
    if (localApplications && localApplications.length > 0) {
      for (const app of localApplications) {
        const [result] = await pool.execute(`
          INSERT INTO job_applications (
            id, user_id, company, company_logo, position, position_type, city, salary_range,
            applied_date, channel, status, status_updated_at, days_since_update,
            interviews, current_round, notes, tags, created_at, updated_at
          ) VALUES (
            UUID(), ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, NOW(), NOW()
          )
        `, [
          uid, app.company, app.companyLogo, app.position, app.positionType, app.city, app.salaryRange,
          app.appliedDate, app.channel, app.status, app.statusUpdatedAt, app.daysSinceUpdate,
          JSON.stringify(app.interviews), app.currentRound, app.notes, JSON.stringify(app.tags)
        ]);
        
        const applicationId = result.insertId;
        
        // 3.3.1 迁移时间线节点
        if (app.timelineNodes && app.timelineNodes.length > 0) {
          for (const node of app.timelineNodes) {
            await pool.execute(`
              INSERT INTO timeline_nodes (id, user_id, application_id, type, title, description, date, created_at)
              VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())
            `, [uid, applicationId, node.type, node.title, node.description, node.date]);
          }
        }
      }
    }
    
    // 4. 返回成功响应
    return NextResponse.json({
      success: true,
      message: '数据迁移成功',
      data: { uid, migratedAt: new Date().toISOString() }
    });
    
  } catch (error) {
    console.error('数据迁移失败：', error);
    return NextResponse.json(
      { success: false, error: '数据迁移失败，请稍后重试' },
      { status: 500 }
    );
  }
}
*/

-- ============================================
-- 脚本结束
-- ============================================
