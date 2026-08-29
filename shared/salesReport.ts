export type SalesSettlementReportSnapshot = {
  farmName: string;
  cycleName: string;
  generatedAt: Date;
  reportTitle?: string;
  totalSalesPiasters: number;
  totalPaidPiasters: number;
  outstandingPiasters: number;
  cycleExpensesPiasters: number;
  netProfitPiasters: number;
  outstandingTraders: { traderName: string; balancePiasters: number; salesCount: number }[];
};

const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
const money = (piasters: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 }).format(piasters / 100);
const date = (value: Date) => new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(value);

export function salesReportFilename(snapshot: SalesSettlementReportSnapshot) {
  return `تقرير-تسوية-بيع-${snapshot.cycleName.replace(/[^\w\u0600-\u06FF]+/g, "-") || "دورة"}.pdf`;
}

export function buildSalesSettlementPdfHtml(snapshot: SalesSettlementReportSnapshot) {
  const debts = snapshot.outstandingTraders.length ? snapshot.outstandingTraders.map((trader) => `<tr><td>${escape(trader.traderName)}</td><td>${new Intl.NumberFormat("ar-EG").format(trader.salesCount)}</td><td>${money(trader.balancePiasters)}</td></tr>`).join("") : `<tr><td colspan="3" class="empty">لا توجد أرصدة متبقية مسجلة على التجار لهذه الدورة.</td></tr>`;
  const title = snapshot.reportTitle ?? "تقرير تسوية مبيعات الدورة";
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escape(title)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#183a29;background:#fff;margin:0;line-height:1.55}header{border-bottom:3px solid #2c6a45;padding-bottom:15px;margin-bottom:20px}h1{font-size:24px;margin:0 0 6px}p{margin:0;color:#607064;font-size:13px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:18px 0}.metric{border:1px solid #dbe8d5;border-radius:10px;padding:12px;background:#fbfdf9}.metric span{display:block;color:#65756a;font-size:12px}.metric strong{display:block;margin-top:4px;font-size:18px;color:#244e36}.profit{background:#eff8ef;border-color:#b9d8bb}.debt{background:#fff7e6;border-color:#ead49e}h2{font-size:16px;margin:26px 0 10px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#edf6e4;color:#27563a;text-align:right;padding:10px}td{padding:10px;border-bottom:1px solid #e2ebe0}.empty{text-align:center;color:#718073;padding:20px}.note{margin-top:26px;border-top:1px solid #dbe8d5;padding-top:10px;color:#718073;font-size:11px}</style></head><body><header><h1>${escape(title)}</h1><p>${escape(snapshot.farmName)} · ${escape(snapshot.cycleName)} · أُنشئ في ${date(snapshot.generatedAt)}</p></header><section class="grid"><div class="metric"><span>إجمالي البيع</span><strong>${money(snapshot.totalSalesPiasters)}</strong></div><div class="metric"><span>إجمالي ما تم تحصيله</span><strong>${money(snapshot.totalPaidPiasters)}</strong></div><div class="metric debt"><span>إجمالي المستحق لدى التجار</span><strong>${money(snapshot.outstandingPiasters)}</strong></div><div class="metric"><span>مصاريف الدورة الفعلية</span><strong>${money(snapshot.cycleExpensesPiasters)}</strong></div><div class="metric profit"><span>صافي الربح التشغيلي</span><strong>${money(snapshot.netProfitPiasters)}</strong></div></section><h2>التجار الذين عليهم مبالغ متبقية</h2><table><thead><tr><th>التاجر</th><th>عدد عمليات البيع</th><th>الرصيد المتبقي</th></tr></thead><tbody>${debts}</tbody></table><p class="note">يعتمد التقرير على سجلات البيع والدفعات والمصروفات المسجلة فعلياً للدورة عند لحظة التصدير. راجع المستند قبل الطباعة أو الحفظ كملف PDF.</p></body></html>`;
}

export function buildCycleClosingPdfHtml(snapshot: SalesSettlementReportSnapshot) {
  return buildSalesSettlementPdfHtml({ ...snapshot, reportTitle: "تقرير إقفال الدورة والمبيعات" });
}
