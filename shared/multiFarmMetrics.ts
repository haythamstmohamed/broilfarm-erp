/**
 * Multi-Farm Executive Metrics & Benchmarking Engine
 * BroilFarm Enterprise ERP
 */

import { calculateAdg, calculateCostPerBird, calculateCostPerKg, calculateEpef, calculateFcr, calculateFeedPerBird, calculateLivability } from "./farmMetrics";

export type FarmPerformanceSummary = {
  farmId: number;
  farmName: string;
  governorate?: string | null;
  hasActiveCycle: boolean;
  cycleId?: number;
  cycleName?: string;
  cycleAgeDays: number;
  birdsPlaced: number;
  liveBirds: number;
  mortalityCount: number;
  livabilityPercent: number;
  totalFeedKg: number;
  averageWeightGrams: number;
  fcr: number;
  epef: number;
  totalExpensesEgp: number;
  totalSalesEgp: number;
  netMarginEgp: number;
  statusGrade: "ممتاز" | "جيد" | "متوسط" | "تنبيه" | "حرج";
};

export type ExecutiveCompanyDashboard = {
  companyStats: {
    totalFarms: number;
    activeFarmsCount: number;
    totalBirdsPlaced: number;
    totalLiveBirds: number;
    totalMortality: number;
    averageLivability: number;
    totalFeedConsumedKg: number;
    weightedAverageFcr: number;
    weightedAverageEpef: number;
    totalSalesRevenueEgp: number;
    totalExpensesEgp: number;
    estimatedNetProfitEgp: number;
  };
  farmRankings: FarmPerformanceSummary[];
};

export function gradeFarmPerformance(epef: number, livability: number): "ممتاز" | "جيد" | "متوسط" | "تنبيه" | "حرج" {
  if (epef >= 340 && livability >= 95) return "ممتاز";
  if (epef >= 300 && livability >= 93) return "جيد";
  if (epef >= 260 && livability >= 90) return "متوسط";
  if (epef >= 220 || livability >= 85) return "تنبيه";
  return "حرج";
}

