import { describe, expect, it } from "vitest";
import { arabicWeatherLabel, cycleDayFromDate, weatherPanelState } from "../shared/weather";

describe("cycle weather synchronization", () => {
  it("aligns each calendar weather date with the correct one-indexed production-cycle day", () => {
    const placementDate = new Date("2026-08-01T00:00:00.000Z");
    expect(cycleDayFromDate(placementDate, "2026-08-01")).toBe(1);
    expect(cycleDayFromDate(placementDate, "2026-08-08")).toBe(8);
  });

  it("uses the selected cycle day as the flock age shown on the dashboard", () => {
    const placementDate = new Date("2026-08-01T00:00:00.000Z");
    expect(cycleDayFromDate(placementDate, "2026-08-15")).toBe(15);
  });

  it("never returns a negative cycle day for dates before placement", () => {
    expect(cycleDayFromDate(new Date("2026-08-10T00:00:00.000Z"), "2026-08-08")).toBe(0);
  });

  it("provides Arabic weather labels for dashboard-friendly WMO conditions", () => {
    expect(arabicWeatherLabel(0)).toBe("صحو");
    expect(arabicWeatherLabel(63)).toBe("أمطار");
    expect(arabicWeatherLabel(95)).toBe("عواصف رعدية");
  });

  it("resolves loading, missing-location, ready, and empty dashboard weather states", () => {
    expect(weatherPanelState(undefined, true)).toBe("loading");
    expect(weatherPanelState({ state: "location_required" }, false)).toBe("location_required");
    expect(weatherPanelState({ state: "ready" }, false)).toBe("ready");
    expect(weatherPanelState(undefined, false)).toBe("empty");
  });
});
