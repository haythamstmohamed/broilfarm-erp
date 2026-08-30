import React, { useState, useMemo } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Printer, TrendingUp, Trophy, ArrowUpRight, Scale, Wheat } from "lucide-react";
import { toast } from "sonner";
import { compareCycles, type CycleBenchmarkInput } from "../../../shared/cycleComparison";

export default function ReportsPage() {
  const { workspace, activeFarm, activeFarmId, farmCycles, activeCycleId, activeCycle } = useWorkspaceContext();
  const [activeTab, setActiveTab] = useState<"audit" | "comparison">("audit");

  const auditReportQuery = trpc.reports.cycleAudit.useQuery(
    { cycleId: activeCycleId! },
    { enabled: !!activeCycleId }
  );

  const csvQuery = trpc.reports.cycleAuditCsv.useQuery(
    { cycleId: activeCycleId! },
    { enabled: false }
  );

  const handleDownloadCsv = async () => {
    try {
      const res = await csvQuery.refetch();
      if (res.data?.csv) {
        const blob = new Blob([res.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `cycle_audit_${activeCycle?.name || "report"}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("تم تنزيل تقرير الدورة بصيغة CSV");
      }
    } catch {
      toast.error("تعذر تنزيل التقرير");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Build comparison data across all farm cycles
  const comparisonReport = useMemo(() => {
    if (!workspace || !activeFarm) return null;

    const inputs: CycleBenchmarkInput[] = farmCycles.map((c) => {
      const records = (workspace.records || []).filter((r) => r.cycleId === c.id);
      const weights = (workspace.weights || []).filter((w) => w.cycleId === c.id);
      const expenses = (workspace.expenses || []).filter((e) => e.cycleId === c.id);
      const sales = (workspace.sales || []).filter((s) => s.cycleId === c.id && !s.isDeleted);

      const totalMort = records.reduce((s, r) => s + r.mortality + r.culls, 0);
      const totalFeed = records.reduce((s, r) => s + r.feedKg, 0);
      const latestWeight = [...weights].sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime())[0]?.averageWeightGrams || 0;
      const totalExp = expenses.reduce((s, e) => s + e.amountPiasters, 0);
      const totalSal = sales.reduce((s, sa) => s + sa.totalPiasters, 0);

      return {
        cycleId: c.id,
        cycleName: c.name,
        farmName: activeFarm.name,
        placementDate: c.placementDate,
        birdsPlaced: c.birdsPlaced,
        status: c.status,
        totalMortality: totalMort,
        totalFeedKg: totalFeed,
        averageWeightGrams: latestWeight,
        totalExpensesPiasters: totalExp,
        totalSalesPiasters: totalSal,
      };
    });

    return compareCycles(inputs);
  }, [workspace, activeFarm, farmCycles]);

  if (!activeCycleId) {
    return <div className="p-8 text-center text-muted-foreground">يرجى اختيار دورة لعرض تقاريرها.</div>;
  }

  const report = auditReportQuery.data;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التقارير والمقارنات التحليلية</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تقرير التدقيق والتصفية الشامل ومقارنة أداء الدورات جنباً إلى جنب
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border gap-1">
            <Button
              variant={activeTab === "audit" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("audit")}
              className="gap-1.5 text-xs font-semibold"
            >
              <FileText className="w-4 h-4" />
              تصفية الدورة
            </Button>
            <Button
              variant={activeTab === "comparison" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("comparison")}
              className="gap-1.5 text-xs font-semibold"
            >
              <TrendingUp className="w-4 h-4" />
              مقارنة الدورات
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
          <Button size="sm" onClick={handleDownloadCsv} className="gap-1.5 text-xs">
            <Download className="w-4 h-4" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Tab 1: Current Cycle Audit */}
      {activeTab === "audit" && (
        <>
          {auditReportQuery.isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جارٍ تجهيز التقرير…</div>
          ) : report ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">المؤشرات الإنتاجية والفنية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-1.5 border-b text-sm">
                    <span className="text-muted-foreground">العدد المسكن:</span>
                    <span className="font-bold">{report.summary?.birdsPlaced?.toLocaleString("ar-EG") || 0} طائر</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b text-sm">
                    <span className="text-muted-foreground">إجمالي النفوق والفرز:</span>
                    <span className="font-bold text-rose-600">{report.summary?.totalMortality?.toLocaleString("ar-EG") || 0} طائر</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b text-sm">
                    <span className="text-muted-foreground">نسبة النفوق:</span>
                    <span className="font-bold">%{report.summary?.mortalityRate || "0.00"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b text-sm">
                    <span className="text-muted-foreground">إجمالي العلف المستهلك:</span>
                    <span className="font-bold">{report.summary?.totalFeedKg?.toLocaleString("ar-EG") || 0} كجم</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b text-sm">
                    <span className="text-muted-foreground">معامل التحويل (FCR):</span>
                    <span className="font-black text-emerald-600">{report.summary?.fcr || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b text-sm">
                    <span className="text-muted-foreground">معامل الكفاءة الأوروبي (EPEF):</span>
                    <span className="font-black text-primary">
                      {report.summary?.epef ? `${Math.round(report.summary.epef)} نقطة` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">نسبة الحيوية (Livability):</span>
                    <span className="font-bold text-emerald-600">
                      %{((1 - (report.summary?.totalMortality || 0) / (report.summary?.birdsPlaced || 1)) * 100).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">المؤشرات المالية والمبيعات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-1.5 border-b text-sm">
                    <span className="text-muted-foreground">إجمالي المصروفات:</span>
                    <span className="font-bold text-rose-600">
                      {((report.summary?.totalExpensesPiasters || 0) / 100).toLocaleString("ar-EG")} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b text-sm">
                    <span className="text-muted-foreground">إجمالي إيرادات المبيعات:</span>
                    <span className="font-bold text-emerald-600">
                      {((report.summary?.totalSalesPiasters || 0) / 100).toLocaleString("ar-EG")} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm font-black">
                    <span>صافي أرباح الدورة:</span>
                    <span
                      className={
                        (report.summary?.netProfitPiasters || 0) >= 0
                          ? "text-emerald-600 text-lg"
                          : "text-rose-600 text-lg"
                      }
                    >
                      {((report.summary?.netProfitPiasters || 0) / 100).toLocaleString("ar-EG")} ج.م
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </>
      )}

      {/* Tab 2: Side-by-Side Multi-Cycle Comparison */}
      {activeTab === "comparison" && comparisonReport && (
        <div className="space-y-6">
          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 border-emerald-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-emerald-700 block">متوسط كفاءة EPEF</span>
                <span className="text-2xl font-black text-emerald-950 block mt-2">
                  {comparisonReport.averages.avgEpef} نقطة
                </span>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  عبر {comparisonReport.cycles.length} دورات
                </span>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-blue-700 block">متوسط التحويل (FCR)</span>
                <span className="text-2xl font-black text-blue-950 block mt-2">
                  {comparisonReport.averages.avgFcr}
                </span>
                <span className="text-[11px] text-blue-600 mt-1 block">
                  معدل تحويل القطعان
                </span>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/30 border-amber-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-amber-700 block">متوسط تكلفة الكيلو</span>
                <span className="text-2xl font-black text-amber-950 block mt-2">
                  {comparisonReport.averages.avgCostPerKgEgp} ج.م / كجم
                </span>
                <span className="text-[11px] text-amber-700 mt-1 block">
                  تكلفة الإنتاج الإجمالية
                </span>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/30 border-purple-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-purple-700 block">متوسط صافي الأرباح</span>
                <span className="text-2xl font-black text-purple-950 block mt-2">
                  {comparisonReport.averages.avgNetProfitEgp.toLocaleString("ar-EG")} ج.م
                </span>
                <span className="text-[11px] text-purple-700 mt-1 block">
                  صافي العائد لكل دورة
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">جدول المقارنة التفصيلي لدورات المزرعة</CardTitle>
              <CardDescription>
                مقارنة شاملة لجميع مؤشرات الإنتاج والتكاليف والأرباح
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground text-xs font-semibold">
                      <th className="p-3">اسم الدورة</th>
                      <th className="p-3">العدد المسكن</th>
                      <th className="p-3">الحيوية %</th>
                      <th className="p-3">FCR</th>
                      <th className="p-3">EPEF</th>
                      <th className="p-3">تكلفة الكيلو</th>
                      <th className="p-3">صافي الأرباح</th>
                      <th className="p-3">العائد ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonReport.cycles.map((c) => {
                      const isBestEpef = c.cycleId === comparisonReport.bestEpefCycleId;
                      const isLowestFcr = c.cycleId === comparisonReport.lowestFcrCycleId;
                      const isHighestProfit = c.cycleId === comparisonReport.highestProfitCycleId;

                      return (
                        <tr key={c.cycleId} className="border-b hover:bg-muted/20">
                          <td className="p-3 font-semibold text-foreground">
                            <div className="flex items-center gap-1.5">
                              {c.cycleName}
                              {isBestEpef && (
                                <Badge variant="default" className="bg-amber-500 text-[10px] py-0">
                                  <Trophy className="w-2.5 h-2.5 ml-1" />
                                  الأعلى كفاءة
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground block">{c.placementDate}</span>
                          </td>
                          <td className="p-3">{c.birdsPlaced.toLocaleString("ar-EG")}</td>
                          <td className="p-3 font-medium text-emerald-600">%{c.livabilityPercent}</td>
                          <td className="p-3">
                            <span className={isLowestFcr ? "font-bold text-emerald-600" : ""}>
                              {c.fcr || "—"}
                            </span>
                          </td>
                          <td className="p-3 font-black text-primary">{c.epef || "—"}</td>
                          <td className="p-3 text-muted-foreground">{c.costPerKgEgp} ج.م</td>
                          <td className="p-3 font-bold text-emerald-600">
                            {c.netProfitEgp.toLocaleString("ar-EG")} ج.م
                          </td>
                          <td className="p-3 font-semibold">%{c.roiPercent}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
