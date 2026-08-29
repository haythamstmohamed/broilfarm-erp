export const farmRoles = [
  "general_manager",
  "farm_manager",
  "veterinarian",
  "engineer",
  "supervisor",
  "accountant",
  "worker",
  "viewer",
] as const;
export type FarmRole = (typeof farmRoles)[number];
export type ResolvedFarmRole = FarmRole | "owner";

export const roleLabels: Record<ResolvedFarmRole, string> = {
  owner: "مالك المزرعة",
  general_manager: "مدير عام المؤسسة",
  farm_manager: "مدير مزرعة",
  veterinarian: "طبيب بيطري",
  engineer: "مهندس إنتاج",
  supervisor: "مشرف عنابر",
  accountant: "محاسب مالي",
  worker: "عامل",
  viewer: "مشاهد / مدقق",
};

const capabilities: Record<ResolvedFarmRole, readonly string[]> = {
  owner: [
    "manage_access",
    "manage_farms",
    "manage_cycles",
    "manage_housing",
    "manage_inventory",
    "manage_expenses",
    "approve_expenses",
    "manage_sales",
    "record_sales_weights",
    "record_operations",
    "manage_health",
    "record_weights",
    "view_reports",
    "view_audit_logs",
    "close_cycles",
  ],
  general_manager: [
    "manage_access",
    "manage_farms",
    "manage_cycles",
    "manage_housing",
    "manage_inventory",
    "manage_expenses",
    "approve_expenses",
    "manage_sales",
    "record_sales_weights",
    "record_operations",
    "manage_health",
    "record_weights",
    "view_reports",
    "view_audit_logs",
    "close_cycles",
  ],
  farm_manager: [
    "manage_cycles",
    "manage_housing",
    "manage_inventory",
    "manage_expenses",
    "approve_expenses",
    "manage_sales",
    "record_sales_weights",
    "record_operations",
    "record_weights",
    "view_reports",
    "manage_health",
    "view_audit_logs",
  ],
  veterinarian: ["manage_health", "view_reports"],
  engineer: [
    "manage_housing",
    "manage_inventory",
    "manage_expenses",
    "manage_sales",
    "record_sales_weights",
    "record_operations",
    "record_weights",
    "view_reports",
  ],
  supervisor: ["record_operations", "record_weights", "record_sales_weights", "view_reports"],
  accountant: ["manage_expenses", "approve_expenses", "manage_sales", "manage_inventory", "view_reports", "view_audit_logs"],
  worker: ["record_sales_weights", "record_operations"],
  viewer: ["view_reports"],
};

export type FarmCapability = (typeof capabilities.owner)[number];

export type MembershipScope = { houseId: number | null; cycleId: number | null };

export function roleCan(role: ResolvedFarmRole, capability: FarmCapability) {
  return capabilities[role].includes(capability);
}

export function scopeAllows(granted: MembershipScope, requested: MembershipScope) {
  if (granted.houseId && granted.houseId !== requested.houseId) return false;
  if (granted.cycleId && granted.cycleId !== requested.cycleId) return false;
  return true;
}
