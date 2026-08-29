import { and, desc, eq } from "drizzle-orm";
import {
  addDailyRecord,
  addFarmExpense,
  addHealthEvent,
  createInvitation,
  deleteDailyRecord,
  deleteHealthEvent,
  getDb,
  getUserByOpenId,
  getWorkspace,
  redeemInvitation,
  upsertUser,
} from "../server/db.ts";
import { ENV } from "../server/_core/env.ts";
import { cycles, dailyRecords, farms, healthEvents, houses } from "../drizzle/schema.ts";

async function expectReject(action) {
  try { await action(); return { rejected: false, message: "accepted" }; }
  catch (error) { return { rejected: true, message: error instanceof Error ? error.message : String(error) }; }
}

async function run() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const owner = await getUserByOpenId(ENV.ownerOpenId);
  const [farm] = await db.select().from(farms).where(eq(farms.name, "TEST FARM — BroilFarm QA")).limit(1);
  const [cycle] = farm ? await db.select().from(cycles).where(eq(cycles.farmId, farm.id)).limit(1) : [];
  const [house] = farm ? await db.select().from(houses).where(eq(houses.farmId, farm.id)).limit(1) : [];
  if (!owner || !farm || !cycle || !house) throw new Error("بيئة QA غير مكتملة");

  const qaMembers = [
    { role: "farm_manager", openId: "qa-manager-broilfarm", name: "QA Farm Manager" },
    { role: "veterinarian", openId: "qa-vet-broilfarm", name: "QA Veterinarian" },
    { role: "engineer", openId: "qa-engineer-broilfarm", name: "QA Engineer" },
    { role: "worker", openId: "qa-worker-broilfarm", name: "QA Worker" },
  ];
  const members = {};
  for (const member of qaMembers) {
    await upsertUser({ openId: member.openId, name: member.name, email: `${member.openId}@qa.invalid`, loginMethod: "qa" });
    const user = await getUserByOpenId(member.openId);
    const invitation = await createInvitation(owner.id, { farmId: farm.id, cycleId: cycle.id, role: member.role, maxUses: 1, notes: `QA role verification: ${member.role}` });
    await redeemInvitation(user.id, invitation.code);
    members[member.role] = user;
  }

  const vetExpense = await expectReject(() => addFarmExpense(members.veterinarian.id, { farmId: farm.id, cycleId: cycle.id, category: "health", amountEgp: 1, expenseDate: new Date("2026-08-20T12:00:00.000Z"), reference: "QA-DENY-VET-EXPENSE" }));
  const workerHealth = await expectReject(() => addHealthEvent(members.worker.id, { cycleId: cycle.id, houseId: house.id, eventDate: new Date("2026-08-20T12:00:00.000Z"), eventType: "vaccination", productName: "QA forbidden event", dosage: "QA", notes: "Should be rejected" }));
  const workerWorkspace = await getWorkspace(members.worker.id);

  let closedCycleDailyMutationAllowed = false;
  try {
    await addDailyRecord(members.worker.id, { cycleId: cycle.id, houseId: house.id, recordDate: new Date("2026-08-20T12:00:00.000Z"), feedKg: 0, waterLiters: 0, mortality: 0, culls: 0 });
    closedCycleDailyMutationAllowed = true;
    const [record] = await db.select().from(dailyRecords).where(and(eq(dailyRecords.cycleId, cycle.id), eq(dailyRecords.houseId, house.id))).orderBy(desc(dailyRecords.id)).limit(1);
    if (record) await deleteDailyRecord(members.worker.id, record.id);
  } catch { /* Closed-cycle protection would produce the expected rejection. */ }

  let closedCycleHealthMutationAllowed = false;
  try {
    await addHealthEvent(members.veterinarian.id, { cycleId: cycle.id, houseId: house.id, eventDate: new Date("2026-08-20T12:00:00.000Z"), eventType: "medication", productName: "QA lifecycle probe", dosage: "QA", notes: "Temporary QA lifecycle probe" });
    closedCycleHealthMutationAllowed = true;
    const [event] = await db.select().from(healthEvents).where(and(eq(healthEvents.cycleId, cycle.id), eq(healthEvents.productName, "QA lifecycle probe"))).orderBy(desc(healthEvents.id)).limit(1);
    if (event) await deleteHealthEvent(members.veterinarian.id, event.id);
  } catch { /* Closed-cycle protection would produce the expected rejection. */ }

  console.log(JSON.stringify({
    veterinarianExpenseDenied: vetExpense,
    workerHealthDenied: workerHealth,
    workerVisibleFarmIds: workerWorkspace.farms.map((item) => item.id),
    qaFarmId: farm.id,
    closedCycleDailyMutationAllowed,
    closedCycleHealthMutationAllowed,
  }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
