import { and, eq, inArray, sql } from "drizzle-orm";
import { traders, sales, saleWeighBatches, salePayments, saleActivities, cycles, dailyRecords } from "../../drizzle/schema";
import { SaleWriteMutation, executeSaleCreate } from "../../shared/salesLifecycle";
import { SaleWeighingMode, remainingCages, flexibleBatchWeighingCalculation } from "../../shared/batchWeighing";
import { evaluateBatchCageEntry, nextBatchSequence, assertBatchOrder, assertSaleCanComplete, assertSaleCanSoftDelete, assertSaleUpdateKeepsPaymentsCovered } from "../../shared/salesManagementLifecycle";
import { saleValueFromLedgerWeight } from "../../shared/salesDashboard";
import { assertCycleAllowsOperationalMutation } from "../../shared/cycleMutationPolicy";
import { getDb } from "./connection";
import { requireFarmCapability } from "./auth";


export async function createTrader(userId: number, input: { farmId: number; name: string; phone?: string; companyName?: string; address?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_sales");
  await db.insert(traders).values({ farmId: input.farmId, name: input.name, phone: input.phone || null, companyName: input.companyName || null, address: input.address || null, notes: input.notes || null });
}

export async function createTraderWithSimpleSale(userId: number, input: { farmId: number; cycleId: number; name: string; phone?: string; pricePerKgEgp: number; notes?: string; saleDate: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1);
  if (!cycle || cycle.farmId !== input.farmId) throw new Error("الدورة لا تنتمي إلى المزرعة المحددة");
  assertCycleAllowsOperationalMutation(cycle.status);
  if (!Number.isFinite(input.pricePerKgEgp) || input.pricePerKgEgp <= 0) throw new Error("أدخل سعر كيلو صالحاً");
  await requireFarmCapability(userId, input.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
  return db.transaction(async (tx) => {
    const [trader] = await tx.insert(traders).values({ farmId: input.farmId, name: input.name, phone: input.phone || null, notes: input.notes || null }).$returningId();
    const [sale] = await tx.insert(sales).values({
      farmId: input.farmId,
      cycleId: input.cycleId,
      traderId: trader.id,
      saleDate: input.saleDate,
      grossWeightGrams: 0,
      loadedCageCount: 0,
      plannedCageCount: 0,
      batchCageCount: 1,
      weighingMode: "direct",
      birdsPerCage: 0,
      status: "open",
      tareWeightGrams: 0,
      tareCageCount: 0,
      netWeightGrams: 0,
      pricePerKgPiasters: Math.round(input.pricePerKgEgp * 100),
      totalPiasters: 0,
      discountPiasters: 0,
      notes: input.notes || null,
      createdByUserId: userId,
    }).$returningId();
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: input.farmId, actorUserId: userId, action: "sale_started", details: "بدء بيع مبسط بالتجميع الفعلي للفارغ والمملوء" });
    return { traderId: trader.id, saleId: sale.id };
  });
}

export async function createSale(userId: number, input: SaleWriteMutation) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [[cycle], [trader]] = await Promise.all([
    db.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1),
    db.select({ id: traders.id, farmId: traders.farmId }).from(traders).where(eq(traders.id, input.traderId)).limit(1),
  ]);
  if (cycle) {
    assertCycleAllowsOperationalMutation(cycle.status);
  }
  return db.transaction(async (tx) => executeSaleCreate({
    userId,
    mutation: input,
    cycle,
    trader,
    requireSalesAccess: async (actorId, scope) => { await requireFarmCapability(actorId, scope.farmId, "manage_sales", { houseId: scope.houseId, cycleId: scope.cycleId }); },
    persistSale: async (record) => {
      const [created] = await tx.insert(sales).values({
        farmId: record.farmId, cycleId: record.cycleId, traderId: record.traderId, saleDate: record.saleDate,
        grossWeightGrams: record.grossWeightGrams, loadedCageCount: record.loadedCageCount, tareWeightGrams: record.tareWeightGrams, tareCageCount: record.tareCageCount,
        netWeightGrams: record.netWeightGrams, pricePerKgPiasters: record.pricePerKgPiasters, totalPiasters: record.totalPiasters,
        reference: record.reference || null, notes: record.notes || null, createdByUserId: userId,
      }).$returningId();
      return created;
    },
    persistPayment: async (saleId, amountPiasters, paidAt, reference) => {
      await tx.insert(salePayments).values({ saleId, farmId: input.farmId, amountPiasters, paidAt, reference: reference || null, createdByUserId: userId });
    },
  }));
}

