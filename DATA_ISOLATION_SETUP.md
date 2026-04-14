# 数据隔离功能部署说明

## 概述

已完成用户数据隔离功能，确保每个用户只能看到自己的数据。

## 已完成的修改

### 后端修改
1. ✅ 创建用户认证模块 (`server/src/modules/auth/`)
2. ✅ 修改所有 Service 添加 user_id 过滤
3. ✅ 修改所有 Controller 接收 x-openid 头
4. ✅ 修改 Network 工具自动添加认证头

### 前端修改
1. ✅ 创建认证工具 (`src/utils/auth.ts`)
2. ✅ 创建 AuthProvider 组件
3. ✅ 修改 Network 工具自动添加 X-Openid 头

## 需要配置的环境变量

在 Render 平台的后端服务中添加以下环境变量：

```
WECHAT_MINI_APP_ID=wxce8df0af7fd86188
WECHAT_MINI_APP_SECRET=你的小程序AppSecret
```

### 获取 AppSecret 的步骤：

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入你的小程序后台
3. 点击 **"开发"** → **"开发管理"** → **"开发设置"**
4. 找到 **"开发者ID"**
5. 点击 **"AppSecret"** 的 **"生成"** 或 **"重置"** 按钮
6. 扫描验证后，会显示 AppSecret

⚠️ **重要提示**：AppSecret 只会显示一次，请立即复制并保存！

## 部署步骤

### 1. 添加环境变量

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 进入你的服务（yibao-pro-backend）
3. 点击 **"Environment"** 标签
4. 添加以下环境变量：

```
WECHAT_MINI_APP_ID=wxce8df0af7fd86188
WECHAT_MINI_APP_SECRET=你的小程序AppSecret
```

5. 点击 **"Save Changes"**

### 2. 重新部署

添加环境变量后，Render 会自动重新部署服务。

### 3. 测试功能

1. 重新编译前端代码
2. 在微信开发者工具中重新导入项目
3. 测试功能：
   - 创建报价单
   - 创建客户
   - 创建商品
   - 使用不同的微信账号登录
   - 确认每个账号只能看到自己的数据

## RLS 策略（可选）

如果需要在数据库层面加强数据隔离，可以执行以下 SQL：

### 方法 1：在 Supabase SQL Editor 中执行

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 进入你的项目
3. 点击 **"SQL Editor"**
4. 点击 **"New query"**
5. 复制并粘贴以下 SQL：

```sql
-- 添加 user_id 字段
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 启用 RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 报价单
DROP POLICY IF EXISTS "Users can view own quotes" ON quotes;
CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own quotes" ON quotes;
CREATE POLICY "Users can insert own quotes" ON quotes
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- 客户
DROP POLICY IF EXISTS "Users can view own customers" ON customers;
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own customers" ON customers;
CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- 商品
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- 商家
DROP POLICY IF EXISTS "Users can view own merchant" ON merchants;
CREATE POLICY "Users can view own merchant" ON merchants
  FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own merchant" ON merchants;
CREATE POLICY "Users can insert own merchant" ON merchants
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
```

6. 点击 **"Run"** 执行

## 注意事项

1. **AppSecret 安全**：不要在前端代码中暴露 AppSecret
2. **环境变量配置**：确保后端服务配置了正确的环境变量
3. **测试数据**：执行 RLS 策略后，现有的测试数据不会被自动过滤
4. **数据迁移**：如果需要为现有数据添加 user_id，需要手动执行 SQL 更新

## 测试数据迁移（可选）

如果需要为现有测试数据添加 user_id，可以执行以下 SQL：

```sql
-- 为所有现有数据添加一个默认 user_id
UPDATE quotes SET user_id = 'default-user' WHERE user_id IS NULL;
UPDATE customers SET user_id = 'default-user' WHERE user_id IS NULL;
UPDATE products SET user_id = 'default-user' WHERE user_id IS NULL;
UPDATE merchants SET user_id = 'default-user' WHERE user_id IS NULL;
```

然后删除这些测试数据，重新创建。

## 常见问题

### Q: 登录失败怎么办？
A: 检查以下几点：
1. 环境变量是否正确配置
2. AppSecret 是否正确
3. 小程序 AppID 是否正确
4. 网络连接是否正常

### Q: 数据还是能看到其他用户的？
A: 检查以下几点：
1. 后端代码是否已部署
2. 前端代码是否已重新编译
3. Network 工具是否正确添加了 X-Openid 头
4. 用户是否已成功登录

### Q: 旧数据怎么办？
A: 旧数据没有 user_id，会返回给所有用户。建议：
1. 在 Supabase 中删除旧数据
2. 或执行数据迁移 SQL 添加 user_id
3. 重新创建测试数据

## 下一步

1. 配置 Render 环境变量
2. 重新部署后端服务
3. 测试登录功能
4. 测试数据隔离功能
5. 准备提交小程序审核
