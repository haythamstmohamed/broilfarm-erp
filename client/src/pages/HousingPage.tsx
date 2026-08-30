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
import { Home as HouseIcon, Plus, Layers, Users, Grid } from "lucide-react";
import { toast } from "sonner";

export default function HousingPage() {
  const { activeFarmId, farmHouses, refetch } = useWorkspaceContext();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [houseName, setHouseName] = useState("");
  const [capacity, setCapacity] = useState("5000");

  const createHouseMutation = trpc.workspace.createHouse.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة العنبر بنجاح");
      setIsCreateOpen(false);
      setHouseName("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء إضافة العنبر");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFarmId) {
      toast.error("يرجى اختيار مزرعة أولاً");
      return;
    }
    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 0) {
      toast.error("يرجى إدخال سعة استيعابية صحيحة");
      return;
    }
    createHouseMutation.mutate({
      farmId: activeFarmId,
      name: houseName.trim() || `عنبر ${farmHouses.length + 1}`,
      capacity: cap,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة العنابر والبطاريات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            تهيئة العنابر، السعات الاستيعابية، وتقسيم البطاريات والخطوط
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          إضافة عنبر جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farmHouses.map((house) => (
          <Card key={house.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                    <HouseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{house.name}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      الحالة: {house.status === "active" ? "مشغول بالطيور" : "فارغ / مجهز"}
                    </div>
                  </div>
                </div>
                <Badge variant={house.status === "active" ? "default" : "secondary"}>
                  {house.status === "active" ? "نشط" : "جاهز"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-muted/40 p-3 rounded-lg flex items-center justify-between text-xs">
                <span className="text-muted-foreground">السعة الاستيعابية:</span>
                <span className="font-bold text-foreground text-sm">
                  {house.capacity.toLocaleString("ar-EG")} طائر
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create House Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إضافة عنبر جديد</DialogTitle>
            <DialogDescription>
              حدد اسم العنبر وسعته الإجمالية للطيور
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="houseName">اسم العنبر *</Label>
              <Input
                id="houseName"
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                placeholder="مثال: عنبر 1 (بطاريات)"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">السعة الاستيعابية (طائر) *</Label>
              <Input
                id="capacity"
                type="number"
                min="100"
                max="500000"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createHouseMutation.isPending}>
                {createHouseMutation.isPending ? "جارٍ الحفظ…" : "إضافة العنبر"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
