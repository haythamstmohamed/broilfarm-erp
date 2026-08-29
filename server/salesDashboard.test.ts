import { describe, expect, it } from "vitest";
import { saleDashboardMetrics, saleValueFromLedgerWeight } from "../shared/salesDashboard";

describe("sales dashboard metrics", () => {
  it("updates cumulative cages, weight, averages, discount, and partial settlement after sequential weigh-ins", () => {
    const metrics = saleDashboardMetrics({ plannedCageCount: 200, totalPiasters: 1_858_200, discountPiasters: 8_200, batches: [{ cageCount: 5, birdCount: 50, grossWeightGrams: 47_500, netWeightGrams: 45_000 }, { cageCount: 5, birdCount: 50, grossWeightGrams: 49_200, netWeightGrams: 46_700 }, { cageCount: 5, birdCount: 50, grossWeightGrams: 48_700, netWeightGrams: 46_200 }], payments: [{ amountPiasters: 500_000 }] });
    expect(metrics).toMatchObject({ loadedCages: 15, totalBirds: 150, netWeightGrams: 145_400, remainingCages: 185, averageCageWeightGrams: 9693, averageBirdWeightGrams: 969, netDuePiasters: 1_850_000, remainingPiasters: 1_350_000, settlementStatus: "partial" });
  });

  it("reports a fully settled sale when payments equal the discounted due amount", () => {
    const metrics = saleDashboardMetrics({ plannedCageCount: 5, totalPiasters: 100_000, discountPiasters: 5_000, batches: [{ cageCount: 5, birdCount: 50, grossWeightGrams: 110_000, netWeightGrams: 100_000 }], payments: [{ amountPiasters: 95_000 }] });
    expect(metrics.settlementStatus).toBe("paid");
    expect(metrics.remainingPiasters).toBe(0);
  });

  it("sums the requested three simple batches for a 200-cage trader account", () => {
    const metrics = saleDashboardMetrics({ plannedCageCount: 200, totalPiasters: 1_382_250, discountPiasters: 0, batches: [
      { cageCount: 5, birdCount: 0, grossWeightGrams: 48_500, netWeightGrams: 48_500 },
      { cageCount: 5, birdCount: 0, grossWeightGrams: 49_200, netWeightGrams: 49_200 },
      { cageCount: 5, birdCount: 0, grossWeightGrams: 47_800, netWeightGrams: 47_800 },
    ], payments: [] });
    expect(metrics).toMatchObject({ loadedCages: 15, remainingCages: 185, netWeightGrams: 145_500, averageCageWeightGrams: 9700, completionPercent: 8 });
  });

  it("subtracts the independent tare ledger total from the independent filled ledger total", () => {
    const metrics = saleDashboardMetrics({ plannedCageCount: 0, totalPiasters: 446_500, discountPiasters: 0, batches: [
      { weighingStage: "tare_pending", cageCount: 5, birdCount: 0, grossWeightGrams: 0, tareWeightGrams: 2_500, netWeightGrams: 0 },
      { weighingStage: "tare_pending", cageCount: 5, birdCount: 0, grossWeightGrams: 0, tareWeightGrams: 1_000, netWeightGrams: 0 },
      { weighingStage: "filled", cageCount: 5, birdCount: 0, grossWeightGrams: 48_500, tareWeightGrams: 0, netWeightGrams: 48_500 },
      { weighingStage: "filled", cageCount: 5, birdCount: 0, grossWeightGrams: 49_200, tareWeightGrams: 0, netWeightGrams: 49_200 },
    ], payments: [] });
    expect(metrics).toMatchObject({ loadedCages: 10, tareWeightGrams: 3_500, grossWeightGrams: 97_700, netWeightGrams: 94_200, remainingCages: 0, completionPercent: 0 });
  });

  it("converts the independent-ledger net weight to the stored sale value", () => {
    expect(saleValueFromLedgerWeight(264_200, 5_800)).toBe(1_532_360);
  });
});
