# 📋 后端部署快速参考

## 🚀 完整部署流程（预计 20 分钟）

### 1️⃣ 准备 GitHub 仓库（5 分钟）
```bash
# 替换你的用户名
GITHUB_USERNAME="你的GitHub用户名"

# 推送代码到 GitHub
cd /workspace/projects
git remote add origin https://github.com/${GITHUB_USERNAME}/yibiao-pro-backend.git
git push -u origin main
```

**或者使用快速脚本：**
```bash
# 1. 编辑 deploy.sh，替换 GITHUB_USERNAME
vim deploy.sh

# 2. 运行脚本
bash deploy.sh
```

---

### 2️⃣ 在 Render 部署（10 分钟）

#### 访问：https://render.com

#### 创建 Web Service

| 配置项 | 值 |
|--------|-----|
| **Name** | `yibiao-pro-backend` |
| **Root Directory** | `server` ⚠️ |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Plan** | Free |

#### 环境变量

```
COZE_SUPABASE_URL=https://br-sweet-watt-bd3e8f65.supabase2.aidap-global.cn-beijing.volces.com
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTU1MzY5NjMsInJvbGUiOiJhbm9uIn0.DKipCGJlRnhlE70BfZGhA3BUnQ716fL1iS3yT_tzxHA
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTU1MzY5NjMsInJvbGUiOiJzZXJ2aWNlX3JvbGUifQ.HQDJOuZFN6ftzH_gQFdOOadN1VXacuPhetB5LhjUyOA
PORT=3000
NODE_ENV=production
```

---

### 3️⃣ 获取后端域名（2 分钟）

部署成功后，复制域名：
```
https://yibiao-pro-backend-xxxx.onrender.com
```

---

### 4️⃣ 配置小程序（3 分钟）

#### 4.1 微信公众平台配置
1. 登录：https://mp.weixin.qq.com
2. 开发 → 开发管理 → 开发设置
3. 服务器域名 → request 合法域名 → 修改
4. 添加：`https://你的域名.onrender.com`

#### 4.2 修改 project.config.json
```json
{
  "setting": {
    "urlCheck": true
  }
}
```

#### 4.3 设置环境变量
```bash
# 创建 .env.production
cat > .env.production << 'EOF'
PROJECT_DOMAIN=https://你的域名.onrender.com
EOF
```

#### 4.4 重新构建
```bash
pnpm build:weapp
```

---

## ✅ 验证清单

部署完成后，请确认：

- [ ] 后端服务部署成功（Render 显示 "Service is live"）
- [ ] 测试后端 API：访问 `https://你的域名.onrender.com/api/quotes`
- [ ] 小程序 request 合法域名已配置
- [ ] `project.config.json` 中的 `urlCheck` 已改为 `true`
- [ ] `.env.production` 已创建
- [ ] 小程序重新构建完成
- [ ] 微信开发者工具中测试所有功能正常
- [ ] 真机预览测试通过

---

## 📚 详细文档

- **完整部署指南**：查看 `DEPLOYMENT_GUIDE.md`
- **快速部署脚本**：运行 `bash deploy.sh`
- **常见问题**：查看 `DEPLOYMENT_GUIDE.md` 的常见问题部分

---

## ⚠️ 重要提醒

1. **Root Directory 必须填写 `server`**
2. **环境变量必须完全复制，不要有多余空格**
3. **request 合法域名不要加 `/api` 后缀**
4. **GitHub 仓库必须是 Public（免费版要求）**

---

## 🎯 预计时间

| 步骤 | 时间 |
|------|------|
| GitHub 仓库 | 5 分钟 |
| Render 配置 | 5 分钟 |
| 等待部署 | 5-10 分钟 |
| 测试验证 | 5 分钟 |
| **总计** | **20-25 分钟** |

---

## 🚀 开始部署

准备好了吗？按照上面的步骤开始部署吧！

如有问题，随时查看 `DEPLOYMENT_GUIDE.md` 详细文档。
