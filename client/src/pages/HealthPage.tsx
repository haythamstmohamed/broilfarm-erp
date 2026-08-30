import React, { useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { MedicineInventoryPanel } from "@/components/MedicineInventoryPanel";
import { MedicationDoseCalculator } from "@/components/MedicationDoseCalculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, Calculator, PackageCheck } from "lucide-react";

export default function HealthPage() {
  const { activeFarmId, activeCycleId, cycleHouses, cycleHealth, currentLiveBirds, avgWeightGrams } = useWorkspaceContext();
  const [activeTab, setActiveTab] = useState<"log" | "inventory" | "calculator">("log");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الرعاية الصحية والأدوية</h1>
          <p className="text-sm text-muted-foreground mt-1">
            سجل التحصينات والعلاجات البيطرية، مخزون الأدوية، وحاسبة الجرعات
          </p>
        </div>
        <div className="flex items-center bg-muted/60 p-1 rounded-lg border gap-1 self-start sm:self-auto">
          <Button
            variant={activeTab === "log" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("log")}
            className="gap-1.5 text-xs font-semibold"
          >
            <HeartPulse className="w-4 h-4" />
            سجل الأحداث الصحية
          </Button>
          <Button
            variant={activeTab === "inventory" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("inventory")}
            className="gap-1.5 text-xs font-semibold"
          >
            <PackageCheck className="w-4 h-4" />
            مخزون الأدوية
          </Button>
          <Button
            variant={activeTab === "calculator" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("calculator")}
            className="gap-1.5 text-xs font-semibold"
          >
            <Calculator className="w-4 h-4" />
            حاسبة الجرعات
          </Button>
        </div>
      </div>

      {activeTab === "log" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">سجل العلاجات والتحصينات المنفذة</CardTitle>
            <CardDescription>عرض كل الأحداث الصحية المسجلة للدورة الحالية</CardDescription>
          </CardHeader>
          <CardContent>
            {cycleHealth.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground text-xs font-semibold">
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">النوع</th>
                      <th className="p-3">اسم الصنف / اللقاح</th>
                      <th className="p-3">الجرعة</th>
                      <th className="p-3">طريقة الإعطاء</th>
                      <th className="p-3">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycleHealth.map((h) => (
                      <tr key={h.id} className="border-b hover:bg-muted/20">
                        <td className="p-3 font-medium">
                          {new Date(h.eventDate).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="p-3">
                          <Badge variant={h.eventType === "vaccination" ? "default" : "secondary"}>
                            {h.eventType === "vaccination" ? "تحصين" : "علاج / دواء"}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold text-foreground">{h.productName}</td>
                        <td className="p-3">{h.dosage}</td>
                        <td className="p-3 text-muted-foreground">{h.administrationRoute || "ماء الشرب"}</td>
                        <td className="p-3 text-xs text-muted-foreground">{h.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                لا توجد أحداث صحية مسجلة بعد في هذه الدورة.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "inventory" && activeFarmId && (
        <MedicineInventoryPanel farmId={activeFarmId} />
      )}

      {activeTab === "calculator" && (
        <MedicationDoseCalculator />
      )}
    </div>
  );
}
