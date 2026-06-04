// ─── Site Configuration ───────────────────────────────────────────────────────
// Edit this file to configure your site. All key settings are here.

export const CONFIG = {
  // ── Branding ────────────────────────────────────────────────────────────────
  siteName: "Nexus Tech",
  siteTagline: "Device Rental. Simplified.",
  version: "1.0.0",
  description: "Device Rental products Platform",

  // ── Telegram ────────────────────────────────────────────────────────────────
  telegramChannel: "https://t.me/nexus_techofficia",   // public channel link
  telegramSupport: "https://t.me/nexus_techofficia",   // support/customer care link
  telegramUsername: "Nexus_support01",                // username without @
  telegramBotToken: "YOUR_BOT_TOKEN_HERE",              // ⚠️ Set TELEGRAM_BOT_TOKEN in your hosting env vars
  telegramAdminChatId: "YOUR_ADMIN_CHAT_ID",            // ⚠️ Set TELEGRAM_ADMIN_CHAT_ID in your hosting env vars

  // ── Paystack ─────────────────────────────────────────────────────────────────
  // ⚠️ Set PAYSTACK_SECRET_KEY in your hosting env vars (never expose secret key in frontend)
  paystackPublicKey: "pk_live_7d3cb527a15d46391bcc66d6bf1dd43d6f45324d", // safe to be here (public)
  // paystackSecretKey goes in server env vars ONLY

  // ── Contact ─────────────────────────────────────────────────────────────────
  supportEmail: "support@nexustech.com",
  supportPhone: "+234 800 000 0000",

  // ── Bank Account (for deposits) ──────────────────────────────────────────────
  bankAccount: {
    name:   "Nexus Tech/ ROSELINE OLAKA ",
    number: "8155991400",
    bank:   "Opay",
    code:   "011",
  },

  // ── Auth ────────────────────────────────────────────────────────────────────
  welcomeBonusAmount: 500,       // naira bonus on signup
  sessionTimeoutMs: 3600000,     // 1 hour in ms

  // ── Investment ──────────────────────────────────────────────────────────────
  minDeposit: 3000,
  maxDeposit: 10000000,

  // ── Withdrawal ──────────────────────────────────────────────────────────────
  minWithdrawal: 1500,
  withdrawalFeePercent: 14,       // 14% fee on withdrawals
  operatingHoursStart: "08:00",
  operatingHoursEnd: "20:00",

  // ── Referral Commission Rates ────────────────────────────────────────────────
  referralRates: {
    level1: 0.15,   // 15% - direct referrals
    level2: 0.03,   // 3%  - their referrals
    level3: 0.02,   // 2%  - third level
  },

  // ── VIP Levels (based on total amount invested) ───────────────────────────────
  vipLevels: [
    { level: 0, name: "VIP 0", minInvested: 0,        color: "#6b7280" },
    { level: 1, name: "VIP 1", minInvested: 10000,    color: "#3b82f6" },
    { level: 2, name: "VIP 2", minInvested: 50000,    color: "#8b5cf6" },
    { level: 3, name: "VIP 3", minInvested: 150000,   color: "#f59e0b" },
    { level: 4, name: "VIP 4", minInvested: 500000,   color: "#ef4444" },
    { level: 5, name: "VIP 5", minInvested: 1000000,  color: "#10b981" },
  ],

  // ── Features ─────────────────────────────────────────────────────────────────
  features: {
    enableKYC:                false,
    enableReferralBonus:      true,
    enableDailyCommission:    true,
    enableWithdrawalApproval: true,
  },

  // ── Colors (reference only - edit index.css for actual styles) ──────────────
  colors: {
    primary:    "#0066FF",
    secondary:  "#00D9FF",
    accent:     "#FFD700",
    background: "#FFFFFF",
    text:       "#1A1A1A",
  },
};

export function getVipLevel(totalInvested: number) {
  const levels = [...CONFIG.vipLevels].reverse();
  return levels.find(l => totalInvested >= l.minInvested) || CONFIG.vipLevels[0];
}
