-- 为报价单表添加 user_id 字段（如果不存在）
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 为客户表添加 user_id 字段（如果不存在）
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 为商品表添加 user_id 字段（如果不存在）
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 为商家信息表添加 user_id 字段（如果不存在）
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 启用 RLS（如果未启用）
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能访问自己的数据

-- 报价单策略
CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own quotes" ON quotes
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own quotes" ON quotes
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own quotes" ON quotes
  FOR DELETE USING (user_id = auth.uid()::text);

-- 客户策略
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own customers" ON customers
  FOR DELETE USING (user_id = auth.uid()::text);

-- 商品策略
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (user_id = auth.uid()::text);

-- 商家信息策略（每个用户只能有一个商家信息）
CREATE POLICY "Users can view own merchant" ON merchants
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own merchant" ON merchants
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own merchant" ON merchants
  FOR UPDATE USING (user_id = auth.uid()::text);
