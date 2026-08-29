import { describe, expect, it } from "vitest";
import { maxHouseAssignment } from "../shared/houseAssignment";

describe("cycle house assignments", () => {
  it("caps a house allocation by the physical house capacity", () => {
    expect(maxHouseAssignment({ cycleBirdsPlaced: 5000, houseId: 1, houseCapacity: 1800, assignments: [] })).toBe(1800);
  });

  it("caps the second house by birds remaining after the first house allocation", () => {
    expect(maxHouseAssignment({ cycleBirdsPlaced: 3000, houseId: 2, houseCapacity: 2000, assignments: [{ houseId: 1, assignedBirds: 1800 }] })).toBe(1200);
  });

  it("restores the target house’s own current allocation when editing it", () => {
    expect(maxHouseAssignment({ cycleBirdsPlaced: 3000, houseId: 1, houseCapacity: 2000, assignments: [{ houseId: 1, assignedBirds: 1200 }, { houseId: 2, assignedBirds: 1000 }] })).toBe(2000);
  });
});
