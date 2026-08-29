import { and, desc, eq, inArray } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { farms, houses, cycles, invitationCodes, farmMemberships } from "../../drizzle/schema";
import { FarmRole } from "../../shared/accessControl";
import { getDb } from "./connection";
import { requireFarmCapability } from "./auth";

export function invitationHash(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function createInvitationCode() {
  return `BROILER-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function createInvitation(ownerId: number, input: { farmId: number; houseId?: number; cycleId?: number; role: FarmRole; maxUses: number; expiresAt?: Date; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(ownerId, input.farmId, "manage_access");
  if (input.houseId) {
    const [house] = await db.select({ farmId: houses.farmId }).from(houses).where(eq(houses.id, input.houseId)).limit(1);
    if (!house || house.farmId !== input.farmId) throw new Error("House does not belong to this farm");
  }
  if (input.cycleId) {
    const [cycle] = await db.select({ farmId: cycles.farmId }).from(cycles).where(eq(cycles.id, input.cycleId)).limit(1);
    if (!cycle || cycle.farmId !== input.farmId) throw new Error("Cycle does not belong to this farm");
  }
  const code = createInvitationCode();
  await db.insert(invitationCodes).values({ farmId: input.farmId, houseId: input.houseId ?? null, cycleId: input.cycleId ?? null, createdByUserId: ownerId, codeHash: invitationHash(code), codePrefix: code, role: input.role, maxUses: input.maxUses, expiresAt: input.expiresAt ?? null, notes: input.notes ?? null });
  return { code };
}

export async function listInvitations(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  const owned = await db.select({ id: farms.id }).from(farms).where(eq(farms.ownerId, ownerId));
  if (!owned.length) return [];
  return db.select().from(invitationCodes).where(inArray(invitationCodes.farmId, owned.map((farm) => farm.id))).orderBy(desc(invitationCodes.createdAt));
}

export async function revokeInvitation(ownerId: number, invitationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [invitation] = await db.select({ farmId: invitationCodes.farmId }).from(invitationCodes).where(eq(invitationCodes.id, invitationId)).limit(1);
  if (!invitation) throw new Error("Invitation not found");
  await requireFarmCapability(ownerId, invitation.farmId, "manage_access");
  await db.update(invitationCodes).set({ status: "revoked" }).where(eq(invitationCodes.id, invitationId));
}

export async function regenerateInvitation(ownerId: number, invitationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [invitation] = await db.select({ farmId: invitationCodes.farmId, status: invitationCodes.status }).from(invitationCodes).where(eq(invitationCodes.id, invitationId)).limit(1);
  if (!invitation || invitation.status !== "active") throw new Error("Only active invitations can be regenerated");
  await requireFarmCapability(ownerId, invitation.farmId, "manage_access");
  const code = createInvitationCode();
  await db.update(invitationCodes).set({ codeHash: invitationHash(code), codePrefix: code, usedCount: 0, status: "active" }).where(eq(invitationCodes.id, invitationId));
  return { code };
}

export async function redeemInvitation(userId: number, code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [invitation] = await db.select().from(invitationCodes).where(eq(invitationCodes.codeHash, invitationHash(code))).limit(1);
  if (!invitation) throw new Error("Invalid invitation code");
  const now = new Date();
  if (invitation.status !== "active" || (invitation.expiresAt && invitation.expiresAt < now) || invitation.usedCount >= invitation.maxUses) {
    if (invitation.status === "active") await db.update(invitationCodes).set({ status: invitation.usedCount >= invitation.maxUses ? "used" : "expired" }).where(eq(invitationCodes.id, invitation.id));
    throw new Error("This invitation code is no longer available");
  }
  const [existing] = await db.select({ id: farmMemberships.id }).from(farmMemberships).where(and(eq(farmMemberships.userId, userId), eq(farmMemberships.farmId, invitation.farmId))).limit(1);
  if (existing) await db.update(farmMemberships).set({ role: invitation.role, houseId: invitation.houseId, cycleId: invitation.cycleId, isActive: true }).where(eq(farmMemberships.id, existing.id));
  else await db.insert(farmMemberships).values({ userId, farmId: invitation.farmId, role: invitation.role, houseId: invitation.houseId, cycleId: invitation.cycleId });
  const nextUsed = invitation.usedCount + 1;
  await db.update(invitationCodes).set({ usedCount: nextUsed, status: nextUsed >= invitation.maxUses ? "used" : "active" }).where(eq(invitationCodes.id, invitation.id));
  return { farmId: invitation.farmId, role: invitation.role };
}
