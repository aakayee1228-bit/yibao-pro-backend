import { sql } from 'drizzle-orm'
import {
  pgTable,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
  index,
  boolean,
} from 'drizzle-orm/pg-core'
import { createSchemaFactory } from 'drizzle-zod'
import { z } from 'zod'

// 系统表（禁止删除）
export const healthCheck = pgTable('health_check', {
  id: integer().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

// 行业模板
export const industries = pgTable(
  'industries',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 100 }).notNull(),
    icon: varchar('icon', { length: 50 }),
    units: jsonb('units').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    attributes: jsonb('attributes').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    sort_order: integer('sort_order').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [index('industries_sort_order_idx').on(table.sort_order)]
)

// 商品
export const products = pgTable(
  'products',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    industry_id: varchar('industry_id', { length: 36 }).notNull().references(() => industries.id),
    name: varchar('name', { length: 200 }).notNull(),
    code: varchar('code', { length: 100 }),
    unit: varchar('unit', { length: 20 }).notNull(),
    specification: varchar('specification', { length: 200 }),
    cost_price: numeric('cost_price', { precision: 10, scale: 2 }),
    retail_price: numeric('retail_price', { precision: 10, scale: 2 }).notNull(),
    wholesale_price: numeric('wholesale_price', { precision: 10, scale: 2 }),
    attributes: jsonb('attributes').$type<Record<string, string>>(),
    images: jsonb('images').$type<string[]>().default(sql`'[]'::jsonb`),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('products_industry_id_idx').on(table.industry_id),
    index('products_name_idx').on(table.name),
    index('products_code_idx').on(table.code),
    index('products_is_active_idx').on(table.is_active),
    index('products_created_at_idx').on(table.created_at),
  ]
)

// 客户
export const customers = pgTable(
  'customers',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    address: text('address'),
    company: varchar('company', { length: 200 }),
    remark: text('remark'),
    tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('customers_name_idx').on(table.name),
    index('customers_phone_idx').on(table.phone),
    index('customers_created_at_idx').on(table.created_at),
  ]
)

// 报价单
export const quotes = pgTable(
  'quotes',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    quote_no: varchar('quote_no', { length: 50 }).notNull().unique(),
    customer_id: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    discount: numeric('discount', { precision: 5, scale: 2 }).notNull().default('0'),
    total_amount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    remark: text('remark'),
    valid_days: integer('valid_days').notNull().default(30),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('quotes_customer_id_idx').on(table.customer_id),
    index('quotes_status_idx').on(table.status),
    index('quotes_created_at_idx').on(table.created_at),
    index('quotes_quote_no_idx').on(table.quote_no),
  ]
)

// 报价明细
export const quoteItems = pgTable(
  'quote_items',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    quote_id: varchar('quote_id', { length: 36 }).notNull().references(() => quotes.id, { onDelete: 'cascade' }),
    product_id: varchar('product_id', { length: 36 }).references(() => products.id),
    product_name: varchar('product_name', { length: 200 }).notNull(),
    unit: varchar('unit', { length: 20 }).notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
    unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    discount: numeric('discount', { precision: 5, scale: 2 }).notNull().default('0'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    remark: text('remark'),
  },
  (table) => [
    index('quote_items_quote_id_idx').on(table.quote_id),
    index('quote_items_product_id_idx').on(table.product_id),
  ]
)

// 商家信息
export const merchantInfo = pgTable(
  'merchant_info',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    shop_name: varchar('shop_name', { length: 200 }).notNull(),
    contact_name: varchar('contact_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    address: text('address'),
    logo: varchar('logo', { length: 500 }),
    stamp: varchar('stamp', { length: 500 }),
    quote_template: text('quote_template'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }),
  }
)

// ==================== 会员订阅系统 ====================

// 会员等级
export const membershipTiers = pgTable(
  'membership_tiers',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 50 }).notNull(), // 'free', 'monthly', 'yearly'
    display_name: varchar('display_name', { length: 100 }).notNull(), // '免费版', '月度会员', '年度会员'
    price: numeric('price', { precision: 10, scale: 2 }).notNull(), // 价格（0表示免费）
    original_price: numeric('original_price', { precision: 10, scale: 2 }), // 原价（用于显示折扣）
    duration_days: integer('duration_days'), // 订阅天数（null表示永久）
    description: text('description'), // 描述
    features: jsonb('features').$type<string[]>().notNull().default(sql`'[]'::jsonb`), // 功能列表
    limits: jsonb('limits').$type<{
      max_products: number // 最大商品数（-1表示无限）
      max_customers: number // 最大客户数（-1表示无限）
      max_quotes: number // 最大报价单数（-1表示无限）
      max_templates: number // 最大模板数（-1表示无限）
      has_advanced_templates: boolean // 高级模板
      has_ad: boolean // 是否有广告
      has_export_pdf: boolean // 导出PDF
      has_data_statistics: boolean // 数据统计
    }>().notNull(),
    is_active: boolean('is_active').notNull().default(true),
    sort_order: integer('sort_order').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [index('membership_tiers_sort_order_idx').on(table.sort_order)]
)

