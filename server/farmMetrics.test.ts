import { describe, expect, it } from "vitest";
import { calculateEpef, calculateFcr, calculateLiveBirds } from "../shared/farmMetrics";

describe("farm performance calculations", () => {
  it("derives the live flock from documented mortality and culls", () => {
    expect(calculateLiveBirds(1000, [{ feedKg: 0, waterLiters: 0, mortality: 8, culls: 2 }, { feedKg: 0, waterLiters: 0, mortality: 4, culls: 1 }])).toBe(985);
  });

  it("does not emit a misleading FCR before a live biomass is available", () => {
    expect(calculateFcr(150, 0, 1400)).toBeNull();
    expect(calculateFcr(150, 500, 0)).toBeNull();
  });

  it("calculates FCR and EPEF from the supplied operational data", () => {
    const fcr = calculateFcr(21000, 4900, 2200);
    expect(fcr).toBeCloseTo(1.948, 3);
    expect(calculateEpef({ birdsPlaced: 5000, mortality: 100, averageWeightGrams: 2200, fcr, ageDays: 35 })).toBeCloseTo(316.2, 0);
  });
});
