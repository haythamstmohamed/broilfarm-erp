import { describe, it, expect } from "vitest";
import {
  analyzeFlockAnomalies,
  calculateOptimalHarvestWindow,
} from "../shared/decisionIntelligence";

describe("Actionable AI & Decision Intelligence Engine", () => {
  it("detects critical mortality spikes and produces investigation questions", () => {
    const report = analyzeFlockAnomalies({
      breed: "ross_308",
      ageDays: 25,
      currentLiveBirds: 10000,
      todayMortality: 80, // Sudden spike from 10
      past3DaysAvgMortality: 12,
      todayFeedKg: 1400,
      todayWaterLiters: 2600,
      ambientTempC: 25,
    });

    expect(report.overallRiskLevel).toBe("critical");
    expect(report.detectedAnomalies.length).toBeGreaterThan(0);
    const mortalityAnomaly = report.detectedAnomalies.find((a) => a.type === "mortality_spike");
    expect(mortalityAnomaly).toBeDefined();
    expect(mortalityAnomaly?.severity).toBe("critical");
    expect(mortalityAnomaly?.investigationQuestions.length).toBeGreaterThan(0);
  });

  it("detects severe water to feed imbalances under high temperature", () => {
    const report = analyzeFlockAnomalies({
      breed: "cobb_500",
      ageDays: 30,
      currentLiveBirds: 8000,
      todayMortality: 8,
      past3DaysAvgMortality: 9,
      todayFeedKg: 1200,
      todayWaterLiters: 1100, // Ratio < 1.0 (Severely low)
      ambientTempC: 34,
    });

    expect(report.detectedAnomalies.some((a) => a.type === "water_imbalance")).toBe(true);
    expect(report.detectedAnomalies.some((a) => a.type === "heat_stress")).toBe(true);
  });

  it("calculates optimal marketing window and advises on marginal profit", () => {
    const advice = calculateOptimalHarvestWindow({
      breed: "ross_308",
      ageDays: 34,
      currentAvgWeightGrams: 2150,
      feedPricePerKgEgp: 24.5,
      liveChickenPricePerKgEgp: 78.0,
      targetMarketWeightGrams: 2250,
    });

    expect(advice.currentAgeDays).toBe(34);
    expect(advice.estimatedOptimalHarvestDay).toBeGreaterThanOrEqual(34);
    expect(advice.projectedProfitPerBirdEgp).toBeGreaterThan(0);
    expect(advice.dailyMarginalGainEgp).toBeGreaterThan(advice.dailyFeedCostEgp);
    expect(["approaching_harvest", "optimal_window"]).toContain(advice.status);
  });
});
