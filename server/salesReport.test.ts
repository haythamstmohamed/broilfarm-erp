import { describe, expect, it } from "vitest";
import { buildCycleClosingPdfHtml, buildSalesSettlementPdfHtml } from "../shared/salesReport";

describe("sales settlement PDF report", () => {
  it("includes sales, receivables, cycle expenses, and net profit while escaping trader data", () => {
    const html = buildSalesSettlementPdfHtml({
      farmName: "غرب",
      cycleName: "أغسطس",
      generatedAt: new Date("2026-08-19T00:00:00Z"),
      totalSalesPiasters: 5_000_000,
      totalPaidPiasters: 2_000_000,
      outstandingPiasters: 3_000_000,
      cycleExpensesPiasters: 3_000_000,
      netProfitPiasters: 2_000_000,
      outstandingTraders: [{ traderName: "تاجر <مميز>", balancePiasters: 3_000_000, salesCount: 1 }],
    });
    expect(html).toContain("إجمالي البيع");
    expect(html).toContain("مصاريف الدورة الفعلية");
    expect(html).toContain("صافي الربح التشغيلي");
    expect(html).toContain("تاجر &lt;مميز&gt;");
    expect(html).not.toContain("تاجر <مميز>");
  });

  it("produces a cycle-closing report from the same actual settlement snapshot", () => {
    const html = buildCycleClosingPdfHtml({ farmName: "غرب", cycleName: "أغسطس", generatedAt: new Date("2026-08-19T00:00:00Z"), totalSalesPiasters: 1, totalPaidPiasters: 0, outstandingPiasters: 1, cycleExpensesPiasters: 0, netProfitPiasters: 1, outstandingTraders: [] });
    expect(html).toContain("تقرير إقفال الدورة والمبيعات");
  });
});
