import { describe, expect, it } from "vitest";
import { assertCycleAllowsOperationalMutation } from "../shared/cycleMutationPolicy";

describe("cycle operational mutation policy", () => {
  it("allows writes while a cycle is draft, upcoming, or active", () => {
    expect(() => assertCycleAllowsOperationalMutation("draft")).not.toThrow();
    expect(() => assertCycleAllowsOperationalMutation("upcoming")).not.toThrow();
    expect(() => assertCycleAllowsOperationalMutation("active")).not.toThrow();
  });

  it("blocks operational writes after a cycle is closed", () => {
    expect(() => assertCycleAllowsOperationalMutation("closed")).toThrow("لا يمكن تعديل بيانات دورة مغلقة");
  });
});
