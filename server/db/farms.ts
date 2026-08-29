import { eq, inArray } from "drizzle-orm";
import {
  farms,
  cycles,
  houses,
  cageSections,
  cycleHouseAssignments,
  cycleCageOccupancy,
  dailyRecords,
  healthEvents,
  weightSamples,
  farmExpenses,
  saleWeighBatches,
  salePayments,
  saleActivities,
  sales,
  invitationCodes,
  feedInventorySettings,
  feedInventoryTransactions,
  farmWeatherDays,
  workers,
  workerAccountEntries,
  traders,
  farmMemberships,
} from "../../drizzle/schema";
import { buildCascadeDeletionImpact, CascadeDeletionCounts, CascadeDeletionKind } from "../../shared/cascadeDeletion";
import { getDb } from "./connection";
import { requireFarmCapability } from "./auth";

export async function bootstrapFarm(ownerId: number, input: { farmName: string; governorate?: string; location?: string; latitude?: number; longitude?: number; locationSource?: "manual" | "device"; cycleName: string; placementDate: Date; birdsPlaced: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [farm] = await db.insert(farms).values({ ownerId, name: input.farmName, governorate: input.governorate || null, location: input.location || null, latitude: input.latitude?.toFixed(6) ?? null, longitude: input.longitude?.toFixed(6) ?? null, locationSource: input.locationSource ?? "manual" }).$returningId();
  const [cycle] = await db.insert(cycles).values({ farmId: farm.id, name: input.cycleName, placementDate: input.placementDate, birdsPlaced: input.birdsPlaced, status: "active" }).$returningId();
  return { farmId: farm.id, cycleId: cycle.id };
}

export async function createFarm(ownerId: number, input: { name: string; governorate?: string; location?: string; latitude?: number; longitude?: number; locationSource?: "manual" | "device" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(farms).values({ ownerId, name: input.name, governorate: input.governorate || null, location: input.location || null, latitude: input.latitude?.toFixed(6) ?? null, longitude: input.longitude?.toFixed(6) ?? null, locationSource: input.locationSource ?? "manual" });
}

export async function updateFarmLocation(userId: number, input: { farmId: number; location?: string; latitude: number; longitude: number; locationSource: "manual" | "device" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_farms");
  await db.update(farms).set({ location: input.location || null, latitude: input.latitude.toFixed(6), longitude: input.longitude.toFixed(6), locationSource: input.locationSource }).where(eq(farms.id, input.farmId));
}

export async function updateFarm(ownerId: number, input: { farmId: number; name: string; governorate?: string; location?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(ownerId, input.farmId, "manage_farms");
  await db.update(farms).set({ name: input.name, governorate: input.governorate || null, location: input.location || null }).where(eq(farms.id, input.farmId));
}

export type CascadeScope = { farmId: number; cycleIds: number[]; houseIds: number[]; sectionIds: number[]; saleIds: number[]; name: string };

export const emptyCounts = (): CascadeDeletionCounts => ({ farms: 0, cycles: 0, houses: 0, cageRows: 0, cageOccupancy: 0, houseAssignments: 0, dailyRecords: 0, healthEvents: 0, weightSamples: 0, feedSettings: 0, feedTransactions: 0, expenses: 0, weatherDays: 0, workers: 0, workerAccountEntries: 0, traders: 0, sales: 0, weightBatches: 0, payments: 0, saleActivities: 0, memberships: 0, invitations: 0 });

export async function resolveCascadeScope(db: any, kind: CascadeDeletionKind, id: number): Promise<CascadeScope> {
  if (kind === "farm") {
    const [farm] = await db.select({ id: farms.id, name: farms.name }).from(farms).where(eq(farms.id, id)).limit(1);
    if (!farm) throw new Error("Farm not found");
    const [cycleRows, houseRows, saleRows] = await Promise.all([
      db.select({ id: cycles.id }).from(cycles).where(eq(cycles.farmId, id)),
      db.select({ id: houses.id }).from(houses).where(eq(houses.farmId, id)),
      db.select({ id: sales.id }).from(sales).where(eq(sales.farmId, id)),
    ]);
    const houseIds = houseRows.map((row: { id: number }) => row.id);
    const sectionRows = houseIds.length ? await db.select({ id: cageSections.id }).from(cageSections).where(inArray(cageSections.houseId, houseIds)) : [];
    return { farmId: id, cycleIds: cycleRows.map((row: { id: number }) => row.id), houseIds, sectionIds: sectionRows.map((row: { id: number }) => row.id), saleIds: saleRows.map((row: { id: number }) => row.id), name: farm.name };
  }
  if (kind === "cycle") {
    const [cycle] = await db.select({ id: cycles.id, farmId: cycles.farmId, name: cycles.name }).from(cycles).where(eq(cycles.id, id)).limit(1);
    if (!cycle) throw new Error("Cycle not found");
    const [assignmentRows, saleRows] = await Promise.all([
      db.select({ houseId: cycleHouseAssignments.houseId }).from(cycleHouseAssignments).where(eq(cycleHouseAssignments.cycleId, id)),
      db.select({ id: sales.id }).from(sales).where(eq(sales.cycleId, id)),
    ]);
    return { farmId: cycle.farmId, cycleIds: [id], houseIds: assignmentRows.map((row: { houseId: number }) => row.houseId), sectionIds: [], saleIds: saleRows.map((row: { id: number }) => row.id), name: cycle.name };
  }
  const [house] = await db.select({ id: houses.id, farmId: houses.farmId, name: houses.name }).from(houses).where(eq(houses.id, id)).limit(1);
  if (!house) throw new Error("House not found");
  const [sectionRows, legacyCycleRows] = await Promise.all([
    db.select({ id: cageSections.id }).from(cageSections).where(eq(cageSections.houseId, id)),
    db.select({ id: cycles.id }).from(cycles).where(eq(cycles.houseId, id)),
  ]);
  const cycleIds = legacyCycleRows.map((row: { id: number }) => row.id);
  const saleRows = cycleIds.length ? await db.select({ id: sales.id }).from(sales).where(inArray(sales.cycleId, cycleIds)) : [];
  return { farmId: house.farmId, cycleIds, houseIds: [id], sectionIds: sectionRows.map((row: { id: number }) => row.id), saleIds: saleRows.map((row: { id: number }) => row.id), name: house.name };
}

export async function getCascadeCounts(db: any, scope: CascadeScope, kind: CascadeDeletionKind): Promise<CascadeDeletionCounts> {
  const counts = emptyCounts();
  counts.farms = kind === "farm" ? 1 : 0;
  counts.cycles = scope.cycleIds.length;
  counts.houses = kind === "farm" ? scope.houseIds.length : 0;
  counts.cageRows = scope.sectionIds.length;
  const [cycleOccupancy, assignments, dailyByCycle, healthByCycle, weightsByCycle, expensesByCycle, salesBatches, payments, activities] = await Promise.all([
    scope.cycleIds.length ? db.select({ id: cycleCageOccupancy.id }).from(cycleCageOccupancy).where(inArray(cycleCageOccupancy.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: cycleHouseAssignments.id }).from(cycleHouseAssignments).where(inArray(cycleHouseAssignments.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: dailyRecords.id }).from(dailyRecords).where(inArray(dailyRecords.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: healthEvents.id }).from(healthEvents).where(inArray(healthEvents.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: weightSamples.id }).from(weightSamples).where(inArray(weightSamples.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: farmExpenses.id }).from(farmExpenses).where(inArray(farmExpenses.cycleId, scope.cycleIds)) : [],
    scope.saleIds.length ? db.select({ id: saleWeighBatches.id }).from(saleWeighBatches).where(inArray(saleWeighBatches.saleId, scope.saleIds)) : [],
    scope.saleIds.length ? db.select({ id: salePayments.id }).from(salePayments).where(inArray(salePayments.saleId, scope.saleIds)) : [],
    scope.saleIds.length ? db.select({ id: saleActivities.id }).from(saleActivities).where(inArray(saleActivities.saleId, scope.saleIds)) : [],
  ]);
  counts.cageOccupancy = cycleOccupancy.length;
  counts.houseAssignments = assignments.length;
  counts.dailyRecords = dailyByCycle.length;
  counts.healthEvents = healthByCycle.length;
  counts.weightSamples = weightsByCycle.length;
  counts.expenses = expensesByCycle.length;
  counts.sales = scope.saleIds.length;
  counts.weightBatches = salesBatches.length;
  counts.payments = payments.length;
  counts.saleActivities = activities.length;
  if (kind === "house") {
    const [daily, health, weights, assignmentsForHouse, invitationsForHouse] = await Promise.all([
      db.select({ id: dailyRecords.id }).from(dailyRecords).where(eq(dailyRecords.houseId, scope.houseIds[0])),
      db.select({ id: healthEvents.id }).from(healthEvents).where(eq(healthEvents.houseId, scope.houseIds[0])),
      db.select({ id: weightSamples.id }).from(weightSamples).where(eq(weightSamples.houseId, scope.houseIds[0])),
      db.select({ id: cycleHouseAssignments.id }).from(cycleHouseAssignments).where(eq(cycleHouseAssignments.houseId, scope.houseIds[0])),
      db.select({ id: invitationCodes.id }).from(invitationCodes).where(eq(invitationCodes.houseId, scope.houseIds[0])),
    ]);
    counts.dailyRecords = Math.max(counts.dailyRecords, daily.length);
    counts.healthEvents = Math.max(counts.healthEvents, health.length);
    counts.weightSamples = Math.max(counts.weightSamples, weights.length);
    counts.houseAssignments = Math.max(counts.houseAssignments, assignmentsForHouse.length);
    counts.invitations = invitationsForHouse.length;
  }
  if (kind === "farm") {
    const [settings, transactions, allExpenses, weather, allWorkers, workerEntries, allTraders, memberships, invitations] = await Promise.all([
      db.select({ id: feedInventorySettings.id }).from(feedInventorySettings).where(eq(feedInventorySettings.farmId, scope.farmId)),
      db.select({ id: feedInventoryTransactions.id }).from(feedInventoryTransactions).where(eq(feedInventoryTransactions.farmId, scope.farmId)),
      db.select({ id: farmExpenses.id }).from(farmExpenses).where(eq(farmExpenses.farmId, scope.farmId)),
      db.select({ id: farmWeatherDays.id }).from(farmWeatherDays).where(eq(farmWeatherDays.farmId, scope.farmId)),
      db.select({ id: workers.id }).from(workers).where(eq(workers.farmId, scope.farmId)),
      db.select({ id: workerAccountEntries.id }).from(workerAccountEntries).where(eq(workerAccountEntries.farmId, scope.farmId)),
      db.select({ id: traders.id }).from(traders).where(eq(traders.farmId, scope.farmId)),
      db.select({ id: farmMemberships.id }).from(farmMemberships).where(eq(farmMemberships.farmId, scope.farmId)),
      db.select({ id: invitationCodes.id }).from(invitationCodes).where(eq(invitationCodes.farmId, scope.farmId)),
    ]);
    counts.feedSettings = settings.length; counts.feedTransactions = transactions.length; counts.expenses = allExpenses.length; counts.weatherDays = weather.length; counts.workers = allWorkers.length; counts.workerAccountEntries = workerEntries.length; counts.traders = allTraders.length; counts.memberships = memberships.length; counts.invitations = invitations.length;
  }
  return counts;
}

export async function getCascadeDeletionImpact(ownerId: number, input: { kind: CascadeDeletionKind; id: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const scope = await resolveCascadeScope(db, input.kind, input.id);
  await requireFarmCapability(ownerId, scope.farmId, input.kind === "house" ? "manage_housing" : input.kind === "cycle" ? "manage_cycles" : "manage_farms", { houseId: input.kind === "house" ? input.id : null, cycleId: input.kind === "cycle" ? input.id : null });
  return buildCascadeDeletionImpact(input.kind, scope.name, await getCascadeCounts(db, scope, input.kind));
}

export async function deleteCascadeScope(tx: any, scope: CascadeScope, kind: CascadeDeletionKind) {
  if (scope.saleIds.length) {
    await tx.delete(saleActivities).where(inArray(saleActivities.saleId, scope.saleIds));
    await tx.delete(salePayments).where(inArray(salePayments.saleId, scope.saleIds));
    await tx.delete(saleWeighBatches).where(inArray(saleWeighBatches.saleId, scope.saleIds));
    await tx.delete(sales).where(inArray(sales.id, scope.saleIds));
  }
  if (scope.cycleIds.length) {
    await tx.delete(dailyRecords).where(inArray(dailyRecords.cycleId, scope.cycleIds));
    await tx.delete(healthEvents).where(inArray(healthEvents.cycleId, scope.cycleIds));
    await tx.delete(weightSamples).where(inArray(weightSamples.cycleId, scope.cycleIds));
    await tx.delete(farmExpenses).where(inArray(farmExpenses.cycleId, scope.cycleIds));
    await tx.delete(cycleCageOccupancy).where(inArray(cycleCageOccupancy.cycleId, scope.cycleIds));
    await tx.delete(cycleHouseAssignments).where(inArray(cycleHouseAssignments.cycleId, scope.cycleIds));
    await tx.delete(invitationCodes).where(inArray(invitationCodes.cycleId, scope.cycleIds));
    await tx.delete(cycles).where(inArray(cycles.id, scope.cycleIds));
  }
  if (kind === "house") {
    const houseId = scope.houseIds[0];
    await tx.delete(dailyRecords).where(eq(dailyRecords.houseId, houseId));
    await tx.delete(healthEvents).where(eq(healthEvents.houseId, houseId));
    await tx.delete(weightSamples).where(eq(weightSamples.houseId, houseId));
    await tx.delete(cycleHouseAssignments).where(eq(cycleHouseAssignments.houseId, houseId));
    await tx.delete(invitationCodes).where(eq(invitationCodes.houseId, houseId));
  }
  if (scope.sectionIds.length) {
    await tx.delete(cycleCageOccupancy).where(inArray(cycleCageOccupancy.cageSectionId, scope.sectionIds));
    await tx.delete(cageSections).where(inArray(cageSections.id, scope.sectionIds));
  }
  if (kind === "house") await tx.delete(houses).where(eq(houses.id, scope.houseIds[0]));
  if (kind === "farm") {
    await tx.delete(farmExpenses).where(eq(farmExpenses.farmId, scope.farmId));
    await tx.delete(workerAccountEntries).where(eq(workerAccountEntries.farmId, scope.farmId));
    await tx.delete(workers).where(eq(workers.farmId, scope.farmId));
    await tx.delete(feedInventoryTransactions).where(eq(feedInventoryTransactions.farmId, scope.farmId));
    await tx.delete(feedInventorySettings).where(eq(feedInventorySettings.farmId, scope.farmId));
    await tx.delete(farmWeatherDays).where(eq(farmWeatherDays.farmId, scope.farmId));
    await tx.delete(invitationCodes).where(eq(invitationCodes.farmId, scope.farmId));
    await tx.delete(farmMemberships).where(eq(farmMemberships.farmId, scope.farmId));
    await tx.delete(traders).where(eq(traders.farmId, scope.farmId));
    await tx.delete(houses).where(eq(houses.farmId, scope.farmId));
    await tx.delete(farms).where(eq(farms.id, scope.farmId));
  }
}

export async function deleteFarm(ownerId: number, farmId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const scope = await resolveCascadeScope(db, "farm", farmId);
  await requireFarmCapability(ownerId, farmId, "manage_farms");
  await db.transaction(async (tx) => deleteCascadeScope(tx, scope, "farm"));
}
