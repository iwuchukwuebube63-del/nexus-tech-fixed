import crypto from "crypto";

/**
 * Hash a password using PBKDF2 (no external dependencies)
 * In production, consider using bcrypt or argon2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  if (!salt || !storedHash) return false;

  const computedHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return computedHash === storedHash;
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
}

/**
 * Generate a referral code
 */
export function generateReferralCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
}
