-- 每日复盘功能数据库迁移
-- 执行方式: npx wrangler d1 execute blogpro-db --remote --file=migrations/001_create_reviews.sql

-- 创建复盘表
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  completed TEXT,
  insights TEXT,
  plans TEXT,
  freeText TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 创建模板表
CREATE TABLE IF NOT EXISTS review_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fields TEXT NOT NULL,
  isDefault INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);

-- 创建日期索引
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(date);

-- 插入默认模板
INSERT INTO review_templates (id, name, fields, isDefault, createdAt)
VALUES (
  'default-template',
  '默认模板',
  '[{"id":"completed","label":"今日完成","icon":"✓","type":"checkbox","required":false},{"id":"insights","label":"今日感悟","icon":"💡","type":"textarea","required":false},{"id":"plans","label":"明日计划","icon":"📋","type":"checkbox","required":false},{"id":"freeText","label":"自由记录","icon":"✏️","type":"textarea","required":false}]',
  1,
  datetime('now')
);