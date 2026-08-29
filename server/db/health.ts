import { eq } from "drizzle-orm";
import { healthEvents } from "../../drizzle/schema";
import { normalizeHealthEventHouseIds, executeHealthEventUpdate, executeHealthEventDelete } from "../../shared/healthEventLifecycle";
import { requireCycleHouseAssignment } from "./auth";
import { getDb } from "./connection";

export type HealthEventInput = { cycleId: number; houseId: number; eventDate: Date; eventType: "medication" | "vaccination"; productName: string; dosage: string; administrationRoute?: string; notes?: string };

export async function addHealthEvent(ownerId: number, input: HealthEventInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleHouseAssignment(ownerId, input.cycleId, input.houseId, "manage_health");
  await db.insert(healthEvents).values({ ...input, administrationRoute: input.administrationRoute || null, notes: input.notes || null });
}

export async function addHealthEvents(ownerId: number, input: Omit<HealthEventInput, "houseId"> & { houseIds: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const houseIds = normalizeHealthEventHouseIds(input.houseIds);
  await Promise.all(houseIds.map((houseId) => requireCycleHouseAssignment(ownerId, input.cycleId, houseId, "manage_health")));
  await db.transaction(async (tx) => {
    await tx.insert(healthEvents).values(houseIds.map((houseId) => ({
      cycleId: input.cycleId,
      houseId,
      eventDate: input.eventDate,
      eventType: input.eventType,
      productName: input.productName,
      dosage: input.dosage,
      administrationRoute: input.administrationRoute || null,
      notes: input.notes || null,
    })));
  });
  return { createdCount: houseIds.length };
}

export async function getExistingHealthEvent(healthEventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [event] = await db.select().from(healthEvents).where(eq(healthEvents.id, healthEventId)).limit(1);
  if (!event) throw new Error("Health record not found or is not linked to a house");
  return { db, event };
}

export async function updateHealthEvent(ownerId: number, input: Omit<HealthEventInput, "cycleId"> & { healthEventId: number }) {
  const { db, event } = await getExistingHealthEvent(input.healthEventId);
  await executeHealthEventUpdate({
    ownerId,
    event,
    mutation: input,
    requireHealthAccess: async (userId, cycleId, houseId) => { await requireCycleHouseAssignment(userId, cycleId, houseId, "manage_health"); },
    persist: async (healthEventId, patch) => { await db.update(healthEvents).set(patch).where(eq(healthEvents.id, healthEventId)); },
  });
}

export async function deleteHealthEvent(ownerId: number, healthEventId: number) {
  const { db, event } = await getExistingHealthEvent(healthEventId);
  await executeHealthEventDelete({
    ownerId,
    event,
    requireHealthAccess: async (userId, cycleId, houseId) => { await requireCycleHouseAssignment(userId, cycleId, houseId, "manage_health"); },
    remove: async (eventId) => { await db.delete(healthEvents).where(eq(healthEvents.id, eventId)); },
  });
}
