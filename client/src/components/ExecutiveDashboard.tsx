import React from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowDown, ArrowUp, Building2, CheckCircle2, Download, RefreshCw, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

export function ExecutiveDashboard() {
  const { data: dashboard, isLoading, refetch } = trpc.reports.executiveDashboard.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: alertsData, refetch: refetchAlerts } = trpc.alerts.list.useQuery({ status: "active" });
  const acknowledgeMutation = trpc.alerts.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("تم تأكيد استلام التنبيه");
      refetchAlerts();
    },
  });

  const handleExportAudit = async (cycleId?: number) => {
    if (!cycleId) {
      toast.error("يرجى اختيار دورة نشطة للتصدير");
      return;
    }
    try {
      toast.info("جاري تجهيز تقرير التدقيق الفني والمالي...");
      // Client-side trigger
    } catch {
      toast.error("فشل تصدير التقرير");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-3 font-medium">جاري تحميل لوحة القيادة التنفيذية للمؤسسة...</span>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          لا توجد بيانات مزارع أو دورات مسجلة لعرض لوحة القيادة التنفيذية.
        </CardContent>
      </Card>
    );
  }

  const { companyStats, farmRankings } = dashboard;
  const activeAlerts = alertsData ?? [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">لوحة القيادة التنفيذية للمؤسسة</h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Enterprise ERP
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            مراقبة الأداء الفني، المالي، والتشغيلي الموحد لكافة المزارع والعنابر التابعة للمؤسسة.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { refetch(); refetchAlerts(); }} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث المؤشرات
          </Button>
        </div>
      </div>

      {/* Smart Alerts Banner if active alerts exist */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <CardTitle className="text-base font-bold">
                  تنبيهات استباقية بحاجة للمتابعة ({activeAlerts.length})
                </CardTitle>
              </div>
              <Badge variant="destructive">انحرافات تشغيلية نشطة</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-red-100 dark:border-red-900 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alert.severity === "critical" ? "bg-red-500 animate-ping" : "bg-amber-500"
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-foreground">{alert.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs hover:bg-muted"
                  onClick={() => acknowledgeMutation.mutate({ alertId: alert.id })}
                  disabled={acknowledgeMutation.isPending}
                >
                  تأكيد الاطلاع
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Executive KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">إجمالي المزارع النشطة</p>
            <p className="text-2xl font-bold text-primary">
              {companyStats.activeFarmsCount} <span className="text-xs font-normal text-muted-foreground">/ {companyStats.totalFarms}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">إجمالي القطيع الحي</p>
            <p className="text-2xl font-bold text-foreground">
              {companyStats.totalLiveBirds.toLocaleString("ar-EG")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">متوسط نسبة الحيوية</p>
            <p className="text-2xl font-bold text-emerald-600">
              {companyStats.averageLivability.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">معامل التحويل الموزون (FCR)</p>
            <p className="text-2xl font-bold text-foreground">
              {companyStats.weightedAverageFcr > 0 ? companyStats.weightedAverageFcr.toFixed(2) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">متوسط كفاءة الإنتاج (EPEF)</p>
            <p className="text-2xl font-bold text-indigo-600">
              {companyStats.weightedAverageEpef > 0 ? Math.round(companyStats.weightedAverageEpef) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">صافي الأرباح التقديري</p>
            <p
              className={`text-2xl font-bold ${
                companyStats.estimatedNetProfitEgp >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {Math.round(companyStats.estimatedNetProfitEgp).toLocaleString("ar-EG")} <span className="text-xs font-normal">ج.م</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Farm Rankings & Benchmark Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">المقارنة المعيارية للمزارع (Benchmarking & Ranking)</CardTitle>
              <CardDescription>
                ترتيب مزارع المؤسسة تنازلياً حسب مؤشر الكفاءة الإنتاجية الأوروبي (EPEF)
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              {farmRankings.length} مزرعة
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs border-y">
              <tr>
                <th className="py-3 px-4"># الترتيب</th>
                <th className="py-3 px-4">المزرعة / الموقع</th>
                <th className="py-3 px-4">الدورة النشطة</th>
                <th className="py-3 px-4">عمر القطيع</th>
                <th className="py-3 px-4">القطيع الحي</th>
                <th className="py-3 px-4">نسبة الحيوية</th>
                <th className="py-3 px-4">متوسط الوزن</th>
                <th className="py-3 px-4">معامل FCR</th>
                <th className="py-3 px-4">مؤشر EPEF</th>
                <th className="py-3 px-4">التقييم الفني</th>
                <th className="py-3 px-4">صافي الهامش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {farmRankings.map((farm, idx) => (
                <tr key={farm.farmId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-muted-foreground">#{idx + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-foreground">{farm.farmName}</p>
                    <p className="text-xs text-muted-foreground">{farm.governorate || "غير محدد"}</p>
                  </td>
                  <td className="py-3 px-4">
                    {farm.hasActiveCycle ? (
                      <span className="font-medium text-foreground">{farm.cycleName}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">لا توجد دورة نشطة</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {farm.hasActiveCycle ? `${farm.cycleAgeDays} يوم` : "—"}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {farm.hasActiveCycle ? farm.liveBirds.toLocaleString("ar-EG") : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {farm.hasActiveCycle ? (
                      <span className={farm.livabilityPercent >= 95 ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                        {farm.livabilityPercent.toFixed(1)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {farm.hasActiveCycle && farm.averageWeightGrams > 0 ? `${farm.averageWeightGrams} جم` : "—"}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {farm.hasActiveCycle && farm.fcr > 0 ? farm.fcr.toFixed(2) : "—"}
                  </td>
                  <td className="py-3 px-4 font-bold text-primary">
                    {farm.hasActiveCycle && farm.epef > 0 ? Math.round(farm.epef) : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {farm.hasActiveCycle ? (
                      <Badge
                        variant={
                          farm.statusGrade === "ممتاز"
                            ? "default"
                            : farm.statusGrade === "جيد"
                            ? "secondary"
                            : farm.statusGrade === "حرج"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {farm.statusGrade}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        خاملة
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    <span className={farm.netMarginEgp >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {Math.round(farm.netMarginEgp).toLocaleString("ar-EG")} ج.م
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutiveDashboard;
