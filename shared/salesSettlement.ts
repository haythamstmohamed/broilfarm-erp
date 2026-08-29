import { amountToPiasters } from "./expenseManagement";

export type SaleCalculationInput = {
  grossWeightKg: number;
  loadedCageCount: number;
  tareWeightKg: number;
  tareCageCount: number;
  pricePerKgEgp: number;
};

export function kilogramsToGrams(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} يجب أن يكون أكبر من صفر`);
  const grams = Math.round(value * 1000);
  if (!Number.isSafeInteger(grams)) throw new Error(`${label} غير صالح`);
  return grams;
}

export function saleSettlement(input: SaleCalculationInput) {
  if (!Number.isInteger(input.loadedCageCount) || input.loadedCageCount <= 0) throw new Error("عدد الأقفاص المحملة يجب أن يكون أكبر من صفر");
  if (!Number.isInteger(input.tareCageCount) || input.tareCageCount <= 0) throw new Error("عدد أقفاص الفارغ يجب أن يكون أكبر من صفر");
  const grossWeightGrams = kilogramsToGrams(input.grossWeightKg, "الوزن الإجمالي");
  const tareWeightGrams = kilogramsToGrams(input.tareWeightKg, "وزن الفارغ");
  const tarePerCageGrams = tareWeightGrams / input.tareCageCount;
  const totalTareGrams = Math.round(tarePerCageGrams * input.loadedCageCount);
  const netWeightGrams = grossWeightGrams - totalTareGrams;
  if (netWeightGrams <= 0) throw new Error("الوزن الصافي يجب أن يكون أكبر من صفر بعد خصم وزن الأقفاص");
  const pricePerKgPiasters = amountToPiasters(input.pricePerKgEgp);
  const totalPiasters = Math.round((netWeightGrams * pricePerKgPiasters) / 1000);
  return { grossWeightGrams, tareWeightGrams, tarePerCageGrams, totalTareGrams, netWeightGrams, pricePerKgPiasters, totalPiasters };
}

export function salesSettlementSummary(input: { salesTotalPiasters: number; paidPiasters: number; cycleExpensesPiasters: number }) {
  const remainingPiasters = Math.max(input.salesTotalPiasters - input.paidPiasters, 0);
  return { remainingPiasters, netProfitPiasters: input.salesTotalPiasters - input.cycleExpensesPiasters };
}
