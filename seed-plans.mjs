import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "data.db");
const sqlite = new Database(dbPath);

const plans = [
  {
    planLevel: 1,
    deviceName: "Entry Mobile",
    investmentAmount: "3500",
    dailyCommission: "700",
    durationDays: 15,
    deviceImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/device-tier1-phone-4W5uPX2nPMab59sEiexzQQ.webp",
  },
  {
    planLevel: 2,
    deviceName: "Mid-Range Mobile",
    investmentAmount: "6000",
    dailyCommission: "1200",
    durationDays: 15,
    deviceImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/device-tier2-phone-kMDMzugwpJAnAzyciaVXJM.webp",
  },
  {
    planLevel: 3,
    deviceName: "Pro Tablet",
    investmentAmount: "15000",
    dailyCommission: "3000",
    durationDays: 15,
    deviceImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/device-tier3-tablet-3fakjGxwiV7d79AGdt8x92.webp",
  },
  {
    planLevel: 4,
    deviceName: "Business Laptop",
    investmentAmount: "35000",
    dailyCommission: "7000",
    durationDays: 30,
    deviceImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/device-tier4-laptop-mzRkcP7Zqt3Z5o2Ku9RBFe.webp",
  },
  {
    planLevel: 5,
    deviceName: "Power Workstation",
    investmentAmount: "75000",
    dailyCommission: "15000",
    durationDays: 60,
    deviceImageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
  },
  {
    planLevel: 6,
    deviceName: "Enterprise Server",
    investmentAmount: "150000",
    dailyCommission: "30000",
    durationDays: 60,
    deviceImageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
  },
  {
    planLevel: 7,
    deviceName: "Data Center Pro",
    investmentAmount: "300000",
    dailyCommission: "63000",
    durationDays: 60,
    deviceImageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  },
  {
    planLevel: 8,
    deviceName: "Quantum Array",
    investmentAmount: "400000",
    dailyCommission: "70000",
    durationDays: 60,
    deviceImageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  },
  {
    planLevel: 9,
    deviceName: "Ultra Cluster",
    investmentAmount: "500000",
    dailyCommission: "80000",
    durationDays: 60,
    deviceImageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  },
];

sqlite.exec(`CREATE TABLE IF NOT EXISTS investment_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_level INTEGER NOT NULL,
  device_name TEXT NOT NULL,
  device_image_url TEXT,
  investment_amount TEXT NOT NULL,
  daily_commission TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
)`);

const insert = sqlite.prepare(`
  INSERT OR IGNORE INTO investment_plans (plan_level, device_name, investment_amount, daily_commission, duration_days, device_image_url, is_active)
  VALUES (@planLevel, @deviceName, @investmentAmount, @dailyCommission, @durationDays, @deviceImageUrl, 1)
`);

// Update existing if already exists
const update = sqlite.prepare(`
  UPDATE investment_plans SET
    device_name = @deviceName,
    investment_amount = @investmentAmount,
    daily_commission = @dailyCommission,
    duration_days = @durationDays,
    device_image_url = @deviceImageUrl,
    is_active = 1
  WHERE plan_level = @planLevel
`);

for (const plan of plans) {
  const existing = sqlite.prepare("SELECT id FROM investment_plans WHERE plan_level = ?").get(plan.planLevel);
  if (existing) {
    update.run(plan);
    console.log(`✓ Updated Plan ${plan.planLevel}: ${plan.deviceName}`);
  } else {
    insert.run(plan);
    console.log(`✓ Inserted Plan ${plan.planLevel}: ${plan.deviceName}`);
  }
}

console.log("✓ All 9 investment plans seeded");
sqlite.close();
