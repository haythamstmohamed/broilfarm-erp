import { describe, expect, it } from "vitest";
import { requireHouseCageDistribution, requireHouseScopedRecord } from "./houseScopedGuards";

describe("house-scoped service guards", () => {
  it("allows a record only for an assigned house in the cycle farm", () => {
    expect(() => requireHouseScopedRecord({ cycleFarmId: 1, houseFarmId: 1, assignedBirds: 120 })).not.toThrow();
    expect(() => requireHouseScopedRecord({ cycleFarmId: 1, houseFarmId: 1, assignedBirds: 0 })).toThrow("Assign birds");
    expect(() => requireHouseScopedRecord({ cycleFarmId: 1, houseFarmId: 2, assignedBirds: 120 })).toThrow("Assign birds");
  });

  it("blocks cage-section distribution until the house is assigned cycle birds", () => {
    expect(() => requireHouseCageDistribution({ assignedBirds: 80, houseSectionCapacity: 100 })).not.toThrow();
    expect(() => requireHouseCageDistribution({ assignedBirds: 0, houseSectionCapacity: 100 })).toThrow("Assign birds");
    expect(() => requireHouseCageDistribution({ assignedBirds: 80, houseSectionCapacity: 0 })).toThrow("Assign birds");
  });
});
