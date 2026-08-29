import { describe, expect, it } from "vitest";
import { formatCycleAuditCsv, generateCycleAuditReport } from "../shared/reportGenerator";

describe("Enterprise Cycle Audit & Report Generator", () => {
  it("generates structured cycle audit data and financial breakdown", () => {
    const report = generateCycleAuditReport({
      companyName: "شركة الدلتا للدواجن",
      farm: { name: "مزرعة الشرقية 1", governorate: "الشرقية" },
      cycle: { name: "دورة الخريف 2026", placementDate: "2026-08-01", birdsPlaced: 10000, status: "active" },
      dailyRecords: [
        { recordDate: "2026-08-01", feedKg: 200, waterLiters: 400, mortality: 10, culls: 0 },
        { recordDate: "2026-08-02", feedKg: 250, waterLiters: 500, mortality: 8, culls: 1 },
      ],
      weightSamples: [
        { sampleDate: "2026-08-02", averageWeightGrams: 120 },
      ],
      expenses: [
        { category: "chicks", amountPiasters: 2500000 }, // 25,000 EGP
        { category: "feed", amountPiasters: 1000000 }, // 10,000 EGP
      ],
      sales: [],
    });

    expect(report.header.companyName).toBe("شركة الدلتا للدواجن");
    expect(report.header.farmName).toBe("مزرعة الشرقية 1");
    expect(report.kpiSummary.totalLosses).toBe(19);
    expect(report.kpiSummary.liveBirds).toBe(10000 - 19);
    expect(report.kpiSummary.totalFeedKg).toBe(450);
    expect(report.financialSummary.chickExpensesEgp).toBe(25000);
    expect(report.financialSummary.feedExpensesEgp).toBe(10000);
    expect(report.financialSummary.totalExpensesEgp).toBe(35000);
    expect(report.dailyLog.length).toBe(2);
  });

  it("formats valid UTF-8 CSV representation with all required columns", () => {
    const report = generateCycleAuditReport({
      farm: { name: "مزرعة الصفا" },
      cycle: { name: "دورة 1", placementDate: "2026-08-01", birdsPlaced: 5000, status: "active" },
      dailyRecords: [
        { recordDate: "2026-08-01", feedKg: 100, waterLiters: 200, mortality: 5, culls: 0 },
      ],
      weightSamples: [],
      expenses: [],
      sales: [],
    });

    const csv = formatCycleAuditCsv(report);
    expect(csv).toContain("مزرعة الصفا");
    expect(csv).toContain("دورة 1");
    expect(csv).toContain("المؤشرات الفنية والإنتاجية");
    expect(csv).toContain("السجل اليومي للتشغيل");
    expect(csv.split("\n").length).toBeGreaterThan(10);
  });
});
