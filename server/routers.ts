import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserByPhoneNumber, getUserById, getInvestmentPlans,
  getUserActiveInvestments, getTransactionHistory, createUserInvestment,
  createTransaction, getDb, upsertUser, updateUserBalance,
  getRentalLimit, getUserRentalCountForPlan, getCloudMiners,
  getUserCloudMinerCount, createUserCloudMiner, getUserActiveCloudMiners,
  toggleCloudMinerLock, getSetting, setSetting, togglePlanLock,
} from "./db";
import { z } from "zod";
import { hashPassword, verifyPassword, generateUserId, generateReferralCode } from "./auth";
import { eq, and } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { users, transactions as transactionsTable, giftCodes, notifications, userNotificationReads, siteSettings } from "../drizzle/schema";

async function notifyTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
    });
  } catch {}
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    signupWithPhoneAndPassword: publicProcedure
      .input(z.object({ phoneNumber: z.string().min(10), password: z.string().min(6), referralCode: z.string().optional(), username: z.string().min(3).max(20).optional() }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByPhoneNumber(input.phoneNumber);
        if (existing) throw new Error("Phone number already registered");

        const userId = generateUserId();
        const referralCode = generateReferralCode();
        const passwordHash = hashPassword(input.password);

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Find referrer
        let referredBy: string | null = null;
        if (input.referralCode) {
          const ref = await db.select().from(users).where(eq(users.referralCode, input.referralCode)).limit(1);
          if (ref[0]) referredBy = ref[0].referralCode;
        }

        await db.insert(users).values({
          openId: `phone_${input.phoneNumber}`,
          phoneNumber: input.phoneNumber,
          passwordHash,
          userId,
          username: input.username || null,
          referralCode,
          referredBy: referredBy ?? undefined,
          loginMethod: "phone",
          balance: "500",
          totalEarnings: "0",
          welcomeBonusApplied: new Date(),
        });

        const newUser = await getUserByPhoneNumber(input.phoneNumber);
        if (newUser) {
          const sessionToken = await sdk.createSessionToken(newUser.openId, { name: newUser.name || "user" });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        }

        return { success: true, userId, message: "Account created successfully" };
      }),

    loginWithPhoneAndPassword: publicProcedure
      .input(z.object({ phoneNumber: z.string().min(10), password: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByPhoneNumber(input.phoneNumber);
        if (!user || !user.passwordHash) throw new Error("Invalid phone number or password");

        const isValid = verifyPassword(input.password, user.passwordHash);
        if (!isValid) throw new Error("Invalid phone number or password");
        if (user.isBanned) throw new Error("Your account has been suspended. Please contact support.");

        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "user" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });

        return { success: true, userId: user.userId, message: "Logged in successfully" };
      }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user || !user.passwordHash) throw new Error("User not found");
        const isValid = verifyPassword(input.currentPassword, user.passwordHash);
        if (!isValid) throw new Error("Current password is incorrect");
        const newHash = hashPassword(input.newPassword);
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),

  investments: router({
    getPlans: publicProcedure.query(async () => getInvestmentPlans()),

    getUserInvestments: protectedProcedure.query(async ({ ctx }) => getUserActiveInvestments(ctx.user.id)),

    rentPlan: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const plans = await getInvestmentPlans();
        const plan = plans.find(p => p.id === input.planId);
        if (!plan) throw new Error("Plan not found");

        const rentalCount = await getUserRentalCountForPlan(ctx.user.id, plan.id);
        const rentalLimit = getRentalLimit(plan.planLevel);
        if (rentalCount >= rentalLimit) throw new Error(`Maximum rental limit (${rentalLimit}) reached for this device`);

        const user = await getUserById(ctx.user.id);
        if (!user || parseFloat(user.balance.toString()) < parseFloat(plan.investmentAmount.toString())) {
          throw new Error("Insufficient balance. Please deposit funds first.");
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.durationDays);

        await createUserInvestment({ userId: ctx.user.id, planId: plan.id, investmentAmount: plan.investmentAmount, dailyCommission: plan.dailyCommission, startDate, endDate, status: "active" });

        const db = await getDb();
        if (db) {
          const newBalance = parseFloat(user.balance.toString()) - parseFloat(plan.investmentAmount.toString());
          await db.update(users).set({ balance: newBalance.toString() }).where(eq(users.id, ctx.user.id));
        }

        await createTransaction({ userId: ctx.user.id, type: "investment", amount: plan.investmentAmount, status: "completed", description: `Invested in ${plan.deviceName}` });

        // Pay referral commissions - 15% L1, 10% L2, 5% L3
        const db2 = await getDb();
        if (db2) {
          const investAmount = parseFloat(plan.investmentAmount.toString());
          const rates = [0.15, 0.03, 0.02]; // 15% L1, 3% L2, 2% L3
          let currentUser = await getUserById(ctx.user.id);
          for (let level = 0; level < 3; level++) {
            if (!currentUser?.referredBy) break;
            const referrer = await db2.select().from(users).where(eq(users.referralCode, currentUser.referredBy)).limit(1).then(r => r[0]);
            if (!referrer) break;
            const commission = investAmount * rates[level];
            const newBal = parseFloat(referrer.balance.toString()) + commission;
            const newEarnings = parseFloat(referrer.totalEarnings.toString()) + commission;
            await db2.update(users).set({ balance: newBal.toString(), totalEarnings: newEarnings.toString() }).where(eq(users.id, referrer.id));
            await createTransaction({ userId: referrer.id, type: "referral", amount: commission.toString(), status: "completed", description: `Level ${level + 1} referral commission from investment` });
            currentUser = referrer;
          }
        }

        return { success: true };
      }),
  }),

  wallet: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      return { balance: user?.balance || "0", totalEarnings: user?.totalEarnings || "0", userId: user?.userId };
    }),

    getTransactionHistory: protectedProcedure.query(async ({ ctx }) => getTransactionHistory(ctx.user.id)),

    deposit: protectedProcedure
      .input(z.object({ amount: z.number().min(0).max(10000000), receiptBase64: z.string().optional(), paystackRef: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // ── Paystack auto-verification path ──────────────────────────────────
        if (input.paystackRef) {
          const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(input.paystackRef)}`, {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || ""}` },
          });
          const verifyData = await verifyRes.json();

          if (!verifyData.status || verifyData.data?.status !== "success") {
            throw new Error("Payment verification failed. Please contact support if money was deducted.");
          }

          const paidAmountKobo = verifyData.data.amount as number;
          const paidAmountNaira = paidAmountKobo / 100;

          // Check for duplicate — don't credit same reference twice
          const existingTx = await db.select().from(transactionsTable)
            .where(eq(transactionsTable.description, `Paystack:${input.paystackRef}`)).limit(1);
          if (existingTx.length > 0) {
            throw new Error("This payment has already been credited.");
          }

          const currentBalance = parseFloat(user.balance.toString());
          await updateUserBalance(ctx.user.id, (currentBalance + paidAmountNaira).toString());

          await db.insert(transactionsTable).values({
            userId: ctx.user.id,
            type: "deposit",
            amount: paidAmountNaira.toString(),
            grossAmount: paidAmountNaira.toString(),
            status: "completed",
            description: `Paystack:${input.paystackRef}`,
          });

          await notifyTelegram(
            `✅ *PAYSTACK DEPOSIT*\n\nUser: ${user.phoneNumber}\nAmount: ₦${paidAmountNaira.toLocaleString()}\nRef: ${input.paystackRef}`
          );

          return { success: true };
        }

        // ── Manual deposit path ───────────────────────────────────────────────
        if (input.amount < 3000) throw new Error("Minimum deposit is ₦3,000");

        await db.insert(transactionsTable).values({
          userId: ctx.user.id,
          type: "deposit",
          amount: input.amount.toString(),
          grossAmount: input.amount.toString(),
          status: "pending",
          description: `Deposit of ₦${input.amount.toLocaleString()}`,
          receiptUrl: input.receiptBase64 || null,
        });

        await notifyTelegram(
          `📥 *DEPOSIT REQUEST*\n\nUser: ${user.phoneNumber}\nAmount: ₦${input.amount.toLocaleString()}\nStatus: Pending\n${input.receiptBase64 ? "✅ Receipt uploaded" : "⚠️ No receipt"}`
        );

        return { success: true };
      }),

    withdraw: protectedProcedure
      .input(z.object({ amount: z.number().min(1500) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");
        if (user.isBanned) throw new Error("Your account has been suspended. Contact support.");

        // Check withdrawal hours (08:00 - 20:00 server UTC+1 Nigeria time)
        const now = new Date();
        const nigeriaHour = (now.getUTCHours() + 1) % 24; // UTC+1
        if (nigeriaHour < 8 || nigeriaHour >= 20) {
          throw new Error("Withdrawals are only available between 8:00 AM and 8:00 PM. Please try again during operating hours.");
        }

        // Must have a bound card
        if (!user.boundAccountNumber || !user.boundBankName) {
          throw new Error("NO_CARD_BOUND");
        }

        // Must have at least one investment ever
        const db3 = await getDb();
        if (db3) {
          const { userInvestments: ui } = await import("../drizzle/schema");
          const anyInvestment = await db3.select().from(ui).where(eq(ui.userId, ctx.user.id)).limit(1);
          if (anyInvestment.length === 0) {
            throw new Error("You must invest in at least one plan before you can withdraw.");
          }
        }

        const balance = parseFloat(user.balance.toString());
        if (balance < input.amount) throw new Error("Insufficient balance");

        const fee = input.amount * 0.14;
        const netAmount = input.amount - fee;

        await updateUserBalance(ctx.user.id, (balance - input.amount).toString());

        await createTransaction({
          userId: ctx.user.id,
          type: "withdrawal",
          amount: netAmount.toString(),
          grossAmount: input.amount.toString(),
          fee: fee.toString(),
          status: "pending",
          description: `Withdrawal ₦${input.amount.toLocaleString()} → ${user.boundBankName} ${user.boundAccountNumber} (${user.boundAccountName})`,
          bankName: user.boundBankName,
          accountNumber: user.boundAccountNumber,
          accountName: user.boundAccountName,
        });

        await notifyTelegram(
          `💸 *WITHDRAWAL REQUEST*

User: ${user.phoneNumber}
Amount: ₦${input.amount.toLocaleString()}
Fee: ₦${fee.toLocaleString()}
Net to pay: ₦${netAmount.toLocaleString()}

🏦 *Bank Details:*
Bank: ${user.boundBankName}
Account: ${user.boundAccountNumber}
Name: ${user.boundAccountName}`
        );

        return { success: true, netAmount, fee };
      }),

    bindCard: protectedProcedure
      .input(z.object({
        bankName: z.string().min(1),
        accountNumber: z.string().min(6).max(20),
        accountName: z.string().min(2),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check for duplicate account number across all users
        const existing = await db.select({
          id: users.id,
          phoneNumber: users.phoneNumber,
        }).from(users)
          .where(eq(users.boundAccountNumber, input.accountNumber))
          .limit(5);

        const others = existing.filter(u => u.id !== ctx.user.id);

        if (others.length > 0) {
          // Alert admin about duplicate card
          const user = await getUserById(ctx.user.id);
          await notifyTelegram(
            `🚨 *DUPLICATE CARD ALERT*

Account: ${input.accountNumber}
Bound by: ${user?.phoneNumber}
Also used by: ${others.map(u => u.phoneNumber).join(", ")}`
          );
        }

        await db.update(users).set({
          boundBankName: input.bankName,
          boundAccountNumber: input.accountNumber,
          boundAccountName: input.accountName,
          boundCardAt: new Date(),
        }).where(eq(users.id, ctx.user.id));

        return { success: true };
      }),

    getBoundCard: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) return null;
      return {
        bankName: user.boundBankName,
        accountNumber: user.boundAccountNumber,
        accountName: user.boundAccountName,
        boundAt: user.boundCardAt,
      };
    }),

    initializePaystack: protectedProcedure
      .input(z.object({ amount: z.number().min(3000).max(20000) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");

        // Check if Paystack is enabled by admin
        const paystackEnabled = await getSetting("paystack_enabled");
        if (paystackEnabled === "false") {
          throw new Error("PAYSTACK_DISABLED");
        }

        const ref = `NT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const callbackUrl = `${process.env.SITE_URL || "https://nexus-tech-fixed.onrender.com"}/deposit/verify?ref=${ref}&userId=${ctx.user.id}`;

        const res = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: `${user.phoneNumber}@nexustech.app`,
            amount: input.amount * 100,
            reference: ref,
            callback_url: callbackUrl,
            metadata: {
              user_id: ctx.user.id,
              phone: user.phoneNumber,
              cancel_action: `${process.env.SITE_URL || "https://nexus-tech-fixed.onrender.com"}/deposit`,
            },
          }),
        });

        const data = await res.json();
        if (!data.status) throw new Error(data.message || "Failed to initialize payment");

        return {
          authorizationUrl: data.data.authorization_url,
          reference: ref,
        };
      }),

    redeemGiftCode: protectedProcedure
      .input(z.object({ code: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const codeRows = await db.select().from(giftCodes).where(eq(giftCodes.code, input.code.toUpperCase())).limit(1);
        const gift = codeRows[0];

        if (!gift) throw new Error("Invalid gift code");
        if (gift.expiresAt && gift.expiresAt < new Date()) throw new Error("This gift code has expired");
        const maxUses = gift.maxUses ?? 1;
        const usedCount = gift.usedCount ?? 0;
        if (usedCount >= maxUses) throw new Error("This gift code has reached its usage limit");

        const amount = parseFloat(gift.amount.toString());
        const user = await getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");

        const newBalance = parseFloat(user.balance.toString()) + amount;
        await updateUserBalance(ctx.user.id, newBalance.toString());

        const newUsedCount = (gift.usedCount ?? 0) + 1;
        const newMaxUses = gift.maxUses ?? 1;
        await db.update(giftCodes).set({
          usedCount: newUsedCount,
          isUsed: newUsedCount >= newMaxUses,
          usedBy: ctx.user.id,
          usedAt: new Date(),
        }).where(eq(giftCodes.id, gift.id));

        await createTransaction({ userId: ctx.user.id, type: "bonus", amount: gift.amount, status: "completed", description: `Gift code redeemed: ${gift.code}` });

        return { success: true, amount };
      }),
  }),

  referral: router({
    getReferralCode: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      return { referralCode: user?.referralCode };
    }),
    getReferralEarnings: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalEarnings: 0, level1: [], level2: [], level3: [] };
      const user = await getUserById(ctx.user.id);
      if (!user?.referralCode) return { totalEarnings: 0, level1: [], level2: [], level3: [] };

      // Level 1 - direct referrals
      const level1 = await db.select({
        id: users.id, phoneNumber: users.phoneNumber, createdAt: users.createdAt, referralCode: users.referralCode,
      }).from(users).where(eq(users.referredBy, user.referralCode));

      // Level 2 - referrals of referrals
      const level2: any[] = [];
      for (const l1 of level1) {
        if (!l1.referralCode) continue;
        const l2 = await db.select({
          id: users.id, phoneNumber: users.phoneNumber, createdAt: users.createdAt, referralCode: users.referralCode,
        }).from(users).where(eq(users.referredBy, l1.referralCode));
        level2.push(...l2);
      }

      // Level 3 - referrals of level 2
      const level3: any[] = [];
      for (const l2 of level2) {
        if (!l2.referralCode) continue;
        const l3 = await db.select({
          id: users.id, phoneNumber: users.phoneNumber, createdAt: users.createdAt, referralCode: users.referralCode,
        }).from(users).where(eq(users.referredBy, l2.referralCode));
        level3.push(...l3);
      }

      // Get total referral earnings from transactions
      const { transactions: txTable } = await import("../drizzle/schema").then(m => ({ transactions: m.transactions }));
      const refTx = await db.select().from(transactionsTable).where(
        and(eq(transactionsTable.userId, ctx.user.id), eq(transactionsTable.type, "referral"))
      );
      const totalEarnings = refTx.reduce((s, t) => s + parseFloat(t.amount.toString()), 0);

      return { totalEarnings, level1, level2, level3, referrals: level1 };
    }),

    getTeamVolume: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalVolume: 0, level1Volume: 0, level2Volume: 0, level3Volume: 0 };
      const user = await getUserById(ctx.user.id);
      if (!user?.referralCode) return { totalVolume: 0, level1Volume: 0, level2Volume: 0, level3Volume: 0 };

      const { userInvestments: ui } = await import("../drizzle/schema");

      const level1 = await db.select({ id: users.id, referralCode: users.referralCode })
        .from(users).where(eq(users.referredBy, user.referralCode));

      const level2: { id: number; referralCode: string | null }[] = [];
      for (const l1 of level1) {
        if (!l1.referralCode) continue;
        const l2 = await db.select({ id: users.id, referralCode: users.referralCode })
          .from(users).where(eq(users.referredBy, l1.referralCode));
        level2.push(...l2);
      }

      const level3: { id: number; referralCode: string | null }[] = [];
      for (const l2 of level2) {
        if (!l2.referralCode) continue;
        const l3 = await db.select({ id: users.id, referralCode: users.referralCode })
          .from(users).where(eq(users.referredBy, l2.referralCode));
        level3.push(...l3);
      }

      const sumInvestments = async (ids: number[]) => {
        if (ids.length === 0) return 0;
        let total = 0;
        for (const id of ids) {
          const invs = await db.select({ investmentAmount: ui.investmentAmount }).from(ui).where(eq(ui.userId, id));
          total += invs.reduce((s, i) => s + parseFloat(i.investmentAmount.toString()), 0);
        }
        return total;
      };

      const level1Volume = await sumInvestments(level1.map(u => u.id));
      const level2Volume = await sumInvestments(level2.map(u => u.id));
      const level3Volume = await sumInvestments(level3.map(u => u.id));
      const totalVolume = level1Volume + level2Volume + level3Volume;

      return { totalVolume, level1Volume, level2Volume, level3Volume };
    }),
  }),

  settings: router({
    getPublic: publicProcedure.query(async () => {
      const paystackEnabled = await getSetting("paystack_enabled");
      return { paystackEnabled: paystackEnabled !== "false" };
    }),
  }),

  cloudMiners: router({
    getAll: publicProcedure.query(async () => getCloudMiners()),

    buy: protectedProcedure
      .input(z.object({ minerId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const miners = await getCloudMiners();
        const miner = miners.find(m => m.id === input.minerId);
        if (!miner) throw new Error("Miner not found");
        if (!miner.isUnlocked) throw new Error("This miner is not available yet");

        const count = await getUserCloudMinerCount(ctx.user.id, miner.id);
        if (count >= miner.quota) throw new Error(`Quota limit (${miner.quota}) reached for this miner`);

        const user = await getUserById(ctx.user.id);
        if (!user || parseFloat(user.balance.toString()) < parseFloat(miner.price.toString())) {
          throw new Error("Insufficient balance. Please deposit funds first.");
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + miner.duration);

        await createUserCloudMiner({ userId: ctx.user.id, minerId: miner.id, price: miner.price, dailyIncome: miner.dailyIncome, status: "active", startDate, endDate });

        const db = await getDb();
        if (db) {
          const newBalance = parseFloat(user.balance.toString()) - parseFloat(miner.price.toString());
          await db.update(users).set({ balance: newBalance.toString() }).where(eq(users.id, ctx.user.id));
        }

        await createTransaction({ userId: ctx.user.id, type: "investment", amount: miner.price, status: "completed", description: `Purchased ${miner.name}` });

        return { success: true };
      }),

    getUserMiners: protectedProcedure.query(async ({ ctx }) => getUserActiveCloudMiners(ctx.user.id)),
  }),

  admin: router({
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.select({ id: users.id, userId: users.userId, phoneNumber: users.phoneNumber, name: users.name, balance: users.balance, totalEarnings: users.totalEarnings, role: users.role, createdAt: users.createdAt }).from(users);
    }),

    setUserRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
        return { success: true };
      }),

    adjustBalance: protectedProcedure
      .input(z.object({ userId: z.number(), amount: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const user = await getUserById(input.userId);
        if (!user) throw new Error("User not found");
        const newBalance = parseFloat(user.balance.toString()) + input.amount;
        await updateUserBalance(input.userId, newBalance.toString());
        return { success: true, newBalance };
      }),

    searchUser: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const db = await getDb();
        if (!db) return null;
        // Search by phone or by userId (6-char ID)
        let user = await getUserByPhoneNumber(input.query);
        if (!user) {
          const byId = await db.select().from(users).where(eq(users.userId, input.query.toUpperCase())).limit(1);
          user = byId[0] || null;
        }
        if (!user) {
          const byUsername = await db.select().from(users).where(eq(users.username, input.query)).limit(1);
          user = byUsername[0] || null;
        }
        if (!user) return null;
        return { id: user.id, userId: user.userId, username: user.username, phoneNumber: user.phoneNumber, name: user.name, balance: user.balance, totalEarnings: user.totalEarnings, role: user.role };
      }),

    toggleCloudMiner: protectedProcedure
      .input(z.object({ minerId: z.number(), isUnlocked: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        await toggleCloudMinerLock(input.minerId, input.isUnlocked);
        return { success: true };
      }),

    togglePlan: protectedProcedure
      .input(z.object({ planId: z.number(), isUnlocked: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        await togglePlanLock(input.planId, input.isUnlocked);
        return { success: true };
      }),

    getPendingTransactions: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.select({
        id: transactionsTable.id,
        userId: transactionsTable.userId,
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        grossAmount: transactionsTable.grossAmount,
        fee: transactionsTable.fee,
        status: transactionsTable.status,
        description: transactionsTable.description,
        receiptUrl: transactionsTable.receiptUrl,
        bankName: transactionsTable.bankName,
        accountNumber: transactionsTable.accountNumber,
        accountName: transactionsTable.accountName,
        createdAt: transactionsTable.createdAt,
        phoneNumber: users.phoneNumber,
      }).from(transactionsTable)
        .leftJoin(users, eq(transactionsTable.userId, users.id))
        .where(eq(transactionsTable.status, "pending"))
        .limit(100);
    }),

    approveTransaction: protectedProcedure
      .input(z.object({ transactionId: z.number(), approve: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const txRows = await db.select().from(transactionsTable).where(eq(transactionsTable.id, input.transactionId)).limit(1);
        const tx = txRows[0];
        if (!tx) throw new Error("Transaction not found");

        const newStatus = input.approve ? "completed" : "cancelled";
        await db.update(transactionsTable).set({ status: newStatus as any }).where(eq(transactionsTable.id, input.transactionId));

        const user = await getUserById(tx.userId);
        if (user) {
          const currentBalance = parseFloat(user.balance.toString());
          if (input.approve && tx.type === "deposit") {
            const depositAmount = parseFloat((tx.grossAmount || tx.amount).toString());
            await updateUserBalance(tx.userId, (currentBalance + depositAmount).toString());
          } else if (!input.approve && tx.type === "withdrawal") {
            const grossAmount = parseFloat((tx.grossAmount || tx.amount).toString());
            await updateUserBalance(tx.userId, (currentBalance + grossAmount).toString());
          }
        }

        return { success: true };
      }),

    generateGiftCode: protectedProcedure
      .input(z.object({ amount: z.number().min(100), count: z.number().min(1).max(50).default(1) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const codes: string[] = [];
        for (let i = 0; i < input.count; i++) {
          const code = `NT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          await db.insert(giftCodes).values({ code, amount: input.amount.toString(), createdBy: ctx.user.id });
          codes.push(code);
        }

        await notifyTelegram(`🎁 *GIFT CODES GENERATED*\n\nAmount: ₦${input.amount.toLocaleString()} each\nCodes:\n${codes.map(c => `• \`${c}\``).join("\n")}`);

        return { success: true, codes };
      }),

    getAllGiftCodes: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(giftCodes).limit(200);
    }),

    getUserPassword: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const user = await getUserById(input.userId);
        if (!user) throw new Error("User not found");
        // Return the raw password hash - admin can see it for support purposes
        // The actual plaintext is not stored, only the hash
        return { passwordHash: user.passwordHash || "" };
      }),

    resetUserPassword: protectedProcedure
      .input(z.object({ userId: z.number(), newPassword: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const newHash = hashPassword(input.newPassword);
        await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, input.userId));
        return { success: true };
      }),

    banUser: protectedProcedure
      .input(z.object({ userId: z.number(), banned: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ isBanned: input.banned }).where(eq(users.id, input.userId));
        const target = await getUserById(input.userId);
        await notifyTelegram(`${input.banned ? "🚫" : "✅"} *USER ${input.banned ? "BANNED" : "UNBANNED"}*

Phone: ${target?.phoneNumber}`);
        return { success: true };
      }),

    togglePaystack: protectedProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        await setSetting("paystack_enabled", input.enabled ? "true" : "false");
        await notifyTelegram(`${input.enabled ? "✅" : "🔴"} *PAYSTACK ${input.enabled ? "ENABLED" : "DISABLED"}* by admin`);
        return { success: true };
      }),

    getSettings: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      const paystackEnabled = await getSetting("paystack_enabled");
      return { paystackEnabled: paystackEnabled !== "false" };
    }),

    broadcastNotification: protectedProcedure
      .input(z.object({ title: z.string().min(1), message: z.string().min(1), imageUrl: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(notifications).values({ title: input.title, message: input.message, imageUrl: input.imageUrl || null, createdBy: ctx.user.id });
        await notifyTelegram(`📢 *BROADCAST SENT*

Title: ${input.title}
${input.message}`);
        return { success: true };
      }),

    getNotifications: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(notifications).limit(50);
    }),

    deleteNotification: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(notifications).set({ isActive: false }).where(eq(notifications.id, input.id));
        return { success: true };
      }),
  }),

  notifications: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(notifications).where(eq(notifications.isActive, true)).limit(20);
    }),

    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const allNotifs = await db.select().from(notifications).where(eq(notifications.isActive, true));
      const read = await db.select().from(userNotificationReads).where(eq(userNotificationReads.userId, ctx.user.id));
      const readIds = new Set(read.map(r => r.notificationId));
      const unread = allNotifs.filter(n => !readIds.has(n.id)).length;
      return { count: unread };
    }),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const allNotifs = await db.select().from(notifications).where(eq(notifications.isActive, true));
      const read = await db.select().from(userNotificationReads).where(eq(userNotificationReads.userId, ctx.user.id));
      const readIds = new Set(read.map(r => r.notificationId));
      for (const n of allNotifs) {
        if (!readIds.has(n.id)) {
          await db.insert(userNotificationReads).values({ userId: ctx.user.id, notificationId: n.id });
        }
      }
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
