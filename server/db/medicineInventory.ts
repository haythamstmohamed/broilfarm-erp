import { desc, eq } from "drizzle-orm";
import { medicineInventory } from "../../drizzle/schema";
import { requireFarmCapability } from "./auth";
import { getDb } from "./connection";

export type MedicineCategory = "vaccine" | "antibiotic" | "vitamin" | "disinfectant" | "supplement" | "other";

export async function listMedicineInventory(userId: number, farmId: number) {
  const db = await getDb();
  if (!db) return [];

  await requireFarmCapability(userId, farmId, "manage_health");
  return db
    .select()
    .from(medicineInventory)
    .where(eq(medicineInventory.farmId, farmId))
    .orderBy(desc(medicineInventory.createdAt));
}

export async function addMedicineItem(
  userId: number,
  input: {
    farmId: number;
    productName: string;
    category?: MedicineCategory;
    batchNumber?: string;
    expiryDate?: Date;
    quantity: number;
    unit?: string;
    unitCostEgp?: number;
    reorderPoint?: number;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  await requireFarmCapability(userId, input.farmId, "manage_health");

  const [item] = await db
    .insert(medicineInventory)
    .values({
      farmId: input.farmId,
      productName: input.productName,
      category: input.category ?? "other",
      batchNumber: input.batchNumber || null,
      expiryDate: input.expiryDate ?? null,
      quantity: input.quantity.toFixed(2),
      unit: input.unit ?? "عبوة",
      unitCostPiasters: input.unitCostEgp ? Math.round(input.unitCostEgp * 100) : 0,
      reorderPoint: input.reorderPoint ? input.reorderPoint.toFixed(2) : "5.00",
      notes: input.notes || null,
      createdByUserId: userId,
    })
    .$returningId();

  return item;
}

export async function updateMedicineQuantity(
  userId: number,
  input: {
    itemId: number;
    quantityDelta: number;
    reason?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [item] = await db.select().from(medicineInventory).where(eq(medicineInventory.id, input.itemId)).limit(1);
  if (!item) throw new Error("الصنف الدوائي غير موجود");

  await requireFarmCapability(userId, item.farmId, "manage_health");

  const currentQty = Number(item.quantity);
  const nextQty = Math.max(0, currentQty + input.quantityDelta);

  await db
    .update(medicineInventory)
    .set({
      quantity: nextQty.toFixed(2),
    })
    .where(eq(medicineInventory.id, input.itemId));

  return { previousQuantity: currentQty, newQuantity: nextQty };
}

export async function deleteMedicineItem(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [item] = await db.select().from(medicineInventory).where(eq(medicineInventory.id, itemId)).limit(1);
  if (!item) throw new Error("الصنف الدوائي غير موجود");

  await requireFarmCapability(userId, item.farmId, "manage_health");
  await db.delete(medicineInventory).where(eq(medicineInventory.id, itemId));

  return { success: true };
}
