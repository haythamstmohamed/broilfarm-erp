import React, { useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { EnvironmentalSensorsPanel } from "@/components/EnvironmentalSensorsPanel";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bird,
  HeartPulse,
  Scale,
  Wheat,
  Droplets,
  Activity,
  CalendarDays,
  Building2,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Bot,
  Gauge,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocation } from "wouter";
import { evaluateWaterToFeedRatio } from "../../../shared/productionIntelligence";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const {
    workspace,
    isLoading,
    activeFarm,
    activeFarmId,
    activeCycle,
    activeCycleId,
    cycleHouses,
    cycleRecords,
    cycleWeights,
    currentLiveBirds,
    totalMortality,
    totalFeedKg,
    totalWaterLiters,
    avgWeightGrams,
    currentFcr,
    cycleAgeDays,
  } = useWorkspaceContext();

  const [activeTab, setActiveTab] = useState<"overview" | "executive" | "sensors" | "ai">("overview");
  const aiMessages: Message[] = [{
    role: "assistant",
    content: "تظهر هنا مستقبلاً ملخصات تحليلية مبنية على بيانات الدورة. لا تستخدم هذه المساحة للتشخيص البيطري أو تحديد الجرعات؛ راجع الطبيب البيطري المختص.",
  }];

  const alertsQuery = trpc.alerts.list.useQuery(
    { farmId: activeFarmId || undefined, status: "active" },
    { enabled: !!activeFarmId }
  );

  const lastRecord = cycleRecords[cycleRecords.length - 1];
  const todayMortality = lastRecord ? lastRecord.mortality + lastRecord.culls : 0;
  const todayFeedKg = lastRecord ? lastRecord.feedKg : 0;
  const todayWaterLiters = lastRecord ? lastRecord.waterLiters : 0;
  const prev3 = cycleRecords.slice(-4, -1);
  const past3DaysAvgMortality =
    prev3.length > 0
      ? prev3.reduce((acc, r) => acc + r.mortality + r.culls, 0) / prev3.length
      : todayMortality;

  const anomalyQuery = trpc.intelligence.analyzeFlock.useQuery(
    {
      breed: "ross_308",
      ageDays: Math.max(1, cycleAgeDays),
      currentLiveBirds,
      todayMortality,
      past3DaysAvgMortality,
      latestAvgWeightGrams: avgWeightGrams > 0 ? avgWeightGrams : undefined,
      todayFeedKg,
      todayWaterLiters,
    },
    { enabled: !!activeCycleId && cycleAgeDays > 0 }
  );

  const harvestQuery = trpc.intelligence.harvestOptimizer.useQuery(
    {
      breed: "ross_308",
      ageDays: Math.max(1, cycleAgeDays),
      currentAvgWeightGrams: avgWeightGrams > 0 ? avgWeightGrams : 1800,
      feedPricePerKgEgp: 24.5,
      liveChickenPricePerKgEgp: 78.0,
      targetMarketWeightGrams: activeCycle?.targetMarketWeight || 2200,
    },
    { enabled: !!activeCycleId && cycleAgeDays > 0 }
  );

  const resolveAlertMutation = trpc.alerts.resolve.useMutation({
    onSuccess: () => {
      toast.success("تم إغلاق التنبيه");
      alertsQuery.refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 text-muted-foreground">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-medium text-lg">جارٍ تحميل لوحة المتابعة الشاملة…</p>
      </div>
    );
  }

  if (!workspace || workspace.farms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-card rounded-2xl border border-dashed">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">مرحباً بك في منصة BroilFarm ERP</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          لم يتم إنشاء أي مزرعة بعد. ابدأ بإضافة مزرعتك الأولى لتفعيل المتابعة الذكية لقطيع التسمين.
        </p>
        <Button onClick={() => setLocation("/farms")} size="lg" className="gap-2 shadow-lg">
          <Building2 className="w-5 h-5" />
          إضافة المزرعة الأولى
        </Button>
      </div>
    );
  }

  const mortalityRate = activeCycle && activeCycle.birdsPlaced > 0
    ? ((totalMortality / activeCycle.birdsPlaced) * 100).toFixed(2)
    : "0.00";

  // Chart data from records
  const chartData = cycleRecords.map((r, idx) => ({
    day: `يوم ${idx + 1}`,
    feed: r.feedKg,
    water: r.waterLiters,
    mortality: r.mortality + r.culls,
  }));

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">لوحة التحكم والتحليلات</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {activeFarm?.name || "المزرعة"}
            </Badge>
            {activeCycle && (
              <Badge variant="secondary" className="gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {activeCycle.name} (عمر {cycleAgeDays} يوم)
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة حية لمؤشرات الأداء الإنتاجي ومعدلات التحويل والنفوق
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-lg border gap-1 self-start md:self-auto overflow-x-auto">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
            className="gap-1.5 text-xs font-semibold"
          >
            <Gauge className="w-4 h-4" />
            نظرة عامة
          </Button>
          <Button
            variant={activeTab === "executive" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("executive")}
            className="gap-1.5 text-xs font-semibold"
          >
            <TrendingUp className="w-4 h-4" />
            التقرير التنفيذي (EPEF)
          </Button>
          <Button
            variant={activeTab === "sensors" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("sensors")}
            className="gap-1.5 text-xs font-semibold"
          >
            <Activity className="w-4 h-4" />
            الحساسات البيئية
          </Button>
          <Button
            variant={activeTab === "ai" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("ai")}
            className="gap-1.5 text-xs font-semibold"
          >
            <Bot className="w-4 h-4" />
            المساعد الذكي (AI)
          </Button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Active Smart Alerts Banner */}
          {alertsQuery.data && alertsQuery.data.length > 0 && (
            <div className="space-y-2">
              {alertsQuery.data.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                    alert.severity === "critical"
                      ? "bg-rose-50 border-rose-200 text-rose-950"
                      : "bg-amber-50 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        alert.severity === "critical" ? "text-rose-600" : "text-amber-600"
                      }`}
                    />
                    <div>
                      <div className="font-bold text-sm">{alert.title}</div>
                      <p className="text-xs mt-0.5 opacity-90">{alert.message}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0 bg-white/80"
                    onClick={() => resolveAlertMutation.mutate({ alertId: alert.id })}
                  >
                    تأكيد المعالجة
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-200">
              <CardContent className="p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700">الطيور الحية</span>
                  <Bird className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-blue-950">
                    {currentLiveBirds.toLocaleString("ar-EG")}
                  </div>
                  <div className="text-[11px] text-blue-600 mt-0.5">
                    من إجمالي {activeCycle?.birdsPlaced.toLocaleString("ar-EG") || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 border-emerald-200">
              <CardContent className="p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700">معامل التحويل (FCR)</span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-950">
                    {currentFcr > 0 ? currentFcr : "—"}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    {currentFcr > 0 && currentFcr <= 1.55 ? "ممتاز ⭐" : "المعدل الفعلي"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/30 border-amber-200">
              <CardContent className="p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700">متوسط الوزن</span>
                  <Scale className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-amber-950">
                    {avgWeightGrams > 0 ? `${avgWeightGrams} جم` : "—"}
                  </div>
                  <div className="text-[11px] text-amber-600 mt-0.5">آخر عينة وزن</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-100/30 border-rose-200">
              <CardContent className="p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-700">نسبة النفوق</span>
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-rose-950">%{mortalityRate}</div>
                  <div className="text-[11px] text-rose-600 mt-0.5">
                    {totalMortality.toLocaleString("ar-EG")} طائر
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/30 border-orange-200">
              <CardContent className="p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-orange-700">إجمالي العلف</span>
                  <Wheat className="w-4 h-4 text-orange-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-orange-950">
                    {(totalFeedKg / 1000).toFixed(2)} طن
                  </div>
                  <div className="text-[11px] text-orange-600 mt-0.5">
                    {totalFeedKg.toLocaleString("ar-EG")} كجم
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/30 border-cyan-200">
              <CardContent className="p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-700">استهلاك المياه</span>
                  <Droplets className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-cyan-950">
                    {totalWaterLiters.toLocaleString("ar-EG")} لتر
                  </div>
                  <div className="text-[11px] text-cyan-700 font-medium mt-0.5">
                    نسبة ماء:علف {totalFeedKg > 0 ? (totalWaterLiters / totalFeedKg).toFixed(1) : "—"} (
                    {evaluateWaterToFeedRatio(totalWaterLiters, totalFeedKg).statusArabic})
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Consumption Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">منحنى استهلاك العلف والمياه اليومي</CardTitle>
                  <CardDescription>متابعة التطور اليومي للاستهلاك عبر أيام الدورة</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setLocation("/operations")} className="gap-1 text-xs">
                  تسجيل يومي
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-[280px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="feedColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="waterColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="feed" stroke="#f97316" fillOpacity={1} fill="url(#feedColor)" name="علف (كجم)" />
                      <Area type="monotone" dataKey="water" stroke="#06b6d4" fillOpacity={1} fill="url(#waterColor)" name="مياه (لتر)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  لا توجد سجلات يومية مسجلة بعد لهذه الدورة.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-primary/20 hover:border-primary hover:bg-primary/5"
              onClick={() => setLocation("/operations")}
            >
              <Activity className="w-6 h-6 text-primary" />
              <span className="font-semibold text-sm">تسجيل العمليات اليومية</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-primary/20 hover:border-primary hover:bg-primary/5"
              onClick={() => setLocation("/growth")}
            >
              <Scale className="w-6 h-6 text-primary" />
              <span className="font-semibold text-sm">أوزان الطيور والنمو</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-primary/20 hover:border-primary hover:bg-primary/5"
              onClick={() => setLocation("/health")}
            >
              <HeartPulse className="w-6 h-6 text-primary" />
              <span className="font-semibold text-sm">الأدوية والتحصينات</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-primary/20 hover:border-primary hover:bg-primary/5"
              onClick={() => setLocation("/sales")}
            >
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="font-semibold text-sm">شاشة بيع التجار</span>
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Executive Dashboard */}
      {activeTab === "executive" && (
        <ExecutiveDashboard />
      )}

      {/* Tab 3: IoT Environmental Sensors */}
      {activeTab === "sensors" && activeFarm && cycleHouses[0] && (
        <EnvironmentalSensorsPanel farmId={activeFarm.id} houseId={cycleHouses[0].id} houseName={cycleHouses[0].name} />
      )}

      {/* Tab 4: AI Intelligent Assistant & Biological Decision Intelligence */}
      {activeTab === "ai" && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Health Status & Risk Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-primary" />
                  <CardTitle className="text-xl">محلل الذكاء البيولوجي والتشغيلي للقطيع</CardTitle>
                </div>
                {anomalyQuery.data && (
                  <Badge
                    variant={
                      anomalyQuery.data.overallRiskLevel === "critical"
                        ? "destructive"
                        : anomalyQuery.data.overallRiskLevel === "medium"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs px-3 py-1 font-bold"
                  >
                    مستوى المخاطر: {anomalyQuery.data.overallRiskArabic}
                  </Badge>
                )}
              </div>
              <CardDescription>
                تحليل تلقائي لأنماط النمو، النفوق، استهلاك المياه والعلف ومقارنتها بالسلالة القياسية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {anomalyQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">جارٍ فحص وتحليل مؤشرات القطيع…</p>
              ) : anomalyQuery.data && anomalyQuery.data.detectedAnomalies.length > 0 ? (
                <div className="space-y-3">
                  {anomalyQuery.data.detectedAnomalies.map((anomaly, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        anomaly.severity === "critical"
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-base mb-1">
                        <AlertTriangle className="w-5 h-5" />
                        {anomaly.titleArabic}
                      </div>
                      <p className="text-sm mb-2 opacity-90">{anomaly.descriptionArabic}</p>
                      <div className="text-xs font-semibold bg-background/60 p-2.5 rounded-lg border">
                        <span className="text-primary font-bold">💡 التوصية التشغيلية: </span>
                        {anomaly.recommendationArabic}
                      </div>
                      {anomaly.investigationQuestions.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-border/40 text-xs">
                          <p className="font-bold mb-1">🔍 أسئلة للفحص الميداني والبيطري:</p>
                          <ul className="list-disc list-inside space-y-0.5 opacity-90">
                            {anomaly.investigationQuestions.map((q, qIdx) => (
                              <li key={qIdx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-foreground">القطيع في حالة بيولوجية وإنتاجية ممتازة</p>
                  <p className="text-xs mt-1">لا توجد أي أنماط شاذة في النفوق أو استهلاك المياه والعلف لهذا اليوم.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Harvest & Marketing Optimizer */}
          {harvestQuery.data && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">مستشار نافذة البيع والتسويق الاقتصادي</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    عمر {harvestQuery.data.currentAgeDays} يوم
                  </Badge>
                </div>
                <CardDescription>
                  تحديد التوقيت الأمثل للبيع بناءً على مقارنة قيمة الزيادة اليومية في الوزن بتكلفة العلف
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-muted/40 rounded-xl border">
                    <p className="text-xs text-muted-foreground">الوزن الحالي</p>
                    <p className="text-lg font-bold text-foreground">{harvestQuery.data.currentWeightGrams} جم</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border">
                    <p className="text-xs text-muted-foreground">الوزن المستهدف</p>
                    <p className="text-lg font-bold text-primary">{harvestQuery.data.targetWeightGrams} جم</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border">
                    <p className="text-xs text-muted-foreground">العمر المتوقع للبيع</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      يوم {harvestQuery.data.estimatedOptimalHarvestDay}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border">
                    <p className="text-xs text-muted-foreground">الربح التقديري/طائر</p>
                    <p className="text-lg font-bold text-foreground">{harvestQuery.data.projectedProfitPerBirdEgp} ج.م</p>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm">
                  <p className="font-bold text-primary mb-1">📢 الرؤية الاقتصادية:</p>
                  <p className="text-foreground">{harvestQuery.data.recommendationArabic}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Veterinary Notice */}
          <div className="p-4 bg-muted/30 rounded-xl border text-xs text-muted-foreground flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <p>
              <strong>ملاحظة أمان بيطرية:</strong> هذه التحليلات تقدم مؤشرات تشغيلية مبنية على البيانات الرياضية للقطيع،
              ولا تغني عن المعاينة الميدانية والتشخيص من الطبيب البيطري المعتمد للمزرعة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