export async function startTraderLoading(userId: number, input: { farmId: number; cycleId: number; traderId: number; saleDate: Date; plannedCageCount: number; batchCageCount: number; weighingMode?: SaleWeighingMode; birdsPerCage?: number; tareWeightKg: number; tareCageCount: number; pricePerKgEgp: number; discountEgp?: number; reference?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [[cycle], [trader]] = await Promise.all([
    db.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1),
    db.select({ id: traders.id, farmId: traders.farmId }).from(traders).where(eq(traders.id, input.traderId)).limit(1),
  ]);
  if (!cycle || cycle.farmId !== input.farmId || !trader || trader.farmId !== input.farmId) throw new Error("الدورة أو التاجر لا ينتمي إلى المزرعة المحددة");
  assertCycleAllowsOperationalMutation(cycle.status);
  const weighingMode = input.weighingMode ?? "fixed";
  if ((!Number.isInteger(input.plannedCageCount) || input.plannedCageCount < 0) || (!Number.isInteger(input.batchCageCount) || input.batchCageCount <= 0) || (weighingMode === "fixed" && input.plannedCageCount > 0 && input.batchCageCount > input.plannedCageCount)) throw new Error("عدد الأقفاص المخطط وحجم الدفعة غير صالحين");
  if (weighingMode !== "direct" && input.plannedCageCount <= 0) throw new Error("حدد عدد الأقفاص المخطط لعملية البيع");
  const tareWeightGrams = Math.round(input.tareWeightKg * 1000);
  const directWithoutCages = weighingMode === "direct" && input.plannedCageCount === 0;
  const noTare = tareWeightGrams === 0 && input.tareCageCount === 0;
  if (!Number.isSafeInteger(tareWeightGrams) || (!noTare && (directWithoutCages ? tareWeightGrams < 0 : tareWeightGrams <= 0)) || !Number.isInteger(input.tareCageCount) || (!noTare && (directWithoutCages ? input.tareCageCount < 0 : input.tareCageCount <= 0)) || input.pricePerKgEgp <= 0) throw new Error("وزن الفارغ والسعر يجب أن يكونا صالحين");
  await requireFarmCapability(userId, input.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
  const discountPiasters = Math.round(Math.max(0, input.discountEgp ?? 0) * 100);
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(sales).values({ farmId: input.farmId, cycleId: input.cycleId, traderId: input.traderId, saleDate: input.saleDate, grossWeightGrams: 0, loadedCageCount: 0, plannedCageCount: input.plannedCageCount, batchCageCount: input.batchCageCount, weighingMode, birdsPerCage: Math.max(0, input.birdsPerCage ?? 0), status: "open", tareWeightGrams, tareCageCount: input.tareCageCount, netWeightGrams: 0, pricePerKgPiasters: Math.round(input.pricePerKgEgp * 100), totalPiasters: 0, discountPiasters, reference: input.reference || null, notes: input.notes || null, createdByUserId: userId }).$returningId();
    await tx.insert(saleActivities).values({ saleId: created.id, farmId: input.farmId, actorUserId: userId, action: "sale_started", details: `بدء تحميل: ${input.plannedCageCount} قفص، وضع ${weighingMode}` });
    return created;
  });
}

