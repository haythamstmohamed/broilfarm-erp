import { describe, expect, it } from "vitest";
import { canDeleteCycle, canDeleteFarm, canDeleteHouse, canSetCycleBirds, canSetHouseCapacity } from "../shared/lifecyclePolicy";

describe("farm record lifecycle safeguards", () => {
  it("does not allow cycle bird counts below the birds already assigned to houses", () => {
    expect(canSetCycleBirds(900, 850)).toBe(true);
    expect(canSetCycleBirds(849, 850)).toBe(false);
  });

  it("does not allow a house capacity below its configured cage capacity", () => {
    expect(canSetHouseCapacity(500, 500)).toBe(true);
    expect(canSetHouseCapacity(499, 500)).toBe(false);
  });

  it("blocks destructive deletions while dependency records exist", () => {
    expect(canDeleteFarm(0, 0)).toBe(true);
    expect(canDeleteFarm(1, 0)).toBe(false);
    expect(canDeleteCycle(0)).toBe(true);
    expect(canDeleteCycle(1)).toBe(false);
    expect(canDeleteHouse(0)).toBe(true);
    expect(canDeleteHouse(1)).toBe(false);
  });
});
