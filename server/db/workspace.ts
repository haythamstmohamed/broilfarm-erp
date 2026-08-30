import { and, desc, eq, inArray } from "drizzle-orm";
import {
  farms,
  farmMemberships,
  houses,
  cycles,
  cageSections,
  cycleCageOccupancy,
  cycleHouseAssignments,
  dailyRecords,
  healthEvents,
  weightSamples,
  invitationCodes,
  feedInventorySettings,
  feedInventoryTransactions,
  farmExpenses,
  workers,
  workerAccountEntries,
  traders,
  sales,
  salePayments,
  saleWeighBatches,
  saleActivities,
} from "../../drizzle/schema";
import { roleCan } from "../../shared/accessControl";
import { getDb } from "./connection";


export async function getWorkspace(ownerId: number) {
  const db = await getDb();
  if (!db) return { farms: [], houses: [], cageSections: [], assignments: [], occupancy: [], cycles: [], records: [], weights: [], health: [], memberships: [], invitations: [], feedInventorySettings: [], feedInventoryTransactions: [], expenses: [], workers: [], workerAccountEntries: [], traders: [], sales: [], salePayments: [], saleWeighBatches: [], saleActivities: [] };
  const [ownedFarms, memberships] = await Promise.all([
    db.select().from(farms).where(eq(farms.ownerId, ownerId)).orderBy(desc(farms.createdAt)),
    db.select().from(farmMemberships).where(and(eq(farmMemberships.userId, ownerId), eq(farmMemberships.isActive, true))),
  ]);
  const memberFarmIds = memberships.map((membership) => membership.farmId);
  const sharedFarms = memberFarmIds.length ? await db.select().from(farms).where(inArray(farms.id, memberFarmIds)) : [];
  const accessibleFarms = [...ownedFarms, ...sharedFarms.filter((farm) => !ownedFarms.some((owned) => owned.id === farm.id))];
  if (!accessibleFarms.length) return { farms: [], houses: [], cageSections: [], occupancy: [], cycles: [], records: [], weights: [], health: [], memberships: [], invitations: [], feedInventorySettings: [], feedInventoryTransactions: [], expenses: [], workers: [], workerAccountEntries: [], traders: [], sales: [], salePayments: [], saleWeighBatches: [], saleActivities: [] };
  const farmIds = accessibleFarms.map((farm) => farm.id);
  const [rawHouses, rawCycles] = await Promise.all([
    db.select().from(houses).where(inArray(houses.farmId, farmIds)),
    db.select().from(cycles).where(inArray(cycles.farmId, farmIds)),
  ]);
  const ownedFarmIds = ownedFarms.map((farm) => farm.id);
  const farmIdsWithUnscopedCapability = (capability: Parameters<typeof roleCan>[1]) => accessibleFarms
    .filter((farm) => ownedFarmIds.includes(farm.id) || memberships.some((membership) => membership.farmId === farm.id && !membership.houseId && !membership.cycleId && roleCan(membership.role, capability)))
    .map((farm) => farm.id);
  const inventoryFarmIds = farmIdsWithUnscopedCapability("manage_inventory");
  const financeFarmIds = farmIdsWithUnscopedCapability("manage_expenses");
  const salesFarmIds = farmIdsWithUnscopedCapability("manage_sales");
  const invitationFarmIds = farmIdsWithUnscopedCapability("manage_access");
  const allHouses = rawHouses.filter((house) => ownedFarmIds.includes(house.farmId) || memberships.some((membership) => membership.farmId === house.farmId && (!membership.houseId || membership.houseId === house.id)));
  const allCycles = rawCycles.filter((cycle) => ownedFarmIds.includes(cycle.farmId) || memberships.some((membership) => membership.farmId === cycle.farmId && (!membership.houseId || membership.houseId === cycle.houseId) && (!membership.cycleId || membership.cycleId === cycle.id)));
  const activeCycle = allCycles.find((cycle) => cycle.status === "active") ?? allCycles[0];
  const allSections = allHouses.length ? (await Promise.all(allHouses.map((house) => db.select().from(cageSections).where(eq(cageSections.houseId, house.id))))).flat() : [];
  const invitations = invitationFarmIds.length ? await db.select().from(invitationCodes).where(inArray(invitationCodes.farmId, invitationFarmIds)).orderBy(desc(invitationCodes.createdAt)) : [];
  const cycleIds = allCycles.map((cycle) => cycle.id);
  const [inventorySettings, inventoryTransactions, rawExpenses, rawWorkers, rawWorkerAccountEntries, workspaceTraders, workspaceSales, workspaceSalePayments] = await Promise.all([
    inventoryFarmIds.length ? db.select().from(feedInventorySettings).where(inArray(feedInventorySettings.farmId, inventoryFarmIds)) : Promise.resolve([]),
    inventoryFarmIds.length ? db.select().from(feedInventoryTransactions).where(inArray(feedInventoryTransactions.farmId, inventoryFarmIds)).orderBy(desc(feedInventoryTransactions.occurredAt)) : Promise.resolve([]),
    financeFarmIds.length ? db.select().from(farmExpenses).where(inArray(farmExpenses.farmId, financeFarmIds)).orderBy(desc(farmExpenses.expenseDate)) : Promise.resolve([]),
    financeFarmIds.length ? db.select().from(workers).where(inArray(workers.farmId, financeFarmIds)).orderBy(desc(workers.createdAt)) : Promise.resolve([]),
    financeFarmIds.length ? db.select().from(workerAccountEntries).where(inArray(workerAccountEntries.farmId, financeFarmIds)).orderBy(desc(workerAccountEntries.occurredAt)) : Promise.resolve([]),
    salesFarmIds.length ? db.select().from(traders).where(inArray(traders.farmId, salesFarmIds)).orderBy(desc(traders.createdAt)) : Promise.resolve([]),
    salesFarmIds.length ? db.select().from(sales).where(and(inArray(sales.farmId, salesFarmIds), eq(sales.isDeleted, false))).orderBy(desc(sales.saleDate)) : Promise.resolve([]),
    salesFarmIds.length ? db.select().from(salePayments).where(inArray(salePayments.farmId, salesFarmIds)).orderBy(desc(salePayments.paidAt)) : Promise.resolve([]),
  ]);
  const workspaceSaleWeighBatches = workspaceSales.length ? await db.select().from(saleWeighBatches).where(inArray(saleWeighBatches.saleId, workspaceSales.map((sale) => sale.id))).orderBy(desc(saleWeighBatches.weighedAt)) : [];
  const workspaceSaleActivities = workspaceSales.length ? await db.select().from(saleActivities).where(inArray(saleActivities.saleId, workspaceSales.map((sale) => sale.id))).orderBy(desc(saleActivities.createdAt)) : [];
  const expenses = rawExpenses;
  if (!activeCycle) return { farms: accessibleFarms, houses: allHouses, cageSections: allSections, assignments: [], occupancy: [], cycles: allCycles, records: [], weights: [], health: [], memberships, invitations, feedInventorySettings: inventorySettings, feedInventoryTransactions: inventoryTransactions, expenses, workers: rawWorkers, workerAccountEntries: rawWorkerAccountEntries, traders: workspaceTraders, sales: workspaceSales, salePayments: workspaceSalePayments, saleWeighBatches: workspaceSaleWeighBatches, saleActivities: workspaceSaleActivities };
  const [records, weights, health, occupancy, assignments] = await Promise.all([
    cycleIds.length ? db.select().from(dailyRecords).where(inArray(dailyRecords.cycleId, cycleIds)).orderBy(dailyRecords.recordDate) : Promise.resolve([]),
    cycleIds.length ? db.select().from(weightSamples).where(inArray(weightSamples.cycleId, cycleIds)).orderBy(weightSamples.sampleDate) : Promise.resolve([]),
    cycleIds.length ? db.select().from(healthEvents).where(inArray(healthEvents.cycleId, cycleIds)).orderBy(desc(healthEvents.eventDate)) : Promise.resolve([]),
    cycleIds.length ? db.select().from(cycleCageOccupancy).where(inArray(cycleCageOccupancy.cycleId, cycleIds)) : Promise.resolve([]),
    cycleIds.length ? db.select().from(cycleHouseAssignments).where(inArray(cycleHouseAssignments.cycleId, cycleIds)) : Promise.resolve([]),
  ]);
  return { farms: accessibleFarms, houses: allHouses, cageSections: allSections, assignments, occupancy, cycles: allCycles, records, weights, health, memberships, invitations, feedInventorySettings: inventorySettings, feedInventoryTransactions: inventoryTransactions, expenses, workers: rawWorkers, workerAccountEntries: rawWorkerAccountEntries, traders: workspaceTraders, sales: workspaceSales, salePayments: workspaceSalePayments, saleWeighBatches: workspaceSaleWeighBatches, saleActivities: workspaceSaleActivities };
}