export async function addSaleWeighBatch(userId: number, input: { saleId: number; cageCount?: number; grossWeightKg: number; tareWeightKg?: number; weighedAt: Date; notes?: string; allowOverage?: boolean }) {
const db = await getDb();
if (!db) throw new Error("Database is unavailable");
return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, input.saleId)).for("update").limit(1);
    if (!sale) throw new Error("جلسة التحميل غير موجودة");
    const [cycle] = await tx.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1);
    if (!cycle || cycle.farmId !== sale.farmId) throw new Error("جلسة التحميل غير صالحة");
    assertCycleAllowsOperationalMutation(cycle.status);
    await requireFarmCapability(userId, sale.farmId, "record_sales_weights", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("تم إغلاق جلسة التحميل ولا يمكن إضافة دفعات جديدة");
    const cageCount = Math.max(0, Math.floor(input.cageCount ?? 0));
    const cagesRemaining = remainingCages(sale.plannedCageCount, sale.loadedCageCount);
const cageDecision = evaluateBatchCageEntry({ weighingMode: sale.weighingMode, cageCount, remainingCages: cagesRemaining, allowOverage: input.allowOverage });
if (cageDecision.requiresManagerOverride) {
await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
}
    const calculation = flexibleBatchWeighingCalculation({ weighingMode: sale.weighingMode, grossWeightKg: input.grossWeightKg, batchTareWeightKg: input.tareWeightKg, cageCount, birdsPerCage: sale.birdsPerCage, tareWeightGrams: sale.tareWeightGrams, tareCageCount: sale.tareCageCount, pricePerKgPiasters: sale.pricePerKgPiasters });

    if (calculation.birdCount > 0) {
      const [[cycleInfo], [cycleLosses], [cycleSold]] = await Promise.all([
        tx.select({ birdsPlaced: cycles.birdsPlaced }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1),
        tx.select({ totalLosses: sql<number>`coalesce(sum(${dailyRecords.mortality} + ${dailyRecords.culls}), 0)` }).from(dailyRecords).where(eq(dailyRecords.cycleId, sale.cycleId)),
        tx.select({ totalSoldBirds: sql<number>`coalesce(sum(${saleWeighBatches.birdCount}), 0)` })
          .from(saleWeighBatches)
          .innerJoin(sales, eq(saleWeighBatches.saleId, sales.id))
          .where(and(eq(sales.cycleId, sale.cycleId), eq(sales.isDeleted, false), eq(saleWeighBatches.weighingStage, "filled"))),
      ]);
      const birdsPlaced = cycleInfo?.birdsPlaced ?? 0;
      const totalLosses = Number(cycleLosses?.totalLosses ?? 0);
      const totalSold = Number(cycleSold?.totalSoldBirds ?? 0);
      const remainingLiveBirds = Math.max(0, birdsPlaced - totalLosses - totalSold);
      if (birdsPlaced > 0 && calculation.birdCount > remainingLiveBirds) {
        throw new Error(`عدد الطيور في الدفعة (${calculation.birdCount}) يتجاوز الرصيد الحي المتبقي في الدورة (${remainingLiveBirds} طائر)`);
      }
    }

const [existing] = await tx.select({ highestSequence: sql<number>`coalesce(max(${saleWeighBatches.sequence}), 0)` }).from(saleWeighBatches).where(eq(saleWeighBatches.saleId, sale.id));
const sequence = nextBatchSequence(Number(existing?.highestSequence ?? 0));
    await tx.insert(saleWeighBatches).values({ saleId: sale.id, sequence, weighingStage: "filled", cageCount: calculation.cageCount, birdCount: calculation.birdCount, grossWeightGrams: calculation.grossWeightGrams, tareWeightGrams: calculation.tareWeightGrams, netWeightGrams: calculation.netWeightGrams, totalPiasters: calculation.totalPiasters, weighedAt: input.weighedAt, notes: input.notes || null, createdByUserId: userId });
    const totals = await refreshSaleFromBatches(tx, sale);
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_added", details: `دفعة ${sequence}: ${calculation.cageCount} قفص، ${calculation.netWeightGrams / 1000} كجم صافي${input.allowOverage && calculation.cageCount > cagesRemaining ? " (تجاوز مؤكد للعدد المخطط)" : ""}` });
    return { sequence, nextLoadedCages: totals.loadedCageCount, remainingCages: 0, ...calculation };
  });
}

