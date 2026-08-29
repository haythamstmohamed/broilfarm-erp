export type SubscriptionPlanTier = "free" | "starter" | "pro" | "business" | "enterprise";

export type EnterpriseFeature =
  | "smart_alerts"
  | "profitability_simulator"
  | "smart_scale_bridge"
  | "iot_sensors"
  | "executive_dashboard"
  | "audit_logs"
  | "medicine_inventory"
  | "advanced_reports"
  | "unlimited_exports";

export type PlanDefinition = {
  id: SubscriptionPlanTier;
  name: string;
  priceMonthlyEgp: number;
  priceAnnualEgp: number;
  description: string;
  limits: {
    maxFarms: number;
    maxHousesPerFarm: number;
    maxUsersPerFarm: number;
    maxActiveCycles: number;
  };
  features: EnterpriseFeature[];
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanTier, PlanDefinition> = {
  free: {
    id: "free",
    name: "الباقة المجانية (Free)",
    priceMonthlyEgp: 0,
    priceAnnualEgp: 0,
    description: "لصغار المربين والمزارع الفردية للبدء في الرقمنة الأساسية",
    limits: {
      maxFarms: 1,
      maxHousesPerFarm: 2,
      maxUsersPerFarm: 2,
      maxActiveCycles: 1,
    },
    features: ["advanced_reports"],
  },
  starter: {
    id: "starter",
    name: "باقة البداية (Starter)",
    priceMonthlyEgp: 499,
    priceAnnualEgp: 4990,
    description: "للمزارع المتوسطة التي تحتاج إلى إدارة دقيقة للمخازن والمبيعات",
    limits: {
      maxFarms: 2,
      maxHousesPerFarm: 4,
      maxUsersPerFarm: 5,
      maxActiveCycles: 2,
    },
    features: ["advanced_reports", "smart_alerts", "medicine_inventory"],
  },
  pro: {
    id: "pro",
    name: "باقة المحترفين (Pro)",
    priceMonthlyEgp: 999,
    priceAnnualEgp: 9990,
    description: "للمزارع الاحترافية التي تستهدف تحسين الكفاءة التحويلية والبيع بالميزان الذكي",
    limits: {
      maxFarms: 5,
      maxHousesPerFarm: 10,
      maxUsersPerFarm: 15,
      maxActiveCycles: 5,
    },
    features: [
      "advanced_reports",
      "smart_alerts",
      "medicine_inventory",
      "profitability_simulator",
      "smart_scale_bridge",
      "unlimited_exports",
    ],
  },
  business: {
    id: "business",
    name: "باقة الشركات (Business)",
    priceMonthlyEgp: 1999,
    priceAnnualEgp: 19990,
    description: "للشركات ومجموعات المزارع التي تتطلب لوحة قيادة تنفيذية موحدة وإنترنت الأشياء",
    limits: {
      maxFarms: 15,
      maxHousesPerFarm: 30,
      maxUsersPerFarm: 50,
      maxActiveCycles: 15,
    },
    features: [
      "advanced_reports",
      "smart_alerts",
      "medicine_inventory",
      "profitability_simulator",
      "smart_scale_bridge",
      "unlimited_exports",
      "executive_dashboard",
      "iot_sensors",
      "audit_logs",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "باقة المؤسسات الكبرى (Enterprise)",
    priceMonthlyEgp: 4999,
    priceAnnualEgp: 49990,
    description: "لكبرى مجمعات الدواجن والشركات القابضة مع مزارع وعنابر غير محدودة ودعم مخصص",
    limits: {
      maxFarms: 9999,
      maxHousesPerFarm: 9999,
      maxUsersPerFarm: 9999,
      maxActiveCycles: 9999,
    },
    features: [
      "advanced_reports",
      "smart_alerts",
      "medicine_inventory",
      "profitability_simulator",
      "smart_scale_bridge",
      "unlimited_exports",
      "executive_dashboard",
      "iot_sensors",
      "audit_logs",
    ],
  },
};

export function checkFeatureAccess(
  plan: SubscriptionPlanTier | null | undefined,
  feature: EnterpriseFeature
): boolean {
  const activePlan = plan ? SUBSCRIPTION_PLANS[plan] : SUBSCRIPTION_PLANS.free;
  return activePlan ? activePlan.features.includes(feature) : false;
}

export function checkResourceLimit(
  plan: SubscriptionPlanTier | null | undefined,
  resourceType: "farms" | "houses" | "users" | "cycles",
  currentCount: number
): { isAllowed: boolean; limit: number; current: number; message?: string } {
  const activePlan = plan ? SUBSCRIPTION_PLANS[plan] : SUBSCRIPTION_PLANS.free;
  let limit = 1;

  switch (resourceType) {
    case "farms":
      limit = activePlan.limits.maxFarms;
      break;
    case "houses":
      limit = activePlan.limits.maxHousesPerFarm;
      break;
    case "users":
      limit = activePlan.limits.maxUsersPerFarm;
      break;
    case "cycles":
      limit = activePlan.limits.maxActiveCycles;
      break;
  }

  const isAllowed = currentCount < limit;

  return {
    isAllowed,
    limit,
    current: currentCount,
    message: isAllowed
      ? undefined
      : `تم الوصول إلى الحد الأقصى المسموح به (${limit}) في باقتك الحالية (${activePlan.name}). يُرجى الترقية لإضافة المزيد.`,
  };
}
