# 多行业报价表小程序 - 设计指南

## 一、品牌定位

**应用名称**：智能报价助手

**应用定位**：面向工程、五金、家具、卫浴等零售行业的专业报价工具，帮助商家快速生成专业报价单，提升成交效率

**目标用户**：
- 中小零售商家（工程建材、五金配件、家具家居、卫浴洁具等）
- 销售人员（需要现场快速报价）
- 批发商（需要批量报价给客户）

**设计风格**：简洁专业、高效实用、信任感强

---

## 二、配色方案

### 主色板（Tailwind 类名）

- **主色**：`bg-blue-600` / `text-blue-600` - 专业、信任（#2563eb）
- **主色浅**：`bg-blue-50` / `text-blue-50` - 辅助背景（#eff6ff）
- **辅色**：`bg-emerald-500` / `text-emerald-500` - 成功、确认（#10b981）
- **辅色浅**：`bg-emerald-50` / `text-emerald-50` - 成功背景（#ecfdf5）

### 中性色

- **标题文字**：`text-gray-900` - #111827
- **正文文字**：`text-gray-700` - #374151
- **次要文字**：`text-gray-500` - #6b7280
- **占位文字**：`text-gray-400` - #9ca3af
- **分割线**：`bg-gray-200` - #e5e7eb
- **背景色**：`bg-gray-50` - #f9fafb
- **白色背景**：`bg-white` - #ffffff

### 语义色

- **成功**：`bg-emerald-500` / `text-emerald-600`
- **警告**：`bg-amber-500` / `text-amber-600`
- **错误**：`bg-red-500` / `text-red-600`
- **信息**：`bg-blue-500` / `text-blue-600`

---

## 三、字体规范

- **H1 页面标题**：`text-2xl font-bold text-gray-900`
- **H2 模块标题**：`text-xl font-semibold text-gray-900`
- **H3 卡片标题**：`text-lg font-medium text-gray-900`
- **Body 正文**：`text-base text-gray-700`
- **Caption 辅助文字**：`text-sm text-gray-500`
- **Price 价格文字**：`text-xl font-bold text-red-500`

---

## 四、间距系统

- **页面边距**：`p-4`（16px）
- **卡片内边距**：`p-4`（16px）
- **列表项间距**：`gap-3`（12px）
- **组件间距**：`gap-4`（16px）
- **按钮圆角**：`rounded-lg`（8px）
- **卡片圆角**：`rounded-xl`（12px）

---

## 五、组件选型原则

**通用 UI 组件优先使用 `@/components/ui/*`**，禁止用 `View/Text` 手搓以下组件：

- **按钮**：`Button`（@/components/ui/button）
- **输入框**：`Input`（@/components/ui/input）、`Textarea`（@/components/ui/textarea）
- **卡片**：`Card` 系列（@/components/ui/card）
- **标签页**：`Tabs`（@/components/ui/tabs）
- **弹窗**：`Dialog`（@/components/ui/dialog）、`Drawer`（@/components/ui/drawer）
- **选择器**：`Select`（@/components/ui/select）
- **开关**：`Switch`（@/components/ui/switch）
- **复选框**：`Checkbox`（@/components/ui/checkbox）
- **徽章**：`Badge`（@/components/ui/badge）
- **分割线**：`Separator`（@/components/ui/separator）
- **提示**：`Toast`（@/components/ui/toast）、`Alert`（@/components/ui/alert）
- **空状态**：使用自定义 EmptyState 组件

**仅在以下情况使用 `@tarojs/components` 原生组件**：
- 页面容器：`View`
- 文本展示：`Text`
- 图片：`Image`
- 滚动容器：`ScrollView`
- 表单容器：`Form`

---

## 六、导航结构（TabBar 配置）

### 底部导航栏

| 页面 | 路径 | 图标 | 说明 |
|------|------|------|------|
| 首页 | pages/home/index | House | 快速入口、最近报价 |
| 商品库 | pages/products/index | Package | 商品管理、行业模板 |
| 报价单 | pages/quotes/index | FileText | 新建/历史报价单 |
| 我的 | pages/profile/index | User | 客户管理、设置 |

### 页面跳转规范

- TabBar 页面跳转：使用 `Taro.switchTab()`
- 普通页面跳转：使用 `Taro.navigateTo()`
- 返回上一页：使用 `Taro.navigateBack()`

---

## 七、页面结构规划

### 1. 首页（pages/home/index）
- **顶部**：搜索栏 + 扫码入口
- **快捷入口**：新建报价、商品库、客户管理、历史报价
- **最近报价**：最近 5 条报价单列表
- **数据概览**：本月报价数、成交金额统计

