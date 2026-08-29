import { describe, expect, it } from "vitest";
import { saleSettlement, salesSettlementSummary } from "../shared/salesSettlement";

describe("sales settlement calculations", () => {
  it("calculates net sale weight using the measured empty-cage average", () => {
    const result = saleSettlement({ grossWeightKg: 1_000, loadedCageCount: 100, tareWeightKg: 50, tareCageCount: 10, pricePerKgEgp: 100 });
    expect(result.tarePerCageGrams).toBe(5_000);
    expect(result.totalTareGrams).toBe(500_000);
    expect(result.netWeightGrams).toBe(500_000);
    expect(result.totalPiasters).toBe(5_000_000);
  });

  it("keeps receivables and net cycle profit distinct", () => {
    expect(salesSettlementSummary({ salesTotalPiasters: 5_000_000, paidPiasters: 2_000_000, cycleExpensesPiasters: 3_000_000 })).toEqual({ remainingPiasters: 3_000_000, netProfitPiasters: 2_000_000 });
  });

  it("rejects a cage tare that would remove all sold bird weight", () => {
    expect(() => saleSettlement({ grossWeightKg: 100, loadedCageCount: 20, tareWeightKg: 20, tareCageCount: 2, pricePerKgEgp: 50 })).toThrow("الوزن الصافي");
  });
});
