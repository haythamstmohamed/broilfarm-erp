/**
 * Cycle Financial Analysis & Production Costing Engine
 * محرك التكاليف والتحليل المالي لدورات التسمين
 * BroilFarm Enterprise ERP
 */

import { expenseCategories, type ExpenseCategory, expenseCategoryLabels } from "./expenseManagement";

export interface ExpenseItemInput {
  category: string;
  amountPiasters: number;
}

export interface SaleItemInput {
  totalPiasters: number;
  netWeightGrams: number;
  isDeleted?: boolean;
}

export interface CategoryCostItem {
  category: ExpenseCategory;
  categoryLabel: string;
  amountEgp: number;
  percentageOfTotal: number;
  costPerBirdEgp: number;
  costPerKgEgp: number;
}

export interface CycleFinancialAnalysis {
  production: {
    birdsPlaced: number;
    liveBirds: number;
    totalBiomassKg: number;
    averageWeightKg: number;
    totalFeedKg: number;
    fcr: number;
  };
  costs: {
    totalExpensesEgp: number;
    feedCostEgp: number;
    chickCostEgp: number;
    healthCostEgp: number;
    utilitiesCostEgp: number;
    laborCostEgp: number;
    otherCostEgp: number;
    totalCostPerBirdEgp: number;
    totalCostPerKgEgp: number;
    feedCostPerKgProducedEgp: number;
    categories: CategoryCostItem[];
  };
  revenue: {
    grossRevenueEgp: number;
    totalSoldKg: number;
    averageSellingPricePerKgEgp: number;
    revenuePerBirdPlacedEgp: number;
  };
  profitability: {
    netProfitEgp: number;
    profitMarginPercent: number;
    roiPercent: number;
    netProfitPerBirdEgp: number;
    netProfitPerKgEgp: number;
    isProfitable: boolean;
  };
  breakEven: {
    breakEvenPricePerKgEgp: number;
    breakEvenBiomassKg: number;
    safetyMarginPercent: number;
  };
}

