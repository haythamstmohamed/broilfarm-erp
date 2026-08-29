export type FeedStockStatus = "setup" | "healthy" | "reorder" | "critical";

export function feedInventorySnapshot(input: { availableBags: number; reorderPointBags: number; bagWeightKg: number; forecastFeedKg: number; hasTrackedStock?: boolean }) {
  const availableBags = Math.max(input.availableBags, 0);
  const bagWeightKg = Math.max(input.bagWeightKg, 1);
  const dailyDemandBags = Math.max(input.forecastFeedKg, 0) / bagWeightKg;
  const daysOfCover = dailyDemandBags > 0 ? availableBags / dailyDemandBags : null;
  const recommendedOrderBags = Math.max(Math.ceil((dailyDemandBags * 7) + input.reorderPointBags - availableBags), 0);
  const status: FeedStockStatus = availableBags === 0
    ? input.hasTrackedStock ? "critical" : "setup"
    : (availableBags <= input.reorderPointBags || (daysOfCover !== null && daysOfCover <= 2))
      ? "critical"
      : daysOfCover !== null && daysOfCover <= 7
        ? "reorder"
        : "healthy";
  return { availableBags, availableKg: availableBags * bagWeightKg, dailyDemandBags, daysOfCover, recommendedOrderBags, status };
}

export function inventoryMovementDelta(type: "opening" | "receipt" | "issue" | "adjustment", bags: number) {
  if (!Number.isFinite(bags) || bags === 0) throw new Error("Quantity must be a non-zero number of bags");
  if ((type === "opening" || type === "receipt") && bags < 0) throw new Error("Opening and receipt movements must add bags");
  if (type === "issue" && bags > 0) throw new Error("Issue movements must remove bags");
  return bags;
}

/** Converts a daily feed reading into an exact stock issue in bags, rounded to inventory precision. */
export function dailyFeedIssueBags(feedKg: number, bagWeightKg: number): number {
  if (!Number.isFinite(feedKg) || feedKg < 0) throw new Error("Daily feed must be a non-negative number");
  if (!Number.isFinite(bagWeightKg) || bagWeightKg <= 0) throw new Error("Bag weight must be a positive number");
  return feedKg === 0 ? 0 : -Number((feedKg / bagWeightKg).toFixed(4));
}
