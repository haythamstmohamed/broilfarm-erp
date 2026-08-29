import { describe, expect, it } from "vitest";
import {
  evaluateFcrAnomaly,
  evaluateFeedStockAnomaly,
  evaluateGrowthAnomaly,
  evaluateMortalityAnomaly,
  evaluateUpcomingVaccines,
  getExpectedWeightGrams,
  scanCycleAnomalies,
} from "../shared/alertsEngine";

describe("Smart Alerts & Anomaly Detection Engine", () => {
  it("computes standard Ross 308 growth curve accurately", () => {
    expect(getExpectedWeightGrams(1)).toBe(42);
    expect(getExpectedWeightGrams(7)).toBe(190);
    expect(getExpectedWeightGrams(14)).toBe(470);
    expect(getExpectedWeightGrams(21)).toBe(950);
    expect(getExpectedWeightGrams(28)).toBe(1560);
    expect(getExpectedWeightGrams(35)).toBe(2280);
    expect(getExpectedWeightGrams(42)).toBe(3020);
    // Interpolation test (day 10.5)
    expect(getExpectedWeightGrams(10.5)).toBeCloseTo(330, 0);
  });

  it("detects critical mortality spikes (>= 1.0%)", () => {
    const alerts = evaluateMortalityAnomaly({
      birdsPlaced: 10000,
      dailyRecords: [
        { recordDate: "2026-08-01", mortality: 20, culls: 5 },
        { recordDate: "2026-08-02", mortality: 110, culls: 10 }, // 120 / 10000 = 1.2%
      ],
    });

    expect(alerts.length).toBeGreaterThanOrEqual(1);
    const criticalAlert = alerts.find((a) => a.severity === "critical");
    expect(criticalAlert).toBeDefined();
    expect(criticalAlert?.alertType).toBe("high_mortality");
    expect(criticalAlert?.title).toContain("ارتفاع حرج");
  });

  it("detects 3-day consecutive rising mortality trend", () => {
    const alerts = evaluateMortalityAnomaly({
      birdsPlaced: 10000,
      dailyRecords: [
        { recordDate: "2026-08-01", mortality: 15, culls: 2 }, // 17
        { recordDate: "2026-08-02", mortality: 25, culls: 3 }, // 28
        { recordDate: "2026-08-03", mortality: 38, culls: 4 }, // 42 (rising: 17 -> 28 -> 42)
      ],
    });

    const trendAlert = alerts.find((a) => a.title.includes("تصاعد مستمر"));
    expect(trendAlert).toBeDefined();
    expect(trendAlert?.severity).toBe("warning");
  });

  it("detects growth lag below breed target standard", () => {
    // Day 28 target is 1560g. Actual is 1200g (-23% lag)
    const alert = evaluateGrowthAnomaly({
      averageWeightGrams: 1200,
      cycleAgeDays: 28,
    });

    expect(alert).not.toBeNull();
    expect(alert?.alertType).toBe("low_weight");
    expect(alert?.severity).toBe("critical");
    expect(alert?.message).toContain("1560");
  });

  it("detects high FCR anomaly", () => {
    // FCR 1.82 at age 35 days
    const alert = evaluateFcrAnomaly({
      fcr: 1.82,
      cycleAgeDays: 35,
    });

    expect(alert).not.toBeNull();
    expect(alert?.alertType).toBe("abnormal_fcr");
    expect(alert?.severity).toBe("critical");
  });

  it("detects feed stock depletion risks", () => {
    // 0 bags -> critical
    const emptyAlert = evaluateFeedStockAnomaly({
      currentBalanceBags: 0,
      reorderPointBags: 50,
      dailyConsumptionBags: 20,
    });
    expect(emptyAlert?.severity).toBe("critical");
    expect(emptyAlert?.title).toContain("نفاد رصيد العلف");

    // 25 bags with daily consumption of 15 bags (1.6 days remaining) -> critical
    const lowDaysAlert = evaluateFeedStockAnomaly({
      currentBalanceBags: 25,
      reorderPointBags: 50,
      dailyConsumptionBags: 15,
    });
    expect(lowDaysAlert?.severity).toBe("critical");
  });

  it("identifies upcoming vaccination window reminders", () => {
    const alerts = evaluateUpcomingVaccines({
      cycleAgeDays: 12,
      executedHealthEvents: [], // No vaccine executed yet
    });

    expect(alerts.length).toBeGreaterThanOrEqual(1);
    const gumboroAlert = alerts.find((a) => a.title.includes("الجمبورو"));
    expect(gumboroAlert).toBeDefined();
    expect(gumboroAlert?.alertType).toBe("vaccine_due");
  });

  it("runs full scanCycleAnomalies master suite without throwing", () => {
    const allAlerts = scanCycleAnomalies({
      birdsPlaced: 10000,
      cycleAgeDays: 28,
      dailyRecords: [
        { recordDate: "2026-08-10", mortality: 15, culls: 2, feedKg: 800, waterLiters: 1600 },
        { recordDate: "2026-08-11", mortality: 20, culls: 2, feedKg: 850, waterLiters: 1700 },
        { recordDate: "2026-08-12", mortality: 120, culls: 10, feedKg: 900, waterLiters: 1800 },
      ],
      latestWeightGrams: 1100, // Underweight
      fcr: 1.78, // High FCR
      currentFeedBalanceBags: 15, // Low stock
      feedReorderPointBags: 50,
      dailyConsumptionBags: 18,
      healthEvents: [],
    });

    expect(allAlerts.length).toBeGreaterThanOrEqual(3);
    expect(allAlerts.some((a) => a.alertType === "high_mortality")).toBe(true);
    expect(allAlerts.some((a) => a.alertType === "low_weight")).toBe(true);
    expect(allAlerts.some((a) => a.alertType === "low_feed_stock")).toBe(true);
  });
});
