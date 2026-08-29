import { describe, expect, it } from "vitest";
import { calculateMedicationDosePlan } from "../shared/medicationDoseCalculator";

describe("medication dose calculator", () => {
  const houses = [
    { id: 1, name: "الكبير", assignedBirds: 6000 },
    { id: 2, name: "الحضانة", assignedBirds: 3000 },
    { id: 3, name: "قبلي", assignedBirds: 3000 },
  ];

  it("derives the daily flock dose and distributes it in proportion to birds in each house", () => {
    const plan = calculateMedicationDosePlan({ availableAmount: 450, days: 5, houses });
    expect(plan.totalBirds).toBe(12000);
    expect(plan.dailyDose).toBe(90);
    expect(plan.allocations.map((allocation) => [allocation.name, allocation.dailyDose, allocation.courseDose])).toEqual([
      ["الكبير", 45, 225],
      ["الحضانة", 22.5, 112.5],
      ["قبلي", 22.5, 112.5],
    ]);
  });

  it("rejects invalid calculation inputs", () => {
    expect(() => calculateMedicationDosePlan({ availableAmount: 0, days: 2, houses })).toThrow("كمية دواء");
    expect(() => calculateMedicationDosePlan({ availableAmount: 20, days: 2, houses: [{ id: 1, name: "فارغ", assignedBirds: 0 }] })).toThrow("كتاكيت");
  });
});
