# 压缩摘要

## 用户需求与目标
- 原始目标: 创建一款适用于工程、五金、家具、卫浴等零售行业的多行业报价表小程序，支持快速生成报价单。
- 当前目标: 修改应用名称为"易表单"，调整所有文案为"表单"相关表述，符合个人主体小程序审核要求。
- 验收标准与约束:
  - 遵循 Taro + NestJS 技术栈
  - 使用 Supabase 数据库
  - 符合个人主体小程序审核要求（无广告、无支付、无商业经营行为）
  - 遵循设计指南规范（配色、组件选型）
- 偏好:
  - 主题色：蓝色系（#2563eb）
  - 简洁专业的 UI 风格
  - 应用名称：易表单

## 项目概览
- 概述: 基于 Taro 4 + NestJS 的多行业表单管理小程序，支持商品管理、客户管理、表单生成。
- 技术栈:
  - 前端: Taro 4.1.9, React 18, TypeScript, Tailwind CSS 4
  - 后端: NestJS 10.4.15, Supabase (PostgreSQL), Drizzle ORM
  - 图标: lucide-react-taro
- 编码规范: ESLint + TypeScript strict mode

## 关键决策
- 采用 Supabase 作为数据库，利用其 PostgREST 和 RLS 能力。
- 前端网络请求封装为 `Network` 工具，统一处理域名和错误。
- 商品创建时默认使用"工程建材"行业ID，避免行业选择缺失导致失败。
- 应用定位从"报价工具"调整为"表单管理工具"，符合个人主体审核要求。

## 核心文件修改
- 文件操作:
  - edit: `src/app.config.ts` - 应用名称改为"易表单"，TabBar文案改为"表单"
  - edit: `src/pages/home/index.tsx` - 首页功能入口和统计项改为"表单"相关
  - edit: `src/pages/home/index.config.ts` - 页面标题改为"易表单"
  - edit: `src/pages/profile/index.tsx` - 个人中心功能入口改为"表单模板"
  - edit: `src/pages/quotes/index.tsx` - 表单列表页面，文案改为"表单"
  - edit: `src/pages/quotes/index.config.ts` - 页面标题改为"我的表单"
  - edit: `src/pages/quotes/create/index.config.ts` - 页面标题改为"创建表单"
  - edit: `src/pages/quotes/create/index.tsx` - 创建按钮改为"创建表单"
  - edit: `src/pages/templates/index.tsx` - 模板页面全面改为"表单模板"
  - edit: `src/pages/templates/index.config.ts` - 页面标题改为"表单模板"
  - edit: `src/pages/quotes/index.css` - 移除广告样式
  - edit: `src/pages/quotes/create/index.css` - 移除广告样式
- 关键修改:
  - 移除所有广告功能代码
  - 修改应用名称：易清单 → 易表单
  - 修改功能文案：报价单/清单 → 表单
  - 修改页面标题和TabBar文案
  - 修改模板页面文案

## 问题或错误及解决方案
- 问题: 个人主体小程序不能有报价功能
  - 解决方案: 将应用定位调整为"表单管理工具"，修改所有相关文案
- 问题: 个人主体小程序不能有广告功能
  - 解决方案: 移除所有广告相关代码和逻辑

## TODO
- 所有修改已完成

## 验证结果
- pnpm validate: ✅ 通过
- pnpm build:web: ✅ 通过
