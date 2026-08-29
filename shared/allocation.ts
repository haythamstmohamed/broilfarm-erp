export type SectionAllocation = { cageSectionId: number; occupiedBirds: number };

export function allocationLimit({ birdsPlaced, targetSectionId, sectionCapacity, allocations }: { birdsPlaced: number; targetSectionId: number; sectionCapacity: number; allocations: SectionAllocation[] }) {
  const assignedElsewhere = allocations.filter((allocation) => allocation.cageSectionId !== targetSectionId).reduce((sum, allocation) => sum + allocation.occupiedBirds, 0);
  const remainingForCycle = Math.max(0, birdsPlaced - assignedElsewhere);
  return { assignedElsewhere, remainingForCycle, maxAssignable: Math.max(0, Math.min(sectionCapacity, remainingForCycle)) };
}