export async function addSaleTareBatch(userId: number, input: { saleId: number; cageCount: number; tareWeightKg: number; weighedAt: Date; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, input.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.isDeleted) throw new Error("عملية البيع غير موجودة");
    await requireFarmCapability(userId, sale.farmId, "record_sales_weights", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("لا يمكن إضافة وزن فارغ بعد إنهاء البيع");
    const cageCount = Math.floor(input.cageCount);
    const tareWeightGrams = Math.round(input.tareWeightKg * 1000);
    if (!Number.isInteger(cageCount) || cageCount <= 0 || !Number.isSafeInteger(tareWeightGrams) || tareWeightGrams < 0) throw new Error("عدد الأقفاص أو وزن الفارغ غير صالح");
    const [pending] = await tx.select({ cageCount: sql<number>`coalesce(sum(${saleWeighBatches.cageCount}), 0)` }).from(saleWeighBatches).where(and(eq(saleWeighBatches.saleId, sale.id), eq(saleWeighBatches.weighingStage, "tare_pending")));
    const reservedCages = sale.loadedCageCount + Number(pending?.cageCount ?? 0);
    if (sale.weighingMode !== "direct" && reservedCages + cageCount > sale.plannedCageCount) throw new Error(`عدد الأقفاص الفارغة يتجاوز المتبقي المتاح (${sale.plannedCageCount - reservedCages} قفص)`);
    const [existing] = await tx.select({ highestSequence: sql<number>`coalesce(max(${saleWeighBatches.sequence}), 0)` }).from(saleWeighBatches).where(eq(saleWeighBatches.saleId, sale.id));
    const sequence = nextBatchSequence(Number(existing?.highestSequence ?? 0));
    const [created] = await tx.insert(saleWeighBatches).values({ saleId: sale.id, sequence, weighingStage: "tare_pending", cageCount, birdCount: 0, grossWeightGrams: 0, tareWeightGrams, netWeightGrams: 0, totalPiasters: 0, weighedAt: input.weighedAt, notes: input.notes || null, createdByUserId: userId }).$returningId();
    await refreshSaleFromBatches(tx, sale);
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_added", details: `تسجيل فارغ للدفعة ${sequence}: ${cageCount} قفص، ${tareWeightGrams / 1000} كجم` });
    return { id: created.id, sequence, cageCount, tareWeightGrams };
  });
}

export async function fillSaleTareBatch(userId: number, input: { batchId: number; grossWeightKg: number; weighedAt: Date; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(saleWeighBatches).where(eq(saleWeighBatches.id, input.batchId)).for("update").limit(1);
    const [sale] = batch ? await tx.select().from(sales).where(eq(sales.id, batch.saleId)).for("update").limit(1) : [];
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!batch || !sale || !cycle || sale.isDeleted) throw new Error("دفعة الوزن أو عملية البيع غير موجودة");
    await requireFarmCapability(userId, sale.farmId, "record_sales_weights", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open" || batch.weighingStage !== "tare_pending") throw new Error("هذه الدفعة لا تنتظر وزناً مملوءاً");
    const calculation = flexibleBatchWeighingCalculation({ weighingMode: sale.weighingMode, grossWeightKg: input.grossWeightKg, batchTareWeightKg: batch.tareWeightGrams / 1000, cageCount: batch.cageCount, birdsPerCage: sale.birdsPerCage, tareWeightGrams: sale.tareWeightGrams, tareCageCount: sale.tareCageCount, pricePerKgPiasters: sale.pricePerKgPiasters });
    await tx.update(saleWeighBatches).set({ weighingStage: "filled", birdCount: calculation.birdCount, grossWeightGrams: calculation.grossWeightGrams, netWeightGrams: calculation.netWeightGrams, totalPiasters: calculation.totalPiasters, weighedAt: input.weighedAt, notes: input.notes || batch.notes }).where(eq(saleWeighBatches.id, batch.id));
    await refreshSaleFromBatches(tx, sale);
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_updated", details: `تسجيل المملوء للدفعة ${batch.sequence}: ${calculation.grossWeightGrams / 1000} كجم، صافي ${calculation.netWeightGrams / 1000} كجم` });
    return calculation;
  });
}

