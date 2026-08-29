import { canDistributeCagesForHouse, canRecordForHouse } from "../shared/houseScopedPolicy";

export function requireHouseScopedRecord({ cycleFarmId, houseFarmId, assignedBirds }: { cycleFarmId: number; houseFarmId: number; assignedBirds: number | null | undefined }) {
  if (!canRecordForHouse({ cycleFarmId, houseFarmId, assignedBirds })) throw new Error("Assign birds to this house before recording operations");
}

export function requireHouseCageDistribution({ assignedBirds, houseSectionCapacity }: { assignedBirds: number | null | undefined; houseSectionCapacity: number }) {
  if (!canDistributeCagesForHouse({ assignedBirds, houseSectionCapacity })) throw new Error("Assign birds to this house before distributing them to cage sections");
}
