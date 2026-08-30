import { describe, expect, it } from "vitest";
import { computeCycleFinancials } from "../shared/cycleFinancials";

describe("Cycle Financials & Costing Engine", () => {
  it("calculates accurate production cost, profitability, and break-even metrics", () => {
    const analysis = computeCycleFinancials({
      birdsPlaced: 10000,
      totalMortality: 300, // 9,700 live birds
      totalFeedKg: 35000,
      averageWeightGrams: 2150, // ~20,855 kg live weight
      expenses: [
        { category: "feed", amountPiasters: 70000000 }, // 700,000 EGP (20 EGP/kg)
        { category: "chicks", amountPiasters: 35000000 }, // 350,000 EGP (35 EGP/chick)
        { category: "health", amountPiasters: 4000000 }, // 40,000 EGP
        { category: "utilities", amountPiasters: 3000000 }, // 30,000 EGP
        { category: "labor", amountPiasters: 2500000 }, // 25,000 EGP
        { category: "maintenance", amountPiasters: 1500000 }, // 15,000 EGP
      ], // Total Expenses = 1,160,000 EGP
      sales: [
        { totalPiasters: 160000000, netWeightGrams: 20000000, isDeleted: false }, // 20,000 kg sold for 1,600,000 EGP (80 EGP/kg)
      ],
    });

    // Production
    expect(analysis.production.liveBirds).toBe(9700);
    expect(analysis.production.totalBiomassKg).toBe(20000);

    // Costs
    expect(analysis.costs.totalExpensesEgp).toBe(1160000);
    expect(analysis.costs.feedCostEgp).toBe(700000);
    expect(analysis.costs.chickCostEgp).toBe(350000);
    expect(analysis.costs.totalCostPerBirdEgp).toBeCloseTo(119.59, 1); // 1,160,000 / 9,700
    expect(analysis.costs.totalCostPerKgEgp).toBe(58); // 1,160,000 / 20,000

    // Revenue & Profitability
    expect(analysis.revenue.grossRevenueEgp).toBe(1600000);
    expect(analysis.revenue.averageSellingPricePerKgEgp).toBe(80);
    expect(analysis.profitability.netProfitEgp).toBe(440000);
    expect(analysis.profitability.isProfitable).toBe(true);
    expect(analysis.profitability.roiPercent).toBeCloseTo(37.93, 1);
    expect(analysis.profitability.netProfitPerKgEgp).toBe(22); // 80 - 58 = 22 EGP/kg

    // Break-even
    expect(analysis.breakEven.breakEvenPricePerKgEgp).toBe(58); // Must sell at > 58 EGP/kg
    expect(analysis.breakEven.breakEvenBiomassKg).toBe(14500); // 1,160,000 / 80
    expect(analysis.breakEven.safetyMarginPercent).toBe(27.5); // (80 - 58) / 80 * 100
  });

  it("handles zero sales gracefully without throwing division by zero errors", () => {
    const analysis = computeCycleFinancials({
      birdsPlaced: 5000,
      totalMortality: 100,
      totalFeedKg: 10000,
      averageWeightGrams: 1800,
      expenses: [
        { category: "feed", amountPiasters: 20000000 }, // 200,000 EGP
      ],
      sales: [],
    });

    expect(analysis.revenue.grossRevenueEgp).toBe(0);
    expect(analysis.profitability.netProfitEgp).toBe(-200000);
    expect(analysis.profitability.isProfitable).toBe(false);
    expect(analysis.costs.totalCostPerKgEgp).toBeGreaterThan(0);
  });
});
