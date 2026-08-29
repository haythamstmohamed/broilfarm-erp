import { eq, inArray } from "drizzle-orm";
import {
  cycles,
  dailyRecords,
  farmExpenses,
  farms,
  feedInventoryTransactions,
  healthEvents,
  houses,
  sales,
  saleWeighBatches,
  weightSamples,
} from "../../drizzle/schema";
import { createBackupPayload, EnterpriseBackupPayload } from "../../shared/backupEngine";
import { requireFarmCapability, resolveFarmAccess } from "./auth";
import { getDb } from "./connection";

export async function exportCompanyBackup(
  userId: number,
  farmId?: number
): Promise<EnterpriseBackupPayload> {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  let farmIds: number[] = [];
  if (farmId) {
    await requireFarmCapability(userId, farmId, "view_reports");
    farmIds = [farmId];
  } else {
    // Resolve all farms user has access to
    const allFarms = await db.select().from(farms);
    for (const f of allFarms) {
      try {
        const access = await resolveFarmAccess(userId, f.id);
        if (access && (access.role === "owner" || access.role === "general_manager" || access.role === "farm_manager")) {
          farmIds.push(f.id);
        }
      } catch {
        // Skip inaccessible farms
      }
    }
  }

  if (!farmIds.length) {
    return createBackupPayload({
      farms: [],
      houses: [],
      cycles: [],
      dailyRecords: [],
      weightSamples: [],
      healthEvents: [],
      expenses: [],
      sales: [],
      saleWeighBatches: [],
      feedTransactions: [],
    });
  }

  const [
    fetchedFarms,
    fetchedHouses,
    fetchedCycles,
    fetchedExpenses,
    fetchedSales,
    fetchedFeedTx,
  ] = await Promise.all([
    db.select().from(farms).where(inArray(farms.id, farmIds)),
    db.select().from(houses).where(inArray(houses.farmId, farmIds)),
    db.select().from(cycles).where(inArray(cycles.farmId, farmIds)),
    db.select().from(farmExpenses).where(inArray(farmExpenses.farmId, farmIds)),
    db.select().from(sales).where(inArray(sales.farmId, farmIds)),
    db.select().from(feedInventoryTransactions).where(inArray(feedInventoryTransactions.farmId, farmIds)),
  ]);

  const cycleIds = fetchedCycles.map((c) => c.id);
  const saleIds = fetchedSales.map((s) => s.id);

  const [
    fetchedRecords,
    fetchedWeights,
    fetchedHealth,
    fetchedBatches,
  ] = await Promise.all([
    cycleIds.length ? db.select().from(dailyRecords).where(inArray(dailyRecords.cycleId, cycleIds)) : [],
    cycleIds.length ? db.select().from(weightSamples).where(inArray(weightSamples.cycleId, cycleIds)) : [],
    cycleIds.length ? db.select().from(healthEvents).where(inArray(healthEvents.cycleId, cycleIds)) : [],
    saleIds.length ? db.select().from(saleWeighBatches).where(inArray(saleWeighBatches.saleId, saleIds)) : [],
  ]);

  return createBackupPayload({
    farms: fetchedFarms,
    houses: fetchedHouses,
    cycles: fetchedCycles,
    dailyRecords: fetchedRecords,
    weightSamples: fetchedWeights,
    healthEvents: fetchedHealth,
    expenses: fetchedExpenses,
    sales: fetchedSales,
    saleWeighBatches: fetchedBatches,
    feedTransactions: fetchedFeedTx,
  });
}
