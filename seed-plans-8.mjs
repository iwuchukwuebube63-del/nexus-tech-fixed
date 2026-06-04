import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "data.db");

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

const { investmentPlans } = await import("./drizzle/schema.js");

const plans = [
  { planLevel: 1, investmentAmount: "3500",   dailyCommission: "700",    durationDays: 15, deviceName: "Entry Mobile" },
  { planLevel: 2, investmentAmount: "6000",   dailyCommission: "1200",   durationDays: 15, deviceName: "Mid-Range Mobile" },
  { planLevel: 3, investmentAmount: "15000",  dailyCommission: "3000",   durationDays: 15, deviceName: "Pro Tablet" },
  { planLevel: 4, investmentAmount: "35000",  dailyCommission: "7000",   durationDays: 30, deviceName: "Business Laptop" },
  { planLevel: 5, investmentAmount: "75000",  dailyCommission: "15000",  durationDays: 30, deviceName: "Power Workstation" },
  { planLevel: 6, investmentAmount: "150000", dailyCommission: "30000",  durationDays: 30, deviceName: "Enterprise Server" },
  { planLevel: 7, investmentAmount: "250000", dailyCommission: "50000",  durationDays: 30, deviceName: "Premium Cluster" },
  { planLevel: 8, investmentAmount: "500000", dailyCommission: "100000", durationDays: 30, deviceName: "Enterprise Datacenter" },
];

console.log("Seeding 8 investment plans into SQLite...");

// Clear and re-seed
db.run?.("DELETE FROM investment_plans") ?? sqlite.exec("DELETE FROM investment_plans");

for (const plan of plans) {
  await db.insert(investmentPlans).values(plan);
  console.log(`✓ Plan ${plan.planLevel}: ${plan.deviceName}`);
}

console.log("✓ All 8 plans seeded!");
sqlite.close();
