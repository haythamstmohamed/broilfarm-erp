import React, { useState, useMemo } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { ExpenseManagementWorkspace, type FarmExpenseData } from "@/components/ExpenseManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calculator, CircleDollarSign, PieChart, TrendingUp, ShieldAlert, Layers } from "lucide-react";
import { computeCycleFinancials } from "../../../shared/cycleFinancials";
import type { ExpenseCategory } from "../../../shared/expenseManagement";

export default function ExpensesPage() {
  const {
    activeFarmId,
    activeFarm,
    farmExpenses,
    farmCycles,
    activeCycleId,
    activeCycle,
    farmSales,
    totalMortality,
    totalFeedKg,
    avgWeightGrams,
    refetch,
  } = useWorkspaceContext();

  const [activeTab, setActiveTab] = useState<"workspace" | "costing">("workspace");

  const addExpenseMutation = trpc.workspace.addFarmExpense.useMutation({
    onSuccess: () => refetch(),
  });

  const updateExpenseMutation = trpc.workspace.updateFarmExpense.useMutation({
    onSuccess: () => refetch(),
  });

  const formattedExpenses: FarmExpenseData[] = useMemo(() => {
    return farmExpenses.map((e) => ({
      id: e.id,
      farmId: e.farmId,
      cycleId: e.cycleId,
      category: e.category as ExpenseCategory,
      amountPiasters: e.amountPiasters,
      expenseDate: new Date(e.expenseDate),
      supplier: e.supplier,
      reference: e.reference,
      notes: e.notes,
    }));
  }, [farmExpenses]);

  const cycleOptions = useMemo(() => {
    return farmCycles.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      birdsPlaced: c.birdsPlaced,
    }));
  }, [farmCycles]);

  // Compute live cycle financials
  const financials = useMemo(() => {
    if (!activeCycle) return null;
    return computeCycleFinancials({
      birdsPlaced: activeCycle.birdsPlaced,
      totalMortality,
      totalFeedKg,
      averageWeightGrams: avgWeightGrams || 1800,
      expenses: farmExpenses.filter((e) => !e.cycleId || e.cycleId === activeCycleId),
      sales: farmSales.filter((s) => s.cycleId === activeCycleId),
    });
  }, [activeCycle, totalMortality, totalFeedKg, avgWeightGrams, farmExpenses, farmSales, activeCycleId]);

  if (!activeFarmId || !activeFarm) {
    return <div className="p-8 text-center text-muted-foreground">يرجى اختيار مزرعة أولاً.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المصروفات والتكاليف المالية</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تسجيل مصروفات المزرعة وتحليل تكلفة الكيلو ونقطة التعادل وهوامش الأرباح
          </p>
        </div>

        <div className="flex items-center bg-muted/60 p-1 rounded-lg border gap-1 self-start sm:self-auto">
          <Button
            variant={activeTab === "workspace" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("workspace")}
            className="gap-1.5 text-xs font-semibold"
          >
            <CircleDollarSign className="w-4 h-4" />
            سجل المصروفات
          </Button>
          <Button
            variant={activeTab === "costing" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("costing")}
            className="gap-1.5 text-xs font-semibold"
          >
            <Calculator className="w-4 h-4" />
            تحليل التكاليف والتعادل
          </Button>
        </div>
      </div>

      {activeTab === "workspace" && (
        <ExpenseManagementWorkspace
          farmName={activeFarm.name}
          expenses={formattedExpenses}
          cycles={cycleOptions}
          activeCycleId={activeCycleId || undefined}
          onAddExpense={async (input) => {
            await addExpenseMutation.mutateAsync({
              farmId: activeFarmId,
              cycleId: input.cycleId,
              category: input.category,
              amountEgp: input.amountEgp,
              expenseDate: new Date(input.expenseDate),
              supplier: input.supplier,
              reference: input.reference,
              notes: input.notes,
            });
          }}
          onUpdateExpense={async (input) => {
            await updateExpenseMutation.mutateAsync({
              expenseId: input.expenseId,
              cycleId: input.cycleId,
              category: input.category,
              amountEgp: input.amountEgp,
              expenseDate: new Date(input.expenseDate),
              supplier: input.supplier,
              reference: input.reference,
              notes: input.notes,
            });
          }}
        />
      )}

      {activeTab === "costing" && financials && (
        <div className="space-y-6">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-blue-700 block">إجمالي المصروفات</span>
                <span className="text-2xl font-black text-blue-950 block mt-2">
                  {financials.costs.totalExpensesEgp.toLocaleString("ar-EG")} ج.م
                </span>
                <span className="text-[11px] text-blue-600 mt-1 block">
                  تكلفة الطائر: {financials.costs.totalCostPerBirdEgp} ج.م
                </span>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/30 border-amber-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-amber-700 block">تكلفة الكيلو القائم</span>
                <span className="text-2xl font-black text-amber-950 block mt-2">
                  {financials.costs.totalCostPerKgEgp} ج.م / كجم
                </span>
                <span className="text-[11px] text-amber-700 mt-1 block">
                  منها علف: {financials.costs.feedCostPerKgProducedEgp} ج.م
                </span>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/30 border-purple-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-purple-700 block">سعر نقطة التعادل</span>
                <span className="text-2xl font-black text-purple-950 block mt-2">
                  {financials.breakEven.breakEvenPricePerKgEgp} ج.م / كجم
                </span>
                <span className="text-[11px] text-purple-700 mt-1 block">
                  أقل سعر بيع لتغطية التكلفة
                </span>
              </CardContent>
            </Card>

            <Card
              className={
                financials.profitability.isProfitable
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100/30 border-emerald-200"
                  : "bg-gradient-to-br from-rose-50 to-rose-100/30 border-rose-200"
              }
            >
              <CardContent className="p-4">
                <span
                  className={`text-xs font-semibold block ${
                    financials.profitability.isProfitable ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  صافي الربح / الخسارة
                </span>
                <span
                  className={`text-2xl font-black block mt-2 ${
                    financials.profitability.isProfitable ? "text-emerald-950" : "text-rose-950"
                  }`}
                >
                  {financials.profitability.netProfitEgp.toLocaleString("ar-EG")} ج.م
                </span>
                <span
                  className={`text-[11px] mt-1 block ${
                    financials.profitability.isProfitable ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  هامش الربح: %{financials.profitability.profitMarginPercent}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Cost Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تفصيل التكاليف حسب بنود الصرف</CardTitle>
              <CardDescription>
                تحليل مساهمة كل بند في التكلفة الإجمالية وتكلفة الطائر والكيلو
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financials.costs.categories.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground text-xs font-semibold">
                        <th className="p-3">بند المصروف</th>
                        <th className="p-3">الإجمالي (ج.م)</th>
                        <th className="p-3">النسبة %</th>
                        <th className="p-3">تكلفة الطائر (ج.م)</th>
                        <th className="p-3">تكلفة الكيلو (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financials.costs.categories.map((c) => (
                        <tr key={c.category} className="border-b hover:bg-muted/20">
                          <td className="p-3 font-semibold text-foreground">{c.categoryLabel}</td>
                          <td className="p-3 font-bold">{c.amountEgp.toLocaleString("ar-EG")} ج.م</td>
                          <td className="p-3">
                            <Badge variant="outline">%{c.percentageOfTotal}</Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{c.costPerBirdEgp} ج.م</td>
                          <td className="p-3 text-muted-foreground">{c.costPerKgEgp} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  لم يتم تسجيل أي مصروفات حتى الآن لهذه الدورة.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
