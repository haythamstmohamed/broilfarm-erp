import { describe, expect, it } from "vitest";
import { ADDITIONAL_EGYPT_BROILER_VACCINES, CORE_EGYPT_BROILER_VACCINES, EGYPT_BROILER_VACCINE_OPTIONS } from "../shared/egyptBroilerVaccines";

describe("Egypt broiler vaccine reference catalog", () => {
  it("contains the Egyptian core broiler disease targets without imposing an automatic schedule", () => {
    const ids = CORE_EGYPT_BROILER_VACCINES.map((option) => option.id);
    expect(ids).toEqual(expect.arrayContaining(["marek", "newcastle", "infectious-bronchitis", "gumboro"]));
    expect(EGYPT_BROILER_VACCINE_OPTIONS.every((option) => option.note.length > 10)).toBe(true);
  });

  it("keeps local-program options distinct from the core reference and permits a veterinarian-defined option", () => {
    expect(ADDITIONAL_EGYPT_BROILER_VACCINES.map((option) => option.id)).toEqual(expect.arrayContaining(["avian-influenza-h5", "avian-influenza-h9", "other"]));
  });
});
