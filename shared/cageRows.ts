export function cageRowCapacity(cageCount: number, birdsPerCage: number) {
  return Math.max(0, Math.floor(cageCount)) * Math.max(0, Math.floor(birdsPerCage));
}

export function canAddCycleCageRow({ houseCapacity, assignedBirds, existingRowCapacity, existingCycleBirds, cageCount, birdsPerCage }: { houseCapacity: number; assignedBirds: number; existingRowCapacity: number; existingCycleBirds: number; cageCount: number; birdsPerCage: number }) {
  const rowCapacity = cageRowCapacity(cageCount, birdsPerCage);
  return rowCapacity > 0 && existingRowCapacity + rowCapacity <= houseCapacity && existingCycleBirds + rowCapacity <= assignedBirds;
}
