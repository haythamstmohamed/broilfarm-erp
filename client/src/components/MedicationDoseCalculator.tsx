import { useState } from "react";
import { AlertTriangle, Calculator, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateMedicationDosePlan } from "../../../shared/medicationDoseCalculator";

type House = { id: number; name: string; assignedBirds: number };
const number = (value: number) => new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value);

export function MedicationDoseCalculator({ open, onOpenChange, houses }: { open: boolean; onOpenChange: (open: boolean) => void; houses: House[] }) {
  const [availableAmount, setAvailableAmount] = useState("");
  const [days, setDays] = useState("");
  const [unit, setUnit] = useState("مل");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calculateMedicationDosePlan>>();

  const reset = () => { setAvailableAmount(""); setDays(""); setUnit("مل"); setError(""); setResult(undefined); };
  const calculate = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setResult(calculateMedicationDosePlan({ availableAmount: Number(availableAmount), days: Number(days), houses }));
      setError("");
    } catch (cause) { setResult(undefined); setError(cause instanceof Error ? cause.message : "تعذر حساب الجرعة"); }
  };

  const totalBirds = houses.reduce((sum, house) => sum + Math.max(0, house.assignedBirds), 0);
  return <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}><DialogContent dir="rtl" className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2 text-right"><Calculator className="h-5 w-5 text-primary" />حاسبة الجرعة اليومية</DialogTitle><DialogDescription className="text-right">تقسم كمية الدواء المدخلة على عدد الأيام، ثم توزع الجرعة اليومية بنسبة أعداد الكتاكيت في كل عنبر.</DialogDescription></DialogHeader>{totalBirds > 0 ? <form className="mt-3 space-y-4" onSubmit={calculate}><div className="rounded-2xl border border-[#f0d3b7] bg-[#fff9ef] p-3 text-xs leading-6 text-[#78552f]"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>هذه أداة حسابية فقط. أدخل كمية الدواء الكلية المعتمدة من الطبيب البيطري ونشرة المنتج، ثم راجع الناتج قبل التنفيذ.</p></div></div><div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="dose-available">كمية الدواء الكلية</Label><Input id="dose-available" type="number" min="0.01" step="0.01" required value={availableAmount} onChange={(event) => setAvailableAmount(event.target.value)} className="mt-2 h-11 rounded-xl" placeholder="مثال: 450" /></div><div><Label htmlFor="dose-unit">وحدة القياس</Label><select id="dose-unit" value={unit} onChange={(event) => setUnit(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="مل">مل</option><option value="جم">جم</option><option value="كجم">كجم</option><option value="لتر">لتر</option></select></div><div><Label htmlFor="dose-days">عدد الأيام</Label><Input id="dose-days" type="number" min="1" step="1" required value={days} onChange={(event) => setDays(event.target.value)} className="mt-2 h-11 rounded-xl" placeholder="مثال: 5" /></div></div><p className="rounded-xl bg-[#f3f7ef] p-3 text-xs leading-6 text-[#4e6155]">سيُقسم إجمالي الكمية على الأيام أولاً، ثم يُوزع الناتج بنسبة الطيور على {new Intl.NumberFormat("ar-EG").format(houses.length)} عنابر بإجمالي {number(totalBirds)} كتكوت.</p>{error && <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}{result && <div className="space-y-3 rounded-2xl border border-[#cfe2c8] bg-[#f7fbf4] p-4"><div className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /><p className="font-extrabold">نتيجة الحساب</p></div><div className="grid grid-cols-2 gap-3"><Metric label="الكمية الكلية" value={`${number(result.totalDose)} ${unit}`} /><Metric label="الجرعة اليومية للقطيع" value={`${number(result.dailyDose)} ${unit}`} /><Metric label="إجمالي الكتاكيت" value={number(result.totalBirds)} /></div><div className="divide-y divide-[#dce9d5] rounded-xl border border-[#dce9d5] bg-white px-3">{result.allocations.map((house) => <div key={house.id} className="flex items-center justify-between gap-3 py-2 text-xs"><span className="font-bold">{house.name}<span className="mr-1 font-normal text-muted-foreground">({number(house.assignedBirds)} كتكوت · {number(house.share * 100)}٪)</span></span><span>{number(house.dailyDose)} {unit} يومياً · {number(house.courseDose)} {unit} طوال المدة</span></div>)}</div></div>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>إغلاق</Button><Button type="submit" className="rounded-xl bg-primary font-bold"><Calculator className="h-4 w-4" />احسب الجرعة</Button></div></form> : <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">لا توجد عنابر موزع عليها كتاكيت في الدورة الحالية.</p>}</DialogContent></Dialog>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-extrabold">{value}</p></div>; }
