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
import { Building2, Plus, MapPin, Check, Calendar, Home as HouseIcon } from "lucide-react";
import { toast } from "sonner";

export default function FarmsPage() {
  const { workspace, isLoading, activeFarmId, setActiveFarmId, refetch } = useWorkspaceContext();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [locationStr, setLocationStr] = useState("");

  const createFarmMutation = trpc.workspace.createFarm.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المزرعة بنجاح");
      setIsCreateOpen(false);
      setFarmName("");
      setGovernorate("");
      setLocationStr("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء إنشاء المزرعة");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) {
      toast.error("يرجى إدخال اسم المزرعة");
      return;
    }
    createFarmMutation.mutate({
      name: farmName.trim(),
      governorate: governorate.trim() || undefined,
      location: locationStr.trim() || undefined,
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">جارٍ تحميل بيانات المزارع…</div>;
  }

  const farmsList = workspace?.farms || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المزارع</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة جميع مزارع المؤسسة ومواقعها الجغرافية وبياناتها
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          إضافة مزرعة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farmsList.map((farm) => {
          const isSelected = farm.id === activeFarmId;
          const farmHouses = (workspace?.houses || []).filter((h) => h.farmId === farm.id);
          const farmCycles = (workspace?.cycles || []).filter((c) => c.farmId === farm.id);
          const activeCycle = farmCycles.find((c) => c.status === "active");

          return (
            <Card
              key={farm.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]" : ""
              }`}
              onClick={() => setActiveFarmId(farm.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{farm.name}</CardTitle>
                      {farm.governorate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {farm.governorate}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="gap-1 text-[11px]">
                      <Check className="w-3 h-3" />
                      المزرعة النشطة
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-lg">
                  <div>
                    <span className="text-muted-foreground block">عدد العنابر:</span>
                    <span className="font-bold text-foreground">{farmHouses.length} عنابر</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">الدورة الحالية:</span>
                    <span className="font-bold text-foreground">
                      {activeCycle ? activeCycle.name : "لا توجد دورة نشطة"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Farm Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إضافة مزرعة جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات المزرعة الجديدة لتضمينها في مساحة العمل
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="farmName">اسم المزرعة *</Label>
              <Input
                id="farmName"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="مثال: مزرعة النور للتسمين"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="governorate">المحافظة</Label>
              <Input
                id="governorate"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                placeholder="مثال: الشرقية، البحيرة، المنوفية"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">العنوان أو الوصف التفصيلي</Label>
              <Input
                id="location"
                value={locationStr}
                onChange={(e) => setLocationStr(e.target.value)}
                placeholder="مثال: طريق بلبيس، الكيلو 15"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createFarmMutation.isPending}>
                {createFarmMutation.isPending ? "جارٍ الإنشاء…" : "إنشاء المزرعة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
