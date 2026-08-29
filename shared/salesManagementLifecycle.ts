export function evaluateBatchCageEntry(input: { weighingMode: "fixed" | "variable" | "direct"; cageCount: number; remainingCages: number; allowOverage?: boolean }) {
  if (input.weighingMode === "direct") return { requiresManagerOverride: false };
  if (!Number.isInteger(input.cageCount) || input.cageCount <= 0) throw new Error("عدد أقفاص الدفعة غير صالح");
  if (input.cageCount <= input.remainingCages) return { requiresManagerOverride: false };
  if (!input.allowOverage) throw new Error(`المتبقي في التحميل هو ${input.remainingCages} قفص فقط. يلزم تأكيد إداري لتجاوز العدد المخطط.`);
  return { requiresManagerOverride: true };
}

export function assertSaleCanComplete(input: { weighingMode: "fixed" | "variable" | "direct"; loadedCageCount: number; plannedCageCount: number; usesIndependentLedgers?: boolean }) {
  if (input.usesIndependentLedgers) return;
  if (input.weighingMode !== "direct" && input.loadedCageCount < input.plannedCageCount) throw new Error("لا يمكن إنهاء البيع قبل وزن كل الأقفاص المخططة");
}

export function assertSaleUpdateKeepsPaymentsCovered(input: { totalPiasters: number; discountPiasters: number; paidPiasters: number }) {
  if (input.discountPiasters > input.totalPiasters) throw new Error("لا يمكن أن يتجاوز الخصم إجمالي البيع");
  if (input.paidPiasters > input.totalPiasters - input.discountPiasters) throw new Error("لا يمكن أن يصبح صافي المستحق أقل من الدفعات المسجلة");
}

export function assertSaleCanSoftDelete(isDeleted: boolean) {
  if (isDeleted) throw new Error("عملية البيع غير موجودة");
}

export function assertBatchOrder(currentIds: number[], requestedIds: number[]) {
  if (currentIds.length !== requestedIds.length || currentIds.some((id) => !requestedIds.includes(id))) throw new Error("ترتيب الدفعات غير مكتمل");
}

export function nextBatchSequence(highestExistingSequence: number) {
  if (!Number.isInteger(highestExistingSequence) || highestExistingSequence < 0) throw new Error("تسلسل الدفعات غير صالح");
  return highestExistingSequence + 1;
}
