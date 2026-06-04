import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "data.db");
const sqlite = new Database(dbPath);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const phoneNumber = "2348067784193";
const password = "Ebube123&456";
const passwordHash = hashPassword(password);
const openId = `phone_${phoneNumber}`;
const referralCode = "ADMIN1"; // 6 chars

const existing = sqlite.prepare("SELECT * FROM users WHERE phone_number = ?").get(phoneNumber);

if (existing) {
  sqlite.prepare("UPDATE users SET role = 'admin', password_hash = ?, referral_code = COALESCE(NULLIF(referral_code, ''), ?) WHERE phone_number = ?")
    .run(passwordHash, referralCode, phoneNumber);
  console.log("✓ Admin user updated");
} else {
  sqlite.prepare(`
    INSERT INTO users (open_id, phone_number, password_hash, user_id, referral_code, login_method, role, balance, total_earnings)
    VALUES (?, ?, ?, ?, ?, 'phone', 'admin', '0', '0')
  `).run(openId, phoneNumber, passwordHash, "ADMIN001", referralCode);
  console.log("✓ Admin user created");
}

// Initialize site settings
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
  )
`);
sqlite.prepare("INSERT OR IGNORE INTO site_settings (key, value) VALUES ('paystack_enabled', 'true')").run();
console.log("✓ Site settings initialized");

console.log(`Phone: ${phoneNumber}`);
console.log(`Password: ${password}`);
console.log(`Role: admin`);
sqlite.close();
