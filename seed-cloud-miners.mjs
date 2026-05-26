import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "data.db");
const sqlite = new Database(dbPath);

sqlite.exec(`CREATE TABLE IF NOT EXISTS cloud_miners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image_url TEXT,
  price TEXT NOT NULL,
  daily_income TEXT NOT NULL,
  duration INTEGER NOT NULL,
  total_income TEXT NOT NULL,
  quota INTEGER NOT NULL DEFAULT 1,
  is_unlocked INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
)`);

sqlite.exec(`CREATE TABLE IF NOT EXISTS user_cloud_miners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  miner_id INTEGER NOT NULL,
  price TEXT NOT NULL,
  daily_income TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  start_date INTEGER,
  end_date INTEGER,
  last_paid_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
)`);

const miners = [
  {
    name: "Cloud Miner S1",
    price: "15000",
    dailyIncome: "6000",
    duration: 5,
    totalIncome: "30000",
    quota: 1,
    sortOrder: 1,
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=80",
  },
  {
    name: "Cloud Miner S2",
    price: "35000",
    dailyIncome: "15000",
    duration: 6,
    totalIncome: "90000",
    quota: 2,
    sortOrder: 2,
    imageUrl: "https://images.unsplash.com/photo-1640161704729-cbe966a08476?w=600&q=80",
  },
  {
    name: "Cloud Miner S3",
    price: "70000",
    dailyIncome: "35000",
    duration: 8,
    totalIncome: "280000",
    quota: 3,
    sortOrder: 3,
    imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&q=80",
  },
  {
    name: "Cloud Miner S4",
    price: "115000",
    dailyIncome: "53000",
    duration: 9,
    totalIncome: "477000",
    quota: 4,
    sortOrder: 4,
    imageUrl: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=600&q=80",
  },
];

const upsert = sqlite.prepare(`
  INSERT INTO cloud_miners (name, price, daily_income, duration, total_income, quota, is_unlocked, sort_order, image_url)
  VALUES (@name, @price, @dailyIncome, @duration, @totalIncome, @quota, 0, @sortOrder, @imageUrl)
  ON CONFLICT(id) DO NOTHING
`);

const existing = sqlite.prepare("SELECT COUNT(*) as cnt FROM cloud_miners").get();
if (existing.cnt === 0) {
  for (const m of miners) {
    upsert.run(m);
    console.log(`✓ ${m.name}`);
  }
  console.log("✓ Cloud miners seeded (all locked by default)");
} else {
  // Update image URLs only
  const updateImg = sqlite.prepare("UPDATE cloud_miners SET image_url = @imageUrl WHERE name = @name");
  for (const m of miners) {
    updateImg.run(m);
  }
  console.log("✓ Cloud miner images updated");
}

sqlite.close();
