export const DEFAULT_FEED_BAG_WEIGHT_KG = 50;
export const DEFAULT_WATER_TO_FEED_RATIO_L_PER_KG = 1.7;
export const DEFAULT_BUCKETS_PER_BAG = 4;

// Cobb 500 male performance objective: daily feed consumption in grams per bird.
// Source: Cobb 500 Broiler Performance & Nutrition Supplement (daily feed table).
const DAILY_FEED_GRAMS_PER_BIRD = [
  0, 13, 17, 21, 23, 27, 31, 35, 39, 44, 48, 54, 58, 64, 68, 75, 81, 87, 93, 98, 105,
  111, 117, 123, 130, 134, 141, 148, 152, 158, 163, 169, 174, 180, 182, 189, 193, 197,
  201, 205, 209, 213, 216, 220, 222, 225, 227, 231, 233, 235, 237, 239, 240, 242, 243,
  245, 245, 245, 245, 245, 245, 245, 245, 245,
];

// Cobb 500 as-hatched performance objective: expected live weight in grams.
// Source: Cobb 500 Broiler Performance & Nutrition Supplement (metric table).
const EXPECTED_LIVE_WEIGHT_GRAMS_PER_BIRD = [
  42, 55, 71, 90, 112, 138, 168, 202, 240, 283, 330, 382, 440, 503, 570,
  639, 711, 786, 864, 945, 1029, 1116, 1205, 1296, 1390, 1486, 1583, 1682,
  1783, 1886, 1989, 2094, 2200, 2306, 2413, 2521, 2629, 2738, 2846, 2954,
  3062, 3170, 3278, 3384, 3490, 3595, 3699, 3801, 3902, 4001, 4099, 4195,
  4289, 4380, 4470, 4557, 4641,
];

export function feedGramsPerBirdForCycleDay(cycleDay: number) {
  if (!Number.isFinite(cycleDay) || cycleDay < 1) return 0;
  return DAILY_FEED_GRAMS_PER_BIRD[Math.min(Math.floor(cycleDay), DAILY_FEED_GRAMS_PER_BIRD.length - 1)] ?? 0;
}

export function expectedLiveWeightGramsForCycleDay(cycleDay: number) {
  if (!Number.isFinite(cycleDay) || cycleDay < 1) return 0;
  return EXPECTED_LIVE_WEIGHT_GRAMS_PER_BIRD[Math.min(Math.floor(cycleDay), EXPECTED_LIVE_WEIGHT_GRAMS_PER_BIRD.length - 1)] ?? 0;
}

export function forecastHouseConsumption({ birds, cycleDay, bagWeightKg = DEFAULT_FEED_BAG_WEIGHT_KG, waterToFeedRatio = DEFAULT_WATER_TO_FEED_RATIO_L_PER_KG, bucketsPerBag = DEFAULT_BUCKETS_PER_BAG }: { birds: number; cycleDay: number; bagWeightKg?: number; waterToFeedRatio?: number; bucketsPerBag?: number }) {
  const dailyFeedGramsPerBird = feedGramsPerBirdForCycleDay(cycleDay);
  const feedKg = (Math.max(0, birds) * dailyFeedGramsPerBird) / 1000;
  const safeBagWeightKg = bagWeightKg > 0 ? bagWeightKg : DEFAULT_FEED_BAG_WEIGHT_KG;
  const feedBags = feedKg / safeBagWeightKg;
  return {
    dailyFeedGramsPerBird,
    feedKg,
    feedBags,
    feedBuckets: feedBags * (bucketsPerBag > 0 ? bucketsPerBag : DEFAULT_BUCKETS_PER_BAG),
    waterLiters: feedKg * waterToFeedRatio,
  };
}
