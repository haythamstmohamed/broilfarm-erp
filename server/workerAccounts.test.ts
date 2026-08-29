import { describe, expect, it } from "vitest";
import { workerAccountSummary } from "../shared/workerAccounts";

describe("worker accounts", () => {
  it("keeps salary credits and worker withdrawals in an independent account balance", () => {
    const summary = workerAccountSummary([
      { entryType: "salary_credit", amountPiasters: 600_000 },
      { entryType: "advance", amountPiasters: 125_000 },
      { entryType: "withdrawal", amountPiasters: 75_000 },
    ]);
    expect(summary.salaryAvailablePiasters).toBe(600_000);
    expect(summary.withdrawnPiasters).toBe(200_000);
    expect(summary.remainingSalaryPiasters).toBe(400_000);
    expect(summary.overdrawnPiasters).toBe(0);
  });

  it("reports an overdrawn balance instead of treating it as a farm expense", () => {
    const summary = workerAccountSummary([{ entryType: "salary_credit", amountPiasters: 100_000 }, { entryType: "withdrawal", amountPiasters: 125_000 }]);
    expect(summary.remainingSalaryPiasters).toBe(0);
    expect(summary.overdrawnPiasters).toBe(25_000);
  });
});
