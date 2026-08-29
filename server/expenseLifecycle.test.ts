import { describe, expect, it, vi } from "vitest";
import { executeFarmExpenseCreate, executeFarmExpenseUpdate } from "../shared/expenseLifecycle";

const baseMutation = { farmId: 9, cycleId: 12, category: "feed" as const, amountEgp: 420.5, expenseDate: new Date("2026-08-19T00:00:00Z") };

describe("protected farm expense writes", () => {
  it("persists an authorized expense with the cycle scope and exact piaster amount", async () => {
    const requireExpenseAccess = vi.fn().mockResolvedValue(undefined);
    const persist = vi.fn().mockResolvedValue(undefined);
    const record = await executeFarmExpenseCreate({ userId: 3, mutation: baseMutation, cycle: { id: 12, farmId: 9, houseId: 6 }, requireExpenseAccess, persist });
    expect(requireExpenseAccess).toHaveBeenCalledWith(3, 9, { houseId: 6, cycleId: 12 });
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ amountPiasters: 42_050, category: "feed" }));
    expect(record.amountPiasters).toBe(42_050);
  });

  it("does not persist when the role-aware access check rejects the actor", async () => {
    const requireExpenseAccess = vi.fn().mockRejectedValue(new Error("غير مصرح بإدارة المصروفات"));
    const persist = vi.fn().mockResolvedValue(undefined);
    await expect(executeFarmExpenseCreate({ userId: 4, mutation: baseMutation, cycle: { id: 12, farmId: 9, houseId: 6 }, requireExpenseAccess, persist })).rejects.toThrow("غير مصرح");
    expect(persist).not.toHaveBeenCalled();
  });

  it("rejects a cycle that belongs to another farm before requesting access or persistence", async () => {
    const requireExpenseAccess = vi.fn().mockResolvedValue(undefined);
    const persist = vi.fn().mockResolvedValue(undefined);
    await expect(executeFarmExpenseCreate({ userId: 3, mutation: baseMutation, cycle: { id: 12, farmId: 10, houseId: null }, requireExpenseAccess, persist })).rejects.toThrow("لا تنتمي الدورة");
    expect(requireExpenseAccess).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it("applies the same scope and exact-piaster rules when an expense is edited", async () => {
    const requireExpenseAccess = vi.fn().mockResolvedValue(undefined);
    const persist = vi.fn().mockResolvedValue(undefined);
    const record = await executeFarmExpenseUpdate({ userId: 3, mutation: { ...baseMutation, amountEgp: 99.99, supplier: "مورد العلف" }, cycle: { id: 12, farmId: 9, houseId: 6 }, requireExpenseAccess, persist });
    expect(record.amountPiasters).toBe(9_999);
    expect(requireExpenseAccess).toHaveBeenCalledWith(3, 9, { houseId: 6, cycleId: 12 });
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ supplier: "مورد العلف", amountPiasters: 9_999 }));
  });
});
