import { describe, expect, it } from "vitest";
import { farmRoles, roleCan, roleLabels, scopeAllows, FarmCapability } from "../shared/accessControl";

describe("Granular Role-Based Access Control (RBAC)", () => {
  it("defines all 8 enterprise roles with Arabic labels", () => {
    expect(farmRoles).toContain("general_manager");
    expect(farmRoles).toContain("farm_manager");
    expect(farmRoles).toContain("veterinarian");
    expect(farmRoles).toContain("engineer");
    expect(farmRoles).toContain("supervisor");
    expect(farmRoles).toContain("accountant");
    expect(farmRoles).toContain("worker");
    expect(farmRoles).toContain("viewer");

    expect(roleLabels.owner).toBe("مالك المزرعة");
    expect(roleLabels.general_manager).toBe("مدير عام المؤسسة");
    expect(roleLabels.accountant).toBe("محاسب مالي");
    expect(roleLabels.viewer).toBe("مشاهد / مدقق");
  });

  it("authorizes General Manager with full operational, financial, and audit capabilities", () => {
    expect(roleCan("general_manager", "manage_access")).toBe(true);
    expect(roleCan("general_manager", "approve_expenses")).toBe(true);
    expect(roleCan("general_manager", "view_audit_logs")).toBe(true);
    expect(roleCan("general_manager", "close_cycles")).toBe(true);
  });

  it("authorizes Accountant exclusively for financial, inventory, reports, and audit logs", () => {
    expect(roleCan("accountant", "manage_expenses")).toBe(true);
    expect(roleCan("accountant", "approve_expenses")).toBe(true);
    expect(roleCan("accountant", "manage_sales")).toBe(true);
    expect(roleCan("accountant", "manage_inventory")).toBe(true);
    expect(roleCan("accountant", "view_reports")).toBe(true);
    expect(roleCan("accountant", "view_audit_logs")).toBe(true);

    // Accountant cannot mutate cycles or housing directly
    expect(roleCan("accountant", "manage_cycles")).toBe(false);
    expect(roleCan("accountant", "manage_housing")).toBe(false);
  });

  it("authorizes Veterinarian for health and reports", () => {
    expect(roleCan("veterinarian", "manage_health")).toBe(true);
    expect(roleCan("veterinarian", "view_reports")).toBe(true);
    expect(roleCan("veterinarian", "manage_expenses")).toBe(false);
    expect(roleCan("veterinarian", "manage_sales")).toBe(false);
  });

  it("authorizes Viewer strictly for read-only reports", () => {
    expect(roleCan("viewer", "view_reports")).toBe(true);
    expect(roleCan("viewer", "manage_expenses")).toBe(false);
    expect(roleCan("viewer", "manage_sales")).toBe(false);
    expect(roleCan("viewer", "record_operations")).toBe(false);
  });

  it("evaluates house and cycle scopes correctly", () => {
    expect(scopeAllows({ houseId: null, cycleId: null }, { houseId: 1, cycleId: 2 })).toBe(true);
    expect(scopeAllows({ houseId: 1, cycleId: null }, { houseId: 1, cycleId: 2 })).toBe(true);
    expect(scopeAllows({ houseId: 1, cycleId: null }, { houseId: 2, cycleId: 2 })).toBe(false);
    expect(scopeAllows({ houseId: null, cycleId: 5 }, { houseId: 1, cycleId: 5 })).toBe(true);
    expect(scopeAllows({ houseId: null, cycleId: 5 }, { houseId: 1, cycleId: 6 })).toBe(false);
  });
});
