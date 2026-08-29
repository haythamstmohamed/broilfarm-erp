import { describe, expect, it } from "vitest";
import { executeHealthEventDelete, executeHealthEventUpdate, healthEventAuthorizationScopes, healthEventUpdatePatch, normalizeHealthEventHouseIds } from "../shared/healthEventLifecycle";

describe("health-event lifecycle service helpers", () => {
  const event = { id: 9, cycleId: 4, houseId: 12 };

  it("requires scoped health authorization for both the original and destination house when moving a record", () => {
    expect(healthEventAuthorizationScopes(event, 17)).toEqual([{ cycleId: 4, houseId: 12 }, { cycleId: 4, houseId: 17 }]);
    expect(healthEventAuthorizationScopes(event, 12)).toEqual([{ cycleId: 4, houseId: 12 }]);
  });

  it("normalizes a batch selection of assigned houses and rejects an empty selection", () => {
    expect(normalizeHealthEventHouseIds([17, 12, 17])).toEqual([17, 12]);
    expect(() => normalizeHealthEventHouseIds([])).toThrow("اختر عنبراً واحداً على الأقل");
  });

  it("rejects unscoped records and builds a complete persisted update patch", () => {
    expect(() => healthEventAuthorizationScopes({ ...event, houseId: null })).toThrow("not linked to a house");
    const eventDate = new Date("2026-08-20T00:00:00.000Z");
    expect(healthEventUpdatePatch({ houseId: 17, eventDate, eventType: "vaccination", productName: "نيوكاسل (ND)", dosage: "حسب وصف الطبيب", administrationRoute: "مياه الشرب", notes: "تم التنفيذ" })).toEqual({ houseId: 17, eventDate, eventType: "vaccination", productName: "نيوكاسل (ND)", dosage: "حسب وصف الطبيب", administrationRoute: "مياه الشرب", notes: "تم التنفيذ" });
  });

  it("persists an authorized update after checking both source and destination house scopes", async () => {
    const authorizationCalls: [number, number, number][] = [];
    let persisted: { id: number; productName: string; houseId: number } | undefined;
    await executeHealthEventUpdate({
      ownerId: 77,
      event,
      mutation: { houseId: 17, eventDate: new Date("2026-08-21T00:00:00.000Z"), eventType: "vaccination", productName: "نيوكاسل (ND)", dosage: "حسب وصف الطبيب", administrationRoute: "مياه الشرب", notes: "تم التنفيذ" },
      requireHealthAccess: async (...args) => { authorizationCalls.push(args); },
      persist: async (id, patch) => { persisted = { id, productName: patch.productName, houseId: patch.houseId }; },
    });
    expect(authorizationCalls).toEqual([[77, 4, 12], [77, 4, 17]]);
    expect(persisted).toEqual({ id: 9, productName: "نيوكاسل (ND)", houseId: 17 });
  });

  it("does not persist update or delete when source or destination house authorization fails", async () => {
    let updatePersisted = false;
    await expect(executeHealthEventUpdate({
      ownerId: 77,
      event,
      mutation: { houseId: 17, eventDate: new Date(), eventType: "medication", productName: "علاج", dosage: "1" },
      requireHealthAccess: async (_owner, _cycle, houseId) => { if (houseId === 17) throw new Error("FORBIDDEN"); },
      persist: async () => { updatePersisted = true; },
    })).rejects.toThrow("FORBIDDEN");
    expect(updatePersisted).toBe(false);

    let deleted = false;
    await expect(executeHealthEventDelete({
      ownerId: 77,
      event,
      requireHealthAccess: async () => { throw new Error("FORBIDDEN"); },
      remove: async () => { deleted = true; },
    })).rejects.toThrow("FORBIDDEN");
    expect(deleted).toBe(false);
  });
});
