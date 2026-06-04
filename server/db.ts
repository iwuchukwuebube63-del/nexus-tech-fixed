import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import { eq } from "drizzle-orm";
import {
  InsertUser, users, investmentPlans, userInvestments,
  transactions, referralEarnings, cloudMiners, userCloudMiners
} from "../drizzle/schema";
import { nanoid } from "nanoid";

const DB_PATH = path.resolve(process.cwd(), "data.db");
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (_db) return _db;
  try {
    const sqlite = new Database(DB_PATH);
    _db = drizzle(sqlite);
    return _db;
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    return null;
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const existing = user.openId
      ? await db.select().from(users).where(eq(users.openId, user.openId)).limit(1)
      : [];

    if (existing.length > 0) {
      const updates: Partial<InsertUser> = {};
      if (user.name !== undefined)       updates.name = user.name;
      if (user.email !== undefined)      updates.email = user.email;
      if (user.loginMethod !== undefined) updates.loginMethod = user.loginMethod;
      if (user.lastSignedIn !== undefined) updates.lastSignedIn = user.lastSignedIn;
      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.openId, user.openId!));
      }
    } else {
      const userId = `USR${nanoid(8).toUpperCase()}`;
      const referralCode = `REF${nanoid(6).toUpperCase()}`;
      await db.insert(users).values({
        openId: user.openId!,
        name: user.name || "",
        email: user.email || "",
        loginMethod: user.loginMethod || "oauth",
        userId,
        referralCode,
        balance: "0",
        totalEarnings: "0",
        lastSignedIn: new Date(),
      });
    }
  } catch (error) {
    console.error("[Database] upsertUser failed:", error);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0] || null;
  } catch {
    return null;
  }
}

export async function getUserByPhoneNumber(phoneNumber: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
    return result[0] || null;
  } catch {
    return null;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  } catch {
    return null;
  }
}

// ─── Investment Plans ─────────────────────────────────────────────────────────

export async function getInvestmentPlans() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(investmentPlans).where(eq(investmentPlans.isActive, true));
  } catch {
    return [];
  }
}

// ─── User Investments ─────────────────────────────────────────────────────────

export async function getUserActiveInvestments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(userInvestments).where(eq(userInvestments.userId, userId));
  } catch {
    return [];
  }
}

export async function createUserInvestment(investment: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userInvestments).values(investment);
  return result;
}

export async function updateInvestmentStatus(investmentId: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(userInvestments).set({ status: status as any }).where(eq(userInvestments.id, investmentId));
}

// ─── Rental Limits ────────────────────────────────────────────────────────────

export function getRentalLimit(planLevel: number): number {
  if (planLevel === 1) return 2;
  if (planLevel === 2) return 3;
  return 10;
}

export async function getUserRentalCountForPlan(userId: number, planId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select().from(userInvestments).where(eq(userInvestments.userId, userId));
    return result.filter((inv) => inv.planId === planId).length;
  } catch {
    return 0;
  }
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactionHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .limit(limit);
    return result.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  } catch {
    return [];
  }
}

export async function createTransaction(transaction: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(transaction);
  return result;
}

// ─── Balances ─────────────────────────────────────────────────────────────────

export async function updateUserBalance(userId: number, newBalance: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ balance: newBalance }).where(eq(users.id, userId));
}

export async function updateUserEarnings(userId: number, newEarnings: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ totalEarnings: newEarnings }).where(eq(users.id, userId));
}

// ─── Referral Earnings ────────────────────────────────────────────────────────

export async function getReferralEarnings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(referralEarnings).where(eq(referralEarnings.userId, userId));
  } catch {
    return [];
  }
}

// ─── Cloud Miners ─────────────────────────────────────────────────────────────

export async function getCloudMiners() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(cloudMiners).orderBy(cloudMiners.sortOrder);
  } catch {
    return [];
  }
}

export async function getUserCloudMinerCount(userId: number, minerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select().from(userCloudMiners).where(eq(userCloudMiners.userId, userId));
    return result.filter((m) => m.minerId === minerId).length;
  } catch {
    return 0;
  }
}

export async function createUserCloudMiner(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(userCloudMiners).values(data);
}

export async function getUserActiveCloudMiners(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(userCloudMiners).where(eq(userCloudMiners.userId, userId));
  } catch {
    return [];
  }
}

export async function toggleCloudMinerLock(minerId: number, isUnlocked: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cloudMiners).set({ isUnlocked }).where(eq(cloudMiners.id, minerId));
}

// ─── Site Settings ────────────────────────────────────────────────────────────

import { siteSettings } from "../drizzle/schema";

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return rows[0]?.value ?? null;
  } catch { return null; }
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value });
    }
  } catch (e) { console.error("setSetting error:", e); }
}

export async function togglePlanLock(planId: number, isUnlocked: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(investmentPlans).set({ isUnlocked }).where(eq(investmentPlans.id, planId));
}
