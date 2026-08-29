import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Calendar, Plus, ShieldCheck, Trash2, Pill } from "lucide-react";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  vaccine: "لقاح / تحصين",
  antibiotic: "مضاد حيوي",
  vitamin: "فيتامينات وأملاح",
  disinfectant: "مطهرات وأمن حيوي",
  supplement: "مكملات ومنشطات كبد/كلى",
  other: "أخرى",
};

export function MedicineInventoryPanel({ farmId }: { farmId: number }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<"vaccine" | "antibiotic" | "vitamin" | "disinfectant" | "supplement" | "other">("vaccine");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("عبوة");
  const [unitCostEgp, setUnitCostEgp] = useState("150");
  const [reorderPoint, setReorderPoint] = useState("3");

  const { data: items, isLoading, refetch } = trpc.medicineInventory.list.useQuery({ farmId }, { enabled: !!farmId });

  const addMutation = trpc.medicineInventory.add.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الصنف الدوائي للمخزون بنجاح");
      setIsAddOpen(false);
      setProductName("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء الإضافة");
    },
  });

  const deleteMutation = trpc.medicineInventory.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الصنف من المخزون");
      refetch();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast.error("يرجى إدخال اسم الصنف / اللقاح");
      return;
    }
    addMutation.mutate({
      farmId,
      productName: productName.trim(),
      category,
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      quantity: Number(quantity) || 0,
      unit: unit.trim() || "عبوة",
      unitCostEgp: Number(unitCostEgp) || 0,
      reorderPoint: Number(reorderPoint) || 5,
    });
  };

  if (!farmId) return null;

  return (
    <Card className="mt-6" dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold">مخزن الأدوية واللقاحات (Medicine & Vaccine Catalog)</CardTitle>
          </div>
          <CardDescription>
            متابعة أرصدة اللقاحات والمضادات الحيوية مع تشغيل تتبع أرقام التشغيلات (Lot/Batch) وتواريخ الصلاحية.
          </CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة صنف دوائي جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تسجيل صنف / لقاح جديد بالمخزن</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الدواء أو اللقاح والتشغيلة لمتابعة الصلاحية ورصيد الأمان.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">اسم الصنف أو اللقاح *</label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="مثال: لقاح نيوكاسل كولون، فلورفينيكول 20%"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">التصنيف</label>
                  <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">رقم التشغيلة (Batch/Lot)</label>
                  <Input
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="LOT-2026-B1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">الكمية</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">الوحدة</label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="عبوة / لتر / قرص"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">سعر الوحدة (ج.م)</label>
                  <Input
                    type="number"
                    value={unitCostEgp}
                    onChange={(e) => setUnitCostEgp(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">تاريخ انتهاء الصلاحية</label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">حد إعادة الطلب (أمان)</label>
                  <Input
                    type="number"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "جاري الحفظ..." : "حفظ الصنف"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">جاري التحميل...</p>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            لا توجد أصناف دوائية أو لقاحات مسجلة بالمخزن حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs border-y">
                <tr>
                  <th className="py-2.5 px-3">اسم الصنف</th>
                  <th className="py-2.5 px-3">التصنيف</th>
                  <th className="py-2.5 px-3">رقم التشغيلة</th>
                  <th className="py-2.5 px-3">الرصيد المتوفر</th>
                  <th className="py-2.5 px-3">تاريخ الصلاحية</th>
                  <th className="py-2.5 px-3">تكلفة الوحدة</th>
                  <th className="py-2.5 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-semibold text-foreground">{item.productName}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[item.category] || item.category}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      {item.batchNumber || "—"}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      {Number(item.quantity).toLocaleString("ar-EG")} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-xs">
                      {item.expiryDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {new Date(item.expiryDate).toLocaleDateString("ar-EG")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs">
                      {(item.unitCostPiasters / 100).toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate({ itemId: item.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MedicineInventoryPanel;
