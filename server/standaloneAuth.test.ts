import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./_core/password";

describe("Standalone Native Authentication & Password Cryptography", () => {
  it("hashes password with a random unique salt each time", () => {
    const pwd = "MySecretPassword123!";
    const hash1 = hashPassword(pwd);
    const hash2 = hashPassword(pwd);

    expect(hash1).toBeDefined();
    expect(hash2).toBeDefined();
    expect(hash1).not.toBe(hash2); // Different salts produce different hashes

    const parts = hash1.split(":");
    expect(parts.length).toBe(2);
    expect(parts[0].length).toBe(32); // 16 bytes hex salt
  });

  it("verifies correct password against hash in constant-time", () => {
    const pwd = "StrongBroilerPassword2026";
    const hash = hashPassword(pwd);

    expect(verifyPassword(pwd, hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
    expect(verifyPassword("", hash)).toBe(false);
    expect(verifyPassword(pwd, "")).toBe(false);
  });

  it("rejects passwords shorter than 6 characters", () => {
    expect(() => hashPassword("12345")).toThrow("6 أحرف على الأقل");
  });

  it("gracefully handles malformed or tampered hashes", () => {
    expect(verifyPassword("test", "malformed_hash_without_colon")).toBe(false);
    expect(verifyPassword("test", "salt:invalidhexkey")).toBe(false);
  });
});
