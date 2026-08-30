import React, { useState, useMemo } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Scale, Plus, TrendingUp, Sparkles, Calculator, CheckCircle2, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";
import {
  getBreedTargetForDay,
  calculateWeightUniformity,
  type UniformityResult,
  type PoultryBreed,
} from "../../../shared/productionIntelligence";

export default function GrowthPage() {
  const { activeCycleId, activeCycle, cycleHouses, cycleWeights, cycleAgeDays, refetch } = useWorkspaceContext();
  const [activeTab, setActiveTab] = useState<"curve" | "uniformity" | "logs">("curve");
  const [selectedBreed, setSelectedBreed] = useState<PoultryBreed>("ross_308");

  // Record weight dialog state
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [sampleDate, setSampleDate] = useState(new Date().toISOString().split("T")[0]);
  const [avgWeightGrams, setAvgWeightGrams] = useState("1200");

  // Uniformity calculator state
  const [rawSampleInput, setRawSampleInput] = useState("1750, 1820, 1800, 1790, 1840, 1780, 1810, 1830, 1770, 1800");
  const [uniformityResult, setUniformityResult] = useState<UniformityResult | null>(() => {
    return calculateWeightUniformity([1750, 1820, 1800, 1790, 1840, 1780, 1810, 1830, 1770, 1800]);
  });

  const addWeightMutation = trpc.workspace.addWeightSample.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل عينة الوزن بنجاح");
      setIsWeightOpen(false);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ عينة الوزن");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycleId) {
      toast.error("يرجى اختيار دورة تسمين أولاً");
      return;
    }
    const houseId = cycleHouses[0]?.id;
    if (!houseId) {
      toast.error("يرجى تحديد العنبر");
      return;
    }
    const grams = parseInt(avgWeightGrams, 10);
    if (isNaN(grams) || grams <= 0) {
      toast.error("يرجى إدخال وزن صحيح بالجرام");
      return;
    }
    addWeightMutation.mutate({
      cycleId: activeCycleId,
      houseId,
      sampleDate: new Date(sampleDate),
      averageWeightGrams: grams,
    });
  };

  const handleCalculateUniformity = () => {
    const parsed = rawSampleInput
      .split(/[\s,\n]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (parsed.length < 3) {
      toast.error("يرجى إدخال 3 أوزان على الأقل لحساب معامل التجانس");
      return;
    }

    const res = calculateWeightUniformity(parsed);
    setUniformityResult(res);
    toast.success("تم تحليل تجانس العينة وحساب CV%");
  };

  // Chart data with standard overlay
  const chartData = useMemo(() => {
    if (!activeCycle) return [];
    const placement = new Date(activeCycle.placementDate);

    // Map weights to cycle age days
    const actualPoints = cycleWeights.map((w) => {
      const d = new Date(w.sampleDate);
      const age = Math.max(1, Math.ceil((d.getTime() - placement.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        ageDay: age,
        actualWeight: w.averageWeightGrams,
      };
    });

    const maxDay = Math.max(cycleAgeDays || 35, 35);
    const data = [];

    for (let day = 1; day <= maxDay; day += 3) {
      const ross = getBreedTargetForDay("ross_308", day).targetWeightGrams;
      const cobb = getBreedTargetForDay("cobb_500", day).targetWeightGrams;
      const actualMatch = actualPoints.find((p) => Math.abs(p.ageDay - day) <= 1);

      data.push({
        day: `عمر ${day}`,
        rossTarget: ross,
        cobbTarget: cobb,
        actualWeight: actualMatch ? actualMatch.actualWeight : undefined,
      });
    }

    return data;
  }, [activeCycle, cycleWeights, cycleAgeDays]);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">معدلات النمو ومعايير السلالات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مقارنة الأوزان الفعلية بكتالوجات Ross 308 و Cobb 500 وتحليل التجانس (CV%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border gap-1">
            <Button
              variant={activeTab === "curve" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("curve")}
              className="gap-1 text-xs"
            >
              <TrendingUp className="w-4 h-4" />
              منحنى السلالة
            </Button>
            <Button
              variant={activeTab === "uniformity" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("uniformity")}
              className="gap-1 text-xs"
            >
              <Calculator className="w-4 h-4" />
              حاسبة التجانس (CV%)
            </Button>
            <Button
              variant={activeTab === "logs" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("logs")}
              className="gap-1 text-xs"
            >
              <Scale className="w-4 h-4" />
              السجل
            </Button>
          </div>

          <Button onClick={() => setIsWeightOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            عينة جديدة
          </Button>
        </div>
      </div>

      {/* Tab 1: Curve with Standard Benchmarks */}
      {activeTab === "curve" && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">منحنى مقارنة الوزن الفعلي بالمعايير القياسية</CardTitle>
                <CardDescription>مقارنة أوزان الدورة بكتالوج الأداء القياسي</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                  Ross 308 Target
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  Cobb 500 Target
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[340px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rossTarget"
                      name="معيار Ross 308 (جم)"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="cobbTarget"
                      name="معيار Cobb 500 (جم)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="actualWeight"
                      name="الوزن الفعلي للمزرعة (جم)"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ r: 6, fill: "#f59e0b" }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                لا توجد عينات أوزان مسجلة بعد لهذه الدورة.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Uniformity & CV% Calculator */}
      {activeTab === "uniformity" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                إدخال عينات أوزان الطيور الفردية
              </CardTitle>
              <CardDescription>
                أدخل أوزان الطيور الموزونة بالجرام مفصولة بفواصل أو مسافات لتحليل معامل الاختلاف والتجانس
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="sampleWeights">أوزان العينة (بالجرام):</Label>
                <Textarea
                  id="sampleWeights"
                  rows={5}
                  value={rawSampleInput}
                  onChange={(e) => setRawSampleInput(e.target.value)}
                  placeholder="مثال: 1750, 1800, 1820, 1790, 1810, 1850"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  يُنصح بوزن 50 إلى 100 طائر عشوائياً من مواقع مختلفة في العنبر لدقة القياس.
                </p>
              </div>

              <Button onClick={handleCalculateUniformity} className="w-full gap-2 font-semibold">
                <Sparkles className="w-4 h-4" />
                تحليل التجانس وحساب معامل CV%
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          {uniformityResult ? (
            <Card className="border-primary/30 bg-primary/[0.01]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">نتائج تحليل تجانس القطيع</CardTitle>
                  <Badge variant="default" className="text-xs">
                    {uniformityResult.flockGradeArabic}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card p-3 rounded-xl border">
                    <span className="text-xs text-muted-foreground block">معامل الاختلاف (CV%):</span>
                    <span className="text-2xl font-black text-foreground">
                      %{uniformityResult.cvPercentage}
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      {uniformityResult.cvPercentage <= 10 ? "ضمن النطاق الممتاز" : "يحتاج تحسين"}
                    </span>
                  </div>

                  <div className="bg-card p-3 rounded-xl border">
                    <span className="text-xs text-muted-foreground block">نسبة التجانس (±10%):</span>
                    <span className="text-2xl font-black text-emerald-600">
                      %{uniformityResult.uniformityPercentage}
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      من أصل {uniformityResult.sampleCount} طائر
                    </span>
                  </div>

                  <div className="bg-card p-3 rounded-xl border">
                    <span className="text-xs text-muted-foreground block">متوسط الوزن الحسابي:</span>
                    <span className="text-xl font-bold text-foreground">
                      {uniformityResult.meanWeightGrams} جم
                    </span>
                  </div>

                  <div className="bg-card p-3 rounded-xl border">
                    <span className="text-xs text-muted-foreground block">الانحراف المعياري (SD):</span>
                    <span className="text-xl font-bold text-foreground">
                      ±{uniformityResult.standardDeviationGrams} جم
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-muted/50 rounded-xl border space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    التوصية التشغيلية:
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {uniformityResult.recommendation}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Tab 3: Logs Table */}
      {activeTab === "logs" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">سجل عينات الوزن</CardTitle>
          </CardHeader>
          <CardContent>
            {cycleWeights.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground text-xs font-semibold">
                      <th className="p-3">تاريخ العينة</th>
                      <th className="p-3">العنبر</th>
                      <th className="p-3">متوسط الوزن</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycleWeights.map((w) => {
                      const house = cycleHouses.find((h) => h.id === w.houseId);
                      return (
                        <tr key={w.id} className="border-b hover:bg-muted/20">
                          <td className="p-3 font-medium">
                            {new Date(w.sampleDate).toLocaleDateString("ar-EG")}
                          </td>
                          <td className="p-3">{house?.name || `عنبر #${w.houseId}`}</td>
                          <td className="p-3 font-bold text-emerald-600">
                            {w.averageWeightGrams} جرام
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                لم يتم إدخال أي عينات وزن حتى الآن.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isWeightOpen} onOpenChange={setIsWeightOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تسجيل عينة وزن جديدة</DialogTitle>
            <DialogDescription>
              أدخل متوسط وزن العينة بالجرام
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="weightDate">تاريخ العينة *</Label>
              <Input
                id="weightDate"
                type="date"
                value={sampleDate}
                onChange={(e) => setSampleDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weightGrams">متوسط الوزن (بالجرام) *</Label>
              <Input
                id="weightGrams"
                type="number"
                min="30"
                max="6000"
                value={avgWeightGrams}
                onChange={(e) => setAvgWeightGrams(e.target.value)}
                placeholder="مثال: 1850"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsWeightOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={addWeightMutation.isPending}>
                {addWeightMutation.isPending ? "جارٍ الحفظ…" : "حفظ العينة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
