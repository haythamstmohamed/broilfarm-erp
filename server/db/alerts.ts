import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alerts, cycles, dailyRecords, feedInventorySettings, feedInventoryTransactions, healthEvents, weightSamples } from "../../drizzle/schema";
import { EvaluatedAlert, scanCycleAnomalies } from "../../shared/alertsEngine";
import { calculateFcr } from "../../shared/farmMetrics";
import { requireFarmCapability } from "./auth";
import { getDb } from "./connection";
import { canReadFarmScope, getReadableFarmScopes } from "./readAccess";

export async function listAlerts(userId: number, filter?: { farmId?: number; cycleId?: number; status?: "active" | "acknowledged" | "resolved" | "dismissed" }) {
  const db = await getDb();
  if (!db) return [];

  const readableScopes = await getReadableFarmScopes(db, userId, "view_reports");
  if (!readableScopes.length) return [];

  const conditions = [];
  const readableFarmIds = [...new Set(readableScopes.map((scope) => scope.farmId))];
  conditions.push(inArray(alerts.farmId, readableFarmIds));
  let requiredFarmId: number | undefined;
  if (filter?.farmId) {
    await requireFarmCapability(userId, filter.farmId, "view_reports");
    requiredFarmId = filter.farmId;
    conditions.push(eq(alerts.farmId, filter.farmId));
  }
  if (filter?.cycleId) {
    const [cycle] = await db.select({ farmId: cycles.farmId, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, filter.cycleId)).limit(1);
    if (!cycle || (requiredFarmId && cycle.farmId !== requiredFarmId)) throw new Error("الدورة لا تتبع المزرعة المحددة");
    await requireFarmCapability(userId, cycle.farmId, "view_reports", { houseId: cycle.houseId, cycleId: filter.cycleId });
    conditions.push(eq(alerts.farmId, cycle.farmId));
    conditions.push(eq(alerts.cycleId, filter.cycleId));
  }
  if (filter?.status) {
    conditions.push(eq(alerts.status, filter.status));
  } else {
    // Default to active and acknowledged
    conditions.push(inArray(alerts.status, ["active", "acknowledged"]));
  }

  const rows = await db
    .select()
    .from(alerts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(alerts.createdAt))
    .limit(500);

  return rows
    .filter((alert) => canReadFarmScope(readableScopes, alert.farmId, { houseId: alert.houseId, cycleId: alert.cycleId }))
    .slice(0, 100);
}

export async function acknowledgeAlert(userId: number, alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [alert] = await db.select().from(alerts).where(eq(alerts.id, alertId)).limit(1);
  if (!alert) throw new Error("Alert not found");

  await requireFarmCapability(userId, alert.farmId, "manage_farms");
  await db
    .update(alerts)
    .set({
      status: "acknowledged",
      acknowledgedByUserId: userId,
      acknowledgedAt: new Date(),
    })
    .where(eq(alerts.id, alertId));

  return { success: true };
}

export async function resolveAlert(userId: number, alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [alert] = await db.select().from(alerts).where(eq(alerts.id, alertId)).limit(1);
  if (!alert) throw new Error("Alert not found");

  await requireFarmCapability(userId, alert.farmId, "manage_farms");
  await db
    .update(alerts)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
    })
    .where(eq(alerts.id, alertId));

  return { success: true };
}

export async function createAlert(farmId: number, alertInput: EvaluatedAlert, cycleId?: number, houseId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [created] = await db
    .insert(alerts)
    .values({
      farmId,
      cycleId: cycleId ?? null,
      houseId: houseId ?? null,
      alertType: alertInput.alertType,
      severity: alertInput.severity,
      title: alertInput.title,
      message: alertInput.message,
      metadata: alertInput.metadata ? JSON.stringify(alertInput.metadata) : null,
      status: "active",
    })
    .$returningId();

  return created;
}

export async function scanAndSyncCycleAlerts(userId: number, farmId: number, cycleId: number) {
  const db = await getDb();
  if (!db) return [];

  await requireFarmCapability(userId, farmId, "manage_farms");

  const [cycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId)).limit(1);
  if (!cycle || cycle.farmId !== farmId) throw new Error("الدورة لا تتبع المزرعة المحددة");
  if (cycle.status === "closed") return [];

  // Fetch operational records
  const [records, weights, health, [feedSetting], feedTxSummary] = await Promise.all([
    db.select().from(dailyRecords).where(eq(dailyRecords.cycleId, cycleId)).orderBy(desc(dailyRecords.recordDate)),
    db.select().from(weightSamples).where(eq(weightSamples.cycleId, cycleId)).orderBy(desc(weightSamples.sampleDate)),
    db.select().from(healthEvents).where(eq(healthEvents.cycleId, cycleId)),
    db.select().from(feedInventorySettings).where(eq(feedInventorySettings.farmId, farmId)).limit(1),
    db.select({ balance: sql<number>`coalesce(sum(${feedInventoryTransactions.bagDelta}), 0)` }).from(feedInventoryTransactions).where(eq(feedInventoryTransactions.farmId, farmId)),
  ]);

  const placementDate = new Date(cycle.placementDate);
  const now = new Date();
  const cycleAgeDays = Math.max(1, Math.floor((now.getTime() - placementDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const totalFeedKg = records.reduce((sum, r) => sum + r.feedKg, 0);
  const totalMortality = records.reduce((sum, r) => sum + r.mortality + r.culls, 0);
  const liveBirds = Math.max(0, cycle.birdsPlaced - totalMortality);

  const latestWeightGrams = weights[0]?.averageWeightGrams ?? 0;
  const fcr = calculateFcr(totalFeedKg, liveBirds, latestWeightGrams) ?? undefined;

  const currentFeedBalanceBags = Number(feedTxSummary[0]?.balance ?? 0);
  const feedReorderPointBags = feedSetting?.reorderPointBags ?? 50;
  const bagWeightKg = Number(feedSetting?.bagWeightKg ?? 50);

  const recentRecords = records.slice(0, 3);
  const avgDailyFeedKg = recentRecords.length ? recentRecords.reduce((sum, r) => sum + r.feedKg, 0) / recentRecords.length : 0;
  const dailyConsumptionBags = bagWeightKg > 0 ? avgDailyFeedKg / bagWeightKg : 0;

  // Run pure scan engine
  const evaluatedAlerts = scanCycleAnomalies({
    birdsPlaced: cycle.birdsPlaced,
    cycleAgeDays,
    dailyRecords: records,
    latestWeightGrams,
    fcr,
    currentFeedBalanceBags,
    feedReorderPointBags,
    dailyConsumptionBags,
    healthEvents: health,
  });

  // Query existing active alerts to avoid spamming duplicates
  const existingActive = await db
    .select({ alertType: alerts.alertType, title: alerts.title })
    .from(alerts)
    .where(and(eq(alerts.farmId, farmId), eq(alerts.cycleId, cycleId), eq(alerts.status, "active")));

  const existingKeys = new Set(existingActive.map((a) => `${a.alertType}:${a.title}`));

  for (const item of evaluatedAlerts) {
    const key = `${item.alertType}:${item.title}`;
    if (!existingKeys.has(key)) {
      await createAlert(farmId, item, cycleId);
    }
  }

  return evaluatedAlerts;
}
