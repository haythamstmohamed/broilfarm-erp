import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Hashes a plaintext password using crypto.scrypt with a unique random salt.
 * Returns formatted string: `${salt}:${derivedKeyHex}`
 */
export function hashPassword(password: string): string {
  if (!password || password.length < 6) {
    throw new Error("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل");
  }
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored hash string using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;

  const [salt, key] = parts;
  try {
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
