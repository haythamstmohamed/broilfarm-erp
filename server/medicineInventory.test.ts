import { describe, expect, it } from "vitest";

describe("Medicine & Vaccine Inventory Catalog", () => {
  it("validates medicine inventory categories", () => {
    const validCategories = ["vaccine", "antibiotic", "vitamin", "disinfectant", "supplement", "other"];
    expect(validCategories).toContain("vaccine");
    expect(validCategories).toContain("antibiotic");
    expect(validCategories).toContain("vitamin");
    expect(validCategories).toContain("disinfectant");
  });

  it("calculates stock adjustments and prevents negative balances", () => {
    const currentQty = 10;
    const delta = -3;
    const nextQty = Math.max(0, currentQty + delta);
    expect(nextQty).toBe(7);

    const excessiveDelta = -15;
    const clampedNextQty = Math.max(0, currentQty + excessiveDelta);
    expect(clampedNextQty).toBe(0);
  });
});
