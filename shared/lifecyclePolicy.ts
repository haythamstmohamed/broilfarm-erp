export function canSetCycleBirds(birdsPlaced: number, assignedBirds: number) {
  return birdsPlaced >= assignedBirds;
}

export function canSetHouseCapacity(capacity: number, configuredCageCapacity: number) {
  return capacity >= configuredCageCapacity;
}

export function canDeleteFarm(houseCount: number, cycleCount: number) {
  return houseCount === 0 && cycleCount === 0;
}

export function canDeleteCycle(dependencyCount: number) {
  return dependencyCount === 0;
}

export function canDeleteHouse(cageSectionCount: number) {
  return cageSectionCount === 0;
}
