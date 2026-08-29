import { describe, expect, it } from "vitest";
import { feedInventorySnapshot, inventoryMovementDelta } from "../shared/feedInventory";

describe("feed inventory planning", () => {
  it("converts stock to days of cover and flags the early reorder horizon", () => {
    const snapshot = feedInventorySnapshot({ availableBags: 10, reorderPointBags: 4, bagWeightKg: 50, forecastFeedKg: 100 });
    expect(snapshot.daysOfCover).toBe(5);
    expect(snapshot.status).toBe("reorder");
    expect(snapshot.recommendedOrderBags).toBe(8);
  });

  it("flags zero stock as setup and validates signed stock movements", () => {
    expect(feedInventorySnapshot({ availableBags: 0, reorderPointBags: 5, bagWeightKg: 50, forecastFeedKg: 100 }).status).toBe("setup");
    expect(inventoryMovementDelta("receipt", 12)).toBe(12);
    expect(inventoryMovementDelta("issue", -3)).toBe(-3);
    expect(() => inventoryMovementDelta("issue", 3)).toThrow("remove bags");
  });

  it("distinguishes healthy, reorder, and critical stock levels against forecast demand", () => {
    const base = { reorderPointBags: 4, bagWeightKg: 50, forecastFeedKg: 100 };
    expect(feedInventorySnapshot({ ...base, availableBags: 20 }).status).toBe("healthy");
    expect(feedInventorySnapshot({ ...base, availableBags: 10 }).status).toBe("reorder");
    expect(feedInventorySnapshot({ ...base, availableBags: 4 }).status).toBe("critical");
  });
});
