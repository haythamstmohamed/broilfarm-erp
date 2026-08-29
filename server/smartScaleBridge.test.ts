import { describe, expect, it } from "vitest";
import { calculateBatchNetMetrics, parseRawScaleData } from "../shared/smartScaleBridge";

describe("Smart Weigh Scale Bridge & Protocol Parser", () => {
  it("parses standard NCI serial data packets", () => {
    const parsed = parseRawScaleData("ST,GS,+  124.50kg\r\n");
    expect(parsed.isValid).toBe(true);
    expect(parsed.isStable).toBe(true);
    expect(parsed.weightKg).toBe(124.5);
    expect(parsed.weightGrams).toBe(124500);
    expect(parsed.unit).toBe("kg");
  });

  it("detects unstable/motion scale indicator readings", () => {
    const parsed = parseRawScaleData("US,GS,+  120.10kg\r\n");
    expect(parsed.isValid).toBe(true);
    expect(parsed.isStable).toBe(false);
  });

  it("parses Toledo / Avery ASCII scale formats", () => {
    const toledo = parseRawScaleData("WT: 85.30 kg GR");
    expect(toledo.isValid).toBe(true);
    expect(toledo.weightKg).toBe(85.3);

    const plain = parseRawScaleData("  64.20  ");
    expect(plain.isValid).toBe(true);
    expect(plain.weightKg).toBe(64.2);
  });

  it("calculates batch net weight and bird average correctly", () => {
    const metrics = calculateBatchNetMetrics({
      grossWeightKg: 125.0,
      tareWeightKg: 25.0, // 5 empty cages @ 5kg each
      cageCount: 5,
      birdCount: 50, // 10 birds per cage
    });

    expect(metrics.netWeightKg).toBe(100.0);
    expect(metrics.netWeightGrams).toBe(100000);
    expect(metrics.avgBirdWeightGrams).toBe(2000); // 100,000 / 50 = 2000g
    expect(metrics.avgCageWeightKg).toBe(5.0);
  });
});