export async function updateSaleTareBatch(userId: number, input: { batchId: number; cageCount: number; tareWeightKg: number; weighedAt: Date; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(saleWeighBatches).where(eq(saleWeighBatches.id, input.batchId)).for("update").limit(1);
    const [sale] = batch ? await tx.select().from(sales).where(eq(sales.id, batch.saleId)).for("update").limit(1) : [];
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!batch || !sale || !cycle || sale.isDeleted) throw new Error("دفعة الفارغ أو عملية البيع غير موجودة");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("لا يمكن تعديل الأوزان بعد إنهاء البيع");
    const cageCount = Math.floor(input.cageCount); const tareWeightGrams = Math.round(input.tareWeightKg * 1000);
    if (!Number.isInteger(cageCount) || cageCount <= 0 || !Number.isSafeInteger(tareWeightGrams) || tareWeightGrams < 0) throw new Error("عدد الأقفاص أو وزن الفارغ غير صالح");
    const [pending] = await tx.select({ cageCount: sql<number>`coalesce(sum(${saleWeighBatches.cageCount}), 0)` }).from(saleWeighBatches).where(and(eq(saleWeighBatches.saleId, sale.id), eq(saleWeighBatches.weighingStage, "tare_pending")));
    const reservedCages = sale.loadedCageCount + Number(pending?.cageCount ?? 0) - batch.cageCount;
    if (sale.weighingMode !== "direct" && reservedCages + cageCount > sale.plannedCageCount) throw new Error("عدد الأقفاص الفارغة يتجاوز المتبقي المتاح");
    if (batch.weighingStage === "filled") {
      const calculation = flexibleBatchWeighingCalculation({ weighingMode: sale.weighingMode, grossWeightKg: batch.grossWeightGrams / 1000, batchTareWeightKg: input.tareWeightKg, cageCount, birdsPerCage: sale.birdsPerCage, tareWeightGrams: sale.tareWeightGrams, tareCageCount: sale.tareCageCount, pricePerKgPiasters: sale.pricePerKgPiasters });
      await tx.update(saleWeighBatches).set({ cageCount, birdCount: calculation.birdCount, tareWeightGrams, netWeightGrams: calculation.netWeightGrams, totalPiasters: calculation.totalPiasters, weighedAt: input.weighedAt, notes: input.notes || null }).where(eq(saleWeighBatches.id, batch.id));
      await refreshSaleFromBatches(tx, sale);
    } else {
      await tx.update(saleWeighBatches).set({ cageCount, tareWeightGrams, weighedAt: input.weighedAt, notes: input.notes || null }).where(eq(saleWeighBatches.id, batch.id));
      await refreshSaleFromBatches(tx, sale);
    }
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_updated", details: `تعديل فارغ الدفعة ${batch.sequence}` });
  });
}

export async function refreshSaleFromBatches(tx: any, sale: typeof sales.$inferSelect) {
  const [[filledTotals], [tareTotals]] = await Promise.all([
    tx.select({ grossWeightGrams: sql<number>`coalesce(sum(${saleWeighBatches.grossWeightGrams}), 0)`, loadedCageCount: sql<number>`coalesce(sum(${saleWeighBatches.cageCount}), 0)` }).from(saleWeighBatches).where(and(eq(saleWeighBatches.saleId, sale.id), eq(saleWeighBatches.weighingStage, "filled"))),
    tx.select({ tareWeightGrams: sql<number>`coalesce(sum(${saleWeighBatches.tareWeightGrams}), 0)` }).from(saleWeighBatches).where(eq(saleWeighBatches.saleId, sale.id)),
  ]);
  const grossWeightGrams = Number(filledTotals?.grossWeightGrams ?? 0);
  const tareWeightGrams = Number(tareTotals?.tareWeightGrams ?? 0);
  const netWeightGrams = Math.max(grossWeightGrams - tareWeightGrams, 0);
  const totalPiasters = saleValueFromLedgerWeight(netWeightGrams, sale.pricePerKgPiasters);
  const next = { grossWeightGrams, loadedCageCount: Number(filledTotals?.loadedCageCount ?? 0), tareWeightGrams, netWeightGrams, totalPiasters };
  await tx.update(sales).set(next).where(eq(sales.id, sale.id));
  return next;
}

export async function calculateSaleTotal(userId: number, saleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.isDeleted) throw new Error("عملية البيع غير موجودة");
    if (sale.status !== "open") throw new Error("أعد فتح البيع للتعديل قبل إعادة الحساب");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    const totals = await refreshSaleFromBatches(tx, sale);
    if (totals.netWeightGrams <= 0) throw new Error("سجّل وزناً مملوءاً أكبر من إجمالي الفارغ قبل حساب قيمة البيع");
    const [paid] = await tx.select({ total: sql<number>`coalesce(sum(${salePayments.amountPiasters}), 0)` }).from(salePayments).where(eq(salePayments.saleId, sale.id));
    assertSaleUpdateKeepsPaymentsCovered({ totalPiasters: totals.totalPiasters, discountPiasters: sale.discountPiasters, paidPiasters: Number(paid?.total ?? 0) });
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: `حساب قيمة البيع: ${totals.netWeightGrams / 1000} كجم صافي، ${totals.totalPiasters / 100} ج.م` });
    return totals;
  });
}

