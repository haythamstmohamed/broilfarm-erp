import { describe, expect, it } from "vitest";
import { batchWeighingCalculation, flexibleBatchWeighingCalculation, remainingCages, saleWeightAverages } from "../shared/batchWeighing";

describe("sequential cage weighing", () => {
  it("calculates one five-cage batch from measured gross weight and sampled cage tare", () => {
    const result = batchWeighingCalculation({ grossWeightKg: 178.5, cageCount: 5, tareWeightGrams: 24_000, tareCageCount: 6, pricePerKgEgp: 72.5 });
    expect(result).toMatchObject({ grossWeightGrams: 178_500, tareWeightGrams: 20_000, netWeightGrams: 158_500, totalPiasters: 1_149_125 });
  });

  it("never reports a negative remaining cage balance", () => {
    expect(remainingCages(200, 195)).toBe(5);
    expect(remainingCages(200, 200)).toBe(0);
    expect(remainingCages(200, 205)).toBe(0);
  });

  it("rejects a batch whose tare consumes the entire gross measurement", () => {
    expect(() => batchWeighingCalculation({ grossWeightKg: 20, cageCount: 5, tareWeightGrams: 24_000, tareCageCount: 6, pricePerKgEgp: 72.5 })).toThrow("الصافي");
  });

  it("supports variable cage batches and calculates their birds and sale value", () => {
    const result = flexibleBatchWeighingCalculation({ weighingMode: "variable", grossWeightKg: 162.5, cageCount: 3, birdsPerCage: 10, tareWeightGrams: 20_000, tareCageCount: 5, pricePerKgPiasters: 7_250 });
    expect(result).toMatchObject({ cageCount: 3, birdCount: 30, tareWeightGrams: 12_000, netWeightGrams: 150_500, totalPiasters: 1_091_125 });
    expect(saleWeightAverages({ netWeightGrams: result.netWeightGrams, cageCount: result.cageCount, birdCount: result.birdCount })).toEqual({ averageCageWeightGrams: 50167, averageBirdWeightGrams: 5017 });
  });

  it("supports direct weight without cages or tare", () => {
    const result = flexibleBatchWeighingCalculation({ weighingMode: "direct", grossWeightKg: 450.25, birdsPerCage: 0, tareWeightGrams: 0, tareCageCount: 0, pricePerKgPiasters: 7_000 });
    expect(result).toMatchObject({ cageCount: 0, birdCount: 0, grossWeightGrams: 450_250, tareWeightGrams: 0, netWeightGrams: 450_250, totalPiasters: 3_151_750 });
  });

  it("records a simple cage batch without applying tare when no tare was entered", () => {
    const result = flexibleBatchWeighingCalculation({ weighingMode: "variable", grossWeightKg: 48.5, cageCount: 5, birdsPerCage: 0, tareWeightGrams: 0, tareCageCount: 0, pricePerKgPiasters: 9_500 });
    expect(result).toMatchObject({ cageCount: 5, grossWeightGrams: 48_500, tareWeightGrams: 0, netWeightGrams: 48_500, totalPiasters: 460_750 });
  });

  it("deducts the entered empty-cage weight from the filled batch before pricing", () => {
    const result = flexibleBatchWeighingCalculation({ weighingMode: "variable", grossWeightKg: 48.5, batchTareWeightKg: 2.5, cageCount: 5, birdsPerCage: 0, tareWeightGrams: 0, tareCageCount: 0, pricePerKgPiasters: 9_500 });
    expect(result).toMatchObject({ grossWeightGrams: 48_500, tareWeightGrams: 2_500, netWeightGrams: 46_000, totalPiasters: 437_000 });
  });
});