export function computeExecutiveDashboard(input: {
  farms: Array<{ id: number; name: string; governorate?: string | null }>;
  cycles: Array<{ id: number; farmId: number; name: string; placementDate: Date | string; birdsPlaced: number; status: string }>;
  dailyRecords: Array<{ cycleId: number; recordDate: Date | string; feedKg: number; waterLiters: number; mortality: number; culls: number }>;
  weightSamples: Array<{ cycleId: number; sampleDate: Date | string; averageWeightGrams: number }>;
  expenses: Array<{ farmId: number; cycleId?: number | null; amountPiasters: number }>;
  sales: Array<{ cycleId: number; netWeightGrams: number; totalPiasters: number; isDeleted: boolean }>;
}): ExecutiveCompanyDashboard {
  const farmSummaries: FarmPerformanceSummary[] = [];

  let aggregateBirdsPlaced = 0;
  let aggregateLiveBirds = 0;
  let aggregateMortality = 0;
  let aggregateFeedKg = 0;
  let aggregateSalesPiasters = 0;
  let aggregateExpensesPiasters = 0;

  let totalWeightedFcr = 0;
  let totalWeightedEpef = 0;
  let activeFarmsCount = 0;

  const now = new Date();

  for (const farm of input.farms) {
    const farmCycles = input.cycles.filter((c) => c.farmId === farm.id);
    const activeCycle = farmCycles.find((c) => c.status === "active") ?? farmCycles[0];

    const farmExpenses = input.expenses.filter((e) => e.farmId === farm.id);
    const totalFarmExpensesPiasters = farmExpenses.reduce((sum, e) => sum + e.amountPiasters, 0);

    if (!activeCycle) {
      farmSummaries.push({
        farmId: farm.id,
        farmName: farm.name,
        governorate: farm.governorate,
        hasActiveCycle: false,
        cycleAgeDays: 0,
        birdsPlaced: 0,
        liveBirds: 0,
        mortalityCount: 0,
        livabilityPercent: 100,
        totalFeedKg: 0,
        averageWeightGrams: 0,
        fcr: 0,
        epef: 0,
        totalExpensesEgp: totalFarmExpensesPiasters / 100,
        totalSalesEgp: 0,
        netMarginEgp: -(totalFarmExpensesPiasters / 100),
        statusGrade: "متوسط",
      });
      continue;
    }

    activeFarmsCount += 1;
    const placementDate = new Date(activeCycle.placementDate);
    const cycleAgeDays = Math.max(1, Math.floor((now.getTime() - placementDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const cycleRecords = input.dailyRecords.filter((r) => r.cycleId === activeCycle.id);
    const cycleWeights = input.weightSamples.filter((w) => w.cycleId === activeCycle.id).sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime());
    const cycleSales = input.sales.filter((s) => s.cycleId === activeCycle.id && !s.isDeleted);

    const totalFeedKg = cycleRecords.reduce((sum, r) => sum + r.feedKg, 0);
    const mortalityCount = cycleRecords.reduce((sum, r) => sum + r.mortality + r.culls, 0);
    const liveBirds = Math.max(0, activeCycle.birdsPlaced - mortalityCount);
    const livabilityRatio = calculateLivability(activeCycle.birdsPlaced, mortalityCount);
    const livabilityPercent = Number((livabilityRatio * 100).toFixed(2));

    const latestWeightGrams = cycleWeights[0]?.averageWeightGrams ?? 0;
    const fcr = calculateFcr(totalFeedKg, liveBirds, latestWeightGrams) ?? 0;
    const epef = calculateEpef({ birdsPlaced: activeCycle.birdsPlaced, mortality: mortalityCount, averageWeightGrams: latestWeightGrams, fcr, ageDays: cycleAgeDays }) ?? 0;

    const totalSalesPiasters = cycleSales.reduce((sum, s) => sum + s.totalPiasters, 0);
    const totalSalesEgp = totalSalesPiasters / 100;
    const totalExpensesEgp = totalFarmExpensesPiasters / 100;
    const netMarginEgp = totalSalesEgp - totalExpensesEgp;

    const statusGrade = gradeFarmPerformance(epef, livabilityPercent);

    farmSummaries.push({
      farmId: farm.id,
      farmName: farm.name,
      governorate: farm.governorate,
      hasActiveCycle: true,
      cycleId: activeCycle.id,
      cycleName: activeCycle.name,
      cycleAgeDays,
      birdsPlaced: activeCycle.birdsPlaced,
      liveBirds,
      mortalityCount,
      livabilityPercent,
      totalFeedKg,
      averageWeightGrams: latestWeightGrams,
      fcr,
      epef,
      totalExpensesEgp,
      totalSalesEgp,
      netMarginEgp,
      statusGrade,
    });

    aggregateBirdsPlaced += activeCycle.birdsPlaced;
    aggregateLiveBirds += liveBirds;
    aggregateMortality += mortalityCount;
    aggregateFeedKg += totalFeedKg;
    aggregateSalesPiasters += totalSalesPiasters;
    aggregateExpensesPiasters += totalFarmExpensesPiasters;

    if (epef > 0) {
      totalWeightedEpef += epef * liveBirds;
    }
    if (fcr > 0) {
      totalWeightedFcr += fcr * liveBirds;
    }
  }

  // Sort farms by EPEF descending (best performing first)
  farmSummaries.sort((a, b) => b.epef - a.epef);

  const averageLivability = aggregateBirdsPlaced > 0 ? ((aggregateBirdsPlaced - aggregateMortality) / aggregateBirdsPlaced) * 100 : 100;
  const weightedAverageFcr = aggregateLiveBirds > 0 ? totalWeightedFcr / aggregateLiveBirds : 0;
  const weightedAverageEpef = aggregateLiveBirds > 0 ? totalWeightedEpef / aggregateLiveBirds : 0;

  return {
    companyStats: {
      totalFarms: input.farms.length,
      activeFarmsCount,
      totalBirdsPlaced: aggregateBirdsPlaced,
      totalLiveBirds: aggregateLiveBirds,
      totalMortality: aggregateMortality,
      averageLivability: Number(averageLivability.toFixed(2)),
      totalFeedConsumedKg: aggregateFeedKg,
      weightedAverageFcr: Number(weightedAverageFcr.toFixed(2)),
      weightedAverageEpef: Number(weightedAverageEpef.toFixed(1)),
      totalSalesRevenueEgp: aggregateSalesPiasters / 100,
      totalExpensesEgp: aggregateExpensesPiasters / 100,
      estimatedNetProfitEgp: (aggregateSalesPiasters - aggregateExpensesPiasters) / 100,
    },
    farmRankings: farmSummaries,
  };
}
