import { describe, expect, it } from "vitest";
import { computeExecutiveDashboard, gradeFarmPerformance } from "../shared/multiFarmMetrics";

describe("Multi-Farm Executive Metrics & Benchmark Engine", () => {
  it("grades farm performance accurately based on EPEF and livability", () => {
    expect(gradeFarmPerformance(360, 96)).toBe("ممتاز");
    expect(gradeFarmPerformance(310, 94)).toBe("جيد");
    expect(gradeFarmPerformance(270, 91)).toBe("متوسط");
    expect(gradeFarmPerformance(230, 88)).toBe("تنبيه");
    expect(gradeFarmPerformance(190, 80)).toBe("حرج");
  });

  it("aggregates cross-farm KPIs and ranks farms correctly", () => {
    const dashboard = computeExecutiveDashboard({
      farms: [
        { id: 1, name: "مزرعة الوادي", governorate: "الشرقية" },
        { id: 2, name: "مزرعة النيل", governorate: "الدقهلية" },
      ],
      cycles: [
        { id: 101, farmId: 1, name: "دورة أغسطس أ", placementDate: new Date(Date.now() - 30 * 86400000), birdsPlaced: 10000, status: "active" },
        { id: 102, farmId: 2, name: "دورة أغسطس ب", placementDate: new Date(Date.now() - 30 * 86400000), birdsPlaced: 20000, status: "active" },
      ],
      dailyRecords: [
        { cycleId: 101, recordDate: "2026-08-01", feedKg: 15000, waterLiters: 30000, mortality: 300, culls: 50 },
        { cycleId: 102, recordDate: "2026-08-01", feedKg: 35000, waterLiters: 70000, mortality: 800, culls: 100 },
      ],
      weightSamples: [
        { cycleId: 101, sampleDate: "2026-08-28", averageWeightGrams: 1800 },
        { cycleId: 102, sampleDate: "2026-08-28", averageWeightGrams: 1750 },
      ],
      expenses: [
        { farmId: 1, cycleId: 101, amountPiasters: 25000000 }, // 250,000 EGP
        { farmId: 2, cycleId: 102, amountPiasters: 50000000 }, // 500,000 EGP
      ],
      sales: [
        { cycleId: 101, netWeightGrams: 17000000, totalPiasters: 35000000, isDeleted: false }, // 350,000 EGP
        { cycleId: 102, netWeightGrams: 33000000, totalPiasters: 70000000, isDeleted: false }, // 700,000 EGP
      ],
    });

    expect(dashboard.companyStats.totalFarms).toBe(2);
    expect(dashboard.companyStats.activeFarmsCount).toBe(2);
    expect(dashboard.companyStats.totalBirdsPlaced).toBe(30000);
    expect(dashboard.companyStats.totalLiveBirds).toBe(30000 - 350 - 900); // 28750
    expect(dashboard.companyStats.totalSalesRevenueEgp).toBe(1050000); // 350k + 700k
    expect(dashboard.companyStats.totalExpensesEgp).toBe(750000); // 250k + 500k
    expect(dashboard.companyStats.estimatedNetProfitEgp).toBe(300000); // 1050k - 750k

    // Farm rankings should have 2 entries
    expect(dashboard.farmRankings.length).toBe(2);
    expect(dashboard.farmRankings[0].epef).toBeGreaterThanOrEqual(dashboard.farmRankings[1].epef);
  });
});