export async function reopenSale(userId: number, saleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.isDeleted) throw new Error("عملية البيع غير موجودة");
    if (sale.status !== "closed") throw new Error("عملية البيع مفتوحة بالفعل للتعديل");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    await tx.update(sales).set({ status: "open" }).where(eq(sales.id, sale.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: "إعادة فتح عملية البيع للتعديل وإضافة سجلات جديدة" });
  });
}

export async function updateTrader(userId: number, input: { traderId: number; name: string; phone?: string; companyName?: string; address?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [trader] = await db.select().from(traders).where(eq(traders.id, input.traderId)).limit(1);
  if (!trader) throw new Error("حساب التاجر غير موجود");
  await requireFarmCapability(userId, trader.farmId, "manage_sales");
  await db.update(traders).set({ name: input.name, phone: input.phone || null, companyName: input.companyName || null, address: input.address || null, notes: input.notes || null }).where(eq(traders.id, trader.id));
}

export async function deleteTrader(userId: number, traderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [trader] = await db.select().from(traders).where(eq(traders.id, traderId)).limit(1);
  if (!trader) throw new Error("حساب التاجر غير موجود");
  await requireFarmCapability(userId, trader.farmId, "manage_sales");
  await db.update(traders).set({ isActive: false }).where(eq(traders.id, trader.id));
}

export async function updateSaleWeighBatch(userId: number, input: { batchId: number; cageCount?: number; grossWeightKg: number; tareWeightKg?: number; weighedAt: Date; notes?: string }) {
const db = await getDb();
if (!db) throw new Error("Database is unavailable");
return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(saleWeighBatches).where(eq(saleWeighBatches.id, input.batchId)).for("update").limit(1);
    if (!batch) throw new Error("سجل الوزن غير موجود");
    const [sale] = await tx.select().from(sales).where(eq(sales.id, batch.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || cycle.farmId !== sale.farmId) throw new Error("عملية البيع غير صالحة");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("لا يمكن تعديل الأوزان بعد إنهاء البيع");
    if (batch.weighingStage !== "filled") throw new Error("عدّل وزن الفارغ من سجل الفارغ أو سجّل وزن المملوء لإكمال الدفعة");
    const cageCount = Math.max(0, Math.floor(input.cageCount ?? batch.cageCount));
    const available = sale.plannedCageCount - (sale.loadedCageCount - batch.cageCount);
if (sale.weighingMode !== "direct" && (cageCount <= 0 || cageCount > available)) throw new Error(`عدد الأقفاص يجب أن يكون بين ١ و${available}`);
    const calculation = flexibleBatchWeighingCalculation({ weighingMode: sale.weighingMode, grossWeightKg: input.grossWeightKg, batchTareWeightKg: input.tareWeightKg ?? batch.tareWeightGrams / 1000, cageCount, birdsPerCage: sale.birdsPerCage, tareWeightGrams: sale.tareWeightGrams, tareCageCount: sale.tareCageCount, pricePerKgPiasters: sale.pricePerKgPiasters });
await tx.update(saleWeighBatches).set({ cageCount: calculation.cageCount, birdCount: calculation.birdCount, grossWeightGrams: calculation.grossWeightGrams, tareWeightGrams: calculation.tareWeightGrams, netWeightGrams: calculation.netWeightGrams, totalPiasters: calculation.totalPiasters, weighedAt: input.weighedAt, notes: input.notes || null }).where(eq(saleWeighBatches.id, batch.id));
await refreshSaleFromBatches(tx, sale);
await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_updated", details: `تعديل الدفعة ${batch.sequence}` });
  });
}

