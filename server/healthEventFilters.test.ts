import { describe, expect, it } from "vitest";
import { filterHealthEvents, healthEventAgeDay } from "../shared/healthEventFilters";

const placementDate = new Date("2026-07-10T00:00:00.000Z");
const records = [
  { id: 1, houseId: 10, date: "2026-07-10", eventType: "vaccination" as const },
  { id: 2, houseId: 10, date: "2026-07-16", eventType: "medication" as const },
  { id: 3, houseId: 20, date: "2026-07-16", eventType: "vaccination" as const },
];

describe("health event filters", () => {
  it("calculates the bird age day from the cycle placement date", () => {
    expect(healthEventAgeDay("2026-07-16", placementDate)).toBe(7);
  });

  it("combines house, age-day, and event-type filters without changing source records", () => {
    const result = filterHealthEvents(records, { houseId: 10, ageDay: 7, eventType: "medication" }, placementDate);
    expect(result.map((record) => record.id)).toEqual([2]);
    expect(records).toHaveLength(3);
  });
});
