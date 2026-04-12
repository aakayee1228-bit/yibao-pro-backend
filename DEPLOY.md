# 易表单Pro - 部署指南

## 免费部署方案

### 方案选择

推荐使用 **Render**（完全免费）：
- 免费额度：750 小时/月（足够个人小程序使用）
- 支持 NestJS 长期运行服务
- 自动 HTTPS
- 全球 CDN

## 部署步骤

### 1. 注册 Render 账号

访问：https://render.com
使用 GitHub 账号登录

### 2. 准备代码

将代码推送到 GitHub 仓库

### 3. 在 Render 创建 Web Service

1. 登录 Render 控制台
2. 点击 "New" → "Web Service"
3. 连接你的 GitHub 仓库
4. 配置部署参数

### 4. 环境变量配置

在 Render 中配置以下环境变量：

```
COZE_SUPABASE_URL=https://br-sweet-watt-bd3e8f65.supabase2.aidap-global.cn-beijing.volces.com
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTU1MzY5NjMsInJvbGUiOiJhbm9uIn0.DKipCGJlRnhlE70BfZGhA3BUnQ716fL1iS3yT_tzxHA
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTU1MzY5NjMsInJvbGUiOiJzZXJ2aWNlX3JvbGUifQ.HQDJOuZFN6ftzH_gQFdOOadN1VXacuPhetB5LhjUyOA
PORT=3000
```

### 5. 部署配置

```
Root Directory: server
Build Command: npm run build
Start Command: npm run start:prod
```

### 6. 获取域名

部署成功后，Render 会提供一个免费域名，如：
```
https://your-app-name.onrender.com
```

### 7. 配置小程序域名

在微信公众平台配置：
```
https://your-app-name.onrender.com/api
```

## 免费额度说明

Render 免费版包含：
- 750 小时/月（约 31 天）
- 512MB RAM
- 0.1 CPU
- 自动休眠（15分钟无请求后休眠）

**注意**：休眠后首次请求会慢一些（5-10秒唤醒），但免费额度足够个人小程序使用。

## 其他免费方案

如果 Render 满足不了需求，还可以选择：

### Railway
- 免费额度：500 小时/月
- 支持 Node.js
- 访问：https://railway.app

### Fly.io
- 免费额度：有限
- 支持 Docker
- 访问：https://fly.io
