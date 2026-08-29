/**
 * Enterprise Poultry Report Generator
 * BroilFarm Enterprise ERP
 */

import { calculateAdg, calculateCostPerBird, calculateCostPerKg, calculateEpef, calculateFcr, calculateFeedPerBird, calculateLivability, calculateRoi } from "./farmMetrics";

export type CycleAuditReportData = {
  header: {
    companyName?: string;
    farmName: string;
    farmGovernorate?: string | null;
    cycleName: string;
    placementDate: string;
    ageDays: number;
    birdsPlaced: number;
    status: string;
    generatedAt: string;
  };
  kpiSummary: {
    liveBirds: number;
    totalLosses: number;
    livabilityPercent: number;
    totalFeedKg: number;
    feedPerBirdKg: number;
    averageWeightGrams: number;
    fcr: number;
    epef: number;
    adgGrams: number;
    totalWaterLiters: number;
    waterToFeedRatio: number;
  };
  financialSummary: {
    totalSalesEgp: number;
    totalExpensesEgp: number;
    feedExpensesEgp: number;
    chickExpensesEgp: number;
    vetExpensesEgp: number;
    otherExpensesEgp: number;
    netProfitEgp: number;
    costPerBirdEgp: number;
    costPerKgEgp: number;
    roiPercent: number;
  };
  dailyLog: Array<{
    dayNumber: number;
    date: string;
    feedKg: number;
    waterLiters: number;
    mortality: number;
    culls: number;
    cumulativeLosses: number;
    cumulativeLossPercent: number;
    averageWeightGrams?: number;
  }>;
};

