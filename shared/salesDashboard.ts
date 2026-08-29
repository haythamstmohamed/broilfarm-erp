export type SaleDashboardInput = {
  plannedCageCount: number;
  totalPiasters: number;
  discountPiasters: number;
  batches: Array<{ cageCount: number; birdCount: number; grossWeightGrams: number; tareWeightGrams?: number; netWeightGrams: number; weighingStage?: "tare_pending" | "filled" }>;
  payments: Array<{ amountPiasters: number }>;
};

export function saleDashboardMetrics(input: SaleDashboardInput) {
  const filledBatches = input.batches.filter((batch) => batch.weighingStage !== "tare_pending");
  const loadedCages = filledBatches.reduce((sum, batch) => sum + batch.cageCount, 0);
  const totalBirds = filledBatches.reduce((sum, batch) => sum + batch.birdCount, 0);
  const grossWeightGrams = filledBatches.reduce((sum, batch) => sum + batch.grossWeightGrams, 0);
  const tareWeightGrams = input.batches.reduce((sum, batch) => sum + (batch.tareWeightGrams ?? 0), 0);
  const tareCages = input.batches.filter((batch) => batch.weighingStage === "tare_pending").reduce((sum, batch) => sum + batch.cageCount, 0);
  const netWeightGrams = Math.max(grossWeightGrams - tareWeightGrams, 0);
  const totalPaidPiasters = input.payments.reduce((sum, payment) => sum + payment.amountPiasters, 0);
  const netDuePiasters = Math.max(input.totalPiasters - input.discountPiasters, 0);
  const remainingPiasters = Math.max(netDuePiasters - totalPaidPiasters, 0);
  const remainingCages = Math.max(input.plannedCageCount - loadedCages, 0);
  const settlementStatus = remainingPiasters === 0 && netDuePiasters > 0 ? "paid" : totalPaidPiasters > 0 ? "partial" : "unpaid";
  return {
    loadedCages,
    totalBirds,
    grossWeightGrams,
    tareWeightGrams,
    tareCages,
    netWeightGrams,
    remainingCages,
    completionPercent: input.plannedCageCount > 0 ? Math.min(100, Math.round((loadedCages / input.plannedCageCount) * 100)) : 0,
    averageCageWeightGrams: loadedCages > 0 ? Math.round(netWeightGrams / loadedCages) : null,
    averageBirdWeightGrams: totalBirds > 0 ? Math.round(netWeightGrams / totalBirds) : null,
    netDuePiasters,
    totalPaidPiasters,
    remainingPiasters,
    settlementStatus,
  } as const;
}

export function saleValueFromLedgerWeight(netWeightGrams: number, pricePerKgPiasters: number) {
  if (!Number.isSafeInteger(netWeightGrams) || netWeightGrams < 0 || !Number.isSafeInteger(pricePerKgPiasters) || pricePerKgPiasters <= 0) throw new Error("الوزن الصافي أو سعر الكيلو غير صالح");
  return Math.round((netWeightGrams * pricePerKgPiasters) / 1000);
}
