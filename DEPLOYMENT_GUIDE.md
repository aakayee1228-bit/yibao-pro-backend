# 🚀 后端服务部署指南 - Render（完全免费）

## 📋 前置准备

在开始部署之前，确保你已经准备好：
- ✅ GitHub 账号（免费）
- ✅ 一个有效的邮箱地址

---

## 步骤 1：创建 GitHub 仓库（3分钟）

### 1.1 登录 GitHub
访问：https://github.com

### 1.2 创建新仓库
1. 点击右上角的 **"+"** 图标
2. 选择 **"New repository"**
3. 填写仓库信息：
   - **Repository name**: `yibiao-pro-backend`（或任意你喜欢的名字）
   - **Description**: 易表单Pro 后端服务
   - **Public**: ✅ 选择 Public（免费版要求）
   - **Initialize this repository**: ❌ 不要勾选（因为本地已有代码）
4. 点击 **"Create repository"**

### 1.3 推送代码到 GitHub

在本地终端执行以下命令（替换成你的用户名）：

```bash
# 进入项目目录
cd /workspace/projects

# 添加远程仓库（替换成你的用户名）
git remote add origin https://github.com/你的GitHub用户名/yibiao-pro-backend.git

# 推送代码
git push -u origin main
```

**示例：**
```bash
git remote add origin https://github.com/zhangsan/yibiao-pro-backend.git
git push -u origin main
```

---

## 步骤 2：注册 Render 账号（2分钟）

### 2.1 访问 Render
访问：https://render.com

### 2.2 注册账号
1. 点击右上角的 **"Sign Up"**
2. 选择 **"Sign up with GitHub"**（推荐）
3. 授权 Render 访问你的 GitHub
4. 填写邮箱和密码，完成注册

**为什么选择 Render？**
- ✅ 完全免费
- ✅ 自动部署
- ✅ 支持 GitHub 持续集成
- ✅ 免费 HTTPS 证书
- ✅ 全球 CDN 加速

---

## 步骤 3：连接 GitHub 仓库到 Render（3分钟）

### 3.1 创建 Web Service
1. 登录 Render 后，点击右上角的 **"+"** 按钮
2. 选择 **"New +"**
3. 选择 **"Web Service"**

### 3.2 连接仓库
1. 在 **"Connect a repository"** 部分
2. 选择你的 GitHub 账号
3. 找到 `yibiao-pro-backend` 仓库
4. 点击 **"Connect"**

---

## 步骤 4：配置部署（5分钟）

### 4.1 基本配置
填写以下信息：

| 配置项 | 值 |
|--------|-----|
| **Name** | `yibiao-pro-backend` |
| **Region** | `Oregon (US West)`（或选择离你最近的） |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Root Directory** | `server` ⚠️ **重要！** |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |

**⚠️ 注意：**
- **Root Directory 必须填写 `server`**，因为后端代码在 server 目录
- 其他选项保持默认即可

### 4.2 配置环境变量

点击 **"Advanced"** → **"Add Environment Variable"**，逐个添加以下变量：

| Key | Value |
|-----|-------|
| `COZE_SUPABASE_URL` | `https://br-sweet-watt-bd3e8f65.supabase2.aidap-global.cn-beijing.volces.com` |
| `COZE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTU1MzY5NjMsInJvbGUiOiJhbm9uIn0.DKipCGJlRnhlE70BfZGhA3BUnQ716fL1iS3yT_tzxHA` |
| `COZE_SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTU1MzY5NjMsInJvbGUiOiJzZXJ2aWNlX3JvbGUifQ.HQDJOuZFN6ftzH_gQFdOOadN1VXacuPhetB5LhjUyOA` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

**💡 提示：**
- 复制时不要有多余的空格
- Key 必须完全一致（区分大小写）
- Value 不要加引号

### 4.3 选择免费计划
1. 在 **"Plan"** 部分
2. 选择 **"Free"**（免费版）
3. **Instance Type**: 选择 `Nano`（免费版）
4. 点击 **"Create Web Service"**

---

## 步骤 5：等待部署（5-10分钟）

### 5.1 部署过程
点击 **"Create Web Service"** 后，Render 会自动：
1. 拉取代码
2. 安装依赖
3. 构建项目
4. 启动服务

