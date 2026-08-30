import { describe, expect, it } from "vitest";
import { canViewCompanyRollup, requireCompanyAdministrator, resolveCompanyAccess } from "../shared/companyAccessPolicy";

describe("company access policy", () => {
  const companyAdmin = { companyId: 12, role: "admin" as const };
  const companyUser = { companyId: 12, role: "user" as const };

  it("only resolves the caller's own company", () => {
    expect(resolveCompanyAccess(companyUser)).toBe(12);
    expect(resolveCompanyAccess(companyUser, 12)).toBe(12);
    expect(() => resolveCompanyAccess(companyUser, 13)).toThrow("ليس لديك صلاحية");
  });

  it("requires an administrator for company-wide data and mutations", () => {
    expect(requireCompanyAdministrator(companyAdmin, 12)).toBe(12);
    expect(() => requireCompanyAdministrator(companyUser, 12)).toThrow("مدير الشركة");
    expect(() => requireCompanyAdministrator(companyAdmin, 13)).toThrow("ليس لديك صلاحية");
  });

  it("does not treat a global admin role as membership in another company", () => {
    expect(canViewCompanyRollup(companyAdmin)).toBe(true);
    expect(canViewCompanyRollup({ companyId: null, role: "admin" })).toBe(false);
  });
});
