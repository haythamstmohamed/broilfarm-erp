import { describe, it, expect } from "vitest";
import {
  validatePopulationIntegrity,
  validateDailyIntakePlausibility,
  validateSaleWeighBatch,
} from "../shared/dataIntegrityGuards";

describe("Data Integrity & Impossible Logic Guards", () => {
  it("allows valid population deductions within available live birds", () => {
    const result = validatePopulationIntegrity({
      birdsPlaced: 10000,
      totalMortality: 200,
      totalCulls: 50,
      totalSoldBirds: 0,
      newMortality: 30,
      newCulls: 10,
    });

    expect(result.isValid).toBe(true);
    expect(result.currentLiveBirds).toBe(9710);
  });

  it("prohibits mortality or sales exceeding current live population", () => {
    const result = validatePopulationIntegrity({
      birdsPlaced: 10000,
      totalMortality: 9500,
      totalCulls: 200,
      totalSoldBirds: 0,
      newMortality: 400, // Available is 300, requesting 400
    });

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("EXCEEDS_LIVE_POPULATION");
    expect(result.errorMessageArabic).toContain("يتجاوز إجمالي الطيور الحية");
  });

  it("prohibits negative bird counts", () => {
    const result = validatePopulationIntegrity({
      birdsPlaced: 5000,
      totalMortality: 100,
      totalCulls: 0,
      totalSoldBirds: 0,
      newMortality: -5,
    });

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("NEGATIVE_COUNT_PROHIBITED");
  });

  it("flags biologically implausible daily feed intake per bird", () => {
    const check = validateDailyIntakePlausibility({
      ageDays: 15,
      currentLiveBirds: 1000,
      feedKg: 500, // 500g per bird! Implausible (max ~350)
      waterLiters: 1000,
    });

    expect(check.isValid).toBe(false);
    expect(check.errors.length).toBeGreaterThan(0);
    expect(check.errors[0]).toContain("غير منطقية بيولوجياً");
  });

  it("correctly validates a live broiler sale weighing batch", () => {
    const validBatch = validateSaleWeighBatch({
      grossWeightGrams: 150000, // 150 kg
      tareWeightGrams: 30000,   // 30 kg
      cageCount: 5,
      birdsPerCage: 10,
    });

    expect(validBatch.isValid).toBe(true);
    expect(validBatch.netWeightGrams).toBe(120000); // 120 kg
    expect(validBatch.averageBirdWeightGrams).toBe(2400); // 2.4 kg/bird
  });

  it("rejects sale batches where tare weight exceeds or equals gross weight", () => {
    const invalidBatch = validateSaleWeighBatch({
      grossWeightGrams: 50000,
      tareWeightGrams: 50000,
      cageCount: 5,
    });

    expect(invalidBatch.isValid).toBe(false);
    expect(invalidBatch.errorArabic).toContain("وزن الفارغ (الأقفاص) لا يمكن أن يكون مساوياً أو أكبر");
  });
});
