import { Request, Response } from "express";
import { getDb } from "./db";
import { eq, and, lte, lt } from "drizzle-orm";
import { users, userInvestments, userCloudMiners, transactions, type InsertTransaction } from "../drizzle/schema";

// Process all daily commissions for active investments AND cloud miners
// Also called on every server request to catch up if cron missed
export async function processDailyCommissions() {
  const db = await getDb();
  if (!db) return { processed: 0, errors: 0 };

  const now = new Date();
  let processed = 0;
  let errors = 0;

  try {
    // ── Device rental commissions ──────────────────────────────────────
    const activeInvestments = await db.select().from(userInvestments)
      .where(and(eq(userInvestments.status, "active"), lte(userInvestments.startDate, now)));

    for (const inv of activeInvestments) {
      try {
        // Mark completed if past end date
        if (inv.endDate && inv.endDate < now) {
          await db.update(userInvestments).set({ status: "completed" }).where(eq(userInvestments.id, inv.id));
          continue;
        }

        // Only pay once per day - use UTC midnight to prevent device time manipulation
        const lastPaid = inv.lastPaidAt ? new Date(inv.lastPaidAt) : null;
        const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        if (lastPaid && lastPaid.getTime() >= utcMidnight.getTime()) continue;

        const userRow = await db.select().from(users).where(eq(users.id, inv.userId)).limit(1).then(r => r[0]);
        if (!userRow) continue;

        const commission = parseFloat(inv.dailyCommission.toString());
        const newBalance = parseFloat(userRow.balance.toString()) + commission;
        const newEarnings = parseFloat(userRow.totalEarnings.toString()) + commission;

        await db.update(users).set({ balance: newBalance.toString(), totalEarnings: newEarnings.toString() }).where(eq(users.id, inv.userId));
        await db.update(userInvestments).set({ lastPaidAt: now }).where(eq(userInvestments.id, inv.id));
        await db.insert(transactions).values({ userId: inv.userId, type: "commission", amount: commission.toString(), status: "completed", description: "Daily rental commission" } as InsertTransaction);

        processed++;
      } catch (e) {
        errors++;
      }
    }

    // ── Cloud miner commissions ────────────────────────────────────────
    const activeMiners = await db.select().from(userCloudMiners)
      .where(and(eq(userCloudMiners.status, "active"), lte(userCloudMiners.startDate, now)));

    for (const miner of activeMiners) {
      try {
        if (miner.endDate && miner.endDate < now) {
          await db.update(userCloudMiners).set({ status: "completed" }).where(eq(userCloudMiners.id, miner.id));
          continue;
        }

        const lastPaid = miner.lastPaidAt ? new Date(miner.lastPaidAt) : null;
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        if (lastPaid && lastPaid >= startOfToday) continue;

        const userRow = await db.select().from(users).where(eq(users.id, miner.userId)).limit(1).then(r => r[0]);
        if (!userRow) continue;

        const income = parseFloat(miner.dailyIncome.toString());
        const newBalance = parseFloat(userRow.balance.toString()) + income;
        const newEarnings = parseFloat(userRow.totalEarnings.toString()) + income;

        await db.update(users).set({ balance: newBalance.toString(), totalEarnings: newEarnings.toString() }).where(eq(users.id, miner.userId));
        await db.update(userCloudMiners).set({ lastPaidAt: now }).where(eq(userCloudMiners.id, miner.id));
        await db.insert(transactions).values({ userId: miner.userId, type: "commission", amount: income.toString(), status: "completed", description: "Daily cloud miner income" } as InsertTransaction);

        processed++;
      } catch (e) {
        errors++;
      }
    }
  } catch (e) {
    console.error("[Commissions] Fatal error:", e);
  }

  return { processed, errors };
}

// HTTP handler for cron webhook
export async function handleDailyCommission(req: Request, res: Response) {
  try {
    const result = await processDailyCommissions();
    res.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Daily commission error:", error);
    res.status(500).json({ error: error.message });
  }
}
