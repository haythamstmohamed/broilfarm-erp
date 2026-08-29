import { describe, expect, it } from "vitest";
import { buildOperationalCsv, buildOperationalPdfHtml, operationalExportFilename } from "../shared/operationalExport";

const snapshot = {
  farmName: "غرب",
  cycleName: "أغسطس",
  selectedDate: "2026-08-24",
  cycleDay: 7,
  actualTemperatureC: 31.2,
  actualHumidityPercent: 31,
  targetTemperatureMinC: 28,
  targetTemperatureMaxC: 30,
  targetHumidityMinPercent: 50,
  targetHumidityMaxPercent: 60,
  weights: [{ date: "2026-08-24", houseName: "الكبير", averageWeightGrams: 202 }],
};

describe("operational exports", () => {
  it("builds an Arabic UTF-8 CSV with the selected environmental context and actual weight samples", () => {
    const csv = buildOperationalCsv(snapshot);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("سياق بيئي مختار");
    expect(csv).toContain("الكبير");
    expect(csv).toContain("28–30°م");
  });

  it("builds a printable RTL report and deterministic filenames", () => {
    const html = buildOperationalPdfHtml(snapshot);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("تقرير الأوزان والبيئة التشغيلية");
    expect(html).toContain("الكبير");
    expect(operationalExportFilename(snapshot, "csv")).toBe("broiler-weight-environment-2026-08-24.csv");
  });
});
