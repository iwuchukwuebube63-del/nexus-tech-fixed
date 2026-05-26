import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id:                  integer("id").primaryKey({ autoIncrement: true }),
  openId:              text("open_id").notNull().unique(),
  userId:              text("user_id"),
  username:            text("username").unique(),
  name:                text("name"),
  email:               text("email"),
  phoneNumber:         text("phone_number"),
  passwordHash:        text("password_hash"),
  loginMethod:         text("login_method"),
  referralCode:        text("referral_code"),
  referredBy:          text("referred_by"),
  role:                text("role", { enum: ["user", "admin"] }).default("user"),
  balance:             text("balance").default("0"),
  totalEarnings:       text("total_earnings").default("0"),
  welcomeBonusApplied: integer("welcome_bonus_applied", { mode: "timestamp" }),
  isBanned:            integer("is_banned", { mode: "boolean" }).default(false),
  boundBankName:       text("bound_bank_name"),
  boundAccountNumber:  text("bound_account_number"),
  boundAccountName:    text("bound_account_name"),
  boundCardAt:         integer("bound_card_at", { mode: "timestamp" }),
  lastSignedIn:        integer("last_signed_in", { mode: "timestamp" }),
  createdAt:           integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Investment Plans ─────────────────────────────────────────────────────────

export const investmentPlans = sqliteTable("investment_plans", {
  id:               integer("id").primaryKey({ autoIncrement: true }),
  planLevel:        integer("plan_level").notNull(),
  deviceName:       text("device_name").notNull(),
  deviceImageUrl:   text("device_image_url"),
  investmentAmount: text("investment_amount").notNull(),
  dailyCommission:  text("daily_commission").notNull(),
  durationDays:     integer("duration_days").notNull(),
  isActive:         integer("is_active", { mode: "boolean" }).default(true),
  createdAt:        integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type InvestmentPlan = typeof investmentPlans.$inferSelect;
export type InsertInvestmentPlan = typeof investmentPlans.$inferInsert;

// ─── User Investments ─────────────────────────────────────────────────────────

export const userInvestments = sqliteTable("user_investments", {
  id:               integer("id").primaryKey({ autoIncrement: true }),
  userId:           integer("user_id").notNull().references(() => users.id),
  planId:           integer("plan_id").notNull().references(() => investmentPlans.id),
  investmentAmount: text("investment_amount").notNull(),
  dailyCommission:  text("daily_commission").notNull(),
  status:           text("status", { enum: ["active", "completed", "cancelled"] }).default("active"),
  startDate:        integer("start_date", { mode: "timestamp" }),
  endDate:          integer("end_date", { mode: "timestamp" }),
  lastPaidAt:       integer("last_paid_at", { mode: "timestamp" }),
  createdAt:        integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type UserInvestment = typeof userInvestments.$inferSelect;
export type InsertUserInvestment = typeof userInvestments.$inferInsert;

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = sqliteTable("transactions", {
  id:            integer("id").primaryKey({ autoIncrement: true }),
  userId:        integer("user_id").notNull().references(() => users.id),
  type:          text("type", { enum: ["deposit", "withdrawal", "investment", "commission", "referral", "bonus"] }).notNull(),
  amount:        text("amount").notNull(),
  grossAmount:   text("gross_amount"),
  fee:           text("fee"),
  status:        text("status", { enum: ["pending", "completed", "failed", "cancelled"] }).default("pending"),
  description:   text("description"),
  receiptUrl:    text("receipt_url"),
  bankName:      text("bank_name"),
  accountNumber: text("account_number"),
  accountName:   text("account_name"),
  createdAt:     integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ─── Referral Earnings ────────────────────────────────────────────────────────

export const referralEarnings = sqliteTable("referral_earnings", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  userId:       integer("user_id").notNull().references(() => users.id),
  referredId:   integer("referred_id").references(() => users.id),
  amount:       text("amount").notNull(),
  description:  text("description"),
  createdAt:    integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type ReferralEarning = typeof referralEarnings.$inferSelect;
export type InsertReferralEarning = typeof referralEarnings.$inferInsert;

// ─── Cloud Miners ─────────────────────────────────────────────────────────────

export const cloudMiners = sqliteTable("cloud_miners", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  name:         text("name").notNull(),
  imageUrl:     text("image_url"),
  price:        text("price").notNull(),
  dailyIncome:  text("daily_income").notNull(),
  duration:     integer("duration").notNull(),
  totalIncome:  text("total_income").notNull(),
  quota:        integer("quota").notNull().default(1),
  isUnlocked:   integer("is_unlocked", { mode: "boolean" }).default(false),
  sortOrder:    integer("sort_order").default(0),
  createdAt:    integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type CloudMiner = typeof cloudMiners.$inferSelect;
export type InsertCloudMiner = typeof cloudMiners.$inferInsert;

// ─── User Cloud Miner Purchases ───────────────────────────────────────────────

export const userCloudMiners = sqliteTable("user_cloud_miners", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  userId:      integer("user_id").notNull().references(() => users.id),
  minerId:     integer("miner_id").notNull().references(() => cloudMiners.id),
  price:       text("price").notNull(),
  dailyIncome: text("daily_income").notNull(),
  status:      text("status", { enum: ["active", "completed", "cancelled"] }).default("active"),
  startDate:   integer("start_date", { mode: "timestamp" }),
  endDate:     integer("end_date", { mode: "timestamp" }),
  lastPaidAt:  integer("last_paid_at", { mode: "timestamp" }),
  createdAt:   integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type UserCloudMiner = typeof userCloudMiners.$inferSelect;
export type InsertUserCloudMiner = typeof userCloudMiners.$inferInsert;

// ─── Gift Codes ───────────────────────────────────────────────────────────────

export const giftCodes = sqliteTable("gift_codes", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  code:        text("code").notNull().unique(),
  amount:      text("amount").notNull(),
  maxUses:     integer("max_uses").default(1),
  usedCount:   integer("used_count").default(0),
  expiresAt:   integer("expires_at", { mode: "timestamp" }),
  isUsed:      integer("is_used", { mode: "boolean" }).default(false),
  usedBy:      integer("used_by").references(() => users.id),
  usedAt:      integer("used_at", { mode: "timestamp" }),
  createdBy:   integer("created_by").references(() => users.id),
  createdAt:   integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type GiftCode = typeof giftCodes.$inferSelect;
export type InsertGiftCode = typeof giftCodes.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = sqliteTable("notifications", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  title:       text("title").notNull(),
  message:     text("message").notNull(),
  imageUrl:    text("image_url"),
  type:        text("type").default("broadcast"),
  isActive:    integer("is_active", { mode: "boolean" }).default(true),
  createdBy:   integer("created_by").references(() => users.id),
  createdAt:   integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── User Notification Reads ──────────────────────────────────────────────────

export const userNotificationReads = sqliteTable("user_notification_reads", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  userId:         integer("user_id").notNull().references(() => users.id),
  notificationId: integer("notification_id").notNull().references(() => notifications.id),
  readAt:         integer("read_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});
