import { eq } from "drizzle-orm";
import { farmExpenses, cycles } from "../../drizzle/schema";
import { ExpenseCategory } from "../../shared/expenseManagement";
import { executeFarmExpenseCreate, executeFarmExpenseUpdate } from "../../shared/expenseLifecycle";
import { assertCycleAllowsOperationalMutation } from "../../shared/cycleMutationPolicy";
import { getDb } from "./connection";
import { requireFarmCapability } from "./auth";


export async function addFarmExpense(userId: number, input: { farmId: number; cycleId?: number; category: ExpenseCategory; amountEgp: number; expenseDate: Date; supplier?: string; reference?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  let cycle: { id: number; farmId: number; houseId: number | null; status: typeof cycles.$inferSelect.status } | undefined;
  if (input.cycleId) {
    const [storedCycle] = await db.select({ id: cycles.id, farmId: cycles.farmId, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1);
    cycle = storedCycle;
  }
  await executeFarmExpenseCreate({
    userId,
    mutation: input,
    cycle,
    requireExpenseAccess: async (actorId, farmId, scope) => { await requireFarmCapability(actorId, farmId, "manage_expenses", scope); },
    persist: async (record) => {
      await db.insert(farmExpenses).values({
        farmId: record.farmId,
        cycleId: record.cycleId ?? null,
        category: record.category,
        amountPiasters: record.amountPiasters,
        expenseDate: record.expenseDate,
        supplier: record.supplier || null,
        reference: record.reference || null,
        notes: record.notes || null,
        createdByUserId: userId,
      });
    },
  });
}

export async function updateFarmExpense(userId: number, input: { expenseId: number; cycleId?: number; category: ExpenseCategory; amountEgp: number; expenseDate: Date; supplier?: string; reference?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [storedExpense] = await db.select().from(farmExpenses).where(eq(farmExpenses.id, input.expenseId)).limit(1);
  if (!storedExpense) throw new Error("سجل المصروف غير موجود");
  const [currentCycle] = storedExpense.cycleId ? await db.select({ id: cycles.id, farmId: cycles.farmId, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq(cycles.id, storedExpense.cycleId)).limit(1) : [undefined];
  if (currentCycle?.status) {
    assertCycleAllowsOperationalMutation(currentCycle.status);
  }
  await requireFarmCapability(userId, storedExpense.farmId, "manage_expenses", { houseId: currentCycle?.houseId ?? null, cycleId: storedExpense.cycleId ?? null });
  let targetCycle: { id: number; farmId: number; houseId: number | null; status: typeof cycles.$inferSelect.status } | undefined;
  if (input.cycleId) {
    const [cycle] = await db.select({ id: cycles.id, farmId: cycles.farmId, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1);
    targetCycle = cycle;
  }
  await executeFarmExpenseUpdate({
    userId,
    mutation: { farmId: storedExpense.farmId, cycleId: input.cycleId, category: input.category, amountEgp: input.amountEgp, expenseDate: input.expenseDate, supplier: input.supplier, reference: input.reference, notes: input.notes },
    cycle: targetCycle,
    requireExpenseAccess: async (actorId, farmId, scope) => { await requireFarmCapability(actorId, farmId, "manage_expenses", scope); },
    persist: async (record) => {
      await db.update(farmExpenses).set({ cycleId: record.cycleId ?? null, category: record.category, amountPiasters: record.amountPiasters, expenseDate: record.expenseDate, supplier: record.supplier || null, reference: record.reference || null, notes: record.notes || null }).where(eq(farmExpenses.id, storedExpense.id));
    },
  });
}

export async function approveExpense(userId: number, expenseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [expense] = await db.select().from(farmExpenses).where(eq(farmExpenses.id, expenseId)).limit(1);
  if (!expense) throw new Error("سجل المصروف غير موجود");

  await requireFarmCapability(userId, expense.farmId, "approve_expenses");

  await db
    .update(farmExpenses)
    .set({
      approvalStatus: "approved",
      approvedByUserId: userId,
      approvedAt: new Date(),
    })
    .where(eq(farmExpenses.id, expenseId));

  return { success: true };
}

export async function rejectExpense(userId: number, input: { expenseId: number; reason: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [expense] = await db.select().from(farmExpenses).where(eq(farmExpenses.id, input.expenseId)).limit(1);
  if (!expense) throw new Error("سجل المصروف غير موجود");

  await requireFarmCapability(userId, expense.farmId, "approve_expenses");

  await db
    .update(farmExpenses)
    .set({
      approvalStatus: "rejected",
      rejectionReason: input.reason,
    })
    .where(eq(farmExpenses.id, input.expenseId));

  return { success: true };
}

export async function markExpensePaid(userId: number, expenseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [expense] = await db.select().from(farmExpenses).where(eq(farmExpenses.id, expenseId)).limit(1);
  if (!expense) throw new Error("سجل المصروف غير موجود");

  await requireFarmCapability(userId, expense.farmId, "manage_expenses");

  await db
    .update(farmExpenses)
    .set({
      approvalStatus: "paid",
    })
    .where(eq(farmExpenses.id, expenseId));

  return { success: true };
}
