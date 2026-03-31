import { pgTable, serial, timestamp, pgPolicy, varchar, numeric, text, jsonb, integer, boolean, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 为 gen_random_uuid 提供一个兼容函数（使用 Postgres 内置函数）
const gen_random_uuid = () => sql`gen_random_uuid()`



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const quoteItems = pgTable("quote_items", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	quoteId: varchar("quote_id", { length: 36 }).notNull(),
	productId: varchar("product_id", { length: 36 }),
	productName: varchar("product_name", { length: 200 }).notNull(),
	unit: varchar({ length: 20 }).notNull(),
	quantity: numeric({ precision: 10, scale:  2 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	discount: numeric({ precision: 5, scale:  2 }).default('0').notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	remark: text(),
}, (table) => [
	pgPolicy("quote_items_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("quote_items_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("quote_items_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("quote_items_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const customers = pgTable("customers", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }),
	address: text(),
	company: varchar({ length: 200 }),
	remark: text(),
	tags: jsonb().default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	pgPolicy("customers_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("customers_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("customers_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("customers_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const industries = pgTable("industries", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	icon: varchar({ length: 50 }),
	units: jsonb().default([]).notNull(),
	attributes: jsonb().default([]).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	pgPolicy("industries_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("industries_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("industries_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("industries_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const merchantInfo = pgTable("merchant_info", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	shopName: varchar("shop_name", { length: 200 }).notNull(),
	contactName: varchar("contact_name", { length: 100 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	address: text(),
	logo: varchar({ length: 500 }),
	stamp: varchar({ length: 500 }),
	quoteTemplate: text("quote_template"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	pgPolicy("merchant_info_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("merchant_info_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("merchant_info_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("merchant_info_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const products = pgTable("products", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	industryId: varchar("industry_id", { length: 36 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	code: varchar({ length: 100 }),
	unit: varchar({ length: 20 }).notNull(),
	specification: varchar({ length: 200 }),
	costPrice: numeric("cost_price", { precision: 10, scale:  2 }),
	retailPrice: numeric("retail_price", { precision: 10, scale:  2 }).notNull(),
	wholesalePrice: numeric("wholesale_price", { precision: 10, scale:  2 }),
	attributes: jsonb(),
	images: jsonb().default([]),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	pgPolicy("products_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("products_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("products_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("products_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const quotes = pgTable("quotes", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	quoteNo: varchar("quote_no", { length: 50 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	subtotal: numeric({ precision: 12, scale:  2 }).notNull(),
	discount: numeric({ precision: 5, scale:  2 }).default('0').notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	remark: text(),
	validDays: integer("valid_days").default(30).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("quotes_quote_no_unique").on(table.quoteNo),
	pgPolicy("quotes_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("quotes_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("quotes_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("quotes_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const membershipTiers = pgTable("membership_tiers", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	originalPrice: numeric("original_price", { precision: 10, scale:  2 }),
	durationDays: integer("duration_days"),
	description: text(),
	features: jsonb().default([]).notNull(),
	limits: jsonb().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	pgPolicy("membership_tiers_允许公开更新", { as: "permissive", for: "update", to: ["public"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("membership_tiers_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("membership_tiers_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const userSubscriptions = pgTable("user_subscriptions", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id", { length: 100 }).notNull(),
	tierId: varchar("tier_id", { length: 36 }).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	startAt: timestamp("start_at", { withTimezone: true, mode: 'string' }).notNull(),
	expireAt: timestamp("expire_at", { withTimezone: true, mode: 'string' }),
	autoRenew: boolean("auto_renew").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	pgPolicy("user_subscriptions_允许公开更新", { as: "permissive", for: "update", to: ["public"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("user_subscriptions_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("user_subscriptions_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const paymentRecords = pgTable("payment_records", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id", { length: 100 }).notNull(),
	subscriptionId: varchar("subscription_id", { length: 36 }),
	tierId: varchar("tier_id", { length: 36 }).notNull(),
	outTradeNo: varchar("out_trade_no", { length: 64 }).notNull(),
	transactionId: varchar("transaction_id", { length: 64 }),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	paymentMethod: varchar("payment_method", { length: 20 }).default('wechat').notNull(),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	refundedAt: timestamp("refunded_at", { withTimezone: true, mode: 'string' }),
	extra: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("payment_records_out_trade_no_unique").on(table.outTradeNo),
	pgPolicy("payment_records_允许公开更新", { as: "permissive", for: "update", to: ["public"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("payment_records_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("payment_records_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const quoteTemplates = pgTable("quote_templates", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	previewImage: varchar("preview_image", { length: 500 }),
	templateData: jsonb("template_data").notNull(),
	isPremium: boolean("is_premium").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	pgPolicy("quote_templates_允许公开更新", { as: "permissive", for: "update", to: ["public"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("quote_templates_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("quote_templates_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);
