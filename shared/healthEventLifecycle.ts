export type StoredHealthEventScope = { id: number; cycleId: number; houseId: number | null };
export type HealthEventMutation = { houseId: number; eventDate: Date; eventType: "medication" | "vaccination"; productName: string; dosage: string; administrationRoute?: string; notes?: string };

export function healthEventAuthorizationScopes(event: StoredHealthEventScope, destinationHouseId?: number) {
  if (!event.houseId) throw new Error("Health record not found or is not linked to a house");
  const destination = destinationHouseId ?? event.houseId;
  return destination === event.houseId
    ? [{ cycleId: event.cycleId, houseId: event.houseId }]
    : [{ cycleId: event.cycleId, houseId: event.houseId }, { cycleId: event.cycleId, houseId: destination }];
}

export function normalizeHealthEventHouseIds(houseIds: number[]) {
  const normalized = Array.from(new Set(houseIds.filter((houseId) => Number.isInteger(houseId) && houseId > 0)));
  if (!normalized.length) throw new Error("اختر عنبراً واحداً على الأقل أو جميع عنابر الدورة");
  return normalized;
}

export function healthEventUpdatePatch(input: HealthEventMutation) {
  return {
    houseId: input.houseId,
    eventDate: input.eventDate,
    eventType: input.eventType,
    productName: input.productName,
    dosage: input.dosage,
    administrationRoute: input.administrationRoute || null,
    notes: input.notes || null,
  };
}

export async function executeHealthEventUpdate(input: {
  ownerId: number;
  event: StoredHealthEventScope;
  mutation: HealthEventMutation;
  requireHealthAccess: (ownerId: number, cycleId: number, houseId: number) => Promise<void>;
  persist: (healthEventId: number, patch: ReturnType<typeof healthEventUpdatePatch>) => Promise<void>;
}) {
  for (const scope of healthEventAuthorizationScopes(input.event, input.mutation.houseId)) {
    await input.requireHealthAccess(input.ownerId, scope.cycleId, scope.houseId);
  }
  const patch = healthEventUpdatePatch(input.mutation);
  await input.persist(input.event.id, patch);
  return patch;
}

export async function executeHealthEventDelete(input: {
  ownerId: number;
  event: StoredHealthEventScope;
  requireHealthAccess: (ownerId: number, cycleId: number, houseId: number) => Promise<void>;
  remove: (healthEventId: number) => Promise<void>;
}) {
  for (const scope of healthEventAuthorizationScopes(input.event)) {
    await input.requireHealthAccess(input.ownerId, scope.cycleId, scope.houseId);
  }
  await input.remove(input.event.id);
}
