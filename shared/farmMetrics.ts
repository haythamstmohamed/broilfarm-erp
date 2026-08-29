export type DailyMetricInput = { feedKg: number; waterLiters: number; mortality: number; culls: number };

export function calculateLiveBirds(birdsPlaced: number, records: DailyMetricInput[]) {
  const losses = records.reduce((sum, record) => sum + record.mortality + record.culls, 0);
  return Math.max(0, birdsPlaced - losses);
}

export function calculateLivability(birdsPlaced: number, mortality: number, culls = 0) {
  if (birdsPlaced <= 0) return 0;
  return Math.max(0, (birdsPlaced - mortality - culls) / birdsPlaced);
}

export function calculateFcr(totalFeedKg: number, liveBirds: number, averageWeightGrams: number) {
  const liveBiomassKg = liveBirds * (averageWeightGrams / 1000);
  return liveBiomassKg > 0 ? totalFeedKg / liveBiomassKg : null;
}

export function calculateAdg(averageWeightGrams: number, ageDays: number, initialWeightGrams = 42) {
  if (ageDays <= 0 || averageWeightGrams <= 0) return 0;
  return Math.max(0, (averageWeightGrams - initialWeightGrams) / ageDays);
}

export function calculateFeedPerBird(totalFeedKg: number, liveBirds: number) {
  if (liveBirds <= 0) return 0;
  return totalFeedKg / liveBirds;
}

export function calculateWaterToFeedRatio(totalWaterLiters: number, totalFeedKg: number) {
  if (totalFeedKg <= 0) return 0;
  return totalWaterLiters / totalFeedKg;
}

export function calculateCostPerBird(totalExpensesPiasters: number, birdCount: number) {
  if (birdCount <= 0 || totalExpensesPiasters <= 0) return 0;
  return (totalExpensesPiasters / 100) / birdCount;
}

export function calculateCostPerKg(totalExpensesPiasters: number, totalBiomassKg: number) {
  if (totalBiomassKg <= 0 || totalExpensesPiasters <= 0) return 0;
  return (totalExpensesPiasters / 100) / totalBiomassKg;
}

export function calculateRoi(revenuePiasters: number, expensesPiasters: number) {
  if (expensesPiasters <= 0) return 0;
  return ((revenuePiasters - expensesPiasters) / expensesPiasters) * 100;
}

export function calculateEpef({ birdsPlaced, mortality, averageWeightGrams, fcr, ageDays }: { birdsPlaced: number; mortality: number; averageWeightGrams: number; fcr: number | null; ageDays: number }) {
  if (birdsPlaced <= 0 || ageDays <= 0 || !fcr || fcr <= 0) return null;
  const livability = (birdsPlaced - mortality) / birdsPlaced;
  return (livability * averageWeightGrams * 10) / (fcr * ageDays);
}
