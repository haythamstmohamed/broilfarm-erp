import { describe, expect, it } from "vitest";
import { roleCan, roleLabels, scopeAllows } from "../shared/accessControl";

describe("farm role permissions", () => {
  it("reserves invitation management and cycle closing for the farm owner", () => {
    expect(roleCan("owner", "manage_access")).toBe(true);
    expect(roleCan("owner", "close_cycles")).toBe(true);
    expect(roleCan("farm_manager", "manage_access")).toBe(false);
    expect(roleCan("farm_manager", "close_cycles")).toBe(false);
  });

  it("grants each specialist only the operations appropriate to their role", () => {
    expect(roleCan("veterinarian", "manage_health")).toBe(true);
    expect(roleCan("veterinarian", "record_operations")).toBe(false);
    expect(roleCan("engineer", "record_weights")).toBe(true);
    expect(roleCan("engineer", "manage_health")).toBe(false);
    expect(roleCan("farm_manager", "manage_expenses")).toBe(true);
    expect(roleCan("engineer", "manage_expenses")).toBe(true);
    expect(roleCan("veterinarian", "manage_expenses")).toBe(false);
    expect(roleCan("worker", "manage_expenses")).toBe(false);
    expect(roleCan("farm_manager", "manage_sales")).toBe(true);
    expect(roleCan("engineer", "manage_sales")).toBe(true);
    expect(roleCan("veterinarian", "manage_sales")).toBe(false);
    expect(roleCan("worker", "manage_sales")).toBe(false);
    expect(roleCan("worker", "record_operations")).toBe(true);
    expect(roleCan("worker", "record_sales_weights")).toBe(true);
    expect(roleCan("worker", "view_reports")).toBe(false);
  });

  it("keeps Arabic role labels available to the RTL access-management interface", () => {
    expect(roleLabels.worker).toBe("عامل");
    expect(roleLabels.veterinarian).toBe("طبيب بيطري");
  });

  it("honors cycle and house scopes attached to a membership", () => {
    expect(scopeAllows({ houseId: 8, cycleId: 14 }, { houseId: 8, cycleId: 14 })).toBe(true);
    expect(scopeAllows({ houseId: 8, cycleId: 14 }, { houseId: 9, cycleId: 14 })).toBe(false);
    expect(scopeAllows({ houseId: 8, cycleId: 14 }, { houseId: 8, cycleId: 15 })).toBe(false);
    expect(scopeAllows({ houseId: null, cycleId: null }, { houseId: 8, cycleId: 15 })).toBe(true);
  });
});
