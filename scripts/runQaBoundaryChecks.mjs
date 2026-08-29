import { eq } from "drizzle-orm";
import { addFeedInventoryTransaction, getDb, getUserByOpenId, setCycleHouseAssignment } from "../server/db.ts";
import { ENV } from "../server/_core/env.ts";
import { cycles, farms, houses } from "../drizzle/schema.ts";

async function expectRejection(label, action) {
  try {
    await action();
    throw new Error(`${label}: العملية قُبلت على غير المتوقع`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("قُبلت على غير المتوقع")) throw error;
    return error instanceof Error ? error.message : String(error);
  }
}

async function run() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const owner = await getUserByOpenId(ENV.ownerOpenId);
  if (!owner) throw new Error("لا يوجد مالك مهيأ");
  const [farm] = await db.select().from(farms).where(eq(farms.name, "TEST FARM — BroilFarm QA")).limit(1);
  const [cycle] = farm ? await db.select().from(cycles).where(eq(cycles.farmId, farm.id)).limit(1) : [];
  const [house] = farm ? await db.select().from(houses).where(eq(houses.farmId, farm.id)).limit(1) : [];
  if (!farm || !cycle || !house) throw new Error("بيئة QA غير مكتملة");

  const oversizeInventoryMessage = await expectRejection("oversize_inventory_issue", () => addFeedInventoryTransaction(owner.id, {
    farmId: farm.id,
    movementType: "issue",
    bagDelta: -9_999,
    occurredAt: new Date("2026-08-20T12:00:00.000Z"),
    reference: "QA-BOUNDARY-OVERSIZE",
    notes: "Should reject without persistence",
  }));
  const capacityMessage = await expectRejection("house_capacity_overage", () => setCycleHouseAssignment(owner.id, {
    cycleId: cycle.id,
    houseId: house.id,
    assignedBirds: house.capacity + 1,
  }));
  console.log(JSON.stringify({ oversizeInventoryRejected: oversizeInventoryMessage, houseCapacityRejected: capacityMessage }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
