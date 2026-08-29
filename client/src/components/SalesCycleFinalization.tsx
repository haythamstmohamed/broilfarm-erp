import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, FileText, Loader2, LockKeyhole, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { saleDashboardMetrics } from "../../../shared/salesDashboard";
import { eligibleCycleSales } from "../../../shared/cycleSalesFinalization";
import { buildCycleClosingPdfHtml, buildSalesSettlementPdfHtml, type SalesSettlementReportSnapshot } from "../../../shared/salesReport";

type Sale = { id: number; traderId: number; cycleId: number; status: "open" | "closed"; isDeleted?: boolean; totalPiasters: number; discountPiasters: number };
type Batch = { id: number; saleId: number; weighingStage: "tare_pending" | "filled"; cageCount: number; birdCount: number; grossWeightGrams: number; tareWeightGrams: number; netWeightGrams: number };
type Payment = { id: number; saleId: number; amountPiasters: number };
type Trader = { id: number; name: string; isActive: boolean };
type Expense = { cycleId: number | null; amountPiasters: number };

const money = (piasters: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 }).format(piasters / 100);
const number = (value: number) => new Intl.NumberFormat("ar-EG").format(value);

export function SalesCycleFinalization({ farmName, cycleName, cycleId, cycleStatus, sales, batches, payments, traders, expenses, onFinalize }: { farmName: string; cycleName: string; cycleId?: number; cycleStatus: "active" | "closed" | "upcoming" | "draft"; sales: Sale[]; batches: Batch[]; payments: Payment[]; traders: Trader[]; expenses: Expense[]; onFinalize: (cycleId: number) => Promise<{ completedSalesCount: number; totalSalesCount: number }> }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const cycleSales = useMemo(() => {
    const activeTraderIds = new Set(traders.filter((trader) => trader.isActive).map((trader) => trader.id));
    return eligibleCycleSales(sales.filter((sale) => sale.cycleId === cycleId && activeTraderIds.has(sale.traderId)));
  }, [cycleId, sales, traders]);
  const snapshot = useMemo<SalesSettlementReportSnapshot>(() => {
    const saleMetrics = cycleSales.map((sale) => ({ sale, metrics: saleDashboardMetrics({ plannedCageCount: 0, totalPiasters: sale.totalPiasters, discountPiasters: sale.discountPiasters, batches: batches.filter((batch) => batch.saleId === sale.id), payments: payments.filter((payment) => payment.saleId === sale.id) }) }));
    const totalSalesPiasters = saleMetrics.reduce((sum, item) => sum + item.metrics.netDuePiasters, 0);
    const totalPaidPiasters = saleMetrics.reduce((sum, item) => sum + item.metrics.totalPaidPiasters, 0);
    const outstandingPiasters = saleMetrics.reduce((sum, item) => sum + item.metrics.remainingPiasters, 0);
    const cycleExpensesPiasters = expenses.filter((expense) => expense.cycleId === cycleId).reduce((sum, expense) => sum + expense.amountPiasters, 0);
    const outstandingTraders = traders.map((trader) => {
      const traderSales = saleMetrics.filter((item) => item.sale.traderId === trader.id);
      return { traderName: trader.name, salesCount: traderSales.length, balancePiasters: traderSales.reduce((sum, item) => sum + item.metrics.remainingPiasters, 0) };
    }).filter((trader) => trader.balancePiasters > 0);
    return { farmName, cycleName, generatedAt: new Date(), totalSalesPiasters, totalPaidPiasters, outstandingPiasters, cycleExpensesPiasters, netProfitPiasters: totalSalesPiasters - cycleExpensesPiasters, outstandingTraders };
  }, [batches, cycleId, cycleName, cycleSales, expenses, farmName, payments, traders]);
  const openReport = (kind: "settlement" | "closing") => {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return toast.error("تعذر فتح التقرير", { description: "اسمح بالنوافذ المنبثقة ثم أعد المحاولة." });
    reportWindow.opener = null;
    reportWindow.document.open();
    reportWindow.document.write(kind === "settlement" ? buildSalesSettlementPdfHtml(snapshot) : buildCycleClosingPdfHtml(snapshot));
    reportWindow.document.close();
    window.setTimeout(() => { reportWindow.focus(); reportWindow.print(); }, 250);
  };
  const finalize = async () => {
    if (!cycleId) return;
    setSaving(true);
    try {
      const result = await onFinalize(cycleId);
      toast.success("تم إنهاء مبيعات الدورة وإقفالها", { description: `تم تثبيت ${number(result.completedSalesCount)} عملية بيع من إجمالي ${number(result.totalSalesCount)}.` });
      setConfirmOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إنهاء الدورة");
    } finally {
      setSaving(false);
    }
  };
  const finalizable = Boolean(cycleId && cycleStatus === "active" && cycleSales.length);
  return <article className="overflow-hidden rounded-2xl border border-[#cfe0cc] bg-white shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dfeada] bg-[#f4f9f1] p-5"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#195638] text-white"><LockKeyhole className="h-5 w-5" /></span><div><p className="font-extrabold text-[#1c402e]">إقفال المبيعات والدورة</p><p className="mt-1 text-sm leading-6 text-muted-foreground">ثبّت كل عمليات البيع المحسوبة، وأغلق دورة {cycleName}، ثم اطبع تقارير التسوية والإقفال من بياناتك الفعلية.</p></div></div><span className={`rounded-lg px-3 py-1.5 text-xs font-extrabold ${cycleStatus === "closed" ? "bg-[#e8eef2] text-[#355362]" : "bg-[#e5f1dc] text-[#246542]"}`}>{cycleStatus === "closed" ? "الدورة مغلقة" : "الدورة نشطة"}</span></div><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5"><Summary label="عمليات البيع" value={number(cycleSales.length)} /><Summary label="إجمالي البيع" value={money(snapshot.totalSalesPiasters)} /><Summary label="المحصل" value={money(snapshot.totalPaidPiasters)} /><Summary label="المتبقي" value={money(snapshot.outstandingPiasters)} /><Summary label="صافي الربح" value={money(snapshot.netProfitPiasters)} accent /></div><div className="flex flex-wrap gap-2 border-t border-[#e5eee1] bg-[#fbfdf9] p-4"><Button variant="outline" className="rounded-xl bg-white" onClick={() => openReport("settlement")}><FileText className="h-4 w-4" />تقرير تسوية المبيعات</Button><Button variant="outline" className="rounded-xl bg-white" onClick={() => openReport("closing")}><Printer className="h-4 w-4" />تقرير إقفال الدورة</Button><Button className="mr-auto rounded-xl" disabled={!finalizable} onClick={() => setConfirmOpen(true)}><LockKeyhole className="h-4 w-4" />إنهاء مبيعات الدورة وإقفالها</Button></div><Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent dir="rtl" className="sm:max-w-lg"><DialogHeader><DialogTitle className="text-right">تأكيد إنهاء المبيعات والدورة</DialogTitle><DialogDescription className="text-right">سيُنهى كل بيع مفتوح له وزن صافٍ وقيمة محسوبة، ثم تُغلق الدورة. يمكن طباعة التقارير بعد الإقفال، ولا يمكن إضافة سجلات جديدة إلى بيع مغلق إلا بعد إعادة فتحه وفق الصلاحيات.</DialogDescription></DialogHeader><div className="mt-3 rounded-2xl border border-[#dcead7] bg-[#f7fbf4] p-4 text-sm leading-7"><p><b>عدد عمليات البيع:</b> {number(cycleSales.length)}</p><p><b>إجمالي البيع:</b> {money(snapshot.totalSalesPiasters)}</p><p><b>صافي الربح التشغيلي:</b> {money(snapshot.netProfitPiasters)}</p></div><div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmOpen(false)}>إلغاء</Button><Button className="flex-1 rounded-xl" disabled={saving} onClick={() => { void finalize(); }}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}تأكيد الإنهاء والإقفال</Button></div></DialogContent></Dialog></article>;
}

function Summary({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className={`rounded-xl p-3 ${accent ? "bg-[#195638] text-white" : "bg-white ring-1 ring-[#e2ece0]"}`}><p className={`text-[11px] ${accent ? "text-white/70" : "text-muted-foreground"}`}>{label}</p><p className="mt-1 text-sm font-extrabold">{value}</p></div>; }
