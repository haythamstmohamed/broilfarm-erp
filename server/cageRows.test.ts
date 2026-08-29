import { describe, expect, it } from "vitest";
import { cageRowCapacity, canAddCycleCageRow } from "../shared/cageRows";

describe("cycle-linked cage rows", () => {
  it("calculates a row capacity from cages and birds per cage", () => {
    expect(cageRowCapacity(80, 5)).toBe(400);
  });

  it("allows rows only while they fit both the house and the house assignment", () => {
    expect(canAddCycleCageRow({ houseCapacity: 1_000, assignedBirds: 900, existingRowCapacity: 400, existingCycleBirds: 400, cageCount: 80, birdsPerCage: 5 })).toBe(true);
    expect(canAddCycleCageRow({ houseCapacity: 1_000, assignedBirds: 900, existingRowCapacity: 800, existingCycleBirds: 800, cageCount: 40, birdsPerCage: 5 })).toBe(false);
  });
});
