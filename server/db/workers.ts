import { eq } from "drizzle-orm";
import { workers, workerAccountEntries } from "../../drizzle/schema";
import { WorkerAccountEntryType, workerAccountAmountToPiasters } from "../../shared/workerAccounts";
import { requireFarmCapability } from "./auth";
import { getDb } from "./connection";


export async function createWorker(userId: number, input: { farmId: number; name: string; jobTitle?: string; phone?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_expenses");
  await db.insert(workers).values({ farmId: input.farmId, name: input.name, jobTitle: input.jobTitle || null, phone: input.phone || null, notes: input.notes || null, createdByUserId: userId });
}

export async function updateWorker(userId: number, input: { workerId: number; name: string; jobTitle?: string; phone?: string; notes?: string; isActive: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [worker] = await db.select().from(workers).where(eq(workers.id, input.workerId)).limit(1);
  if (!worker) throw new Error("العامل غير موجود");
  await requireFarmCapability(userId, worker.farmId, "manage_expenses");
  await db.update(workers).set({ name: input.name, jobTitle: input.jobTitle || null, phone: input.phone || null, notes: input.notes || null, isActive: input.isActive }).where(eq(workers.id, worker.id));
}

export async function requireWorkerAccountAccess(db: any, userId: number, workerId: number) {
  const [worker] = await db.select().from(workers).where(eq(workers.id, workerId)).limit(1);
  if (!worker) throw new Error("العامل غير موجود");
  await requireFarmCapability(userId, worker.farmId, "manage_expenses");
  return worker;
}

export async function addWorkerAccountEntry(userId: number, input: { workerId: number; entryType: WorkerAccountEntryType; amountEgp: number; occurredAt: Date; reference?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const worker = await requireWorkerAccountAccess(db, userId, input.workerId);
  await db.insert(workerAccountEntries).values({ farmId: worker.farmId, workerId: worker.id, entryType: input.entryType, amountPiasters: workerAccountAmountToPiasters(input.entryType, input.amountEgp), occurredAt: input.occurredAt, reference: input.reference || null, notes: input.notes || null, createdByUserId: userId });
}

export async function updateWorkerAccountEntry(userId: number, input: { entryId: number; entryType: WorkerAccountEntryType; amountEgp: number; occurredAt: Date; reference?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [entry] = await db.select().from(workerAccountEntries).where(eq(workerAccountEntries.id, input.entryId)).limit(1);
  if (!entry) throw new Error("حركة حساب العامل غير موجودة");
  const worker = await requireWorkerAccountAccess(db, userId, entry.workerId);
  await db.update(workerAccountEntries).set({ farmId: worker.farmId, entryType: input.entryType, amountPiasters: workerAccountAmountToPiasters(input.entryType, input.amountEgp), occurredAt: input.occurredAt, reference: input.reference || null, notes: input.notes || null }).where(eq(workerAccountEntries.id, entry.id));
}

export async function deleteWorkerAccountEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [entry] = await db.select().from(workerAccountEntries).where(eq(workerAccountEntries.id, entryId)).limit(1);
  if (!entry) throw new Error("حركة حساب العامل غير موجودة");
  await requireWorkerAccountAccess(db, userId, entry.workerId);
  await db.delete(workerAccountEntries).where(eq(workerAccountEntries.id, entry.id));
}
