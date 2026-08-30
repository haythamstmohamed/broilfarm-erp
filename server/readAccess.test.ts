import { describe, expect, it } from "vitest";
import { canReadFarmScope, unrestrictedFarmIds } from "./db/readAccess";

describe("read scope policy", () => {
  const scopes = [
    { farmId: 1, scope: { houseId: null, cycleId: null } },
    { farmId: 2, scope: { houseId: 21, cycleId: 200 } },
  ];

  it("does not turn a house or cycle assignment into farm-wide access", () => {
    expect(canReadFarmScope(scopes, 1, { houseId: 10, cycleId: 100 })).toBe(true);
    expect(canReadFarmScope(scopes, 2, { houseId: 21, cycleId: 200 })).toBe(true);
    expect(canReadFarmScope(scopes, 2, { houseId: 22, cycleId: 200 })).toBe(false);
    expect(canReadFarmScope(scopes, 2, { houseId: 21, cycleId: 201 })).toBe(false);
    expect(canReadFarmScope(scopes, 2, { houseId: null, cycleId: null })).toBe(false);
  });

  it("only exposes farm-wide records to unrestricted assignments", () => {
    expect(unrestrictedFarmIds(scopes)).toEqual([1]);
  });
});
