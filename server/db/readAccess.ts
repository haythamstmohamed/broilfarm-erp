import { and, eq } from "drizzle-orm";
import { farmMemberships, farms } from "../../drizzle/schema";
import { FarmCapability, MembershipScope, roleCan, scopeAllows } from "../../shared/accessControl";

export type FarmReadScope = {
  farmId: number;
  scope: MembershipScope;
};

export async function getReadableFarmScopes(db: any, userId: number, capability: FarmCapability): Promise<FarmReadScope[]> {
  const [ownedFarms, memberships] = await Promise.all([
    db.select({ id: farms.id }).from(farms).where(eq(farms.ownerId, userId)),
    db
      .select({ farmId: farmMemberships.farmId, role: farmMemberships.role, houseId: farmMemberships.houseId, cycleId: farmMemberships.cycleId })
      .from(farmMemberships)
      .where(and(eq(farmMemberships.userId, userId), eq(farmMemberships.isActive, true))),
  ]);

  return [
    ...ownedFarms.map((farm: { id: number }) => ({ farmId: farm.id, scope: { houseId: null, cycleId: null } })),
    ...memberships
      .filter((membership: { role: Parameters<typeof roleCan>[0] }) => roleCan(membership.role, capability))
      .map((membership: { farmId: number; houseId: number | null; cycleId: number | null }) => ({
        farmId: membership.farmId,
        scope: { houseId: membership.houseId, cycleId: membership.cycleId },
      })),
  ];
}

export function canReadFarmScope(scopes: FarmReadScope[], farmId: number, resourceScope: MembershipScope): boolean {
  return scopes.some((candidate) => candidate.farmId === farmId && scopeAllows(candidate.scope, resourceScope));
}

export function unrestrictedFarmIds(scopes: FarmReadScope[]): number[] {
  return [...new Set(scopes.filter((item) => !item.scope.houseId && !item.scope.cycleId).map((item) => item.farmId))];
}
