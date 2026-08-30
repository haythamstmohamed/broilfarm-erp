import React, { useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Plus, Bird, CheckCircle2, Clock, Lock } from "lucide-react";
import { toast } from "sonner";

export default function CyclesPage() {
  const { activeFarmId, farmCycles, activeCycleId, setActiveCycleId, refetch } = useWorkspaceContext();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [placementDate, setPlacementDate] = useState(new Date().toISOString().split("T")[0]);
  const [birdsPlaced, setBirdsPlaced] = useState("10000");

  const createCycleMutation = trpc.workspace.createCycle.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الدورة بنجاح");
      setIsCreateOpen(false);
      setCycleName("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء إنشاء الدورة");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFarmId) {
      toast.error("يرجى اختيار مزرعة أولاً");
      return;
    }
    const count = parseInt(birdsPlaced, 10);
    if (isNaN(count) || count <= 0) {
      toast.error("يرجى إدخال عدد كتاكيت صحيح");
      return;
    }
    createCycleMutation.mutate({
      farmId: activeFarmId,
      name: cycleName.trim() || `دورة ${new Date().toLocaleDateString("ar-EG")}`,
      placementDate: new Date(placementDate),
      birdsPlaced: count,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-emerald-600 gap-1"><CheckCircle2 className="w-3 h-3" /> نشطة</Badge>;
      case "closed":
        return <Badge variant="secondary" className="gap-1"><Lock className="w-3 h-3" /> مغلقة</Badge>;
      case "draft":
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> مسودة</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة دورات التسمين</h1>
          <p className="text-sm text-muted-foreground mt-1">
            سجل دورات التسمين، أعداد الكتاكيت المسكنة، وتواريخ التسكين والإغلاق
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          بدء دورة تسمين جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farmCycles.map((cycle) => {
          const isSelected = cycle.id === activeCycleId;
          const placedDateFormatted = new Date(cycle.placementDate).toLocaleDateString("ar-EG");

          return (
            <Card
              key={cycle.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]" : ""
              }`}
              onClick={() => setActiveCycleId(cycle.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{cycle.name}</CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      تاريخ التسكين: {placedDateFormatted}
                    </div>
                  </div>
                  {getStatusBadge(cycle.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-muted/40 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bird className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">العدد المسكن:</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {cycle.birdsPlaced.toLocaleString("ar-EG")} طائر
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Cycle Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>بدء دورة تسمين جديدة</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الدورة والعدد الابتدائي للكتاكيت المسكنة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cycleName">اسم الدورة *</Label>
              <Input
                id="cycleName"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="مثال: دورة أغسطس 2026"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="placementDate">تاريخ التسكين (العمر يوم 1) *</Label>
              <Input
                id="placementDate"
                type="date"
                value={placementDate}
                onChange={(e) => setPlacementDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birdsPlaced">عدد الكتاكيت المسكنة *</Label>
              <Input
                id="birdsPlaced"
                type="number"
                min="100"
                max="1000000"
                value={birdsPlaced}
                onChange={(e) => setBirdsPlaced(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createCycleMutation.isPending}>
                {createCycleMutation.isPending ? "جارٍ الحفظ…" : "تأكيد وبدء الدورة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
