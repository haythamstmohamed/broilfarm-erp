export const workerAccountEntryTypes = ["salary_credit", "advance", "withdrawal", "adjustment"] as const;
export type WorkerAccountEntryType = (typeof workerAccountEntryTypes)[number];

export type WorkerAccountEntry = { entryType: WorkerAccountEntryType; amountPiasters: number };

export function workerAccountAmountToPiasters(entryType: WorkerAccountEntryType, amountEgp: number) {
  const allowsSignedAmount = entryType === "adjustment";
  if (!Number.isFinite(amountEgp) || (allowsSignedAmount ? amountEgp === 0 : amountEgp <= 0)) throw new Error("قيمة حركة حساب العامل غير صالحة");
  const piasters = Math.round(amountEgp * 100);
  if (!Number.isSafeInteger(piasters) || Math.abs(piasters) > 1_000_000_000) throw new Error("قيمة حركة حساب العامل غير صالحة");
  return piasters;
}

/**
 * Calculates the internal worker account only. It never contributes to farm expenses;
 * the full payroll expense remains a separately entered expense record.
 */
export function workerAccountSummary(entries: WorkerAccountEntry[]) {
  const salaryCreditsPiasters = entries.filter((entry) => entry.entryType === "salary_credit").reduce((sum, entry) => sum + entry.amountPiasters, 0);
  const advancesPiasters = entries.filter((entry) => entry.entryType === "advance").reduce((sum, entry) => sum + entry.amountPiasters, 0);
  const withdrawalsPiasters = entries.filter((entry) => entry.entryType === "withdrawal").reduce((sum, entry) => sum + entry.amountPiasters, 0);
  const adjustmentsPiasters = entries.filter((entry) => entry.entryType === "adjustment").reduce((sum, entry) => sum + entry.amountPiasters, 0);
  const salaryAvailablePiasters = salaryCreditsPiasters + adjustmentsPiasters;
  const withdrawnPiasters = advancesPiasters + withdrawalsPiasters;
  const netPiasters = salaryAvailablePiasters - withdrawnPiasters;
  return {
    salaryCreditsPiasters,
    advancesPiasters,
    withdrawalsPiasters,
    adjustmentsPiasters,
    salaryAvailablePiasters,
    withdrawnPiasters,
    remainingSalaryPiasters: Math.max(netPiasters, 0),
    overdrawnPiasters: Math.max(-netPiasters, 0),
  };
}
