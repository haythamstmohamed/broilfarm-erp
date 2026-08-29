import { getExpectedWeightGrams } from "./alertsEngine";

export type ProfitabilitySimulationInput = {
  birdsPlaced: number;
  currentAgeDays: number;
  currentLiveBirds: number;
  currentAvgWeightGrams: number;
  feedCostPerKgEgp: number;
  chickCostPerBirdEgp: number;
  veterinaryCostPerBirdEgp?: number;
  fixedDailyOverheadEgp: number;
  targetSellingPricePerKgEgp: number;
  expectedDailyMortalityRate?: number; // e.g. 0.001 (0.1% daily)
};

export type DayProfitProjection = {
  ageDays: number;
  projectedWeightGrams: number;
  projectedLiveBirds: number;
  totalBiomassKg: number;
  feedConsumedPerBirdKg: number;
  totalFeedConsumedKg: number;
  totalFeedCostEgp: number;
  totalChickCostEgp: number;
  totalVeterinaryCostEgp: number;
  totalOverheadCostEgp: number;
  totalExpensesEgp: number;
  grossRevenueEgp: number;
  netProfitEgp: number;
  profitPerBirdEgp: number;
  profitPerCycleDayEgp: number;
  roiPercent: number;
  fcr: number;
  isOptimalHarvestDay?: boolean;
};

export type ProfitabilitySimulationResult = {
  currentStatus: {
    ageDays: number;
    liveBirds: number;
    avgWeightGrams: number;
    estimatedCostToDateEgp: number;
  };
  optimalHarvest: {
    optimalAgeDays: number;
    optimalWeightGrams: number;
    maxNetProfitEgp: number;
    maxProfitPerDayEgp: number;
    optimalRoiPercent: number;
  };
  dailyProjections: DayProfitProjection[];
};

export function simulateCycleProfitability(
  input: ProfitabilitySimulationInput
): ProfitabilitySimulationResult {
  const currentAge = Math.max(1, input.currentAgeDays);
  const dailyMortality = input.expectedDailyMortalityRate ?? 0.001;
  const vetCostPerBird = input.veterinaryCostPerBirdEgp ?? 4.5;

  const projections: DayProfitProjection[] = [];
  let bestDay = currentAge;
  let highestNetProfit = -Infinity;

  // Simulate from current age up to 45 days
  let runningLiveBirds = input.currentLiveBirds;

  for (let age = Math.min(currentAge, 25); age <= 45; age++) {
    // Determine expected weight: scale standard Ross curve relative to current actual performance
    const standardCurrent = getExpectedWeightGrams(currentAge);
    const standardAtAge = getExpectedWeightGrams(age);
    const performanceFactor = standardCurrent > 0 ? input.currentAvgWeightGrams / standardCurrent : 1.0;
    const projectedWeightGrams = Math.round(standardAtAge * Math.max(0.7, Math.min(1.3, performanceFactor)));

    // Cumulative feed estimation based on standard broiler feed intake curve
    // Typical cumulative feed: age 28 -> 2.4kg, age 35 -> 3.7kg, age 42 -> 5.2kg
    const feedPerBirdKg = Number(((projectedWeightGrams / 1000) * (1.25 + (age / 40) * 0.4)).toFixed(3));
    const fcr = Number((feedPerBirdKg / (projectedWeightGrams / 1000)).toFixed(2));

    if (age > currentAge) {
      runningLiveBirds = Math.round(runningLiveBirds * (1 - dailyMortality));
    }

    const totalBiomassKg = (runningLiveBirds * projectedWeightGrams) / 1000;
    const totalFeedKg = runningLiveBirds * feedPerBirdKg;

    const totalChickCost = input.birdsPlaced * input.chickCostPerBirdEgp;
    const totalFeedCost = totalFeedKg * input.feedCostPerKgEgp;
    const totalVetCost = input.birdsPlaced * vetCostPerBird;
    const totalOverhead = age * input.fixedDailyOverheadEgp;
    const totalExpenses = totalChickCost + totalFeedCost + totalVetCost + totalOverhead;

    const grossRevenue = totalBiomassKg * input.targetSellingPricePerKgEgp;
    const netProfit = grossRevenue - totalExpenses;
    const profitPerBird = runningLiveBirds > 0 ? Number((netProfit / runningLiveBirds).toFixed(2)) : 0;
    const profitPerCycleDay = age > 0 ? Number((netProfit / age).toFixed(2)) : 0;
    const roiPercent = totalExpenses > 0 ? Number(((netProfit / totalExpenses) * 100).toFixed(2)) : 0;

    if (netProfit > highestNetProfit && age >= currentAge) {
      highestNetProfit = netProfit;
      bestDay = age;
    }

    projections.push({
      ageDays: age,
      projectedWeightGrams,
      projectedLiveBirds: runningLiveBirds,
      totalBiomassKg: Math.round(totalBiomassKg),
      feedConsumedPerBirdKg: feedPerBirdKg,
      totalFeedConsumedKg: Math.round(totalFeedKg),
      totalFeedCostEgp: Math.round(totalFeedCost),
      totalChickCostEgp: Math.round(totalChickCost),
      totalVeterinaryCostEgp: Math.round(totalVetCost),
      totalOverheadCostEgp: Math.round(totalOverhead),
      totalExpensesEgp: Math.round(totalExpenses),
      grossRevenueEgp: Math.round(grossRevenue),
      netProfitEgp: Math.round(netProfit),
      profitPerBirdEgp: profitPerBird,
      profitPerCycleDayEgp: profitPerCycleDay,
      roiPercent,
      fcr,
    });
  }

  // Mark optimal day
  projections.forEach((p) => {
    if (p.ageDays === bestDay) {
      p.isOptimalHarvestDay = true;
    }
  });

  const optimalProj = projections.find((p) => p.ageDays === bestDay) || projections[0];

  return {
    currentStatus: {
      ageDays: currentAge,
      liveBirds: input.currentLiveBirds,
      avgWeightGrams: input.currentAvgWeightGrams,
      estimatedCostToDateEgp:
        input.birdsPlaced * input.chickCostPerBirdEgp +
        currentAge * input.fixedDailyOverheadEgp,
    },
    optimalHarvest: {
      optimalAgeDays: bestDay,
      optimalWeightGrams: optimalProj.projectedWeightGrams,
      maxNetProfitEgp: optimalProj.netProfitEgp,
      maxProfitPerDayEgp: optimalProj.profitPerCycleDayEgp,
      optimalRoiPercent: optimalProj.roiPercent,
    },
    dailyProjections: projections,
  };
}
