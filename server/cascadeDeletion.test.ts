import { describe, expect, it } from "vitest";
import { buildCascadeDeletionImpact, type CascadeDeletionCounts } from "../shared/cascadeDeletion";

const zeroCounts: CascadeDeletionCounts = {
  farms: 0, cycles: 0, houses: 0, cageRows: 0, cageOccupancy: 0, houseAssignments: 0,
  dailyRecords: 0, healthEvents: 0, weightSamples: 0, feedSettings: 0, feedTransactions: 0,
  expenses: 0, weatherDays: 0, workers: 0, workerAccountEntries: 0, traders: 0, sales: 0, weightBatches: 0, payments: 0,
  saleActivities: 0, memberships: 0, invitations: 0,
};

describe("cascade deletion impact", () => {
  it("lists only dependent records and totals their count", () => {
    const impact = buildCascadeDeletionImpact("farm", "مزرعة اختبار", { ...zeroCounts, farms: 1, cycles: 2, sales: 3, payments: 4 });
    expect(impact.items.map((item) => item.key)).toEqual(["farms", "cycles", "sales", "payments"]);
    expect(impact.totalRelatedRecords).toBe(10);
  });
});
