import { and, desc, eq, inArray } from "drizzle-orm";
import { companies, cycles, dailyRecords, farmExpenses, farmMemberships, farms, sales, users, weightSamples } from "../../drizzle/schema";
import { computeExecutiveDashboard, ExecutiveCompanyDashboard } from "../../shared/multiFarmMetrics";
import { canViewCompanyRollup, requireCompanyAdministrator } from "../../shared/companyAccessPolicy";
import { formatCycleAuditCsv, generateCycleAuditReport, CycleAuditReportData } from "../../shared/reportGenerator";
import { requireFarmCapability } from "./auth";
import { getDb } from "./connection";

export async function getCycleAuditReport(userId: number, cycleId: number): Promise<CycleAuditReportData> {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [cycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId)).limit(1);
  if (!cycle) throw new Error("الدورة غير موجودة");

  const [farm] = await db.select().from(farms).where(eq(farms.id, cycle.farmId)).limit(1);
  if (!farm) throw new Error("المزرعة غير موجودة");

  await requireFarmCapability(userId, farm.id, "manage_farms");

  const [company] = farm.companyId ? await db.select().from(companies).where(eq(companies.id, farm.companyId)).limit(1) : [null];

  const [daily, weights, expenses, cycleSales] = await Promise.all([
    db.select().from(dailyRecords).where(eq(dailyRecords.cycleId, cycleId)).orderBy(dailyRecords.recordDate),
    db.select().from(weightSamples).where(eq(weightSamples.cycleId, cycleId)),
    db.select().from(farmExpenses).where(eq(farmExpenses.cycleId, cycleId)),
    db.select().from(sales).where(and(eq(sales.cycleId, cycleId), eq(sales.isDeleted, false))),
  ]);

  return generateCycleAuditReport({
    companyName: company?.name,
    farm: { name: farm.name, governorate: farm.governorate },
    cycle: { name: cycle.name, placementDate: cycle.placementDate, birdsPlaced: cycle.birdsPlaced, status: cycle.status },
    dailyRecords: daily,
    weightSamples: weights,
    expenses,
    sales: cycleSales,
  });
}

export async function getCycleAuditReportCsv(userId: number, cycleId: number): Promise<string> {
  const reportData = await getCycleAuditReport(userId, cycleId);
  const csvContent = formatCycleAuditCsv(reportData);
  // Prepend UTF-8 BOM for Arabic text compatibility in Excel
  return `\uFEFF${csvContent}`;
}

export async function getCompanyExecutiveDashboard(userId: number, companyId?: number): Promise<ExecutiveCompanyDashboard> {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [user] = await db.select({ companyId: users.companyId, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("المستخدم غير موجود");

  const requestedCompanyId = companyId;
  if (requestedCompanyId) requireCompanyAdministrator(user, requestedCompanyId);
  const targetCompanyId = requestedCompanyId ?? (canViewCompanyRollup(user) ? user.companyId : undefined);

  // If user belongs to a company, query company farms; otherwise query user's accessible farms
  let accessibleFarms: typeof farms.$inferSelect[] = [];
  if (targetCompanyId) {
    accessibleFarms = await db.select().from(farms).where(eq(farms.companyId, targetCompanyId));
  }

  if (!accessibleFarms.length) {
    // Fallback to owned and membership farms
    const [owned, memberships] = await Promise.all([
      db.select().from(farms).where(eq(farms.ownerId, userId)),
      db.select().from(farmMemberships).where(and(eq(farmMemberships.userId, userId), eq(farmMemberships.isActive, true))),
    ]);
    const memberFarmIds = memberships.map((m) => m.farmId);
    const sharedFarms = memberFarmIds.length ? await db.select().from(farms).where(inArray(farms.id, memberFarmIds)) : [];
    accessibleFarms = [...owned, ...sharedFarms.filter((sf) => !owned.some((o) => o.id === sf.id))];
  }

  if (!accessibleFarms.length) {
    return {
      companyStats: {
        totalFarms: 0,
        activeFarmsCount: 0,
        totalBirdsPlaced: 0,
        totalLiveBirds: 0,
        totalMortality: 0,
        averageLivability: 100,
        totalFeedConsumedKg: 0,
        weightedAverageFcr: 0,
        weightedAverageEpef: 0,
        totalSalesRevenueEgp: 0,
        totalExpensesEgp: 0,
        estimatedNetProfitEgp: 0,
      },
      farmRankings: [],
    };
  }

  const farmIds = accessibleFarms.map((f) => f.id);
  const [allCycles, allExpenses] = await Promise.all([
    db.select().from(cycles).where(inArray(cycles.farmId, farmIds)),
    db.select().from(farmExpenses).where(inArray(farmExpenses.farmId, farmIds)),
  ]);

  const cycleIds = allCycles.map((c) => c.id);
  const [allDaily, allWeights, allSales] = await Promise.all([
    cycleIds.length ? db.select().from(dailyRecords).where(inArray(dailyRecords.cycleId, cycleIds)) : [],
    cycleIds.length ? db.select().from(weightSamples).where(inArray(weightSamples.cycleId, cycleIds)) : [],
    cycleIds.length ? db.select().from(sales).where(and(inArray(sales.cycleId, cycleIds), eq(sales.isDeleted, false))) : [],
  ]);

  return computeExecutiveDashboard({
    farms: accessibleFarms,
    cycles: allCycles,
    dailyRecords: allDaily,
    weightSamples: allWeights,
    expenses: allExpenses,
    sales: allSales,
  });
}
