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
  if (!db) return { farms: [], houses: [], cageSections: [], occupancy: [], cycles: [], records: [], weights: [], health: [], feedInventorySettings: [], feedInventoryTransactions: [], expenses: [], workers: [], workerAccountEntries: [], traders: [], sales: [], salePayments: [], saleWeighBatches: [], saleActivities: [] };
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
  const workerAccountFarmIds = accessibleFarms.filter((farm) => ownedFarmIds.includes(farm.id) || memberships.some((membership) => membership.farmId === farm.id && !membership.houseId && !membership.cycleId && roleCan(membership.role, "manage_expenses"))).map((farm) => farm.id);
  const allHouses = rawHouses.filter((house) => ownedFarmIds.includes(house.farmId) || memberships.some((membership) => membership.farmId === house.farmId && (!membership.houseId || membership.houseId === house.id)));
  const allCycles = rawCycles.filter((cycle) => ownedFarmIds.includes(cycle.farmId) || memberships.some((membership) => membership.farmId === cycle.farmId && (!membership.houseId || membership.houseId === cycle.houseId) && (!membership.cycleId || membership.cycleId === cycle.id)));
  const activeCycle = allCycles.find((cycle) => cycle.status === "active") ?? allCycles[0];
  const allSections = allHouses.length ? (await Promise.all(allHouses.map((house) => db.select().from(cageSections).where(eq(cageSections.houseId, house.id))))).flat() : [];
  const invitations = ownedFarmIds.length ? await db.select().from(invitationCodes).where(inArray(invitationCodes.farmId, ownedFarmIds)).orderBy(desc(invitationCodes.createdAt)) : [];
  const cycleIds = allCycles.map((cycle) => cycle.id);
  const [inventorySettings, inventoryTransactions, rawExpenses, rawWorkers, rawWorkerAccountEntries, workspaceTraders, workspaceSales, workspaceSalePayments] = await Promise.all([
    db.select().from(feedInventorySettings).where(inArray(feedInventorySettings.farmId, farmIds)),
    db.select().from(feedInventoryTransactions).where(inArray(feedInventoryTransactions.farmId, farmIds)).orderBy(desc(feedInventoryTransactions.occurredAt)),
    db.select().from(farmExpenses).where(inArray(farmExpenses.farmId, farmIds)).orderBy(desc(farmExpenses.expenseDate)),
    workerAccountFarmIds.length ? db.select().from(workers).where(inArray(workers.farmId, workerAccountFarmIds)).orderBy(desc(workers.createdAt)) : Promise.resolve([]),
    workerAccountFarmIds.length ? db.select().from(workerAccountEntries).where(inArray(workerAccountEntries.farmId, workerAccountFarmIds)).orderBy(desc(workerAccountEntries.occurredAt)) : Promise.resolve([]),
    db.select().from(traders).where(inArray(traders.farmId, farmIds)).orderBy(desc(traders.createdAt)),
    db.select().from(sales).where(and(inArray(sales.farmId, farmIds), eq(sales.isDeleted, false))).orderBy(desc(sales.saleDate)),
    db.select().from(salePayments).where(inArray(salePayments.farmId, farmIds)).orderBy(desc(salePayments.paidAt)),
  ]);
  const workspaceSaleWeighBatches = workspaceSales.length ? await db.select().from(saleWeighBatches).where(inArray(saleWeighBatches.saleId, workspaceSales.map((sale) => sale.id))).orderBy(desc(saleWeighBatches.weighedAt)) : [];
  const workspaceSaleActivities = workspaceSales.length ? await db.select().from(saleActivities).where(inArray(saleActivities.saleId, workspaceSales.map((sale) => sale.id))).orderBy(desc(saleActivities.createdAt)) : [];
  const expenses = rawExpenses.filter((expense) => ownedFarmIds.includes(expense.farmId) || memberships.some((membership) => {
    if (membership.farmId !== expense.farmId) return false;
    const expenseCycle = allCycles.find((cycle) => cycle.id === expense.cycleId);
    return (!membership.cycleId || membership.cycleId === expense.cycleId) && (!membership.houseId || expenseCycle?.houseId === membership.houseId);
  }));
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
