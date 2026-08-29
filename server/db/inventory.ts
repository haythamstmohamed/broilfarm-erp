import { eq, sql } from "drizzle-orm";
import { feedInventorySettings, feedInventoryTransactions } from "../../drizzle/schema";
import { inventoryMovementDelta } from "../../shared/feedInventory";
import { requireFarmCapability } from "./auth";
import { getDb } from "./connection";


export async function updateFeedInventorySettings(userId: number, input: { farmId: number; bagWeightKg: number; reorderPointBags: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_inventory");
  await db.insert(feedInventorySettings).values(input).onDuplicateKeyUpdate({ set: { bagWeightKg: input.bagWeightKg, reorderPointBags: input.reorderPointBags } });
}

export async function addFeedInventoryTransaction(userId: number, input: { farmId: number; movementType: "opening" | "receipt" | "issue" | "adjustment"; bagDelta: number; occurredAt: Date; reference?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_inventory");
  const bagDelta = inventoryMovementDelta(input.movementType, input.bagDelta);
  await db.transaction(async (tx) => {
    const [summary] = await tx.select({ balance: sql<number>`coalesce(sum(${feedInventoryTransactions.bagDelta}), 0)` }).from(feedInventoryTransactions).where(eq(feedInventoryTransactions.farmId, input.farmId));
    const currentBalance = Number(summary?.balance ?? 0);
    if (currentBalance + bagDelta < 0) throw new Error("لا يمكن صرف عدد شكاير أكبر من الرصيد المتاح في المخزن");
    await tx.insert(feedInventoryTransactions).values({ ...input, bagDelta: bagDelta.toFixed(4), reference: input.reference || null, notes: input.notes || null, createdByUserId: userId });
  });
}
