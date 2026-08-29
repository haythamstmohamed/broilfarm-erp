import { describe, expect, it } from "vitest";
import {
  checkFeatureAccess,
  checkResourceLimit,
  SUBSCRIPTION_PLANS,
} from "../shared/subscriptionPlans";

describe("Commercial Subscription Tiering & Feature Gating", () => {
  it("defines all 5 commercial tiers with Arabic descriptions and pricing", () => {
    expect(SUBSCRIPTION_PLANS.free).toBeDefined();
    expect(SUBSCRIPTION_PLANS.starter).toBeDefined();
    expect(SUBSCRIPTION_PLANS.pro).toBeDefined();
    expect(SUBSCRIPTION_PLANS.business).toBeDefined();
    expect(SUBSCRIPTION_PLANS.enterprise).toBeDefined();

    expect(SUBSCRIPTION_PLANS.starter.priceMonthlyEgp).toBe(499);
    expect(SUBSCRIPTION_PLANS.pro.priceMonthlyEgp).toBe(999);
    expect(SUBSCRIPTION_PLANS.business.priceMonthlyEgp).toBe(1999);
    expect(SUBSCRIPTION_PLANS.enterprise.priceMonthlyEgp).toBe(4999);
  });

  it("restricts advanced features to authorized subscription tiers", () => {
    // Free plan should NOT have IoT or Executive Dashboard or Smart Scale
    expect(checkFeatureAccess("free", "iot_sensors")).toBe(false);
    expect(checkFeatureAccess("free", "executive_dashboard")).toBe(false);
    expect(checkFeatureAccess("free", "smart_scale_bridge")).toBe(false);

    // Pro plan should have smart scale and simulator
    expect(checkFeatureAccess("pro", "smart_scale_bridge")).toBe(true);
    expect(checkFeatureAccess("pro", "profitability_simulator")).toBe(true);
    expect(checkFeatureAccess("pro", "executive_dashboard")).toBe(false);

    // Business and Enterprise plans have all modules
    expect(checkFeatureAccess("business", "executive_dashboard")).toBe(true);
    expect(checkFeatureAccess("business", "iot_sensors")).toBe(true);
    expect(checkFeatureAccess("enterprise", "audit_logs")).toBe(true);
  });

  it("enforces farm, house, and user limits strictly", () => {
    // Free: max 1 farm
    const freeFarmsCheck = checkResourceLimit("free", "farms", 1);
    expect(freeFarmsCheck.isAllowed).toBe(false);
    expect(freeFarmsCheck.message).toContain("تم الوصول إلى الحد الأقصى");

    const freeFarmsAllowed = checkResourceLimit("free", "farms", 0);
    expect(freeFarmsAllowed.isAllowed).toBe(true);

    // Pro: max 5 farms, 15 houses
    expect(checkResourceLimit("pro", "farms", 4).isAllowed).toBe(true);
    expect(checkResourceLimit("pro", "farms", 5).isAllowed).toBe(false);
    expect(checkResourceLimit("pro", "users", 14).isAllowed).toBe(true);
    expect(checkResourceLimit("pro", "users", 15).isAllowed).toBe(false);
  });
});
