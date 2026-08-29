import { describe, expect, it } from "vitest";
import {
  computeBackupChecksum,
  createBackupPayload,
  verifyBackupIntegrity,
} from "../shared/backupEngine";

describe("Enterprise Data Backup & Disaster Recovery Engine", () => {
  it("creates structured backup payload with valid metadata and checksum", () => {
    const payload = createBackupPayload({
      companyName: "شركة الدلتا للدواجن",
      farms: [{ id: 1, name: "مزرعة الشرقية" }],
      houses: [{ id: 10, name: "عنبر 1" }],
      cycles: [{ id: 100, name: "دورة الخريف" }],
      dailyRecords: [{ id: 1001, feedKg: 400 }],
      weightSamples: [],
      healthEvents: [],
      expenses: [],
      sales: [],
      saleWeighBatches: [],
      feedTransactions: [],
    });

    expect(payload.version).toBe("1.0");
    expect(payload.metadata.companyName).toBe("شركة الدلتا للدواجن");
    expect(payload.metadata.totalFarms).toBe(1);
    expect(payload.metadata.totalHouses).toBeUndefined(); // inside data
    expect(payload.metadata.totalCycles).toBe(1);
    expect(payload.metadata.totalDailyRecords).toBe(1);
    expect(payload.checksum).toBeDefined();
    expect(payload.checksum.startsWith("BF_")).toBe(true);
  });

  it("verifies unaltered backup payload successfully", () => {
    const payload = createBackupPayload({
      farms: [{ id: 1, name: "مزرعة 1" }],
      houses: [],
      cycles: [],
      dailyRecords: [],
      weightSamples: [],
      healthEvents: [],
      expenses: [],
      sales: [],
      saleWeighBatches: [],
      feedTransactions: [],
    });

    const verification = verifyBackupIntegrity(payload);
    expect(verification.isValid).toBe(true);
    expect(verification.message).toContain("تم التحقق من سلامة النسخة");
  });

  it("detects corrupted or tampered backup payload", () => {
    const payload = createBackupPayload({
      farms: [{ id: 1, name: "مزرعة 1" }],
      houses: [],
      cycles: [],
      dailyRecords: [],
      weightSamples: [],
      healthEvents: [],
      expenses: [],
      sales: [],
      saleWeighBatches: [],
      feedTransactions: [],
    });

    // Tamper with data after checksum was generated
    payload.data.farms.push({ id: 99, name: "مزرعة وهمية" });

    const verification = verifyBackupIntegrity(payload);
    expect(verification.isValid).toBe(false);
    expect(verification.message).toContain("فشل التحقق من البصمة");
  });
});
