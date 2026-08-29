import { and, eq, inArray, sql } from "drizzle-orm";
import { cycles, cycleHouseAssignments, traders, sales, saleWeighBatches, saleActivities } from "../../drizzle/schema";
import { canSetCycleBirds } from "../../shared/lifecyclePolicy";
import { assertCycleAllowsOperationalMutation } from "../../shared/cycleMutationPolicy";
import { cycleSalesFinalizationReadiness } from "../../shared/cycleSalesFinalization";
import { assertSaleCanComplete } from "../../shared/salesManagementLifecycle";
import { getDb } from "./connection";
import { requireFarmCapability, requireCycleCapability } from "./auth";
import { resolveCascadeScope, deleteCascadeScope } from "./farms";
import { refreshSaleFromBatches } from "./sales";


export async function createCycle(ownerId: number, input: { farmId: number; name: string; placementDate: Date; birdsPlaced: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(ownerId, input.farmId, "manage_cycles");
  await db.insert(cycles).values({ ...input, status: "upcoming" });
}

export async function updateCycle(ownerId: number, input: { cycleId: number; name: string; placementDate: Date; birdsPlaced: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1);
  if (!cycle) throw new Error("Cycle not found");
  assertCycleAllowsOperationalMutation(cycle.status);
  await requireFarmCapability(ownerId, cycle.farmId, "manage_cycles", { houseId: null, cycleId: input.cycleId });
  const assignments = await db.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(eq(cycleHouseAssignments.cycleId, input.cycleId));
  const assignedBirds = assignments.reduce((sum, assignment) => sum + assignment.assignedBirds, 0);
  if (!canSetCycleBirds(input.birdsPlaced, assignedBirds)) throw new Error("Cycle birds placed cannot be less than birds already allocated to houses");
  await db.update(cycles).set({ name: input.name, placementDate: input.placementDate, birdsPlaced: input.birdsPlaced }).where(eq(cycles.id, input.cycleId));
}

export async function deleteCycle(ownerId: number, cycleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const scope = await resolveCascadeScope(db, "cycle", cycleId);
  await requireFarmCapability(ownerId, scope.farmId, "manage_cycles", { houseId: null, cycleId });
  await db.transaction(async (tx) => deleteCascadeScope(tx, scope, "cycle"));
}

export async function closeCycle(ownerId: number, cycleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleCapability(ownerId, cycleId, "close_cycles");
  await db.update(cycles).set({ status: "closed" }).where(eq(cycles.id, cycleId));
}

export async function finalizeCycleSalesAndClose(ownerId: number, cycleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleCapability(ownerId, cycleId, "close_cycles");
  const [cycleAccess] = await db.select({ farmId: cycles.farmId, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, cycleId)).limit(1);
  if (!cycleAccess) throw new Error("الدورة غير موجودة");
  await requireFarmCapability(ownerId, cycleAccess.farmId, "manage_sales", { houseId: cycleAccess.houseId, cycleId });
  return db.transaction(async (tx) => {
    const [cycle] = await tx.select().from(cycles).where(eq(cycles.id, cycleId)).for("update").limit(1);
    if (!cycle) throw new Error("الدورة غير موجودة");
    if (cycle.status === "closed") throw new Error("هذه الدورة منتهية بالفعل");
    const activeTraderRows = await tx.select({ id: traders.id }).from(traders).where(and(eq(traders.farmId, cycle.farmId), eq(traders.isActive, true)));
    const activeTraderIds = activeTraderRows.map((trader) => trader.id);
    const cycleSales = activeTraderIds.length
      ? await tx.select().from(sales).where(and(eq(sales.cycleId, cycleId), eq(sales.isDeleted, false), inArray(sales.traderId, activeTraderIds))).for("update")
      : [];
    const readiness = cycleSalesFinalizationReadiness(cycleSales);
    if (!readiness.activeSalesCount) throw new Error("لا توجد عمليات بيع نشطة لإنهاء الدورة");
    let completedSalesCount = 0;
    for (const sale of cycleSales) {
      if (sale.status === "closed") continue;
      const totals = await refreshSaleFromBatches(tx, sale);
      if (totals.netWeightGrams <= 0 || totals.totalPiasters <= 0) throw new Error("هناك عملية بيع مفتوحة لا تحتوي على وزن صافٍ أو قيمة بيع محسوبة");
      const [independentLedger] = await tx.select({ count: sql<number>`coalesce(count(*), 0)` }).from(saleWeighBatches).where(and(eq(saleWeighBatches.saleId, sale.id), eq(saleWeighBatches.weighingStage, "tare_pending")));
      assertSaleCanComplete({ weighingMode: sale.weighingMode, loadedCageCount: sale.loadedCageCount, plannedCageCount: sale.plannedCageCount, usesIndependentLedgers: Number(independentLedger?.count ?? 0) > 0 });
      await tx.update(sales).set({ status: "closed" }).where(eq(sales.id, sale.id));
      await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: ownerId, action: "sale_completed", details: "إنهاء تلقائي ضمن إقفال الدورة" });
      completedSalesCount += 1;
    }
    await tx.update(cycles).set({ status: "closed" }).where(eq(cycles.id, cycle.id));
    return { cycleId: cycle.id, completedSalesCount, totalSalesCount: readiness.activeSalesCount };
  });
}