export function computeCycleFinancials(input: {
  birdsPlaced: number;
  totalMortality: number;
  totalFeedKg: number;
  averageWeightGrams: number;
  expenses: ExpenseItemInput[];
  sales: SaleItemInput[];
}): CycleFinancialAnalysis {
  const birdsPlaced = Math.max(1, input.birdsPlaced);
  const liveBirds = Math.max(0, birdsPlaced - input.totalMortality);
  const avgWeightKg = input.averageWeightGrams > 0 ? input.averageWeightGrams / 1000 : 0;
  const theoreticalBiomassKg = liveBirds * avgWeightKg;

  // Aggregate Sales
  const activeSales = input.sales.filter((s) => !s.isDeleted);
  const totalSalesPiasters = activeSales.reduce((sum, s) => sum + (s.totalPiasters || 0), 0);
  const totalSoldGrams = activeSales.reduce((sum, s) => sum + (s.netWeightGrams || 0), 0);
  const totalSoldKg = totalSoldGrams > 0 ? totalSoldGrams / 1000 : theoreticalBiomassKg;
  const grossRevenueEgp = totalSalesPiasters / 100;
  const avgSellingPricePerKgEgp = totalSoldKg > 0 ? grossRevenueEgp / totalSoldKg : 0;

  // Aggregate Expenses by Category
  const categoryTotalsPiasters: Record<ExpenseCategory, number> = {
    chicks: 0,
    feed: 0,
    health: 0,
    labor: 0,
    utilities: 0,
    maintenance: 0,
    transport: 0,
    equipment: 0,
    other: 0,
  };

  let totalExpensesPiasters = 0;

  for (const exp of input.expenses) {
    const cat = exp.category as ExpenseCategory;
    const amount = Number(exp.amountPiasters) || 0;
    totalExpensesPiasters += amount;
    if (cat in categoryTotalsPiasters) {
      categoryTotalsPiasters[cat] += amount;
    } else {
      categoryTotalsPiasters.other += amount;
    }
  }

  const totalExpensesEgp = totalExpensesPiasters / 100;
  const effectiveBiomassKg = totalSoldKg > 0 ? totalSoldKg : Math.max(1, theoreticalBiomassKg);
  const effectiveBirds = liveBirds > 0 ? liveBirds : birdsPlaced;

  const totalCostPerBirdEgp = Number((totalExpensesEgp / effectiveBirds).toFixed(2));
  const totalCostPerKgEgp = Number((totalExpensesEgp / effectiveBiomassKg).toFixed(2));

  // Category breakdown list
  const categoryBreakdown: CategoryCostItem[] = expenseCategories.map((cat) => {
    const catEgp = categoryTotalsPiasters[cat] / 100;
    const pct = totalExpensesEgp > 0 ? (catEgp / totalExpensesEgp) * 100 : 0;
    return {
      category: cat,
      categoryLabel: expenseCategoryLabels[cat] || cat,
      amountEgp: Number(catEgp.toFixed(2)),
      percentageOfTotal: Number(pct.toFixed(1)),
      costPerBirdEgp: Number((catEgp / effectiveBirds).toFixed(2)),
      costPerKgEgp: Number((catEgp / effectiveBiomassKg).toFixed(2)),
    };
  });

  const feedCostEgp = categoryTotalsPiasters.feed / 100;
  const feedCostPerKgProducedEgp = Number((feedCostEgp / effectiveBiomassKg).toFixed(2));

  // Profitability
  const netProfitEgp = Number((grossRevenueEgp - totalExpensesEgp).toFixed(2));
  const profitMarginPercent = grossRevenueEgp > 0 ? Number(((netProfitEgp / grossRevenueEgp) * 100).toFixed(2)) : 0;
  const roiPercent = totalExpensesEgp > 0 ? Number(((netProfitEgp / totalExpensesEgp) * 100).toFixed(2)) : 0;
  const netProfitPerBirdEgp = Number((netProfitEgp / effectiveBirds).toFixed(2));
  const netProfitPerKgEgp = Number((netProfitEgp / effectiveBiomassKg).toFixed(2));

  // Break-Even Analysis
  const breakEvenPricePerKgEgp = effectiveBiomassKg > 0 ? Number((totalExpensesEgp / effectiveBiomassKg).toFixed(2)) : 0;
  const breakEvenBiomassKg = avgSellingPricePerKgEgp > 0 ? Math.round(totalExpensesEgp / avgSellingPricePerKgEgp) : 0;
  const safetyMarginPercent =
    avgSellingPricePerKgEgp > 0 && avgSellingPricePerKgEgp > breakEvenPricePerKgEgp
      ? Number((((avgSellingPricePerKgEgp - breakEvenPricePerKgEgp) / avgSellingPricePerKgEgp) * 100).toFixed(2))
      : 0;

  const fcr = effectiveBiomassKg > 0 ? Number((input.totalFeedKg / effectiveBiomassKg).toFixed(2)) : 0;

  return {
    production: {
      birdsPlaced: input.birdsPlaced,
      liveBirds,
      totalBiomassKg: Number(effectiveBiomassKg.toFixed(1)),
      averageWeightKg: Number(avgWeightKg.toFixed(3)),
      totalFeedKg: input.totalFeedKg,
      fcr,
    },
    costs: {
      totalExpensesEgp: Number(totalExpensesEgp.toFixed(2)),
      feedCostEgp: Number((categoryTotalsPiasters.feed / 100).toFixed(2)),
      chickCostEgp: Number((categoryTotalsPiasters.chicks / 100).toFixed(2)),
      healthCostEgp: Number((categoryTotalsPiasters.health / 100).toFixed(2)),
      utilitiesCostEgp: Number((categoryTotalsPiasters.utilities / 100).toFixed(2)),
      laborCostEgp: Number((categoryTotalsPiasters.labor / 100).toFixed(2)),
      otherCostEgp: Number(
        (
          (categoryTotalsPiasters.maintenance +
            categoryTotalsPiasters.transport +
            categoryTotalsPiasters.equipment +
            categoryTotalsPiasters.other) /
          100
        ).toFixed(2)
      ),
      totalCostPerBirdEgp,
      totalCostPerKgEgp,
      feedCostPerKgProducedEgp,
      categories: categoryBreakdown.filter((c) => c.amountEgp > 0),
    },
    revenue: {
      grossRevenueEgp: Number(grossRevenueEgp.toFixed(2)),
      totalSoldKg: Number(totalSoldKg.toFixed(1)),
      averageSellingPricePerKgEgp: Number(avgSellingPricePerKgEgp.toFixed(2)),
      revenuePerBirdPlacedEgp: Number((grossRevenueEgp / birdsPlaced).toFixed(2)),
    },
    profitability: {
      netProfitEgp,
      profitMarginPercent,
      roiPercent,
      netProfitPerBirdEgp,
      netProfitPerKgEgp,
      isProfitable: netProfitEgp >= 0,
    },
    breakEven: {
      breakEvenPricePerKgEgp,
      breakEvenBiomassKg,
      safetyMarginPercent,
    },
  };
}
