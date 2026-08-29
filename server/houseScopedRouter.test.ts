import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function caller() {
  const ctx = {
    user: { id: 77, openId: "house-scope-test", name: "Test", email: null, loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} },
    res: { clearCookie: () => undefined },
  } as unknown as TrpcContext;
  return appRouter.createCaller(ctx);
}

describe("house-scoped workspace procedure contracts", () => {
  it("rejects a daily operation that omits its assigned house", async () => {
    await expect(caller().workspace.addDailyRecord({ cycleId: 1, recordDate: new Date(), feedKg: 10, waterLiters: 20, mortality: 0, culls: 0 } as never)).rejects.toThrow();
  });

  it("rejects a weight or health write that omits its assigned house", async () => {
    await expect(caller().workspace.addWeightSample({ cycleId: 1, sampleDate: new Date(), averageWeightGrams: 100 } as never)).rejects.toThrow();
    await expect(caller().workspace.addHealthEvent({ cycleId: 1, eventDate: new Date(), eventType: "vaccination", productName: "Test", dosage: "1" } as never)).rejects.toThrow();
  });

  it("requires an existing health record identifier and assigned house for health record lifecycle actions", async () => {
    await expect(caller().workspace.updateHealthEvent({ healthEventId: 1, eventDate: new Date(), eventType: "vaccination", productName: "Test", dosage: "1" } as never)).rejects.toThrow();
    await expect(caller().workspace.deleteHealthEvent({ healthEventId: 0 })).rejects.toThrow();
  });

  it("rejects an invalid expense amount before it reaches the protected expense service", async () => {
    await expect(caller().workspace.addFarmExpense({ farmId: 1, category: "feed", amountEgp: 0, expenseDate: new Date() })).rejects.toThrow();
    await expect(caller().workspace.updateFarmExpense({ expenseId: 1, category: "feed", amountEgp: 0, expenseDate: new Date() })).rejects.toThrow();
  });
});
