export type MedicationDoseCalculationInput = {
  availableAmount: number;
  days: number;
  houses: { id: number; name: string; assignedBirds: number }[];
};

export function calculateMedicationDosePlan(input: MedicationDoseCalculationInput) {
  if (!Number.isFinite(input.availableAmount) || input.availableAmount <= 0) throw new Error("أدخل كمية دواء صحيحة");
  if (!Number.isInteger(input.days) || input.days <= 0) throw new Error("أدخل عدد أيام صحيحاً");
  const eligibleHouses = input.houses.filter((house) => Number.isFinite(house.assignedBirds) && house.assignedBirds > 0);
  const totalBirds = eligibleHouses.reduce((sum, house) => sum + house.assignedBirds, 0);
  if (!eligibleHouses.length || totalBirds <= 0) throw new Error("لا توجد عنابر موزع عليها كتاكيت");

  const totalDose = input.availableAmount;
  const dailyDose = totalDose / input.days;
  const allocations = eligibleHouses.map((house) => {
    const share = house.assignedBirds / totalBirds;
    return { ...house, share, dailyDose: dailyDose * share, courseDose: totalDose * share };
  });
  return { totalDose, dailyDose, totalBirds, allocations };
}
