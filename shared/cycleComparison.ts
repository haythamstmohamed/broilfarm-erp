/**
 * Multi-Cycle Comparative Analytics & Benchmarking Engine
 * محرك المقارنة التحليلية بين دورات التسمين
 * BroilFarm Enterprise ERP
 */

import { calculateAdvancedEpef } from "./productionIntelligence";
import { computeCycleFinancials } from "./cycleFinancials";

export interface CycleBenchmarkInput {
  cycleId: number;
  cycleName: string;
  farmName: string;
  placementDate: Date | string;
  birdsPlaced: number;
  status: string;
  totalMortality: number;
  totalFeedKg: number;
  averageWeightGrams: number;
  totalExpensesPiasters: number;
  totalSalesPiasters: number;
  totalSoldWeightGrams?: number;
}

export interface CycleComparisonMetric {
  cycleId: number;
  cycleName: string;
  farmName: string;
  placementDate: string;
  status: string;
  birdsPlaced: number;
  liveBirds: number;
  livabilityPercent: number;
  totalFeedKg: number;
  averageWeightGrams: number;
  fcr: number;
  epef: number;
  totalExpensesEgp: number;
  costPerBirdEgp: number;
  costPerKgEgp: number;
  totalSalesEgp: number;
  netProfitEgp: number;
  roiPercent: number;
}

export interface CycleComparisonReport {
  cycles: CycleComparisonMetric[];
  bestEpefCycleId: number | null;
  lowestFcrCycleId: number | null;
  highestProfitCycleId: number | null;
  averages: {
    avgLivabilityPercent: number;
    avgFcr: number;
    avgEpef: number;
    avgCostPerKgEgp: number;
    avgNetProfitEgp: number;
  };
}

export function compareCycles(inputs: CycleBenchmarkInput[]): CycleComparisonReport {
  if (!inputs || inputs.length === 0) {
    return {
      cycles: [],
      bestEpefCycleId: null,
      lowestFcrCycleId: null,
      highestProfitCycleId: null,
      averages: {
        avgLivabilityPercent: 0,
        avgFcr: 0,
        avgEpef: 0,
        avgCostPerKgEgp: 0,
        avgNetProfitEgp: 0,
      },
    };
  }

  const metricsList: CycleComparisonMetric[] = inputs.map((item) => {
    const birdsPlaced = Math.max(1, item.birdsPlaced);
    const liveBirds = Math.max(0, birdsPlaced - item.totalMortality);
    const livabilityRatio = liveBirds / birdsPlaced;
    const livabilityPercent = Number((livabilityRatio * 100).toFixed(2));

    const avgWeightKg = item.averageWeightGrams > 0 ? item.averageWeightGrams / 1000 : 0;
    const totalSoldKg = item.totalSoldWeightGrams && item.totalSoldWeightGrams > 0
      ? item.totalSoldWeightGrams / 1000
      : liveBirds * avgWeightKg;

    const fcr = totalSoldKg > 0 ? Number((item.totalFeedKg / totalSoldKg).toFixed(2)) : 0;

    const ageDays = Math.max(
      1,
      Math.ceil((new Date().getTime() - new Date(item.placementDate).getTime()) / (1000 * 60 * 60 * 24))
    );

    const epefResult = calculateAdvancedEpef({
      birdsPlaced,
      totalMortality: item.totalMortality,
      averageWeightGrams: item.averageWeightGrams,
      actualFcr: fcr > 0 ? fcr : 1.6,
      ageDays: Math.min(45, ageDays),
    });

    const totalExpensesEgp = (item.totalExpensesPiasters || 0) / 100;
    const totalSalesEgp = (item.totalSalesPiasters || 0) / 100;
    const netProfitEgp = Number((totalSalesEgp - totalExpensesEgp).toFixed(2));
    const costPerBirdEgp = Number((totalExpensesEgp / Math.max(1, liveBirds)).toFixed(2));
    const costPerKgEgp = Number((totalExpensesEgp / Math.max(1, totalSoldKg)).toFixed(2));
    const roiPercent = totalExpensesEgp > 0 ? Number(((netProfitEgp / totalExpensesEgp) * 100).toFixed(2)) : 0;

    return {
      cycleId: item.cycleId,
      cycleName: item.cycleName,
      farmName: item.farmName,
      placementDate: new Date(item.placementDate).toLocaleDateString("ar-EG"),
      status: item.status,
      birdsPlaced,
      liveBirds,
      livabilityPercent,
      totalFeedKg: item.totalFeedKg,
      averageWeightGrams: item.averageWeightGrams,
      fcr,
      epef: epefResult?.epefScore || 0,
      totalExpensesEgp,
      costPerBirdEgp,
      costPerKgEgp,
      totalSalesEgp,
      netProfitEgp,
      roiPercent,
    };
  });

  // Determine benchmarks
  let bestEpefId: number | null = null;
  let maxEpef = -1;
  let lowestFcrId: number | null = null;
  let minFcr = 999;
  let highestProfitId: number | null = null;
  let maxProfit = -Infinity;

  for (const m of metricsList) {
    if (m.epef > maxEpef) {
      maxEpef = m.epef;
      bestEpefId = m.cycleId;
    }
    if (m.fcr > 0 && m.fcr < minFcr) {
      minFcr = m.fcr;
      lowestFcrId = m.cycleId;
    }
    if (m.netProfitEgp > maxProfit) {
      maxProfit = m.netProfitEgp;
      highestProfitId = m.cycleId;
    }
  }

  const count = metricsList.length;
  const avgLivabilityPercent = Number((metricsList.reduce((s, m) => s + m.livabilityPercent, 0) / count).toFixed(2));
  const avgFcr = Number((metricsList.reduce((s, m) => s + m.fcr, 0) / count).toFixed(2));
  const avgEpef = Math.round(metricsList.reduce((s, m) => s + m.epef, 0) / count);
  const avgCostPerKgEgp = Number((metricsList.reduce((s, m) => s + m.costPerKgEgp, 0) / count).toFixed(2));
  const avgNetProfitEgp = Number((metricsList.reduce((s, m) => s + m.netProfitEgp, 0) / count).toFixed(2));

  return {
    cycles: metricsList,
    bestEpefCycleId: bestEpefId,
    lowestFcrCycleId: lowestFcrId,
    highestProfitCycleId: highestProfitId,
    averages: {
      avgLivabilityPercent,
      avgFcr,
      avgEpef,
      avgCostPerKgEgp,
      avgNetProfitEgp,
    },
  };
}
