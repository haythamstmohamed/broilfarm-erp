export function canRecordForHouse({ cycleFarmId, houseFarmId, assignedBirds }: { cycleFarmId: number; houseFarmId: number; assignedBirds: number | null | undefined }) {
  return cycleFarmId === houseFarmId && (assignedBirds ?? 0) > 0;
}

export function canDistributeCagesForHouse({ assignedBirds, houseSectionCapacity }: { assignedBirds: number | null | undefined; houseSectionCapacity: number }) {
  return (assignedBirds ?? 0) > 0 && houseSectionCapacity > 0;
}
