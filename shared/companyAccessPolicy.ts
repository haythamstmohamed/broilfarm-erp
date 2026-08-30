export type CompanyAccessUser = {
  companyId: number | null;
  role: "user" | "admin";
};

export function resolveCompanyAccess(user: CompanyAccessUser, requestedCompanyId?: number): number {
  const companyId = requestedCompanyId ?? user.companyId;
  if (!companyId || user.companyId !== companyId) {
    throw new Error("ليس لديك صلاحية للوصول إلى بيانات هذه الشركة");
  }
  return companyId;
}

export function requireCompanyAdministrator(user: CompanyAccessUser, requestedCompanyId?: number): number {
  const companyId = resolveCompanyAccess(user, requestedCompanyId);
  if (user.role !== "admin") {
    throw new Error("هذه العملية متاحة لمدير الشركة فقط");
  }
  return companyId;
}

export function canViewCompanyRollup(user: CompanyAccessUser): boolean {
  return Boolean(user.companyId && user.role === "admin");
}
