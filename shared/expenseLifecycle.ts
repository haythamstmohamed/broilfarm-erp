import { amountToPiasters, expenseCycleBelongsToFarm, ExpenseCategory } from "./expenseManagement";
import { assertCycleAllowsOperationalMutation, CycleMutationStatus } from "./cycleMutationPolicy";

export type ExpenseWriteMutation = {
  farmId: number;
  cycleId?: number;
  category: ExpenseCategory;
  amountEgp: number;
  expenseDate: Date;
  supplier?: string;
  reference?: string;
  notes?: string;
};

export type ExpenseCycleScope = { id: number; farmId: number; houseId: number | null; status?: CycleMutationStatus };

export async function executeFarmExpenseCreate(input: {
  userId: number;
  mutation: ExpenseWriteMutation;
  cycle?: ExpenseCycleScope;
  requireExpenseAccess: (userId: number, farmId: number, scope: { houseId: number | null; cycleId: number | null }) => Promise<void>;
  persist: (record: ExpenseWriteMutation & { amountPiasters: number }) => Promise<void>;
}) {
  if (input.mutation.cycleId) {
    if (!input.cycle || input.cycle.id !== input.mutation.cycleId || !expenseCycleBelongsToFarm(input.mutation.farmId, input.cycle.farmId)) {
      throw new Error("لا تنتمي الدورة المحددة إلى هذه المزرعة");
    }
    if (input.cycle.status) {
      assertCycleAllowsOperationalMutation(input.cycle.status);
    }
  }
  await input.requireExpenseAccess(input.userId, input.mutation.farmId, { houseId: input.cycle?.houseId ?? null, cycleId: input.mutation.cycleId ?? null });
  const record = { ...input.mutation, amountPiasters: amountToPiasters(input.mutation.amountEgp) };
  await input.persist(record);
  return record;
}

/** Applies the same farm, cycle, access, and money-integrity rules when an existing expense is edited. */
export async function executeFarmExpenseUpdate(input: {
  userId: number;
  mutation: ExpenseWriteMutation;
  cycle?: ExpenseCycleScope;
  requireExpenseAccess: (userId: number, farmId: number, scope: { houseId: number | null; cycleId: number | null }) => Promise<void>;
  persist: (record: ExpenseWriteMutation & { amountPiasters: number }) => Promise<void>;
}) {
  return executeFarmExpenseCreate(input);
}