export function generateCycleAuditReport(input: {
  companyName?: string;
  farm: { name: string; governorate?: string | null };
  cycle: { name: string; placementDate: Date | string; birdsPlaced: number; status: string };
  dailyRecords: Array<{ recordDate: Date | string; feedKg: number; waterLiters: number; mortality: number; culls: number }>;
  weightSamples: Array<{ sampleDate: Date | string; averageWeightGrams: number }>;
  expenses: Array<{ category: string; amountPiasters: number }>;
  sales: Array<{ totalPiasters: number; netWeightGrams: number; isDeleted: boolean }>;
}): CycleAuditReportData {
  const placement = new Date(input.cycle.placementDate);
  const now = new Date();
  const ageDays = Math.max(1, Math.floor((now.getTime() - placement.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Sort records
  const sortedRecords = [...input.dailyRecords].sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime());
  const sortedWeights = [...input.weightSamples].sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime());

  const totalFeedKg = sortedRecords.reduce((sum, r) => sum + r.feedKg, 0);
  const totalWaterLiters = sortedRecords.reduce((sum, r) => sum + r.waterLiters, 0);
  const totalLosses = sortedRecords.reduce((sum, r) => sum + r.mortality + r.culls, 0);
  const liveBirds = Math.max(0, input.cycle.birdsPlaced - totalLosses);

  const livabilityRatio = calculateLivability(input.cycle.birdsPlaced, totalLosses);
  const livabilityPercent = Number((livabilityRatio * 100).toFixed(2));
  const latestWeightGrams = sortedWeights[0]?.averageWeightGrams ?? 0;
  const fcr = calculateFcr(totalFeedKg, liveBirds, latestWeightGrams) ?? 0;
  const epef = calculateEpef({ birdsPlaced: input.cycle.birdsPlaced, mortality: totalLosses, averageWeightGrams: latestWeightGrams, fcr, ageDays }) ?? 0;
  const adgGrams = calculateAdg(latestWeightGrams, ageDays);
  const feedPerBirdKg = calculateFeedPerBird(totalFeedKg, liveBirds);
  const waterToFeedRatio = totalFeedKg > 0 ? Number((totalWaterLiters / totalFeedKg).toFixed(2)) : 0;

  // Expenses breakdown
  let feedExpensesPiasters = 0;
  let chickExpensesPiasters = 0;
  let vetExpensesPiasters = 0;
  let otherExpensesPiasters = 0;

  for (const exp of input.expenses) {
    if (exp.category === "feed") feedExpensesPiasters += exp.amountPiasters;
    else if (exp.category === "chicks") chickExpensesPiasters += exp.amountPiasters;
    else if (exp.category === "veterinary" || exp.category === "disinfection") vetExpensesPiasters += exp.amountPiasters;
    else otherExpensesPiasters += exp.amountPiasters;
  }

  const totalExpensesPiasters = feedExpensesPiasters + chickExpensesPiasters + vetExpensesPiasters + otherExpensesPiasters;
  const totalSalesPiasters = input.sales.filter((s) => !s.isDeleted).reduce((sum, s) => sum + s.totalPiasters, 0);
  const totalProducedKg = (liveBirds * latestWeightGrams) / 1000;

  const totalSalesEgp = totalSalesPiasters / 100;
  const totalExpensesEgp = totalExpensesPiasters / 100;
  const netProfitEgp = totalSalesEgp - totalExpensesEgp;
  const costPerBirdEgp = calculateCostPerBird(totalExpensesEgp, liveBirds);
  const costPerKgEgp = calculateCostPerKg(totalExpensesEgp, totalProducedKg);
  const roiPercent = calculateRoi(totalSalesEgp, totalExpensesEgp);

  // Daily log assembly
  let runningLoss = 0;
  const dailyLog = sortedRecords.map((r, index) => {
    const rDate = new Date(r.recordDate);
    const dayNum = Math.max(1, Math.floor((rDate.getTime() - placement.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const dayLoss = r.mortality + r.culls;
    runningLoss += dayLoss;

    const matchedWeight = input.weightSamples.find((w) => new Date(w.sampleDate).toISOString().slice(0, 10) === rDate.toISOString().slice(0, 10));

    return {
      dayNumber: dayNum,
      date: rDate.toISOString().slice(0, 10),
      feedKg: r.feedKg,
      waterLiters: r.waterLiters,
      mortality: r.mortality,
      culls: r.culls,
      cumulativeLosses: runningLoss,
      cumulativeLossPercent: Number(((runningLoss / input.cycle.birdsPlaced) * 100).toFixed(2)),
      averageWeightGrams: matchedWeight?.averageWeightGrams,
    };
  });

  return {
    header: {
      companyName: input.companyName,
      farmName: input.farm.name,
      farmGovernorate: input.farm.governorate,
      cycleName: input.cycle.name,
      placementDate: placement.toISOString().slice(0, 10),
      ageDays,
      birdsPlaced: input.cycle.birdsPlaced,
      status: input.cycle.status,
      generatedAt: now.toISOString(),
    },
    kpiSummary: {
      liveBirds,
      totalLosses,
      livabilityPercent,
      totalFeedKg,
      feedPerBirdKg,
      averageWeightGrams: latestWeightGrams,
      fcr,
      epef,
      adgGrams,
      totalWaterLiters,
      waterToFeedRatio,
    },
    financialSummary: {
      totalSalesEgp,
      totalExpensesEgp,
      feedExpensesEgp: feedExpensesPiasters / 100,
      chickExpensesEgp: chickExpensesPiasters / 100,
      vetExpensesEgp: vetExpensesPiasters / 100,
      otherExpensesEgp: otherExpensesPiasters / 100,
      netProfitEgp,
      costPerBirdEgp,
      costPerKgEgp,
      roiPercent,
    },
    dailyLog,
  };
}

/**
 * Formats CSV string from Cycle Audit Report for Excel export
 */
export function formatCycleAuditCsv(data: CycleAuditReportData): string {
  const lines: string[] = [];

  lines.push(`تقرير الأداء الفني والمالي للدورة - BroilFarm Enterprise ERP`);
  lines.push(`المزرعة,${data.header.farmName},الدورة,${data.header.cycleName}`);
  lines.push(`تاريخ التسكين,${data.header.placementDate},العدد المسكن,${data.header.birdsPlaced}`);
  lines.push(`العمر الحالي,${data.header.ageDays} يوم,الحالة,${data.header.status}`);
  lines.push(``);
  lines.push(`--- المؤشرات الفنية والإنتاجية ---`);
  lines.push(`الطيور الحية,${data.kpiSummary.liveBirds},نسبة الحيوية,${data.kpiSummary.livabilityPercent}%`);
  lines.push(`إجمالي العلف (كجم),${data.kpiSummary.totalFeedKg},متوسط الوزن (جم),${data.kpiSummary.averageWeightGrams}`);
  lines.push(`معامل التحويل (FCR),${data.kpiSummary.fcr},معامل الكفاءة الأوروبي (EPEF),${data.kpiSummary.epef}`);
  lines.push(`معدل الزيادة اليومية (جم),${data.kpiSummary.adgGrams},نسبة الماء للعلف,${data.kpiSummary.waterToFeedRatio}`);
  lines.push(``);
  lines.push(`--- المؤشرات المالية ---`);
  lines.push(`إجمالي المبيعات (ج.م),${data.financialSummary.totalSalesEgp},إجمالي المصروفات (ج.م),${data.financialSummary.totalExpensesEgp}`);
  lines.push(`صافي الأرباح (ج.م),${data.financialSummary.netProfitEgp},تكلفة الكيلو (ج.م),${data.financialSummary.costPerKgEgp}`);
  lines.push(`تكلفة الطائر (ج.م),${data.financialSummary.costPerBirdEgp},العائد على الاستثمار ROI,${data.financialSummary.roiPercent}%`);
  lines.push(``);
  lines.push(`--- السجل اليومي للتشغيل ---`);
  lines.push(`العمر (يوم),التاريخ,العلف (كجم),المياه (لتر),النافق,الفرز,تراكمي الفاقد,نسبة الفاقد %,متوسط الوزن (جم)`);

  for (const row of data.dailyLog) {
    lines.push(`${row.dayNumber},${row.date},${row.feedKg},${row.waterLiters},${row.mortality},${row.culls},${row.cumulativeLosses},${row.cumulativeLossPercent}%,${row.averageWeightGrams ?? "-"}`);
  }

  return lines.join("\n");
}
