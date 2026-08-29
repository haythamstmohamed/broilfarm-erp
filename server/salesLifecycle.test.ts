import { describe, expect, it, vi } from "vitest";
import { executeSaleCreate, executeSalePaymentCreate } from "../shared/salesLifecycle";

const mutation = { farmId: 3, cycleId: 5, traderId: 8, saleDate: new Date("2026-08-19T00:00:00Z"), grossWeightKg: 1_000, loadedCageCount: 100, tareWeightKg: 50, tareCageCount: 10, pricePerKgEgp: 100, initialPaidEgp: 20_000 };
const cycle = { farmId: 3, cycleId: 5, houseId: null };

describe("protected sales lifecycle", () => {
  it("persists an authorized sale and its initial trader payment", async () => {
    const requireSalesAccess = vi.fn().mockResolvedValue(undefined);
    const persistSale = vi.fn().mockResolvedValue({ id: 22 });
    const persistPayment = vi.fn().mockResolvedValue(undefined);
    const result = await executeSaleCreate({ userId: 1, mutation, cycle, trader: { id: 8, farmId: 3 }, requireSalesAccess, persistSale, persistPayment });
    expect(requireSalesAccess).toHaveBeenCalledWith(1, cycle);
    expect(result.totalPiasters).toBe(5_000_000);
    expect(persistPayment).toHaveBeenCalledWith(22, 2_000_000, mutation.saleDate, undefined);
  });

  it("rejects a trader from another farm before persisting the sale", async () => {
    const persistSale = vi.fn();
    await expect(executeSaleCreate({ userId: 1, mutation, cycle, trader: { id: 8, farmId: 4 }, requireSalesAccess: vi.fn(), persistSale, persistPayment: vi.fn() })).rejects.toThrow("التاجر المحدد");
    expect(persistSale).not.toHaveBeenCalled();
  });

  it("rejects a settlement payment that exceeds the trader balance", async () => {
    const persist = vi.fn();
    await expect(executeSalePaymentCreate({ userId: 1, sale: { id: 22, farmId: 3, cycleId: 5, totalPiasters: 5_000_000 }, cycle, amountEgp: 30_001, paidAt: new Date(), existingPaidPiasters: 2_000_000, requireSalesAccess: vi.fn(), persist })).rejects.toThrow("تتجاوز");
    expect(persist).not.toHaveBeenCalled();
  });
});
