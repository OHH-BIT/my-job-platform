--
-- 社区互动与个人数据云端同步 - 数据库Schema扩展
-- 
-- 数据库类型：MySQL 8.0+ / MariaDB 10.5+
-- 字符集：utf8mb4（支持emoji）
-- 存储引擎：InnoDB（支持事务和外键）
--
-- 本文件是对原有schema.sql的扩展，新增以下表：
-- 1. community_comments（评论内容、关联的企业/岗位ID、父评论ID）
-- 2. community_questions（提问内容、回答记录）
-- 3. fact_records（被标记为事实的结构化数据）
-- 4. job_matches（岗位匹配结果表）
-- 5. notification_settings（通知设置表）
-- 6. user_activity_logs（用户活动日志表）
--

-- ============================================
-- 1. 社区评论表（community_comments）
-- 支持盖楼式回复、点赞、收藏
-- ============================================

CREATE TABLE IF NOT EXISTS `community_comments` (
  `id` VARCHAR(36) NOT NULL COMMENT '评论ID（UUID v4）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '评论用户ID（外键 -> users.uid）',
  
  -- 关联信息
  `target_type` ENUM('mentor_sharing', 'fact_record', 'job_match', 'user_profile') NOT NULL COMMENT '评论目标类型',
  `target_id` VARCHAR(36) NOT NULL COMMENT '评论目标ID（如mentor_sharings.id）',
  `parent_id` VARCHAR(36) NULL DEFAULT NULL COMMENT '父评论ID（用于盖楼式回复，NULL表示顶级评论）',
  `root_id` VARCHAR(36) NULL DEFAULT NULL COMMENT '根评论ID（用于快速查询某个评论下的所有回复）',
  
  -- 评论内容
  `content` TEXT NOT NULL COMMENT '评论内容（支持Markdown）',
  `content_type` ENUM('text', 'markdown', 'html') NOT NULL DEFAULT 'markdown' COMMENT '内容类型',
  
  -- 互动数据
  `likes_count` INT NOT NULL DEFAULT 0 COMMENT '点赞数',
  `replies_count` INT NOT NULL DEFAULT 0 COMMENT '回复数',
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否置顶（0=否，1=是）',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否精选（0=否，1=是）',
  
  -- 状态
  `status` ENUM('active', 'deleted', 'hidden', 'reported') NOT NULL DEFAULT 'active' COMMENT '评论状态',
  `report_count` INT NOT NULL DEFAULT 0 COMMENT '被举报次数',
  
  -- 元数据
  `ip_address` VARCHAR(45) NULL DEFAULT NULL COMMENT 'IP地址（IPv4或IPv6）',
  `user_agent` TEXT NULL DEFAULT NULL COMMENT 'User-Agent',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL DEFAULT NULL COMMENT '删除时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_root_id` (`root_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_pinned` (`is_pinned`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_created_at` (`created_at`),
  
  -- 外键约束
  CONSTRAINT `fk_community_comments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_comments_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `community_comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社区评论表（盖楼式回复、点赞、收藏）';

-- ============================================
-- 2. 评论点赞表（community_comment_likes）
-- 记录用户对某条评论的点赞
-- ============================================

CREATE TABLE IF NOT EXISTS `community_comment_likes` (
  `id` VARCHAR(36) NOT NULL COMMENT '记录ID（UUID v4）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID（外键 -> users.uid）',
  `comment_id` VARCHAR(36) NOT NULL COMMENT '评论ID（外键 -> community_comments.id）',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_comment` (`user_id`, `comment_id`),
  KEY `idx_comment_id` (`comment_id`),
  KEY `idx_created_at` (`created_at`),
  
  -- 外键约束
  CONSTRAINT `fk_community_comment_likes_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_comment_likes_comment_id` FOREIGN KEY (`comment_id`) REFERENCES `community_comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论点赞表';

-- ============================================
-- 3. 社区提问表（community_questions）
-- 用户针对企业/岗位发起提问
-- ============================================

CREATE TABLE IF NOT EXISTS `community_questions` (
  `id` VARCHAR(36) NOT NULL COMMENT '提问ID（UUID v4）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '提问用户ID（外键 -> users.uid）',
  
  -- 提问信息
  `title` VARCHAR(255) NOT NULL COMMENT '提问标题',
  `content` TEXT NOT NULL COMMENT '提问内容（支持Markdown）',
  `company` VARCHAR(255) NULL DEFAULT NULL COMMENT '关联公司（可选）',
  `position` VARCHAR(255) NULL DEFAULT NULL COMMENT '关联岗位（可选）',
  `tags` JSON NULL DEFAULT NULL COMMENT '话题标签（如["面试经验", "薪资福利"]）',
  
  -- 互动数据
  `answers_count` INT NOT NULL DEFAULT 0 COMMENT '回答数',
  `likes_count` INT NOT NULL DEFAULT 0 COMMENT '点赞数',
  `views_count` INT NOT NULL DEFAULT 0 COMMENT '浏览数',
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否置顶（0=否，1=是）',
  `is_closed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否关闭（0=否，1=是，关闭后不能再回答）',
  
  -- 状态
  `status` ENUM('open', 'closed', 'deleted', 'hidden', 'reported') NOT NULL DEFAULT 'open' COMMENT '提问状态',
  `report_count` INT NOT NULL DEFAULT 0 COMMENT '被举报次数',
  
  -- 最佳答案
  `accepted_answer_id` VARCHAR(36) NULL DEFAULT NULL COMMENT '被采纳的最佳答案ID（外键 -> community_answers.id）',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL DEFAULT NULL COMMENT '删除时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_company` (`company`),
  KEY `idx_position` (`position`),
  KEY `idx_tags` (`tags`),
  KEY `idx_status` (`status`),
  KEY `idx_is_pinned` (`is_pinned`),
  KEY `idx_is_closed` (`is_closed`),
  KEY `idx_created_at` (`created_at`),
  
  -- 外键约束
  CONSTRAINT `fk_community_questions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社区提问表';

-- ============================================
-- 4. 社区回答表（community_answers）
-- 用户回答某个提问
-- ============================================

CREATE TABLE IF NOT EXISTS `community_answers` (
  `id` VARCHAR(36) NOT NULL COMMENT '回答ID（UUID v4）',
  `question_id` VARCHAR(36) NOT NULL COMMENT '提问ID（外键 -> community_questions.id）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '回答用户ID（外键 -> users.uid）',
  
  -- 回答内容
  `content` TEXT NOT NULL COMMENT '回答内容（支持Markdown）',
  `content_type` ENUM('text', 'markdown', 'html') NOT NULL DEFAULT 'markdown' COMMENT '内容类型',
  
  -- 互动数据
  `likes_count` INT NOT NULL DEFAULT 0 COMMENT '点赞数',
  `is_accepted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否被采纳为最佳答案（0=否，1=是）',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否精选（0=否，1=是）',
  
  -- 状态
  `status` ENUM('active', 'deleted', 'hidden', 'reported') NOT NULL DEFAULT 'active' COMMENT '回答状态',
  `report_count` INT NOT NULL DEFAULT 0 COMMENT '被举报次数',
  
  -- 元数据
  `ip_address` VARCHAR(45) NULL DEFAULT NULL COMMENT 'IP地址（IPv4或IPv6）',
  `user_agent` TEXT NULL DEFAULT NULL COMMENT 'User-Agent',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL DEFAULT NULL COMMENT '删除时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  KEY `idx_question_id` (`question_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_accepted` (`is_accepted`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  
  -- 外键约束
  CONSTRAINT `fk_community_answers_question_id` FOREIGN KEY (`question_id`) REFERENCES `community_questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_answers_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社区回答表';

-- ============================================
-- 5. 回答点赞表（community_answer_likes）
-- 记录用户对某条回答的点赞
-- ============================================

CREATE TABLE IF NOT EXISTS `community_answer_likes` (
  `id` VARCHAR(36) NOT NULL COMMENT '记录ID（UUID v4）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID（外键 -> users.uid）',
  `answer_id` VARCHAR(36) NOT NULL COMMENT '回答ID（外键 -> community_answers.id）',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_answer` (`user_id`, `answer_id`),
  KEY `idx_answer_id` (`answer_id`),
  KEY `idx_created_at` (`created_at`),
  
  -- 外键约束
  CONSTRAINT `fk_community_answer_likes_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_community_answer_likes_answer_id` FOREIGN KEY (`answer_id`) REFERENCES `community_answers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回答点赞表';

-- ============================================
-- 6. 事实记录表（fact_records）
-- 被标记为事实的结构化数据，进入"企业/岗位真相库"
-- ============================================

CREATE TABLE IF NOT EXISTS `fact_records` (
  `id` VARCHAR(36) NOT NULL COMMENT '事实记录ID（UUID v4）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '提交用户ID（外键 -> users.uid）',
  
  -- 事实信息
  `title` VARCHAR(255) NOT NULL COMMENT '事实标题（简洁描述）',
  `content` TEXT NOT NULL COMMENT '事实内容（详细描述）',
  `company` VARCHAR(255) NOT NULL COMMENT '关联公司',
  `position` VARCHAR(255) NULL DEFAULT NULL COMMENT '关联岗位（可选）',
  `department` VARCHAR(255) NULL DEFAULT NULL COMMENT '关联部门（可选）',
  
  -- 事实分类
  `category` ENUM('interview_process', 'salary_benefit', 'work_culture', 'team_info', 'career_development', 'other') NOT NULL COMMENT '事实分类',
  `tags` JSON NULL DEFAULT NULL COMMENT '话题标签（如["面试新增系统设计", "年终奖3个月"]）',
  
  -- 证据来源
  `source_type` ENUM('comment', 'answer', 'user_submission') NOT NULL COMMENT '来源类型',
  `source_id` VARCHAR(36) NULL DEFAULT NULL COMMENT '来源ID（如community_comments.id）',
  `evidence_text` TEXT NULL DEFAULT NULL COMMENT '证据原文（从评论/回答中提取）',
  
  -- 验证信息
  `verification_status` ENUM('pending', 'verified', 'disputed', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '验证状态',
  `verified_by` VARCHAR(36) NULL DEFAULT NULL COMMENT '验证人ID（外键 -> users.uid，通常是管理员或AI）',
  `verified_at` DATETIME NULL DEFAULT NULL COMMENT '验证时间',
  `verification_note` TEXT NULL DEFAULT NULL COMMENT '验证备注',
  
  -- 统计数据
  `upvotes` INT NOT NULL DEFAULT 0 COMMENT '赞同数（认为事实准确）',
  `downvotes` INT NOT NULL DEFAULT 0 COMMENT '反对数（认为事实不准确）',
  `confidence_score` DECIMAL(3,2) NOT NULL DEFAULT 0.50 COMMENT '置信度评分（0.00-1.00，基于验证状态和投票）',
  
  -- 状态
  `status` ENUM('active', 'archived', 'deleted') NOT NULL DEFAULT 'active' COMMENT '记录状态',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_company` (`company`),
  KEY `idx_position` (`position`),
  KEY `idx_department` (`department`),
  KEY `idx_category` (`category`),
  KEY `idx_verification_status` (`verification_status`),
  KEY `idx_confidence_score` (`confidence_score`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  
  -- 外键约束
  CONSTRAINT `fk_fact_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fact_records_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`uid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='事实记录表（企业/岗位真相库）';

-- ============================================
-- 7. 事实投票表（fact_record_votes）
-- 记录用户对某个事实记录的投票（赞同/反对）
-- ============================================

CREATE TABLE IF NOT EXISTS `fact_record_votes` (
  `id` VARCHAR(36) NOT NULL COMMENT '投票ID（UUID v4）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID（外键 -> users.uid）',
  `fact_id` VARCHAR(36) NOT NULL COMMENT '事实记录ID（外键 -> fact_records.id）',
  `vote_type` ENUM('upvote', 'downvote') NOT NULL COMMENT '投票类型（upvote=赞同，downvote=反对）',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_fact` (`user_id`, `fact_id`),
  KEY `idx_fact_id` (`fact_id`),
  KEY `idx_vote_type` (`vote_type`),
  KEY `idx_created_at` (`created_at`),
  
  -- 外键约束
  CONSTRAINT `fk_fact_record_votes_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fact_record_votes_fact_id` FOREIGN KEY (`fact_id`) REFERENCES `fact_records` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='事实投票表';

-- ============================================
-- 8. 岗位匹配结果表（job_matches）
-- 存储用户的岗位匹配结果（云端持久化）
-- ============================================

CREATE TABLE IF NOT EXISTS `job_matches` (
  `id` VARCHAR(36) NOT NULL COMMENT '匹配结果ID（UUID v4）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID（外键 -> users.uid）',
  
  -- 匹配信息
  `job_id` VARCHAR(36) NOT NULL COMMENT '岗位ID（关联tencent_jobs或自定义岗位）',
  `job_title` VARCHAR(255) NOT NULL COMMENT '岗位标题',
  `company` VARCHAR(255) NOT NULL COMMENT '公司名称',
  `department` VARCHAR(255) NULL DEFAULT NULL COMMENT '部门（可选）',
  
  -- 匹配结果（JSON格式存储）
  `match_result` JSON NOT NULL COMMENT '匹配结果（包含overallScore、dimensionScores、gapAnalysis等）',
  
  -- 状态
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否当前活跃匹配结果',
  `is_favorite` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否收藏（0=否，1=是）',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间（匹配时间）',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_job_id` (`job_id`),
  KEY `idx_company` (`company`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_favorite` (`is_favorite`),
  KEY `idx_created_at` (`created_at`),
  
  -- 外键约束
  CONSTRAINT `fk_job_matches_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位匹配结果表（云端持久化）';

-- ============================================
-- 9. 通知设置表（notification_settings）
-- 用户的通知偏好设置
-- ============================================

CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` VARCHAR(36) NOT NULL COMMENT '设置ID（UUID v4）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID（外键 -> users.uid）',
  
  -- 通知渠道
  `email_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '邮件通知是否启用（0=否，1=是）',
  `sms_enabled` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '短信通知是否启用（0=否，1=是）',
  `push_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '推送通知是否启用（0=否，1=是）',
  
  -- 通知类型
  `notify_comment_reply` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '评论回复通知（0=否，1=是）',
  `notify_comment_like` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '评论点赞通知（0=否，1=是）',
  `notify_answer_accepted` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '回答被采纳通知（0=否，1=是）',
  `notify_fact_verified` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '事实被验证通知（0=否，1=是）',
  `notify_job_application` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '求职申请状态变更通知（0=否，1=是）',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  
  -- 外键约束
  CONSTRAINT `fk_notification_settings_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知设置表';

-- ============================================
-- 10. 用户活动日志表（user_activity_logs）
-- 记录用户的关键操作，用于审计和分析
-- ============================================

CREATE TABLE IF NOT EXISTS `user_activity_logs` (
  `id` VARCHAR(36) NOT NULL COMMENT '日志ID（UUID v4）',
  `user_id` VARCHAR(36) NULL DEFAULT NULL COMMENT '用户ID（外键 -> users.uid，匿名用户为NULL）',
  
  -- 活动信息
  `action` VARCHAR(100) NOT NULL COMMENT '操作动作（如"login"、"create_comment"、"update_profile"）',
  `entity_type` VARCHAR(50) NULL DEFAULT NULL COMMENT '实体类型（如"user_profile"、"job_application"）',
  `entity_id` VARCHAR(36) NULL DEFAULT NULL COMMENT '实体ID',
  `details` JSON NULL DEFAULT NULL COMMENT '详细信息（如变更前后的数据）',
  
  -- 请求信息
  `ip_address` VARCHAR(45) NULL DEFAULT NULL COMMENT 'IP地址（IPv4或IPv6）',
  `user_agent` TEXT NULL DEFAULT NULL COMMENT 'User-Agent',
  `referer` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Referer',
  
  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  -- 主键和索引
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_created_at` (`created_at`),
  
  -- 外键约束（可选，因为匿名用户的user_id可以为NULL）
  CONSTRAINT `fk_user_activity_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户活动日志表（审计和分析）';

-- ============================================
-- 11. 视图：社区评论完整信息（包含用户信息、回复统计）
-- ============================================

CREATE VIEW `v_community_comments_full` AS
SELECT 
  c.`id`,
  c.`user_id`,
  u.`nickname` AS user_nickname,
  u.`avatar_url` AS user_avatar_url,
  c.`target_type`,
  c.`target_id`,
  c.`parent_id`,
  c.`root_id`,
  c.`content`,
  c.`content_type`,
  c.`likes_count`,
  c.`replies_count`,
  c.`is_pinned`,
  c.`is_featured`,
  c.`status`,
  c.`report_count`,
  c.`created_at`,
  c.`updated_at`,
  
  -- 父评论信息（如果是回复）
  p.`user_id` AS parent_user_id,
  pu.`nickname` AS parent_user_nickname,
  
  -- 回复统计
  (SELECT COUNT(*) FROM `community_comments` AS child WHERE child.`parent_id` = c.`id` AND child.`status` = 'active') AS active_replies_count
  
FROM `community_comments` c
INNER JOIN `users` u ON c.`user_id` = u.`uid`
LEFT JOIN `community_comments` p ON c.`parent_id` = p.`id`
LEFT JOIN `users` pu ON p.`user_id` = pu.`uid`
WHERE c.`status` = 'active';

-- ============================================
-- 12. 视图：事实记录完整信息（包含提交用户信息、验证人信息）
-- ============================================

CREATE VIEW `v_fact_records_full` AS
SELECT 
  f.`id`,
  f.`user_id`,
  u.`nickname` AS submitter_nickname,
  u.`avatar_url` AS submitter_avatar_url,
  f.`title`,
  f.`content`,
  f.`company`,
  f.`position`,
  f.`department`,
  f.`category`,
  f.`tags`,
  f.`source_type`,
  f.`source_id`,
  f.`evidence_text`,
  f.`verification_status`,
  f.`verified_by`,
  vu.`nickname` AS verifier_nickname,
  f.`verified_at`,
  f.`verification_note`,
  f.`upvotes`,
  f.`downvotes`,
  f.`confidence_score`,
  f.`status`,
  f.`created_at`,
  f.`updated_at`
  
FROM `fact_records` f
INNER JOIN `users` u ON f.`user_id` = u.`uid`
LEFT JOIN `users` vu ON f.`verified_by` = vu.`uid`
WHERE f.`status` = 'active';

-- ============================================
-- 13. 索引优化建议（可选，根据实际查询模式调整）
-- ============================================

-- 为community_comments表添加复合索引（优化查询性能）
-- CREATE INDEX `idx_target_parent_created` ON `community_comments` (`target_type`, `target_id`, `parent_id`, `created_at`);

-- 为fact_records表添加复合索引（优化真相库查询）
-- CREATE INDEX `idx_company_category_confidence` ON `fact_records` (`company`, `category`, `confidence_score`);

-- ============================================
-- 完成提示
-- ============================================

SELECT '数据库Schema扩展创建完成！' AS message;