export async function deleteSaleWeighBatch(userId: number, batchId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(saleWeighBatches).where(eq(saleWeighBatches.id, batchId)).for("update").limit(1);
    if (!batch) throw new Error("سجل الوزن غير موجود");
    const [sale] = await tx.select().from(sales).where(eq(sales.id, batch.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle) throw new Error("عملية البيع غير صالحة");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("لا يمكن حذف الأوزان بعد إنهاء البيع");
    await tx.delete(saleWeighBatches).where(eq(saleWeighBatches.id, batch.id));
    await refreshSaleFromBatches(tx, sale);
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_deleted", details: `حذف الدفعة ${batch.sequence}` });
  });
}

export async function completeSale(userId: number, saleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle) throw new Error("عملية البيع غير موجودة");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("عملية البيع منتهية بالفعل");
    const totals = await refreshSaleFromBatches(tx, sale);
    if (totals.netWeightGrams <= 0 || totals.totalPiasters <= 0) throw new Error("احسب قيمة البيع بعد إدخال الأوزان قبل إنهاء العملية");
    const [independentLedger] = await tx.select({ count: sql<number>`coalesce(count(*), 0)` }).from(saleWeighBatches).where(and(eq(saleWeighBatches.saleId, sale.id), eq(saleWeighBatches.weighingStage, "tare_pending")));
    assertSaleCanComplete({ weighingMode: sale.weighingMode, loadedCageCount: sale.loadedCageCount, plannedCageCount: sale.plannedCageCount, usesIndependentLedgers: Number(independentLedger?.count ?? 0) > 0 });
    await tx.update(sales).set({ status: "closed" }).where(eq(sales.id, sale.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_completed", details: "إنهاء عملية البيع" });
  });
}

export async function updateSaleDetails(userId: number, input: { saleId: number; pricePerKgEgp: number; discountEgp: number; reference?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, input.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.isDeleted) throw new Error("عملية البيع غير موجودة");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("لا يمكن تعديل سعر أو خصم البيع بعد الإنهاء");
    const pricePerKgPiasters = Math.round(input.pricePerKgEgp * 100);
    const discountPiasters = Math.round(Math.max(0, input.discountEgp) * 100);
    if (!Number.isSafeInteger(pricePerKgPiasters) || pricePerKgPiasters <= 0 || !Number.isSafeInteger(discountPiasters)) throw new Error("السعر أو الخصم غير صالحين");
    const rows = await tx.select().from(saleWeighBatches).where(eq(saleWeighBatches.saleId, sale.id)).for("update");
    let totalPiasters = 0;
    for (const row of rows) { const lineTotal = Math.round((row.netWeightGrams * pricePerKgPiasters) / 1000); totalPiasters += lineTotal; await tx.update(saleWeighBatches).set({ totalPiasters: lineTotal }).where(eq(saleWeighBatches.id, row.id)); }
    const [paid] = await tx.select({ total: sql<number>`coalesce(sum(${salePayments.amountPiasters}), 0)` }).from(salePayments).where(eq(salePayments.saleId, sale.id));
    assertSaleUpdateKeepsPaymentsCovered({ totalPiasters, discountPiasters, paidPiasters: Number(paid?.total ?? 0) });
    await tx.update(sales).set({ pricePerKgPiasters, discountPiasters, totalPiasters, reference: input.reference || null, notes: input.notes || null }).where(eq(sales.id, sale.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: "تعديل سعر البيع أو الخصم أو الملاحظات" });
  });
}

export async function reorderSaleWeighBatches(userId: number, input: { saleId: number; batchIds: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, input.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.status !== "open") throw new Error("لا يمكن إعادة ترتيب هذه العملية");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    const rows = await tx.select({ id: saleWeighBatches.id }).from(saleWeighBatches).where(eq(saleWeighBatches.saleId, sale.id));
    assertBatchOrder(rows.map((row) => row.id), input.batchIds);
    for (let index = 0; index < input.batchIds.length; index += 1) await tx.update(saleWeighBatches).set({ sequence: index + 100_000 }).where(eq(saleWeighBatches.id, input.batchIds[index]));
    for (let index = 0; index < input.batchIds.length; index += 1) await tx.update(saleWeighBatches).set({ sequence: index + 1 }).where(eq(saleWeighBatches.id, input.batchIds[index]));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batches_reordered", details: "إعادة ترتيب دفعات الوزن" });
  });
}

