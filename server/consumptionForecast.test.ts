import { describe, expect, it } from "vitest";
import { expectedLiveWeightGramsForCycleDay, feedGramsPerBirdForCycleDay, forecastHouseConsumption } from "../shared/consumptionForecast";
import { cycleDayFromDate } from "../shared/weather";

describe("per-house consumption forecasts", () => {
  it("uses the age-indexed feed objective for the selected production day", () => {
    expect(feedGramsPerBirdForCycleDay(1)).toBe(13);
    expect(feedGramsPerBirdForCycleDay(35)).toBe(189);
  });

  it("calculates feed kilograms, 50-kilogram bags, four buckets per bag, and water from actual house occupancy", () => {
    const result = forecastHouseConsumption({ birds: 1000, cycleDay: 35 });
    expect(result.dailyFeedGramsPerBird).toBe(189);
    expect(result.feedKg).toBe(189);
    expect(result.feedBags).toBeCloseTo(3.78, 2);
    expect(result.feedBuckets).toBeCloseTo(15.12, 2);
    expect(result.waterLiters).toBeCloseTo(321.3, 1);
  });

  it("does not produce consumption for a cycle day before placement", () => {
    expect(forecastHouseConsumption({ birds: 1000, cycleDay: 0 })).toMatchObject({ feedKg: 0, feedBags: 0, waterLiters: 0 });
  });

  it("returns the Cobb expected live-weight reference for the selected production day", () => {
    expect(expectedLiveWeightGramsForCycleDay(1)).toBe(55);
    expect(expectedLiveWeightGramsForCycleDay(35)).toBe(2521);
    expect(expectedLiveWeightGramsForCycleDay(0)).toBe(0);
  });

  it("updates the expected live weight when the operator selects a later cycle date", () => {
    const placementDate = new Date("2026-08-18T00:00:00Z");
    const placementDay = cycleDayFromDate(placementDate, "2026-08-18");
    const seventhCycleDay = cycleDayFromDate(placementDate, "2026-08-24");

    expect(placementDay).toBe(1);
    expect(seventhCycleDay).toBe(7);
    expect(expectedLiveWeightGramsForCycleDay(placementDay)).toBe(55);
    expect(expectedLiveWeightGramsForCycleDay(seventhCycleDay)).toBe(202);
  });
});
