import { and, eq } from "drizzle-orm";
import { farms, farmMemberships, cycles, houses, cycleHouseAssignments } from "../../drizzle/schema";
import { FarmCapability, MembershipScope, roleCan, ResolvedFarmRole, scopeAllows } from "../../shared/accessControl";
import { assertCycleAllowsOperationalMutation } from "../../shared/cycleMutationPolicy";
import { requireHouseScopedRecord } from "../houseScopedGuards";
import { getDb } from "./connection";

export async function resolveFarmAccess(userId: number, farmId: number): Promise<{ role: ResolvedFarmRole; scope: MembershipScope } | null> {
  const db = await getDb();
  if (!db) return null;
  const [farm] = await db.select({ ownerId: farms.ownerId }).from(farms).where(eq(farms.id, farmId)).limit(1);
  if (!farm) return null;
  if (farm.ownerId === userId) return { role: "owner", scope: { houseId: null, cycleId: null } };
  const [membership] = await db.select({ role: farmMemberships.role, houseId: farmMemberships.houseId, cycleId: farmMemberships.cycleId }).from(farmMemberships).where(and(eq(farmMemberships.userId, userId), eq(farmMemberships.farmId, farmId), eq(farmMemberships.isActive, true))).limit(1);
  return membership ? { role: membership.role, scope: { houseId: membership.houseId, cycleId: membership.cycleId } } : null;
}

export async function requireFarmCapability(userId: number, farmId: number, capability: FarmCapability, resourceScope: MembershipScope = { houseId: null, cycleId: null }) {
  const access = await resolveFarmAccess(userId, farmId);
  if (!access || !roleCan(access.role, capability) || !scopeAllows(access.scope, resourceScope)) throw new Error("You do not have permission for this farm action");
  return access.role;
}

export async function requireCycleCapability(userId: number, cycleId: number, capability: FarmCapability) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, cycleId)).limit(1);
  if (!cycle) throw new Error("Cycle not found");
  return requireFarmCapability(userId, cycle.farmId, capability, { houseId: cycle.houseId, cycleId });
}

export async function requireCycleHouseAssignment(userId: number, cycleId: number, houseId: number, capability: FarmCapability) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq(cycles.id, cycleId)).limit(1);
  const [house] = await db.select({ farmId: houses.farmId }).from(houses).where(eq(houses.id, houseId)).limit(1);
  if (!cycle || !house || cycle.farmId !== house.farmId) throw new Error("House does not belong to this cycle farm");
  assertCycleAllowsOperationalMutation(cycle.status);
  await requireFarmCapability(userId, cycle.farmId, capability, { houseId, cycleId });
  const [assignment] = await db.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(and(eq(cycleHouseAssignments.cycleId, cycleId), eq(cycleHouseAssignments.houseId, houseId))).limit(1);
  requireHouseScopedRecord({ cycleFarmId: cycle.farmId, houseFarmId: house.farmId, assignedBirds: assignment?.assignedBirds });
  return assignment;
}
