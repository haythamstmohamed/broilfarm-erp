import { describe, expect, it } from "vitest";
import { broilerEnvironmentTargetForCycleDay } from "../shared/environmentTargets";
import { cycleDayFromDate } from "../shared/weather";

describe("age-synchronized broiler environment targets", () => {
  it("reduces the temperature target as the selected cycle day advances", () => {
    expect(broilerEnvironmentTargetForCycleDay(1)).toMatchObject({ temperatureMinC: 32, temperatureMaxC: 34, humidityMinPercent: 50, humidityMaxPercent: 60 });
    expect(broilerEnvironmentTargetForCycleDay(7)).toMatchObject({ temperatureMinC: 28, temperatureMaxC: 30, humidityMinPercent: 50, humidityMaxPercent: 60 });
    expect(broilerEnvironmentTargetForCycleDay(21)).toMatchObject({ temperatureMinC: 20, temperatureMaxC: 22, humidityMinPercent: 45, humidityMaxPercent: 60 });
  });

  it("uses the same selected-date age as the dashboard weather control", () => {
    const placementDate = new Date("2026-08-18T00:00:00Z");
    const selectedCycleDay = cycleDayFromDate(placementDate, "2026-08-24");

    expect(selectedCycleDay).toBe(7);
    expect(broilerEnvironmentTargetForCycleDay(selectedCycleDay)).toMatchObject({ cycleDay: 7, temperatureMinC: 28, temperatureMaxC: 30 });
  });
});