### 2. 商品库（pages/products/index）
- **顶部搜索**：商品名称/编码搜索
- **行业切换**：Tabs 切换不同行业模板
- **商品列表**：卡片式展示，支持编辑/删除
- **底部操作**：添加商品按钮（固定底部）

### 3. 商品详情/编辑（pages/products/detail）
- **基本信息**：商品名称、编码、单位、规格
- **价格设置**：成本价、零售价、批发价
- **行业属性**：根据行业显示特殊字段（如材质、颜色、尺寸）
- **商品图片**：支持上传商品图片

### 4. 报价单列表（pages/quotes/index）
- **顶部筛选**：全部、草稿、已发送、已成交
- **搜索框**：客户名称/报价单号搜索
- **报价卡片**：客户名、金额、状态、创建时间
- **新建按钮**：右下角浮动按钮

### 5. 新建/编辑报价单（pages/quotes/create）
- **客户选择**：下拉选择或新增客户
- **商品添加**：搜索商品 + 填数量
- **商品列表**：展示已选商品，支持修改数量/删除
- **底部汇总**：商品数量、小计、折扣、总价
- **操作按钮**：保存草稿、生成报价单

### 6. 报价单预览（pages/quotes/preview）
- **报价单头部**：商家信息、报价单号、日期
- **客户信息**：姓名、联系方式
- **商品明细**：商品名称、规格、数量、单价、小计
- **底部汇总**：合计金额、备注
- **操作按钮**：编辑、分享、导出图片

### 7. 客户管理（pages/customers/index）
- **搜索栏**：客户名称/电话搜索
- **客户列表**：卡片展示客户信息
- **历史报价**：点击查看该客户所有报价单
- **添加按钮**：右下角浮动按钮

### 8. 客户详情/编辑（pages/customers/detail）
- **基本信息**：姓名、电话、地址、备注
- **历史报价**：该客户的所有报价单列表
- **快捷操作**：新建报价、拨打电话

### 9. 我的（pages/profile/index）
- **用户信息**：头像、昵称、商家信息
- **功能列表**：
  - 商家信息设置
  - 报价单模板设置
  - 单位换算设置
  - 折扣管理
  - 数据统计
- **其他**：关于我们、帮助文档

---

## 八、数据模型设计

### 1. 行业模板（industries）
```typescript
{
  id: string
  name: string // 工程建材、五金配件、家具家居、卫浴洁具
  icon: string
  units: string[] // 常用单位
  attributes: string[] // 特殊属性字段
}
```

### 2. 商品（products）
```typescript
{
  id: string
  industryId: string
  name: string
  code: string // 商品编码
  unit: string // 单位
  specification?: string // 规格
  costPrice: number // 成本价
  retailPrice: number // 零售价
  wholesalePrice?: number // 批发价
  attributes?: Record<string, string> // 行业特殊属性
  images?: string[] // 商品图片
  createdAt: Date
  updatedAt: Date
}
```

### 3. 报价单（quotes）
```typescript
{
  id: string
  quoteNo: string // 报价单号
  customerId: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  items: QuoteItem[]
  subtotal: number // 小计
  discount: number // 折扣
  totalAmount: number // 总价
  remark?: string
  validDays: number // 有效期（天）
  createdAt: Date
  updatedAt: Date
}
```

### 4. 报价明细（quote_items）
```typescript
{
  id: string
  quoteId: string
  productId: string
  productName: string
  unit: string
  quantity: number
  unitPrice: number
  discount?: number
  amount: number
  remark?: string
}
```

### 5. 客户（customers）
```typescript
{
  id: string
  name: string
  phone: string
  address?: string
  company?: string
  remark?: string
  tags?: string[] // 客户标签
  createdAt: Date
  updatedAt: Date
}
```

### 6. 商家信息（merchant_info）
```typescript
{
  id: string
  userId: string
  shopName: string
  contactName: string
  phone: string
  address: string
  logo?: string
  stamp?: string // 印章图片
  quoteTemplate?: string // 报价单模板
}
```

---

## 九、核心功能流程

### 快速报价流程
1. 首页点击「新建报价」→ 进入报价单创建页
2. 选择客户（或新增客户）
3. 搜索/选择商品 → 填写数量
4. 系统自动计算小计和总价
5. 设置折扣（可选）→ 填写备注（可选）
6. 保存草稿 或 生成报价单
7. 预览报价单 → 分享/导出

