import { amountToPiasters } from "./expenseManagement";
import { kilogramsToGrams } from "./salesSettlement";

export function batchWeighingCalculation(input: { grossWeightKg: number; cageCount: number; tareWeightGrams: number; tareCageCount: number; pricePerKgEgp: number }) {
  if (!Number.isInteger(input.cageCount) || input.cageCount <= 0) throw new Error("عدد الأقفاص في الدفعة يجب أن يكون أكبر من صفر");
  if (!Number.isInteger(input.tareCageCount) || input.tareCageCount <= 0) throw new Error("عدد أقفاص الفارغ يجب أن يكون أكبر من صفر");
  const grossWeightGrams = kilogramsToGrams(input.grossWeightKg, "وزن الدفعة");
  const tarePerCageGrams = input.tareWeightGrams / input.tareCageCount;
  const tareWeightGrams = Math.round(tarePerCageGrams * input.cageCount);
  const netWeightGrams = grossWeightGrams - tareWeightGrams;
  if (netWeightGrams <= 0) throw new Error("وزن الدفعة الصافي يجب أن يكون أكبر من صفر");
  const pricePerKgPiasters = amountToPiasters(input.pricePerKgEgp);
  const totalPiasters = Math.round((netWeightGrams * pricePerKgPiasters) / 1000);
  return { grossWeightGrams, tareWeightGrams, netWeightGrams, totalPiasters, tarePerCageGrams };
}

export type SaleWeighingMode = "fixed" | "variable" | "direct";

export function flexibleBatchWeighingCalculation(input: { weighingMode: SaleWeighingMode; grossWeightKg: number; cageCount?: number; birdsPerCage: number; tareWeightGrams: number; tareCageCount: number; pricePerKgPiasters: number; batchTareWeightKg?: number }) {
  const grossWeightGrams = kilogramsToGrams(input.grossWeightKg, "وزن الدفعة");
  const cageCount = Math.max(0, Math.floor(input.cageCount ?? 0));
  if (input.weighingMode !== "direct" && cageCount <= 0) throw new Error("عدد الأقفاص في الدفعة يجب أن يكون أكبر من صفر");
  if (input.batchTareWeightKg !== undefined) {
    if (!Number.isFinite(input.batchTareWeightKg) || input.batchTareWeightKg < 0) throw new Error("وزن الفارغ يجب أن يكون صفراً أو أكبر");
    const batchTareWeightGrams = Math.round(input.batchTareWeightKg * 1000);
    const netWeightGrams = grossWeightGrams - batchTareWeightGrams;
    if (netWeightGrams <= 0) throw new Error("الوزن الصافي يجب أن يكون أكبر من صفر بعد خصم الفارغ");
    return { cageCount, birdCount: Math.max(0, cageCount * Math.max(0, input.birdsPerCage)), grossWeightGrams, tareWeightGrams: batchTareWeightGrams, netWeightGrams, totalPiasters: Math.round((netWeightGrams * input.pricePerKgPiasters) / 1000), tarePerCageGrams: cageCount > 0 ? Math.round(batchTareWeightGrams / cageCount) : 0 };
  }
  if (input.weighingMode === "direct" && cageCount === 0) {
    return { cageCount: 0, birdCount: 0, grossWeightGrams, tareWeightGrams: 0, netWeightGrams: grossWeightGrams, totalPiasters: Math.round((grossWeightGrams * input.pricePerKgPiasters) / 1000), tarePerCageGrams: 0 };
  }
  if (input.tareWeightGrams === 0 && input.tareCageCount === 0) {
    return { cageCount, birdCount: Math.max(0, cageCount * Math.max(0, input.birdsPerCage)), grossWeightGrams, tareWeightGrams: 0, netWeightGrams: grossWeightGrams, totalPiasters: Math.round((grossWeightGrams * input.pricePerKgPiasters) / 1000), tarePerCageGrams: 0 };
  }
  if (!Number.isInteger(input.tareCageCount) || input.tareCageCount <= 0) throw new Error("عدد أقفاص الفارغ يجب أن يكون أكبر من صفر");
  const tarePerCageGrams = input.tareWeightGrams / input.tareCageCount;
  const tareWeightGrams = Math.round(tarePerCageGrams * cageCount);
  const netWeightGrams = grossWeightGrams - tareWeightGrams;
  if (netWeightGrams <= 0) throw new Error("وزن الدفعة الصافي يجب أن يكون أكبر من صفر");
  return { cageCount, birdCount: Math.max(0, cageCount * Math.max(0, input.birdsPerCage)), grossWeightGrams, tareWeightGrams, netWeightGrams, totalPiasters: Math.round((netWeightGrams * input.pricePerKgPiasters) / 1000), tarePerCageGrams };
}

export function saleWeightAverages(input: { netWeightGrams: number; cageCount: number; birdCount: number }) {
  return { averageCageWeightGrams: input.cageCount > 0 ? Math.round(input.netWeightGrams / input.cageCount) : null, averageBirdWeightGrams: input.birdCount > 0 ? Math.round(input.netWeightGrams / input.birdCount) : null };
}

export function remainingCages(plannedCageCount: number, loadedCageCount: number) {
  return Math.max(plannedCageCount - loadedCageCount, 0);
}
