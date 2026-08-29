import { describe, expect, it } from "vitest";
import { simulateCycleProfitability } from "../shared/profitabilitySimulator";

describe("Harvest & Profitability Scenario Simulator", () => {
  it("projects forward daily cycle finances and biomass accurately", () => {
    const result = simulateCycleProfitability({
      birdsPlaced: 10000,
      currentAgeDays: 28,
      currentLiveBirds: 9600,
      currentAvgWeightGrams: 1560,
      feedCostPerKgEgp: 23.5,
      chickCostPerBirdEgp: 32.0,
      veterinaryCostPerBirdEgp: 4.0,
      fixedDailyOverheadEgp: 750,
      targetSellingPricePerKgEgp: 82.0,
    });

    expect(result.currentStatus.ageDays).toBe(28);
    expect(result.currentStatus.liveBirds).toBe(9600);
    expect(result.dailyProjections.length).toBeGreaterThan(10);

    // Projections should include day 35
    const day35 = result.dailyProjections.find((p) => p.ageDays === 35);
    expect(day35).toBeDefined();
    expect(day35?.projectedWeightGrams).toBeGreaterThan(2000);
    expect(day35?.grossRevenueEgp).toBeGreaterThan(day35?.totalExpensesEgp ?? 0);
    expect(day35?.netProfitEgp).toBeGreaterThan(0);
    expect(day35?.roiPercent).toBeGreaterThan(0);
  });

  it("identifies optimal harvest day maximizing net margin", () => {
    const result = simulateCycleProfitability({
      birdsPlaced: 20000,
      currentAgeDays: 30,
      currentLiveBirds: 19200,
      currentAvgWeightGrams: 1750,
      feedCostPerKgEgp: 24.0,
      chickCostPerBirdEgp: 34.0,
      fixedDailyOverheadEgp: 1200,
      targetSellingPricePerKgEgp: 85.0,
    });

    expect(result.optimalHarvest.optimalAgeDays).toBeGreaterThanOrEqual(30);
    expect(result.optimalHarvest.optimalAgeDays).toBeLessThanOrEqual(45);
    expect(result.optimalHarvest.maxNetProfitEgp).toBeGreaterThan(100000);

    const optimalDay = result.dailyProjections.find((p) => p.isOptimalHarvestDay);
    expect(optimalDay).toBeDefined();
    expect(optimalDay?.ageDays).toBe(result.optimalHarvest.optimalAgeDays);
  });
});
