import { and, eq, sql } from "drizzle-orm";
import { cycles, cycleHouseAssignments, dailyRecords, feedInventorySettings, feedInventoryTransactions } from "../../drizzle/schema";
import { dailyFeedIssueBags } from "../../shared/feedInventory";
import { assertCycleAllowsOperationalMutation } from "../../shared/cycleMutationPolicy";
import { requireCycleHouseAssignment } from "./auth";
import { getDb } from "./connection";


export async function addDailyRecord(ownerId: number, input: { cycleId: number; houseId: number; recordDate: Date; feedKg: number; waterLiters: number; mortality: number; culls: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleHouseAssignment(ownerId, input.cycleId, input.houseId, "record_operations");
  await db.transaction(async (tx) => {
    const [cycle] = await tx.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1);
    if (!cycle) throw new Error("الدورة غير موجودة");
    assertCycleAllowsOperationalMutation(cycle.status);

    const startOfDay = new Date(input.recordDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(input.recordDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSameDay = await tx.select({ id: dailyRecords.id })
      .from(dailyRecords)
      .where(and(
        eq(dailyRecords.cycleId, input.cycleId),
        eq(dailyRecords.houseId, input.houseId),
        sql`${dailyRecords.recordDate} >= ${startOfDay} and ${dailyRecords.recordDate} <= ${endOfDay}`
      )).limit(1);

    if (existingSameDay.length > 0) {
      throw new Error("يوجد سجل تشغيلي مسجل بالفعل لهذا العنبر في هذا اليوم");
    }

    const [assignment] = await tx.select({ assignedBirds: cycleHouseAssignments.assignedBirds })
      .from(cycleHouseAssignments)
      .where(and(
        eq(cycleHouseAssignments.cycleId, input.cycleId),
        eq(cycleHouseAssignments.houseId, input.houseId)
      )).limit(1);

    const [houseLosses] = await tx.select({
      totalLosses: sql<number>`coalesce(sum(${dailyRecords.mortality} + ${dailyRecords.culls}), 0)`
    }).from(dailyRecords).where(and(
      eq(dailyRecords.cycleId, input.cycleId),
      eq(dailyRecords.houseId, input.houseId)
    ));

    const assignedBirds = assignment?.assignedBirds ?? 0;
    const currentLosses = Number(houseLosses?.totalLosses ?? 0);
    const newLosses = input.mortality + input.culls;

    if (assignedBirds > 0 && currentLosses + newLosses > assignedBirds) {
      throw new Error(`إجمالي النافق والاستبعاد (${currentLosses + newLosses}) لا يمكن أن يتجاوز عدد الطيور المسكنة بالعنبر (${assignedBirds})`);
    }

    const [settings] = await tx.select({ bagWeightKg: feedInventorySettings.bagWeightKg }).from(feedInventorySettings).where(eq(feedInventorySettings.farmId, cycle.farmId)).limit(1);
    const bagDelta = dailyFeedIssueBags(input.feedKg, Number(settings?.bagWeightKg ?? 50));
    if (bagDelta < 0) await requireSufficientFeedBalance(tx, cycle.farmId, bagDelta);
    const inserted = await tx.insert(dailyRecords).values(input);
    const recordId = Number((inserted as unknown as [{ insertId?: number }])[0]?.insertId);
    if (!recordId) throw new Error("تعذر ربط سجل التشغيل بحركة مخزون العلف");
    if (bagDelta < 0) await tx.insert(feedInventoryTransactions).values({
      farmId: cycle.farmId,
      dailyRecordId: recordId,
      movementType: "issue",
      bagDelta: bagDelta.toFixed(4),
      occurredAt: input.recordDate,
      reference: `سجل تشغيل #${recordId}`,
      notes: `خصم تلقائي لاستهلاك ${input.feedKg} كجم علف`,
      createdByUserId: ownerId,
    });
  });
}

export async function requireSufficientFeedBalance(tx: any, farmId: number, bagDelta: number, ignoredDailyRecordId?: number) {
  const [summary] = await tx.select({ balance: sql<number>`coalesce(sum(${feedInventoryTransactions.bagDelta}), 0)` }).from(feedInventoryTransactions).where(eq(feedInventoryTransactions.farmId, farmId));
  let availableBags = Number(summary?.balance ?? 0);
  if (ignoredDailyRecordId) {
    const [existingIssue] = await tx.select({ bagDelta: feedInventoryTransactions.bagDelta }).from(feedInventoryTransactions).where(eq(feedInventoryTransactions.dailyRecordId, ignoredDailyRecordId)).limit(1);
    availableBags -= Number(existingIssue?.bagDelta ?? 0);
  }
  if (availableBags + bagDelta < -0.00001) throw new Error("لا يمكن تسجيل استهلاك علف أكبر من الرصيد المتاح في المخزن");
}

export async function updateDailyRecord(ownerId: number, input: { recordId: number; recordDate: Date; feedKg: number; waterLiters: number; mortality: number; culls: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [record] = await db.select().from(dailyRecords).where(eq(dailyRecords.id, input.recordId)).limit(1);
  if (!record) throw new Error("سجل التشغيل غير موجود");
  if (record.houseId === null) throw new Error("لا يمكن تعديل سجل تشغيلي قديم غير مرتبط بعنبر");
  await requireCycleHouseAssignment(ownerId, record.cycleId, record.houseId, "record_operations");
  await db.transaction(async (tx) => {
    const [cycle] = await tx.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq(cycles.id, record.cycleId)).limit(1);
    if (!cycle) throw new Error("الدورة غير موجودة");
    assertCycleAllowsOperationalMutation(cycle.status);

    const [assignment] = await tx.select({ assignedBirds: cycleHouseAssignments.assignedBirds })
      .from(cycleHouseAssignments)
      .where(and(
        eq(cycleHouseAssignments.cycleId, record.cycleId),
        eq(cycleHouseAssignments.houseId, record.houseId!)
      )).limit(1);

    const [houseLosses] = await tx.select({
      totalLosses: sql<number>`coalesce(sum(case when ${dailyRecords.id} <> ${record.id} then ${dailyRecords.mortality} + ${dailyRecords.culls} else 0 end), 0)`
    }).from(dailyRecords).where(and(
      eq(dailyRecords.cycleId, record.cycleId),
      eq(dailyRecords.houseId, record.houseId!)
    ));

    const assignedBirds = assignment?.assignedBirds ?? 0;
    const currentLosses = Number(houseLosses?.totalLosses ?? 0);
    const newLosses = input.mortality + input.culls;

    if (assignedBirds > 0 && currentLosses + newLosses > assignedBirds) {
      throw new Error(`إجمالي النافق والاستبعاد (${currentLosses + newLosses}) لا يمكن أن يتجاوز عدد الطيور المسكنة بالعنبر (${assignedBirds})`);
    }
    if (!cycle) throw new Error("الدورة غير موجودة");
    const [settings] = await tx.select({ bagWeightKg: feedInventorySettings.bagWeightKg }).from(feedInventorySettings).where(eq(feedInventorySettings.farmId, cycle.farmId)).limit(1);
    const bagDelta = dailyFeedIssueBags(input.feedKg, Number(settings?.bagWeightKg ?? 50));
    if (bagDelta < 0) await requireSufficientFeedBalance(tx, cycle.farmId, bagDelta, record.id);
    await tx.update(dailyRecords).set({ recordDate: input.recordDate, feedKg: input.feedKg, waterLiters: input.waterLiters, mortality: input.mortality, culls: input.culls }).where(eq(dailyRecords.id, record.id));
    const [existingIssue] = await tx.select({ id: feedInventoryTransactions.id }).from(feedInventoryTransactions).where(eq(feedInventoryTransactions.dailyRecordId, record.id)).limit(1);
    if (existingIssue && bagDelta === 0) {
      await tx.delete(feedInventoryTransactions).where(eq(feedInventoryTransactions.id, existingIssue.id));
    } else if (existingIssue) {
      await tx.update(feedInventoryTransactions).set({ bagDelta: bagDelta.toFixed(4), occurredAt: input.recordDate, notes: `خصم تلقائي لاستهلاك ${input.feedKg} كجم علف` }).where(eq(feedInventoryTransactions.id, existingIssue.id));
    } else if (bagDelta < 0) {
      await tx.insert(feedInventoryTransactions).values({ farmId: cycle.farmId, dailyRecordId: record.id, movementType: "issue", bagDelta: bagDelta.toFixed(4), occurredAt: input.recordDate, reference: `سجل تشغيل #${record.id}`, notes: `خصم تلقائي لاستهلاك ${input.feedKg} كجم علف`, createdByUserId: ownerId });
    }
  });
}

export async function deleteDailyRecord(ownerId: number, recordId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [record] = await db.select().from(dailyRecords).where(eq(dailyRecords.id, recordId)).limit(1);
  if (!record) throw new Error("سجل التشغيل غير موجود");
  if (record.houseId === null) throw new Error("لا يمكن حذف سجل تشغيلي قديم غير مرتبط بعنبر");
  await requireCycleHouseAssignment(ownerId, record.cycleId, record.houseId, "record_operations");
  await db.transaction(async (tx) => {
    await tx.delete(feedInventoryTransactions).where(eq(feedInventoryTransactions.dailyRecordId, record.id));
    await tx.delete(dailyRecords).where(eq(dailyRecords.id, record.id));
  });
}
