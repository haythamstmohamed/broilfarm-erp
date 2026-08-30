import { describe, expect, it } from "vitest";
import {
  getBreedTargetForDay,
  calculateWeightUniformity,
  evaluateWaterToFeedRatio,
  calculateAdvancedEpef,
} from "../shared/productionIntelligence";

describe("Production Intelligence Engine", () => {
  describe("Breed Performance Standards", () => {
    it("returns valid targets for Ross 308 across days", () => {
      const day1 = getBreedTargetForDay("ross_308", 1);
      expect(day1.targetWeightGrams).toBeGreaterThanOrEqual(40);

      const day35 = getBreedTargetForDay("ross_308", 35);
      expect(day35.targetWeightGrams).toBeGreaterThan(2000);
      expect(day35.targetFcr).toBeGreaterThan(1.2);
    });

    it("returns valid targets for Cobb 500", () => {
      const day28 = getBreedTargetForDay("cobb_500", 28);
      expect(day28.targetWeightGrams).toBeGreaterThan(1500);
      expect(day28.dailyGainGrams).toBeGreaterThan(50);
    });
  });

  describe("Weight Uniformity & CV% Engine", () => {
    it("accurately computes uniformity and CV% for a homogeneous flock", () => {
      // 10 birds with very close weights (mean ~ 1800)
      const weights = [1780, 1800, 1820, 1790, 1810, 1800, 1830, 1770, 1810, 1800];
      const result = calculateWeightUniformity(weights);

      expect(result).not.toBeNull();
      expect(result?.meanWeightGrams).toBe(1801);
      expect(result?.cvPercentage).toBeLessThan(5); // Very low CV%
      expect(result?.uniformityPercentage).toBe(100); // All within ±10%
      expect(result?.flockGrade).toBe("world_class");
    });

    it("detects high variation (moderate / poor) flock uniformity", () => {
      // High variation sample
      const weights = [1200, 1450, 1800, 2100, 2400, 1300, 1900];
      const result = calculateWeightUniformity(weights);

      expect(result).not.toBeNull();
      expect(result?.cvPercentage).toBeGreaterThan(14);
      expect(result?.flockGrade).toBe("poor");
    });

    it("handles insufficient sample sizes gracefully", () => {
      expect(calculateWeightUniformity([])).toBeNull();
      expect(calculateWeightUniformity([1800, 1820])).toBeNull();
    });
  });

  describe("Water:Feed Ratio Diagnostic", () => {
    it("identifies optimal water:feed ratio", () => {
      const assessment = evaluateWaterToFeedRatio(350, 200, 24); // 1.75 ratio
      expect(assessment.status).toBe("optimal");
      expect(assessment.tone).toBe("emerald");
    });

    it("flags low water intake warning", () => {
      const assessment = evaluateWaterToFeedRatio(200, 180, 24); // 1.11 ratio
      expect(assessment.status).toBe("low");
      expect(assessment.tone).toBe("amber");
    });

    it("flags critical high water consumption (leaks / diarrhea)", () => {
      const assessment = evaluateWaterToFeedRatio(600, 200, 24); // 3.0 ratio
      expect(assessment.status).toBe("critical_high");
      expect(assessment.tone).toBe("rose");
    });
  });

  describe("Advanced EPEF & Adjusted FCR", () => {
    it("calculates accurate EPEF and standardized Adjusted FCR", () => {
      const result = calculateAdvancedEpef({
        birdsPlaced: 10000,
        totalMortality: 300, // 97% livability
        averageWeightGrams: 2150, // 2.15 kg
        actualFcr: 1.52,
        ageDays: 35,
      });

      expect(result).not.toBeNull();
      expect(result?.epefScore).toBeGreaterThan(380); // Excellent flock
      expect(result?.grade).toBe("excellent");
      expect(result?.adjustedFcr2kg).toBeCloseTo(1.47, 1);
    });

    it("returns null for invalid inputs", () => {
      expect(
        calculateAdvancedEpef({
          birdsPlaced: 0,
          totalMortality: 0,
          averageWeightGrams: 0,
          actualFcr: 0,
          ageDays: 0,
        })
      ).toBeNull();
    });
  });
});
