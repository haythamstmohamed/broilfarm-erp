export type HouseAssignmentInput = { houseId: number; assignedBirds: number };

export function maxHouseAssignment({ cycleBirdsPlaced, houseId, houseCapacity, assignments }: { cycleBirdsPlaced: number; houseId: number; houseCapacity: number; assignments: HouseAssignmentInput[] }) {
  const assignedElsewhere = assignments.filter((assignment) => assignment.houseId !== houseId).reduce((sum, assignment) => sum + assignment.assignedBirds, 0);
  return Math.max(0, Math.min(houseCapacity, cycleBirdsPlaced - assignedElsewhere));
}
