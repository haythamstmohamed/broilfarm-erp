import { and, eq, inArray } from "drizzle-orm";
import { houses, cageSections, cycleHouseAssignments, cycles, cycleCageOccupancy } from "../../drizzle/schema";
import { allocationLimit } from "../../shared/allocation";
import { canAddCycleCageRow, cageRowCapacity } from "../../shared/cageRows";
import { maxHouseAssignment } from "../../shared/houseAssignment";
import { canSetHouseCapacity } from "../../shared/lifecyclePolicy";
import { assertCycleAllowsOperationalMutation } from "../../shared/cycleMutationPolicy";
import { requireHouseCageDistribution } from "../houseScopedGuards";
import { getDb } from "./connection";
import { requireFarmCapability, requireCycleHouseAssignment } from "./auth";
import { resolveCascadeScope, deleteCascadeScope } from "./farms";


export async function setCycleHouseAssignment(ownerId: number, input: { cycleId: number; houseId: number; assignedBirds: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1);
  const [house] = await db.select({ farmId: houses.farmId, capacity: houses.capacity }).from(houses).where(eq(houses.id, input.houseId)).limit(1);
  if (!cycle || !house || cycle.farmId !== house.farmId) throw new Error("House does not belong to this cycle farm");
  assertCycleAllowsOperationalMutation(cycle.status);
  await requireFarmCapability(ownerId, cycle.farmId, "manage_housing", { houseId: input.houseId, cycleId: input.cycleId });
  await db.transaction(async (tx) => {
    const [lockedCycle] = await tx.select({ birdsPlaced: cycles.birdsPlaced }).from(cycles).where(eq(cycles.id, input.cycleId)).for("update").limit(1);
    const assignments = await tx.select({ houseId: cycleHouseAssignments.houseId, assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(eq(cycleHouseAssignments.cycleId, input.cycleId)).for("update");
    const allowedBirds = lockedCycle ? maxHouseAssignment({ cycleBirdsPlaced: lockedCycle.birdsPlaced, houseId: input.houseId, houseCapacity: house.capacity, assignments }) : 0;
    if (!lockedCycle || input.assignedBirds > allowedBirds) throw new Error("House birds cannot exceed its capacity or the total birds placed in this cycle");
    const [existing] = await tx.select({ id: cycleHouseAssignments.id }).from(cycleHouseAssignments).where(and(eq(cycleHouseAssignments.cycleId, input.cycleId), eq(cycleHouseAssignments.houseId, input.houseId))).for("update").limit(1);
    if (input.assignedBirds === 0 && existing) await tx.delete(cycleHouseAssignments).where(eq(cycleHouseAssignments.id, existing.id));
    else if (existing) await tx.update(cycleHouseAssignments).set({ assignedBirds: input.assignedBirds }).where(eq(cycleHouseAssignments.id, existing.id));
    else if (input.assignedBirds > 0) await tx.insert(cycleHouseAssignments).values(input);
  });
}

export async function createHouse(ownerId: number, input: { farmId: number; name: string; capacity: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(ownerId, input.farmId, "manage_housing");
  await db.insert(houses).values(input);
}

export async function updateHouse(ownerId: number, input: { houseId: number; name: string; capacity: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [house] = await db.select({ farmId: houses.farmId }).from(houses).where(eq(houses.id, input.houseId)).limit(1);
  if (!house) throw new Error("House not found");
  await requireFarmCapability(ownerId, house.farmId, "manage_housing", { houseId: input.houseId, cycleId: null });
  const sections = await db.select({ cageCount: cageSections.cageCount, capacityPerCage: cageSections.capacityPerCage }).from(cageSections).where(eq(cageSections.houseId, input.houseId));
  const configuredCapacity = sections.reduce((sum, section) => sum + section.cageCount * section.capacityPerCage, 0);
  const assignments = await db.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(eq(cycleHouseAssignments.houseId, input.houseId));
  const highestAssignedBirds = assignments.reduce((max, assignment) => Math.max(max, assignment.assignedBirds), 0);
  if (!canSetHouseCapacity(input.capacity, Math.max(configuredCapacity, highestAssignedBirds))) throw new Error("House capacity cannot be less than cage capacity or assigned cycle birds");
  await db.update(houses).set({ name: input.name, capacity: input.capacity }).where(eq(houses.id, input.houseId));
}

export async function deleteHouse(ownerId: number, houseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const scope = await resolveCascadeScope(db, "house", houseId);
  await requireFarmCapability(ownerId, scope.farmId, "manage_housing", { houseId, cycleId: null });
  await db.transaction(async (tx) => deleteCascadeScope(tx, scope, "house"));
}

export async function createCageSection(ownerId: number, input: { cycleId: number; houseId: number; name: string; rowName: string; cageCount: number; capacityPerCage: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const assignment = await requireCycleHouseAssignment(ownerId, input.cycleId, input.houseId, "manage_housing");
  const [house] = await db.select({ capacity: houses.capacity }).from(houses).where(eq(houses.id, input.houseId)).limit(1);
  if (!house) throw new Error("House not found");
  const rowCapacity = cageRowCapacity(input.cageCount, input.capacityPerCage);
  await db.transaction(async (tx) => {
    const existingSections = await tx.select({ id: cageSections.id, cageCount: cageSections.cageCount, capacityPerCage: cageSections.capacityPerCage }).from(cageSections).where(eq(cageSections.houseId, input.houseId)).for("update");
    const existingRowCapacity = existingSections.reduce((sum, section) => sum + cageRowCapacity(section.cageCount, section.capacityPerCage), 0);
    const existingOccupancy = existingSections.length ? await tx.select({ occupiedBirds: cycleCageOccupancy.occupiedBirds }).from(cycleCageOccupancy).where(and(eq(cycleCageOccupancy.cycleId, input.cycleId), inArray(cycleCageOccupancy.cageSectionId, existingSections.map((section) => section.id)))).for("update") : [];
    const existingCycleBirds = existingOccupancy.reduce((sum, allocation) => sum + allocation.occupiedBirds, 0);
    if (!canAddCycleCageRow({ houseCapacity: house.capacity, assignedBirds: assignment.assignedBirds, existingRowCapacity, existingCycleBirds, cageCount: input.cageCount, birdsPerCage: input.capacityPerCage })) throw new Error("Cage row capacity exceeds the house capacity or birds assigned to this house for the cycle");
    const [section] = await tx.insert(cageSections).values({ houseId: input.houseId, name: input.name, rowName: input.rowName, cageCount: input.cageCount, capacityPerCage: input.capacityPerCage }).$returningId();
    await tx.insert(cycleCageOccupancy).values({ cycleId: input.cycleId, cageSectionId: section.id, occupiedBirds: rowCapacity });
  });
}

export async function setCageOccupancy(ownerId: number, input: { cycleId: number; cageSectionId: number; occupiedBirds: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1);
  if (!cycle) throw new Error("Cycle not found");
  const [section] = await db.select({ farmId: houses.farmId, houseId: cageSections.houseId, cageCount: cageSections.cageCount, capacityPerCage: cageSections.capacityPerCage }).from(cageSections).innerJoin(houses, eq(cageSections.houseId, houses.id)).where(eq(cageSections.id, input.cageSectionId)).limit(1);
  if (!section || section.farmId !== cycle.farmId) throw new Error("Cage section does not belong to this cycle farm");
  await requireCycleHouseAssignment(ownerId, input.cycleId, section.houseId, "manage_housing");
  await db.transaction(async (tx) => {
    const [lockedAssignment] = await tx.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(and(eq(cycleHouseAssignments.cycleId, input.cycleId), eq(cycleHouseAssignments.houseId, section.houseId))).for("update").limit(1);
    requireHouseCageDistribution({ assignedBirds: lockedAssignment?.assignedBirds, houseSectionCapacity: section.cageCount * section.capacityPerCage });
    const existingAllocations = await tx.select({ cageSectionId: cycleCageOccupancy.cageSectionId, occupiedBirds: cycleCageOccupancy.occupiedBirds }).from(cycleCageOccupancy).where(eq(cycleCageOccupancy.cycleId, input.cycleId)).for("update");
    const sectionCapacity = section.cageCount * section.capacityPerCage;
    const houseSectionIds = new Set((await tx.select({ id: cageSections.id }).from(cageSections).where(eq(cageSections.houseId, section.houseId))).map((item) => item.id));
    const houseAllocations = existingAllocations.filter((allocation) => houseSectionIds.has(allocation.cageSectionId));
    const { maxAssignable } = allocationLimit({ birdsPlaced: lockedAssignment?.assignedBirds ?? 0, targetSectionId: input.cageSectionId, sectionCapacity, allocations: houseAllocations });
    if (input.occupiedBirds > maxAssignable) throw new Error("Occupied birds exceed this house assignment or the section capacity");
    const [existing] = await tx.select({ id: cycleCageOccupancy.id }).from(cycleCageOccupancy).where(and(eq(cycleCageOccupancy.cycleId, input.cycleId), eq(cycleCageOccupancy.cageSectionId, input.cageSectionId))).for("update").limit(1);
    if (existing) await tx.update(cycleCageOccupancy).set({ occupiedBirds: input.occupiedBirds }).where(eq(cycleCageOccupancy.id, existing.id));
    else await tx.insert(cycleCageOccupancy).values(input);
  });
}
