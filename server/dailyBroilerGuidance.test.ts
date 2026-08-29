import { describe, expect, it } from "vitest";
import { dailyBroilerGuidanceForCycleDay } from "../shared/dailyBroilerGuidance";
import { cycleDayFromDate } from "../shared/weather";

describe("daily broiler guidance", () => {
  it("selects the brooding guidance for placement day", () => {
    const guidance = dailyBroilerGuidanceForCycleDay(1);
    expect(guidance.phase).toBe("بداية التحضين");
    expect(guidance.checks).toHaveLength(3);
    expect(guidance.title).toContain("أقفاص");
    expect(guidance.checks.join(" ")).toContain("السقايات");
    expect(guidance.checks.join(" ")).not.toContain("فرشة");
  });

  it("updates the guidance when the selected date changes the production age", () => {
    const placementDate = new Date("2026-08-18T00:00:00Z");
    const daySeven = cycleDayFromDate(placementDate, "2026-08-24");
    const dayTwentyTwo = cycleDayFromDate(placementDate, "2026-09-08");

    expect(dailyBroilerGuidanceForCycleDay(daySeven).phase).toBe("استكمال التحضين");
    expect(dailyBroilerGuidanceForCycleDay(dayTwentyTwo).phase).toBe("إدارة النمو");
  });
});