### 商品库管理流程
1. 首页点击「商品库」→ 进入商品列表
2. 切换行业标签 → 查看对应商品
3. 点击「添加商品」→ 填写商品信息
4. 上传商品图片（可选）
5. 保存商品

### 客户管理流程
1. 首页点击「客户管理」→ 进入客户列表
2. 点击客户卡片 → 查看客户详情和历史报价
3. 点击「添加客户」→ 填写客户信息
4. 保存客户

---

## 十、小程序约束

### 包体积
- 主包体积 ≤ 2MB
- 总包体积 ≤ 20MB
- 图片资源优先使用对象存储

### 性能优化
- 商品列表使用虚拟滚动
- 图片懒加载
- 分包加载（客户管理、统计等次要功能放分包）

### 数据存储
- 商品库、客户数据存储到后端数据库
- 本地缓存最近报价单（提高加载速度）

---

## 十一、会员体系设计

### 会员等级配色

**免费版**：
- 主色：`bg-gray-500` / `text-gray-500` - #6b7280
- 标签：`bg-gray-100 text-gray-700`

**月度会员**：
- 主色：`bg-blue-500` / `text-blue-500` - #3b82f6
- 标签：`bg-blue-50 text-blue-700`

**年度会员**：
- 主色：`bg-amber-500` / `text-amber-500` - #f59e0b
- 标签：`bg-amber-50 text-amber-700`

### 会员卡片样式

```tsx
// 免费版卡片
<View className="border border-gray-200 rounded-xl p-4">
  <Badge variant="secondary">免费版</Badge>
  <Text className="text-2xl font-bold text-gray-700 mt-2">¥0</Text>
  <Text className="text-xs text-gray-500">永久免费</Text>
</View>

// 月度会员卡片（推荐）
<View className="border-2 border-blue-500 rounded-xl p-4 relative">
  <View className="absolute -top-2 left-4 bg-blue-500 px-2 py-0.5 rounded">
    <Text className="text-xs text-white">推荐</Text>
  </View>
  <Badge>月度会员</Badge>
  <Text className="text-2xl font-bold text-blue-600 mt-2">¥29.9</Text>
  <Text className="text-xs text-gray-500">/月</Text>
</View>

// 年度会员卡片（最优惠）
<View className="border-2 border-amber-500 rounded-xl p-4 relative bg-gradient-to-br from-amber-50 to-white">
  <View className="absolute -top-2 left-4 bg-amber-500 px-2 py-0.5 rounded">
    <Text className="text-xs text-white">省¥159</Text>
  </View>
  <Badge className="bg-amber-500">年度会员</Badge>
  <View className="flex items-baseline gap-2 mt-2">
    <Text className="text-2xl font-bold text-amber-600">¥199</Text>
    <Text className="text-sm text-gray-400 line-through">¥358.8</Text>
  </View>
  <Text className="text-xs text-gray-500">/年（相当于¥16.6/月）</Text>
</View>
```

### 功能权限提示样式

```tsx
// 功能限制提示
<View className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
  <AlertCircle size={16} color="#f59e0b" />
  <Text className="text-sm text-amber-700">商品数量已达上限（50/50），升级会员解锁无限商品</Text>
</View>

// 付费功能锁定
<View className="relative">
  <View className="opacity-50">{/* 功能内容 */}</View>
  <View className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
    <View className="text-center">
      <Lock size={24} color="#6b7280" className="mx-auto mb-1" />
      <Text className="text-xs text-gray-500">升级会员解锁</Text>
    </View>
  </View>
</View>
```

### 广告样式

```tsx
// 底部横幅广告
<View className="fixed bottom-16 left-0 right-0 bg-gray-100 border-t border-gray-200 p-3">
  <View className="flex items-center justify-between">
    <Text className="text-xs text-gray-500">升级会员，去除广告</Text>
    <Button size="sm" variant="outline">立即升级</Button>
  </View>
</View>
```

---

## 十二、开发优先级

### P0 - 核心功能（MVP）
1. 商品库（CRUD）
2. 快速报价（创建报价单）
3. 报价单预览
4. 客户管理（CRUD）

### P1 - 重要功能
5. 商家信息设置
6. 报价单列表
7. 分享报价单（图片）
8. **会员体系**（订阅、权限控制）

### P2 - 增强功能
9. 行业模板预设
10. 单位换算
11. 折扣管理
12. 导出 PDF
13. **支付集成**（微信支付）

### P3 - 优化功能
14. 数据统计
15. 客户标签
16. 报价单模板自定义
17. **高级模板**
18. **广告系统**
