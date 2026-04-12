#!/bin/bash

# 🚀 易表单Pro 后端服务部署 - 快速开始脚本
#
# 使用方法：
# 1. 替换 YOUR_GITHUB_USERNAME 为你的 GitHub 用户名
# 2. 运行脚本: bash deploy.sh
#

set -e  # 遇到错误立即退出

echo "========================================"
echo "  易表单Pro 后端服务部署 - 快速开始"
echo "========================================"
echo ""

# 配置变量
GITHUB_USERNAME="YOUR_GITHUB_USERNAME"  # ⚠️ 请替换成你的 GitHub 用户名
REPO_NAME="yibiao-pro-backend"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否已配置 GitHub 用户名
if [ "$GITHUB_USERNAME" = "YOUR_GITHUB_USERNAME" ]; then
    echo -e "${RED}❌ 请先编辑此脚本，将 GITHUB_USERNAME 替换为你的 GitHub 用户名${NC}"
    echo -e "${YELLOW}示例: GITHUB_USERNAME=\"zhangsan\"${NC}"
    exit 1
fi

echo -e "${GREEN}✓ GitHub 用户名: $GITHUB_USERNAME${NC}"
echo ""

# 步骤 1：检查 Git 仓库
echo -e "${YELLOW}[1/5] 检查 Git 仓库...${NC}"
if [ -d .git ]; then
    echo -e "${GREEN}✓ Git 仓库已初始化${NC}"
else
    echo -e "${YELLOW}初始化 Git 仓库...${NC}"
    git init
fi
echo ""

# 步骤 2：配置远程仓库
echo -e "${YELLOW}[2/5] 配置远程仓库...${NC}"
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# 检查远程仓库是否已配置
if git remote get-url origin > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 远程仓库已配置: $(git remote get-url origin)${NC}"
    read -p "是否重新配置? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin "$REPO_URL"
        echo -e "${GREEN}✓ 远程仓库已更新: $REPO_URL${NC}"
    fi
else
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✓ 远程仓库已配置: $REPO_URL${NC}"
fi
echo ""

# 步骤 3：提交代码
echo -e "${YELLOW}[3/5] 提交代码...${NC}"
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${GREEN}✓ 没有需要提交的更改${NC}"
else
    git add -A
    git commit -m "feat: 准备部署后端服务"
    echo -e "${GREEN}✓ 代码已提交${NC}"
fi
echo ""

# 步骤 4：推送到 GitHub
echo -e "${YELLOW}[4/5] 推送代码到 GitHub...${NC}"
echo -e "${YELLOW}请先在 GitHub 上创建仓库: https://github.com/new${NC}"
echo -e "${YELLOW}仓库名称: $REPO_NAME${NC}"
echo -e "${YELLOW}选择: Public (免费版要求)${NC}"
echo ""
read -p "已创建仓库? 按 Enter 继续..."

git push -u origin main || {
    echo -e "${RED}❌ 推送失败，请检查：${NC}"
    echo "  1. 仓库是否已创建？"
    echo "  2. 用户名是否正确？"
    echo "  3. 是否有权限访问该仓库？"
    exit 1
}
echo -e "${GREEN}✓ 代码已推送到 GitHub${NC}"
echo ""

# 步骤 5：显示下一步操作
echo -e "${YELLOW}[5/5] 部署到 Render...${NC}"
echo ""
echo "========================================"
echo "  🎉 代码已准备好！"
echo "========================================"
echo ""
echo "下一步操作："
echo ""
echo "1️⃣  访问 Render: https://render.com"
echo "2️⃣  注册/登录账号"
echo "3️⃣  创建 Web Service"
echo "4️⃣  连接仓库: $GITHUB_USERNAME/$REPO_NAME"
echo ""
echo -e "${GREEN}详细配置说明，请查看: DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo "========================================"
echo ""
