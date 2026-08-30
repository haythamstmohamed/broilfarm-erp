import { and, desc, eq, inArray } from "drizzle-orm";
import { auditLogs, cycles, users } from "../../drizzle/schema";
import { requireFarmCapability } from "./auth";
import { getDb } from "./connection";
import { getReadableFarmScopes, unrestrictedFarmIds } from "./readAccess";

export type RecordAuditLogInput = {
  companyId?: number | null;
  farmId?: number | null;
  cycleId?: number | null;
  userId: number;
  entityType: string;
  entityId: number;
  action: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordAuditLog(input: RecordAuditLogInput) {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(auditLogs).values({
      companyId: input.companyId ?? null,
      farmId: input.farmId ?? null,
      cycleId: input.cycleId ?? null,
      userId: input.userId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      oldValues: input.oldValues ? JSON.stringify(input.oldValues) : null,
      newValues: input.newValues ? JSON.stringify(input.newValues) : null,
      details: input.details ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (error) {
    // Non-blocking logging failure to avoid rolling back critical business actions if logging fails
    console.error("Failed to record audit log:", error);
  }
}

export async function listAuditLogs(
  userId: number,
  filter?: {
    farmId?: number;
    cycleId?: number;
    entityType?: string;
    action?: string;
    limit?: number;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  let constrained = false;
  if (filter?.farmId) {
    await requireFarmCapability(userId, filter.farmId, "view_audit_logs");
    conditions.push(eq(auditLogs.farmId, filter.farmId));
    constrained = true;
  }
  if (filter?.cycleId) {
    const [cycle] = await db.select({ farmId: cycles.farmId, houseId: cycles.houseId }).from(cycles).where(eq(cycles.id, filter.cycleId)).limit(1);
    if (!cycle || (filter.farmId && cycle.farmId !== filter.farmId)) throw new Error("الدورة لا تتبع المزرعة المحددة");
    await requireFarmCapability(userId, cycle.farmId, "view_audit_logs", { houseId: cycle.houseId, cycleId: filter.cycleId });
    conditions.push(eq(auditLogs.farmId, cycle.farmId));
    conditions.push(eq(auditLogs.cycleId, filter.cycleId));
    constrained = true;
  }
  if (!constrained) {
    const readableFarmIds = unrestrictedFarmIds(await getReadableFarmScopes(db, userId, "view_audit_logs"));
    if (!readableFarmIds.length) return [];
    conditions.push(inArray(auditLogs.farmId, readableFarmIds));
  }
  if (filter?.entityType) {
    conditions.push(eq(auditLogs.entityType, filter.entityType));
  }
  if (filter?.action) {
    conditions.push(eq(auditLogs.action, filter.action));
  }

  return db
    .select({
      id: auditLogs.id,
      farmId: auditLogs.farmId,
      cycleId: auditLogs.cycleId,
      userId: auditLogs.userId,
      userName: users.name,
      userEmail: users.email,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      oldValues: auditLogs.oldValues,
      newValues: auditLogs.newValues,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(filter?.limit ?? 100);
}
