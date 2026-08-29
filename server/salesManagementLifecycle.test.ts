import { describe, expect, it } from "vitest";
import { assertBatchOrder, assertSaleCanComplete, assertSaleCanSoftDelete, assertSaleUpdateKeepsPaymentsCovered, evaluateBatchCageEntry, nextBatchSequence } from "../shared/salesManagementLifecycle";

describe("sales management lifecycle guards", () => {
  it("requires an explicit manager override for a batch over the remaining cage count", () => {
    expect(() => evaluateBatchCageEntry({ weighingMode: "variable", cageCount: 8, remainingCages: 5 })).toThrow("تأكيد إداري");
    expect(evaluateBatchCageEntry({ weighingMode: "variable", cageCount: 8, remainingCages: 5, allowOverage: true })).toEqual({ requiresManagerOverride: true });
    expect(evaluateBatchCageEntry({ weighingMode: "direct", cageCount: 0, remainingCages: 0 })).toEqual({ requiresManagerOverride: false });
  });

  it("blocks premature completion but permits a confirmed overage to complete a cage sale", () => {
    expect(() => assertSaleCanComplete({ weighingMode: "fixed", loadedCageCount: 199, plannedCageCount: 200 })).toThrow("قبل وزن");
    expect(() => assertSaleCanComplete({ weighingMode: "variable", loadedCageCount: 205, plannedCageCount: 200 })).not.toThrow();
  });

  it("allows independent tare and filled ledgers to complete without a historical cage plan", () => {
    expect(() => assertSaleCanComplete({ weighingMode: "variable", loadedCageCount: 10, plannedCageCount: 200, usesIndependentLedgers: true })).not.toThrow();
  });

  it("protects recalculated sale details from invalid discounts and already-recorded payment overages", () => {
    expect(() => assertSaleUpdateKeepsPaymentsCovered({ totalPiasters: 100_000, discountPiasters: 30_000, paidPiasters: 80_000 })).toThrow("الدفعات");
    expect(() => assertSaleUpdateKeepsPaymentsCovered({ totalPiasters: 100_000, discountPiasters: 10_000, paidPiasters: 80_000 })).not.toThrow();
  });

  it("guards soft deletion and exact batch reordering", () => {
    expect(() => assertSaleCanSoftDelete(true)).toThrow("غير موجودة");
    expect(() => assertBatchOrder([1, 2, 3], [3, 1, 2])).not.toThrow();
    expect(() => assertBatchOrder([1, 2, 3], [1, 2])).toThrow("غير مكتمل");
  });

  it("continues after the highest surviving sequence when a prior batch was deleted", () => {
    expect(nextBatchSequence(0)).toBe(1);
    expect(nextBatchSequence(2)).toBe(3);
  });
});