// 用户订阅
export const userSubscriptions = pgTable(
  'user_subscriptions',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar('user_id', { length: 100 }).notNull(), // 微信 openid
    tier_id: varchar('tier_id', { length: 36 }).notNull().references(() => membershipTiers.id),
    status: varchar('status', { length: 20 }).notNull().default('active'), // 'active', 'expired', 'cancelled'
    start_at: timestamp('start_at', { withTimezone: true }).notNull(),
    expire_at: timestamp('expire_at', { withTimezone: true }), // 过期时间（null表示永久）
    auto_renew: boolean('auto_renew').notNull().default(false), // 自动续费
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('user_subscriptions_user_id_idx').on(table.user_id),
    index('user_subscriptions_status_idx').on(table.status),
    index('user_subscriptions_expire_at_idx').on(table.expire_at),
  ]
)

// 支付记录
export const paymentRecords = pgTable(
  'payment_records',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar('user_id', { length: 100 }).notNull(),
    subscription_id: varchar('subscription_id', { length: 36 }).references(() => userSubscriptions.id),
    tier_id: varchar('tier_id', { length: 36 }).notNull().references(() => membershipTiers.id),
    out_trade_no: varchar('out_trade_no', { length: 64 }).notNull().unique(), // 商户订单号
    transaction_id: varchar('transaction_id', { length: 64 }), // 微信支付订单号
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // 支付金额
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'success', 'failed', 'refunded'
    payment_method: varchar('payment_method', { length: 20 }).notNull().default('wechat'), // 支付方式
    paid_at: timestamp('paid_at', { withTimezone: true }), // 支付时间
    refunded_at: timestamp('refunded_at', { withTimezone: true }), // 退款时间
    extra: jsonb('extra').$type<Record<string, unknown>>(), // 额外信息
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('payment_records_user_id_idx').on(table.user_id),
    index('payment_records_status_idx').on(table.status),
    index('payment_records_out_trade_no_idx').on(table.out_trade_no),
    index('payment_records_transaction_id_idx').on(table.transaction_id),
  ]
)

// 报价单模板（高级模板）
export const quoteTemplates = pgTable(
  'quote_templates',
  {
    id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 100 }).notNull(),
    preview_image: varchar('preview_image', { length: 500 }), // 预览图
    template_data: jsonb('template_data').$type<{
      header_style: Record<string, unknown>
      body_style: Record<string, unknown>
      footer_style: Record<string, unknown>
      colors: Record<string, string>
      fonts: Record<string, string>
    }>().notNull(),
    is_premium: boolean('is_premium').notNull().default(false), // 是否付费模板
    is_active: boolean('is_active').notNull().default(true),
    sort_order: integer('sort_order').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('quote_templates_is_premium_idx').on(table.is_premium),
    index('quote_templates_sort_order_idx').on(table.sort_order),
  ]
)

// Zod schemas for validation
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({ coerce: { date: true } })

export const insertIndustrySchema = createCoercedInsertSchema(industries).pick({
  name: true,
  icon: true,
  units: true,
  attributes: true,
  sort_order: true,
})

export const insertProductSchema = createCoercedInsertSchema(products).pick({
  industry_id: true,
  name: true,
  code: true,
  unit: true,
  specification: true,
  cost_price: true,
  retail_price: true,
  wholesale_price: true,
  attributes: true,
  images: true,
})

export const insertCustomerSchema = createCoercedInsertSchema(customers).pick({
  name: true,
  phone: true,
  address: true,
  company: true,
  remark: true,
  tags: true,
})

export const insertQuoteSchema = createCoercedInsertSchema(quotes).pick({
  customer_id: true,
  status: true,
  subtotal: true,
  discount: true,
  total_amount: true,
  remark: true,
  valid_days: true,
})

export const insertQuoteItemSchema = createCoercedInsertSchema(quoteItems).pick({
  quote_id: true,
  product_id: true,
  product_name: true,
  unit: true,
  quantity: true,
  unit_price: true,
  discount: true,
  amount: true,
  remark: true,
})

export const insertMerchantInfoSchema = createCoercedInsertSchema(merchantInfo).pick({
  shop_name: true,
  contact_name: true,
  phone: true,
  address: true,
  logo: true,
  stamp: true,
  quote_template: true,
})

export const insertMembershipTierSchema = createCoercedInsertSchema(membershipTiers).pick({
  name: true,
  display_name: true,
  price: true,
  original_price: true,
  duration_days: true,
  description: true,
  features: true,
  limits: true,
  sort_order: true,
})

export const insertUserSubscriptionSchema = createCoercedInsertSchema(userSubscriptions).pick({
  user_id: true,
  tier_id: true,
  status: true,
  start_at: true,
  expire_at: true,
  auto_renew: true,
})

export const insertPaymentRecordSchema = createCoercedInsertSchema(paymentRecords).pick({
  user_id: true,
  subscription_id: true,
  tier_id: true,
  out_trade_no: true,
  transaction_id: true,
  amount: true,
  status: true,
  payment_method: true,
  paid_at: true,
  refunded_at: true,
  extra: true,
})

export const insertQuoteTemplateSchema = createCoercedInsertSchema(quoteTemplates).pick({
  name: true,
  preview_image: true,
  template_data: true,
  is_premium: true,
  sort_order: true,
})

// Type exports
export type Industry = typeof industries.$inferSelect
export type Product = typeof products.$inferSelect
export type Customer = typeof customers.$inferSelect
export type Quote = typeof quotes.$inferSelect
export type QuoteItem = typeof quoteItems.$inferSelect
export type MerchantInfo = typeof merchantInfo.$inferSelect
export type MembershipTier = typeof membershipTiers.$inferSelect
export type UserSubscription = typeof userSubscriptions.$inferSelect
export type PaymentRecord = typeof paymentRecords.$inferSelect
export type QuoteTemplate = typeof quoteTemplates.$inferSelect
