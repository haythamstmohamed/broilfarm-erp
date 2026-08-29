import { describe, expect, it } from "vitest";
import { amountToPiasters, expenseCycleBelongsToFarm, expenseSummary } from "../shared/expenseManagement";

describe("farm expense management", () => {
  it("stores Egyptian-pound amounts exactly in piasters", () => {
    expect(amountToPiasters(125.75)).toBe(12_575);
    expect(amountToPiasters(1)).toBe(100);
    expect(() => amountToPiasters(0)).toThrow("أكبر من صفر");
  });

  it("summarizes actual expenses by category without manufacturing empty categories", () => {
    const summary = expenseSummary([
      { category: "feed", amountPiasters: 90_000 },
      { category: "health", amountPiasters: 10_000 },
      { category: "feed", amountPiasters: 30_000 },
    ]);
    expect(summary.totalPiasters).toBe(130_000);
    expect(summary.byCategory).toEqual([
      { category: "feed", amountPiasters: 120_000, sharePercent: expect.closeTo(92.3076923077) },
      { category: "health", amountPiasters: 10_000, sharePercent: expect.closeTo(7.6923076923) },
    ]);
  });

  it("keeps an expense cycle inside its source farm", () => {
    expect(expenseCycleBelongsToFarm(14, 14)).toBe(true);
    expect(expenseCycleBelongsToFarm(14, 15)).toBe(false);
    expect(expenseCycleBelongsToFarm(14, null)).toBe(false);
  });
});