### 5.2 查看部署日志
1. 在 **"Logs"** 标签页查看实时日志
2. 等待看到 **"Service is live"** 表示部署成功
3. 整个过程约 5-10 分钟

### 5.3 获取服务域名
部署成功后，在服务详情页顶部可以看到：
```
https://yibiao-pro-backend-xxxx.onrender.com
```

**复制这个域名，后续需要配置到小程序！**

---

## 步骤 6：测试后端服务（2分钟）

### 6.1 测试健康检查
在浏览器中访问：
```
https://你的域名.onrender.com/api/quotes
```

**预期结果：**
- 返回 JSON 数据
- 或者返回空数组 `[]`（如果没有数据）

### 6.2 使用 curl 测试
```bash
curl https://你的域名.onrender.com/api/quotes
```

---

## 步骤 7：配置小程序域名（2分钟）

### 7.1 登录微信公众平台
访问：https://mp.weixin.qq.com

### 7.2 添加服务器域名
1. 进入 **"开发"** → **"开发管理"** → **"开发设置"**
2. 找到 **"服务器域名"**
3. 点击 **"request 合法域名"** → **"修改"**
4. 添加你的后端域名：
   ```
   https://你的域名.onrender.com
   ```
5. 点击 **"保存并提交"**

**⚠️ 注意：**
- 必须使用 `https://`
- 不要加 `/api` 后缀
- 不要加端口号

### 7.3 修改 project.config.json
在项目中修改 `project.config.json`：

```json
{
  "setting": {
    "urlCheck": true
  }
}
```

---

## 步骤 8：更新前端配置（2分钟）

### 8.1 设置生产环境域名

在本地创建 `.env.production` 文件：

```bash
# 在项目根目录创建 .env.production 文件
cat > .env.production << 'EOF'
PROJECT_DOMAIN=https://你的域名.onrender.com
EOF
```

### 8.2 重新构建小程序
```bash
pnpm build:weapp
```

### 8.3 测试小程序
1. 在微信开发者工具中刷新
2. 测试所有功能
3. 确认 API 请求正常

---

## 🎉 完成！

恭喜你！后端服务已经成功部署并上线了！

## 📊 免费额度说明

**Render 免费版包含：**
- ✅ 750 小时/月（约 31 天全天运行）
- ✅ 512MB 内存
- ✅ 0.1 CPU 核心
- ✅ 自动 HTTPS（SSL 证书）
- ✅ 全球 CDN 加速

**注意事项：**
- ⚠️ 15 分钟无请求后会自动休眠（省电）
- ⚠️ 休眠后首次请求会慢 5-10 秒（唤醒时间）
- ✅ 免费额度足够个人小程序使用

---

## ❓ 常见问题

### Q1: 部署失败怎么办？
**A:** 检查以下几点：
- GitHub 仓库是否为 Public
- Root Directory 是否填写为 `server`
- 环境变量是否配置正确
- 查看部署日志，找出错误原因

### Q2: 服务太慢怎么办？
**A:** 这是免费版的正常现象：
- Render 免费版有休眠机制
- 首次请求会慢 5-10 秒
- 后续请求会很快
- 如需更快的速度，可升级到付费版（$7/月起）

### Q3: 如何查看服务日志？
**A:** 在 Render 控制台：
1. 进入你的服务
2. 点击 **"Logs"** 标签
3. 可以查看实时日志

### Q4: 如何更新代码？
**A:** 自动部署流程：
1. 修改代码
2. 提交到 GitHub
3. Render 自动检测到提交
4. 自动重新部署

### Q5: 需要备案吗？
**A:** 不需要！
- Render 提供的是海外服务器
- 不需要备案
- 直接使用即可

---

## 📞 需要帮助？

如果在部署过程中遇到问题：
1. 检查 Render 部署日志
2. 确认环境变量配置正确
3. 确认 GitHub 仓库为 Public
4. 查看本文档的常见问题部分

或者随时联系我！

---

## 🎯 下一步

部署完成后，你可以：
1. ✅ 测试小程序的所有功能
2. ✅ 提交小程序审核
3. ✅ 开始使用易表单Pro
4. ✅ 分享给客户使用

祝你使用愉快！🚀
