import { describe, expect, it } from "vitest";
import { compareCycles, type CycleBenchmarkInput } from "../shared/cycleComparison";

describe("Multi-Cycle Comparison Engine", () => {
  it("accurately compares multiple cycles and determines top performers", () => {
    const cyclesData: CycleBenchmarkInput[] = [
      {
        cycleId: 101,
        cycleName: "دورة الصيف 2026",
        farmName: "مزرعة النور",
        placementDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        birdsPlaced: 10000,
        status: "closed",
        totalMortality: 300,
        totalFeedKg: 35000,
        averageWeightGrams: 2150,
        totalExpensesPiasters: 100000000, // 1,000,000 EGP
        totalSalesPiasters: 160000000, // 1,600,000 EGP
        totalSoldWeightGrams: 20000000,
      },
      {
        cycleId: 102,
        cycleName: "دورة الشتاء 2026",
        farmName: "مزرعة النور",
        placementDate: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000),
        birdsPlaced: 10000,
        status: "closed",
        totalMortality: 500,
        totalFeedKg: 36000,
        averageWeightGrams: 2000,
        totalExpensesPiasters: 110000000, // 1,100,000 EGP
        totalSalesPiasters: 140000000, // 1,400,000 EGP
        totalSoldWeightGrams: 19000000,
      },
    ];

    const report = compareCycles(cyclesData);

    expect(report.cycles).toHaveLength(2);

    // Cycle 101 performed better: lower FCR (1.75 vs 1.89), higher profit (600,000 vs 300,000)
    expect(report.highestProfitCycleId).toBe(101);
    expect(report.lowestFcrCycleId).toBe(101);
    expect(report.bestEpefCycleId).toBe(101);

    expect(report.averages.avgLivabilityPercent).toBeGreaterThan(95);
    expect(report.averages.avgNetProfitEgp).toBe(450000);
  });

  it("handles empty cycles list gracefully", () => {
    const report = compareCycles([]);
    expect(report.cycles).toHaveLength(0);
    expect(report.bestEpefCycleId).toBeNull();
  });
});
