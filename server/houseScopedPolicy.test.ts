import { describe, expect, it } from "vitest";
import { canDistributeCagesForHouse, canRecordForHouse } from "../shared/houseScopedPolicy";

describe("house-scoped cycle workflow", () => {
  it("requires a positive assignment on a house in the same farm before recording operations", () => {
    expect(canRecordForHouse({ cycleFarmId: 1, houseFarmId: 1, assignedBirds: 250 })).toBe(true);
    expect(canRecordForHouse({ cycleFarmId: 1, houseFarmId: 1, assignedBirds: 0 })).toBe(false);
    expect(canRecordForHouse({ cycleFarmId: 1, houseFarmId: 2, assignedBirds: 250 })).toBe(false);
  });

  it("permits cage distribution only after the house has cycle birds and cage capacity", () => {
    expect(canDistributeCagesForHouse({ assignedBirds: 250, houseSectionCapacity: 300 })).toBe(true);
    expect(canDistributeCagesForHouse({ assignedBirds: 0, houseSectionCapacity: 300 })).toBe(false);
    expect(canDistributeCagesForHouse({ assignedBirds: 250, houseSectionCapacity: 0 })).toBe(false);
  });
});
