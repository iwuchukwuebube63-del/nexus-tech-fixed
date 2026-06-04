import { Request, Response } from "express";
import { getDb } from "./db";
import { eq, and, lte } from "drizzle-orm";
import { users, userInvestments, userCloudMiners, transactions, type InsertTransaction } from "../drizzle/schema";

// Returns true if it is currently 12:00 AM Nigeria time (UTC+1), within a 1-hour window
function isCommissionTime(): boolean {
  const now = new Date();
  const nigeriaHour = (now.getUTCHours() + 1) % 24;
  return nigeriaHour === 0; // midnight to 1AM Nigeria time
}

// Process all daily commissions for active investments AND cloud miners
// Pays once per day at 12:00 AM Nigeria time (UTC+1)
export async function processDailyCommissions() {
  const db = await getDb();
  if (!db) return { processed: 0, errors: 0, skipped: "no_db" };

  // Only pay during the 12AM window (hour 0 Nigeria time)
  if (!isCommissionTime()) {
    return { processed: 0, errors: 0, skipped: "not_commission_time" };
  }

  const now = new Date();
  // Use Nigeria midnight as the reference point for "today"
  const todayNigeria = new Date(now);
  todayNigeria.setUTCHours(0 - 1, 0, 0, 0); // midnight Nigeria = 23:00 UTC prev day

  let processed = 0;
  let errors = 0;

  try {
    // ── Device rental commissions ──────────────────────────────────────────────
    const activeInvestments = await db.select().from(userInvestments)
      .where(and(eq(userInvestments.status, "active"), lte(userInvestments.startDate, now)));

    for (const inv of activeInvestments) {
      try {
        // Mark completed if past end date
        if (inv.endDate && inv.endDate < now) {
          await db.update(userInvestments).set({ status: "completed" }).where(eq(userInvestments.id, inv.id));
          continue;
        }

        // Skip if already paid today (last paid within the last 20 hours)
        if (inv.lastPaidAt) {
          const lastPaid = new Date(inv.lastPaidAt);
          const hoursSincePaid = (now.getTime() - lastPaid.getTime()) / (1000 * 60 * 60);
          if (hoursSincePaid < 20) continue;
        }

        const userRow = await db.select().from(users).where(eq(users.id, inv.userId)).limit(1).then(r => r[0]);
        if (!userRow) continue;

        const commission = parseFloat(inv.dailyCommission.toString());
        const newBalance = parseFloat(userRow.balance.toString()) + commission;
        const newEarnings = parseFloat(userRow.totalEarnings.toString()) + commission;

        await db.update(users).set({ balance: newBalance.toString(), totalEarnings: newEarnings.toString() }).where(eq(users.id, inv.userId));
        await db.update(userInvestments).set({ lastPaidAt: now }).where(eq(userInvestments.id, inv.id));
        await db.insert(transactions).values({
          userId: inv.userId,
          type: "commission",
          amount: commission.toString(),
          status: "completed",
          description: "Daily rental commission",
        } as InsertTransaction);

        processed++;
      } catch (e) {
        errors++;
      }
    }

    // ── Cloud miner commissions ────────────────────────────────────────────────
    const activeMiners = await db.select().from(userCloudMiners)
      .where(and(eq(userCloudMiners.status, "active"), lte(userCloudMiners.startDate, now)));

    for (const miner of activeMiners) {
      try {
        if (miner.endDate && miner.endDate < now) {
          await db.update(userCloudMiners).set({ status: "completed" }).where(eq(userCloudMiners.id, miner.id));
          continue;
        }

        // Skip if already paid today (last paid within the last 20 hours)
        if (miner.lastPaidAt) {
          const lastPaid = new Date(miner.lastPaidAt);
          const hoursSincePaid = (now.getTime() - lastPaid.getTime()) / (1000 * 60 * 60);
          if (hoursSincePaid < 20) continue;
        }

        const userRow = await db.select().from(users).where(eq(users.id, miner.userId)).limit(1).then(r => r[0]);
        if (!userRow) continue;

        const income = parseFloat(miner.dailyIncome.toString());
        const newBalance = parseFloat(userRow.balance.toString()) + income;
        const newEarnings = parseFloat(userRow.totalEarnings.toString()) + income;

        await db.update(users).set({ balance: newBalance.toString(), totalEarnings: newEarnings.toString() }).where(eq(users.id, miner.userId));
        await db.update(userCloudMiners).set({ lastPaidAt: now }).where(eq(userCloudMiners.id, miner.id));
        await db.insert(transactions).values({
          userId: miner.userId,
          type: "commission",
          amount: income.toString(),
          status: "completed",
          description: "Daily cloud miner income",
        } as InsertTransaction);

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
