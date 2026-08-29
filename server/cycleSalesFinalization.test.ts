import { describe, expect, it } from "vitest";
import { cycleSalesFinalizationReadiness, eligibleCycleSales } from "../shared/cycleSalesFinalization";

describe("cycle sales finalization readiness", () => {
  it("requires at least one active sale and a calculated net value for every open sale", () => {
    expect(cycleSalesFinalizationReadiness([]).canFinalize).toBe(false);
    expect(cycleSalesFinalizationReadiness([{ id: 1, status: "open", netWeightGrams: 0, totalPiasters: 0 }]).canFinalize).toBe(false);
    expect(cycleSalesFinalizationReadiness([{ id: 1, status: "closed", netWeightGrams: 100_000, totalPiasters: 500_000 }, { id: 2, status: "open", netWeightGrams: 80_000, totalPiasters: 400_000 }])).toMatchObject({ activeSalesCount: 2, openSalesCount: 1, closedSalesCount: 1, canFinalize: true });
  });

  it("excludes deleted sales and sales belonging to inactive hidden traders", () => {
    const visibleSales = eligibleCycleSales([
      { id: 1, isDeleted: true, traderActive: true },
      { id: 2, isDeleted: false, traderActive: false },
      { id: 3, isDeleted: false, traderActive: true },
    ]);
    expect(visibleSales.map((sale) => sale.id)).toEqual([3]);
    expect(cycleSalesFinalizationReadiness([
      { id: 1, status: "closed", isDeleted: true, traderActive: true, netWeightGrams: 100_000, totalPiasters: 500_000 },
      { id: 2, status: "open", isDeleted: false, traderActive: false, netWeightGrams: 80_000, totalPiasters: 400_000 },
      { id: 3, status: "closed", isDeleted: false, traderActive: true, netWeightGrams: 60_000, totalPiasters: 300_000 },
    ])).toMatchObject({ activeSalesCount: 1, openSalesCount: 0, closedSalesCount: 1, canFinalize: true });
  });
});
