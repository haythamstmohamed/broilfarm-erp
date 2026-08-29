import { describe, expect, it } from "vitest";
import { allocationLimit } from "../shared/allocation";

describe("cycle cage allocation limits", () => {
  it("caps an allocation by cage-section capacity when the cycle has more birds remaining", () => {
    expect(allocationLimit({ birdsPlaced: 1000, targetSectionId: 7, sectionCapacity: 240, allocations: [{ cageSectionId: 2, occupiedBirds: 200 }] })).toMatchObject({ remainingForCycle: 800, maxAssignable: 240 });
  });

  it("caps an allocation by remaining birds in the cycle when other sections are already assigned", () => {
    expect(allocationLimit({ birdsPlaced: 1000, targetSectionId: 7, sectionCapacity: 500, allocations: [{ cageSectionId: 2, occupiedBirds: 650 }, { cageSectionId: 4, occupiedBirds: 200 }] })).toMatchObject({ assignedElsewhere: 850, remainingForCycle: 150, maxAssignable: 150 });
  });

  it("caps a second house allocation at the remainder after the first house is assigned", () => {
    const firstHouse = allocationLimit({ birdsPlaced: 1000, targetSectionId: 1, sectionCapacity: 800, allocations: [] });
    expect(firstHouse.maxAssignable).toBe(800);
    const secondHouse = allocationLimit({ birdsPlaced: 1000, targetSectionId: 2, sectionCapacity: 800, allocations: [{ cageSectionId: 1, occupiedBirds: 800 }] });
    expect(secondHouse).toMatchObject({ assignedElsewhere: 800, remainingForCycle: 200, maxAssignable: 200 });
  });

  it("never produces a negative allowance after the cycle has been fully assigned", () => {
    expect(allocationLimit({ birdsPlaced: 100, targetSectionId: 7, sectionCapacity: 40, allocations: [{ cageSectionId: 2, occupiedBirds: 120 }] }).maxAssignable).toBe(0);
  });
});
