import React, { useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Activity, Plus, Wheat, Droplets, HeartPulse, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function OperationsPage() {
  const { activeCycleId, cycleHouses, cycleRecords, refetch } = useWorkspaceContext();
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]);
  const [feedKg, setFeedKg] = useState("100");
  const [waterLiters, setWaterLiters] = useState("200");
  const [mortality, setMortality] = useState("0");
  const [culls, setCulls] = useState("0");

  const addRecordMutation = trpc.workspace.addDailyRecord.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل بيانات التشغيل اليومي بنجاح");
      setIsRecordOpen(false);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ السجل");
    },
  });

  const deleteRecordMutation = trpc.workspace.deleteDailyRecord.useMutation({
    onSuccess: () => {
      toast.success("تم حذف السجل اليومي");
      refetch();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycleId) {
      toast.error("يرجى اختيار دورة تسمين أولاً");
      return;
    }
    const houseId = selectedHouseId || cycleHouses[0]?.id;
    if (!houseId) {
      toast.error("يرجى تحديد العنبر");
      return;
    }
    addRecordMutation.mutate({
      cycleId: activeCycleId,
      houseId,
      recordDate: new Date(recordDate),
      feedKg: parseFloat(feedKg) || 0,
      waterLiters: parseFloat(waterLiters) || 0,
      mortality: parseInt(mortality, 10) || 0,
      culls: parseInt(culls, 10) || 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">العمليات والتشغيل اليومي</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تسجيل ومتابعة استهلاك العلف والمياه والنفوق والفرز اليومي
          </p>
        </div>
        <Button onClick={() => setIsRecordOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          تسجيل يومي جديد
        </Button>
      </div>

      {/* Daily Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل الأيام التشغيلية</CardTitle>
          <CardDescription>عرض التاريخ المسجل لكل يوم في الدورة الحالية</CardDescription>
        </CardHeader>
        <CardContent>
          {cycleRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground text-xs font-semibold">
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">العنبر</th>
                    <th className="p-3">العلف (كجم)</th>
                    <th className="p-3">المياه (لتر)</th>
                    <th className="p-3">النفوق</th>
                    <th className="p-3">الفرز</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleRecords.map((r) => {
                    const house = cycleHouses.find((h) => h.id === r.houseId);
                    return (
                      <tr key={r.id} className="border-b hover:bg-muted/20">
                        <td className="p-3 font-medium">
                          {new Date(r.recordDate).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="p-3">{house?.name || `عنبر #${r.houseId}`}</td>
                        <td className="p-3 text-orange-600 font-semibold">{r.feedKg} كجم</td>
                        <td className="p-3 text-cyan-600 font-semibold">{r.waterLiters} لتر</td>
                        <td className="p-3 text-rose-600 font-bold">{r.mortality}</td>
                        <td className="p-3 text-amber-600">{r.culls}</td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                            onClick={() => deleteRecordMutation.mutate({ recordId: r.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              لا توجد سجلات تشغيل يومية مسجلة بعد لهذه الدورة.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تسجيل العمليات اليومية</DialogTitle>
            <DialogDescription>
              أدخل كمية العلف والمياه والنفوق لليوم الحالي
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="date">التاريخ *</Label>
              <Input
                id="date"
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="feed">العلف المستهلك (كجم) *</Label>
                <Input
                  id="feed"
                  type="number"
                  step="0.1"
                  min="0"
                  value={feedKg}
                  onChange={(e) => setFeedKg(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="water">المياه (لتر) *</Label>
                <Input
                  id="water"
                  type="number"
                  step="0.1"
                  min="0"
                  value={waterLiters}
                  onChange={(e) => setWaterLiters(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mortality">النفوق (طائر)</Label>
                <Input
                  id="mortality"
                  type="number"
                  min="0"
                  value={mortality}
                  onChange={(e) => setMortality(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="culls">الفرز (طائر)</Label>
                <Input
                  id="culls"
                  type="number"
                  min="0"
                  value={culls}
                  onChange={(e) => setCulls(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={addRecordMutation.isPending}>
                {addRecordMutation.isPending ? "جارٍ الحفظ…" : "حفظ السجل"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