export async function deleteSale(userId: number, saleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle) throw new Error("عملية البيع غير موجودة");
    assertSaleCanSoftDelete(sale.isDeleted);
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    await tx.update(sales).set({ isDeleted: true, deletedAt: new Date() }).where(eq(sales.id, sale.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_deleted", details: "إزالة عملية البيع من السجل النشط" });
  });
}

export async function addSalePayment(userId: number, input: { saleId: number; amountEgp: number; paidAt: Date; paymentMethod?: "cash" | "transfer" | "credit" | "other"; reference?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select({ id: sales.id, farmId: sales.farmId, cycleId: sales.cycleId, totalPiasters: sales.totalPiasters, discountPiasters: sales.discountPiasters }).from(sales).where(eq(sales.id, input.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    const [paid] = sale ? await tx.select({ total: sql<number>`coalesce(sum(${salePayments.amountPiasters}), 0)` }).from(salePayments).where(eq(salePayments.saleId, sale.id)) : [];
    if (!sale || !cycle) throw new Error("عملية البيع غير موجودة");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    const amountPiasters = Math.round(input.amountEgp * 100);
    const netDuePiasters = Math.max(sale.totalPiasters - sale.discountPiasters, 0);
    const currentPaidPiasters = Number(paid?.total ?? 0);
    if (!Number.isSafeInteger(amountPiasters) || amountPiasters <= 0) throw new Error("قيمة الدفعة غير صالحة");
    if (currentPaidPiasters + amountPiasters > netDuePiasters) throw new Error("لا يمكن أن تتجاوز الدفعة صافي المستحق على التاجر");
    await tx.insert(salePayments).values({ saleId: input.saleId, farmId: sale.farmId, amountPiasters, paymentMethod: input.paymentMethod ?? "cash", paidAt: input.paidAt, reference: input.reference || null, notes: input.notes || null, createdByUserId: userId });
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "payment_added", details: `دفعة ${amountPiasters / 100} ج.م` });
    return { remainingPiasters: netDuePiasters - currentPaidPiasters - amountPiasters };
  });
}

export async function updateSalePayment(userId: number, input: { paymentId: number; amountEgp: number; paidAt: Date; paymentMethod?: "cash" | "transfer" | "credit" | "other"; reference?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [payment] = await tx.select().from(salePayments).where(eq(salePayments.id, input.paymentId)).for("update").limit(1);
    const [sale] = payment ? await tx.select().from(sales).where(eq(sales.id, payment.saleId)).for("update").limit(1) : [];
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!payment || !sale || !cycle || sale.isDeleted) throw new Error("حركة الرصيد أو عملية البيع غير موجودة");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    const amountPiasters = Math.round(input.amountEgp * 100);
    if (!Number.isSafeInteger(amountPiasters) || amountPiasters <= 0) throw new Error("قيمة الرصيد غير صالحة");
    const [others] = await tx.select({ total: sql<number>`coalesce(sum(case when ${salePayments.id} <> ${payment.id} then ${salePayments.amountPiasters} else 0 end), 0)` }).from(salePayments).where(eq(salePayments.saleId, sale.id));
    const netDuePiasters = Math.max(sale.totalPiasters - sale.discountPiasters, 0);
    if (Number(others?.total ?? 0) + amountPiasters > netDuePiasters) throw new Error("لا يمكن أن تتجاوز الحركة صافي المستحق على التاجر");
    await tx.update(salePayments).set({ amountPiasters, paidAt: input.paidAt, paymentMethod: input.paymentMethod ?? payment.paymentMethod, reference: input.reference || null, notes: input.notes || null }).where(eq(salePayments.id, payment.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: `تعديل رصيد التاجر إلى ${amountPiasters / 100} ج.م` });
  });
}

export async function deleteSalePayment(userId: number, paymentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [payment] = await tx.select().from(salePayments).where(eq(salePayments.id, paymentId)).for("update").limit(1);
    const [sale] = payment ? await tx.select().from(sales).where(eq(sales.id, payment.saleId)).for("update").limit(1) : [];
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, sale.cycleId)).limit(1) : [];
    if (!payment || !sale || !cycle || sale.isDeleted) throw new Error("حركة الرصيد أو عملية البيع غير موجودة");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    await tx.delete(salePayments).where(eq(salePayments.id, payment.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: `حذف رصيد التاجر ${payment.amountPiasters / 100} ج.م` });
  });
}
