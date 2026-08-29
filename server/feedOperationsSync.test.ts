import { describe, expect, it } from "vitest";
import { dailyFeedIssueBags, feedInventorySnapshot, inventoryMovementDelta } from "../shared/feedInventory";

describe("daily feed to inventory synchronization", () => {
  it("converts a house feed reading to an exact negative bag movement", () => {
    expect(dailyFeedIssueBags(1026, 50)).toBe(-20.52);
    expect(inventoryMovementDelta("issue", dailyFeedIssueBags(1026, 50))).toBe(-20.52);
  });

  it("preserves the full 81-tonne demo consumption across its three houses", () => {
    const issuedBags = [43086, 15510, 22404].reduce((total, feedKg) => total + dailyFeedIssueBags(feedKg, 50), 0);
    expect(issuedBags).toBe(-1620);
  });

  it("reduces the available stock and exposes a reorder state after consumption", () => {
    const issuedBags = [43086, 15510, 22404].reduce((total, feedKg) => total + dailyFeedIssueBags(feedKg, 50), 1620);
    const snapshot = feedInventorySnapshot({ availableBags: issuedBags, reorderPointBags: 20, bagWeightKg: 50, forecastFeedKg: 1000, hasTrackedStock: true });
    expect(snapshot.availableBags).toBe(0);
    expect(snapshot.status).toBe("critical");
  });

  it("rejects invalid feed and bag-weight values before a movement can be created", () => {
    expect(() => dailyFeedIssueBags(-1, 50)).toThrow();
    expect(() => dailyFeedIssueBags(100, 0)).toThrow();
  });
});
