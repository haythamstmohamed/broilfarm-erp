import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Sparkles, TrendingUp, DollarSign, Calendar, Scale } from "lucide-react";

export function ProfitabilitySimulatorPanel({
  birdsPlaced = 10000,
  currentAgeDays = 28,
  currentLiveBirds = 9500,
  currentAvgWeightGrams = 1560,
}: {
  birdsPlaced?: number;
  currentAgeDays?: number;
  currentLiveBirds?: number;
  currentAvgWeightGrams?: number;
}) {
  const [feedCost, setFeedCost] = useState("24.0");
  const [chickCost, setChickCost] = useState("33.0");
  const [sellingPrice, setSellingPrice] = useState("85.0");
  const [dailyOverhead, setDailyOverhead] = useState("800");

  const { data: simulation } = trpc.simulator.simulate.useQuery({
    birdsPlaced: Math.max(100, birdsPlaced),
    currentAgeDays: Math.max(1, currentAgeDays),
    currentLiveBirds: Math.max(100, currentLiveBirds),
    currentAvgWeightGrams: Math.max(50, currentAvgWeightGrams),
    feedCostPerKgEgp: Number(feedCost) || 24,
    chickCostPerBirdEgp: Number(chickCost) || 33,
    fixedDailyOverheadEgp: Number(dailyOverhead) || 800,
    targetSellingPricePerKgEgp: Number(sellingPrice) || 85,
  });

  return (
    <div className="space-y-6 mt-6" dir="rtl">
      <Card className="border-primary/30 bg-gradient-to-l from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl font-bold">
                  محاكي سيناريوهات الربحية ويوم البيع المثالي (What-If Profitability Simulator)
                </CardTitle>
              </div>
              <CardDescription>
                توقع نمو الأرباح اليومية، معامل التحويل FCR، والعائد على الاستثمار لاختيار أفضل موعد للبيع والتسويق.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              ذكاء تسويقي
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Controls Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-background border">
            <div className="space-y-1">
              <Label className="text-xs">سعر طن العلف (ج.م / كجم)</Label>
              <Input
                type="number"
                step="0.5"
                value={feedCost}
                onChange={(e) => setFeedCost(e.target.value)}
                className="text-left font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">سعر الكتكوت (ج.م)</Label>
              <Input
                type="number"
                step="0.5"
                value={chickCost}
                onChange={(e) => setChickCost(e.target.value)}
                className="text-left font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">سعر بيع البورصة المتوقع (ج.م / كجم)</Label>
              <Input
                type="number"
                step="0.5"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="text-left font-mono text-emerald-600 font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">المصاريف اليومية الثابتة (ج.م / يوم)</Label>
              <Input
                type="number"
                value={dailyOverhead}
                onChange={(e) => setDailyOverhead(e.target.value)}
                className="text-left font-mono"
              />
            </div>
          </div>

          {/* Optimal Harvest Day Highlight */}
          {simulation && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Calendar className="w-5 h-5" />
                    <p className="text-xs font-semibold">عمر البيع الأمثل اقتصادياً</p>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                    اليوم {simulation.optimalHarvest.optimalAgeDays}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    متوسط الوزن المستهدف: {simulation.optimalHarvest.optimalWeightGrams} جم
                  </p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <DollarSign className="w-5 h-5" />
                    <p className="text-xs font-semibold">أعلى صافي ربح متوقع للدورة</p>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                    {Math.round(simulation.optimalHarvest.maxNetProfitEgp).toLocaleString("ar-EG")}{" "}
                    <span className="text-sm font-normal">ج.م</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    العائد على الاستثمار: {simulation.optimalHarvest.optimalRoiPercent}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <TrendingUp className="w-5 h-5" />
                    <p className="text-xs font-semibold">معدل الربح اليومي الأقصى</p>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                    {Math.round(simulation.optimalHarvest.maxProfitPerDayEgp).toLocaleString("ar-EG")}{" "}
                    <span className="text-sm font-normal">ج.م / يوم</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    كفاءة استغلال العنبر والوقت
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Forward Simulation Table */}
          {simulation && (
            <div className="mt-6 overflow-x-auto rounded-xl border">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="py-2.5 px-3">عمر القطيع</th>
                    <th className="py-2.5 px-3">الوزن المتوقع</th>
                    <th className="py-2.5 px-3">الطيور الحية</th>
                    <th className="py-2.5 px-3">الكتلة الحية (كجم)</th>
                    <th className="py-2.5 px-3">معامل FCR</th>
                    <th className="py-2.5 px-3">إجمالي التكاليف</th>
                    <th className="py-2.5 px-3">إجمالي الإيرادات</th>
                    <th className="py-2.5 px-3">صافي الأرباح</th>
                    <th className="py-2.5 px-3">ربح الطائر</th>
                    <th className="py-2.5 px-3">العائد ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {simulation.dailyProjections.map((row) => (
                    <tr
                      key={row.ageDays}
                      className={`transition-colors ${
                        row.isOptimalHarvestDay
                          ? "bg-emerald-50 dark:bg-emerald-950/40 font-bold border-l-4 border-l-emerald-600"
                          : row.ageDays === currentAgeDays
                          ? "bg-primary/5 font-semibold"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1.5">
                          يوم {row.ageDays}
                          {row.isOptimalHarvestDay && (
                            <Badge variant="default" className="text-[10px] bg-emerald-600 h-4 px-1">
                              الأمثل
                            </Badge>
                          )}
                          {row.ageDays === currentAgeDays && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              اليوم الحالي
                            </Badge>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{row.projectedWeightGrams} جم</td>
                      <td className="py-2.5 px-3 font-mono">{row.projectedLiveBirds.toLocaleString("ar-EG")}</td>
                      <td className="py-2.5 px-3 font-mono">{row.totalBiomassKg.toLocaleString("ar-EG")}</td>
                      <td className="py-2.5 px-3 font-mono">{row.fcr.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {row.totalExpensesEgp.toLocaleString("ar-EG")}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {row.grossRevenueEgp.toLocaleString("ar-EG")}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-mono font-bold ${
                          row.netProfitEgp >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {row.netProfitEgp.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="py-2.5 px-3 font-mono">{row.profitPerBirdEgp} ج.م</td>
                      <td className="py-2.5 px-3 font-mono">{row.roiPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfitabilitySimulatorPanel;
