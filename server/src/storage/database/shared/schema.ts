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

// Type exports
export type Industry = typeof industries.$inferSelect
export type Product = typeof products.$inferSelect
export type Customer = typeof customers.$inferSelect
export type Quote = typeof quotes.$inferSelect
export type QuoteItem = typeof quoteItems.$inferSelect
export type MerchantInfo = typeof merchantInfo.$inferSelect
