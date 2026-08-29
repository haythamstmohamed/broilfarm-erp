import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Boxes, ClipboardList, PackageCheck, Settings2, Truck, Warehouse, Wheat } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FeedStockStatus } from "../../../shared/feedInventory";

export type FeedInventorySettingsData = { bagWeightKg: number; reorderPointBags: number };
export type FeedInventoryTransactionData = {
  id: number;
  movementType: "opening" | "receipt" | "issue" | "adjustment";
  bagDelta: number;
  occurredAt: Date;
  reference: string | null;
  notes: string | null;
};
export type FeedInventorySnapshotData = {
  availableBags: number;
  availableKg: number;
  dailyDemandBags: number;
  daysOfCover: number | null;
  recommendedOrderBags: number;
  status: FeedStockStatus;
};

const number = (value: number, digits = 0) => new Intl.NumberFormat("ar-EG", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const date = (value: Date | string) => new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const errorText = (error: unknown, fallback: string) => error instanceof Error && error.message ? error.message : fallback;

const stockStatus: Record<FeedStockStatus, { label: string; headline: string; tone: string }> = {
  setup: { label: "يلزم إدخال الرصيد", headline: "ابدأ بتسجيل الرصيد الفعلي في المخزن", tone: "border-[#e7c998] bg-[#fff6e8] text-[#89551e]" },
  healthy: { label: "مخزون مطمئن", headline: "الرصيد يغطي الاستهلاك المتوقع بأمان", tone: "border-[#cbe5cf] bg-[#eff8ef] text-[#2e7043]" },
  reorder: { label: "اطلب علفاً قريباً", headline: "اقترب الرصيد من نافذة إعادة الطلب", tone: "border-[#ecd9a4] bg-[#fff9e8] text-[#8b681f]" },
  critical: { label: "تنبيه عاجل للمخزون", headline: "اطلب العلف قبل أن يتأثر التشغيل", tone: "border-[#f0c4b9] bg-[#fff1ed] text-[#a84227]" },
};

export function FeedStockAlert({ snapshot, settings, onOpen }: { snapshot: FeedInventorySnapshotData; settings: FeedInventorySettingsData; onOpen: () => void }) {
  const status = stockStatus[snapshot.status];
  return (
    <article className={`overflow-hidden rounded-3xl border shadow-[0_12px_34px_-26px_rgba(36,81,60,0.35)] ${status.tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm"><Warehouse className="h-5 w-5" /></span><div><p className="font-extrabold">مخزون العلف والتنبيه المبكر</p><p className="mt-1 text-xs opacity-80">يتابع الرصيد بالشكاير مقابل الاستهلاك المتوقع في يوم الدورة المختار.</p></div></div>
        <Badge variant="outline" className="border-current bg-white/60 px-3 py-1.5 font-bold">{status.label}</Badge>
      </div>
      <div className="grid gap-3 border-y border-current/10 bg-white/45 p-5 sm:grid-cols-3">
        <StockMetric label="الرصيد الحالي" value={`${number(snapshot.availableBags, 1)} شيكارة`} caption={`${number(snapshot.availableKg, 1)} كجم`} />
        <StockMetric label="غطاء الاستهلاك" value={snapshot.daysOfCover === null ? "—" : `${number(snapshot.daysOfCover, 1)} يوم`} caption={snapshot.dailyDemandBags > 0 ? `${number(snapshot.dailyDemandBags, 2)} شيكارة/يوم` : "يتطلب توزيع الطيور"} />
        <StockMetric label="حد إعادة الطلب" value={`${number(settings.reorderPointBags)} شيكارة`} caption={snapshot.recommendedOrderBags ? `اطلب نحو ${number(snapshot.recommendedOrderBags)} شيكارة` : "لا توجد كمية مقترحة الآن"} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><p className="text-sm font-bold">{status.headline}</p><Button onClick={onOpen} className="rounded-xl bg-current text-white hover:opacity-90"><Boxes className="h-4 w-4" />إدارة المخزون</Button></div>
    </article>
  );
}

export function FeedInventoryWorkspace({ farmName, settings, transactions, snapshot, onSaveSettings, onAddMovement }: {
  farmName: string;
  settings: FeedInventorySettingsData;
  transactions: FeedInventoryTransactionData[];
  snapshot: FeedInventorySnapshotData;
  onSaveSettings: (input: FeedInventorySettingsData) => Promise<unknown>;
  onAddMovement: (input: { movementType: "opening" | "receipt" | "issue" | "adjustment"; bagDelta: number; occurredAt: string; reference?: string; notes?: string }) => Promise<unknown>;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const status = stockStatus[snapshot.status];
  const totalReceipts = useMemo(() => transactions.filter((transaction) => transaction.movementType === "receipt").reduce((sum, transaction) => sum + Math.max(transaction.bagDelta, 0), 0), [transactions]);

  return (
    <section className="space-y-5">
      <article className="overflow-hidden rounded-3xl border border-[#dbe8d5] bg-[linear-gradient(135deg,#f1f8ee_0%,#ffffff_56%,#fffaf0_100%)] shadow-[0_16px_36px_-28px_rgba(34,91,59,0.4)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dce8d7] p-5 sm:p-7">
          <div className="flex gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2c6a45] text-white shadow-lg shadow-[#2c6a45]/20"><Warehouse className="h-6 w-6" /></span><div><p className="text-xs font-bold text-primary">{farmName}</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#254c37]">مخزون العلف</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">سجل الرصيد الافتتاحي والتوريدات والصرف الفعلي. ستظهر تنبيهات إعادة الطلب وفق رصيد المخزن واستهلاك الدورة المتوقع.</p></div></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-xl bg-white font-bold" onClick={() => setSettingsOpen(true)}><Settings2 className="h-4 w-4" />إعدادات المخزون</Button><Button className="rounded-xl bg-primary font-bold" onClick={() => setMovementOpen(true)}><ArrowUpRight className="h-4 w-4" />تسجيل حركة</Button></div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <InventoryMetric icon={Boxes} label="الرصيد المتاح" value={`${number(snapshot.availableBags, 1)} شيكارة`} caption={`${number(snapshot.availableKg, 1)} كجم`} tone="bg-[#ebf5e7] text-[#347448]" />
          <InventoryMetric icon={Truck} label="إجمالي التوريدات" value={`${number(totalReceipts, 1)} شيكارة`} caption="توريدات مسجلة فعلياً" tone="bg-[#edf1fa] text-[#4e659b]" />
          <InventoryMetric icon={Wheat} label="استهلاك اليوم المتوقع" value={snapshot.dailyDemandBags > 0 ? `${number(snapshot.dailyDemandBags, 2)} شيكارة` : "—"} caption="حسب العمر وتوزيع الطيور" tone="bg-[#fff7df] text-[#936c20]" />
          <InventoryMetric icon={ClipboardList} label="أيام التغطية" value={snapshot.daysOfCover === null ? "—" : `${number(snapshot.daysOfCover, 1)} يوم`} caption="بالرصيد الحالي" tone="bg-[#ecf2f4] text-[#3e6f79]" />
          <InventoryMetric icon={AlertTriangle} label="حالة التوريد" value={status.label} caption={snapshot.recommendedOrderBags ? `اقتراح: ${number(snapshot.recommendedOrderBags)} شيكارة` : "لا اقتراح حالياً"} tone={snapshot.status === "critical" ? "bg-[#fff0eb] text-[#ac4d31]" : "bg-[#f4f0fa] text-[#68569e]"} />
        </div>
      </article>
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="soft-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5"><div><p className="font-extrabold">سجل حركة المخزون</p><p className="mt-1 text-xs text-muted-foreground">آخر توريد أو صرف أو تسوية مسجلة فعلياً.</p></div><span className="rounded-lg bg-[#eef6ea] px-2.5 py-1 text-xs font-bold text-primary">{number(transactions.length)} حركة</span></div>
          {transactions.length ? <div className="divide-y divide-border/70">{transactions.slice(0, 10).map((transaction) => <TransactionRow transaction={transaction} key={transaction.id} />)}</div> : <EmptyStock onClick={() => setMovementOpen(true)} />}
        </article>
        <article className={`rounded-3xl border p-5 ${status.tone}`}><div className="flex h-full flex-col"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/75"><PackageCheck className="h-5 w-5" /></span><div><p className="font-extrabold">قرار الشراء</p><p className="mt-1 text-xs opacity-80">متزامن مع يوم الدورة المختار.</p></div></div><h3 className="mt-6 text-lg font-extrabold">{status.headline}</h3><p className="mt-2 text-sm leading-7 opacity-90">حد إعادة الطلب مضبوط على {number(settings.reorderPointBags)} شيكارة، ووزن الشيكارة {number(settings.bagWeightKg)} كجم.</p><div className="mt-6 rounded-2xl bg-white/70 p-4"><p className="text-xs font-bold opacity-70">الكمية المقترحة لسبعة أيام + حد الأمان</p><p className="mt-2 text-3xl font-extrabold">{number(snapshot.recommendedOrderBags)} شيكارة</p></div><p className="mt-auto pt-5 text-xs leading-6 opacity-75">هذه أداة تخطيط للمخزون. راجع زمن التوريد الفعلي وقدرة التخزين وجودة العلف قبل اعتماد أمر الشراء.</p></div></article>
      </section>
      <InventorySettingsDialog open={settingsOpen} settings={settings} onOpenChange={setSettingsOpen} onSave={onSaveSettings} />
      <InventoryMovementDialog open={movementOpen} onOpenChange={setMovementOpen} onSave={onAddMovement} />
    </section>
  );
}

function StockMetric({ label, value, caption }: { label: string; value: string; caption: string }) { return <div className="rounded-2xl bg-white/70 p-4"><p className="text-xs font-bold opacity-70">{label}</p><p className="mt-2 text-xl font-extrabold">{value}</p><p className="mt-1 text-xs opacity-70">{caption}</p></div>; }
function InventoryMetric({ icon: Icon, label, value, caption, tone }: { icon: typeof Boxes; label: string; value: string; caption: string; tone: string }) { return <div className="rounded-2xl border border-[#e4ece0] bg-white p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span><p className="mt-4 text-lg font-extrabold">{value}</p><p className="mt-1 text-xs font-bold text-foreground">{label}</p><p className="mt-1 text-xs text-muted-foreground">{caption}</p></div>; }
function EmptyStock({ onClick }: { onClick: () => void }) { return <div className="p-10 text-center"><Warehouse className="mx-auto h-7 w-7 text-[#8ca985]" /><p className="mt-3 font-bold">لم يُسجّل رصيد علف بعد</p><p className="mt-1 text-sm leading-6 text-muted-foreground">سجّل الرصيد الافتتاحي الفعلي للمخزن لتبدأ التنبيهات وحساب التغطية.</p><Button className="mt-5 rounded-xl" onClick={onClick}>تسجيل الرصيد الفعلي</Button></div>; }
function movementLabel(type: FeedInventoryTransactionData["movementType"]) { return ({ opening: "رصيد افتتاحي", receipt: "توريد علف", issue: "صرف علف", adjustment: "تسوية مخزون" } as const)[type]; }
function TransactionRow({ transaction }: { transaction: FeedInventoryTransactionData }) { const received = transaction.bagDelta > 0; return <div className="flex items-center gap-3 p-4"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${received ? "bg-[#edf6e9] text-[#3c804d]" : "bg-[#fff0eb] text-[#bc573a]"}`}>{received ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="font-bold">{movementLabel(transaction.movementType)}{transaction.reference ? ` · ${transaction.reference}` : ""}</p><p className="mt-1 truncate text-xs text-muted-foreground">{date(transaction.occurredAt)}{transaction.notes ? ` · ${transaction.notes}` : ""}</p></div><p className={`text-sm font-extrabold ${received ? "text-[#2d7544]" : "text-[#b74a32]"}`}>{received ? "+" : ""}{number(transaction.bagDelta, 2)} شيكارة</p></div>; }

function InventorySettingsDialog({ open, settings, onOpenChange, onSave }: { open: boolean; settings: FeedInventorySettingsData; onOpenChange: (open: boolean) => void; onSave: (input: FeedInventorySettingsData) => Promise<unknown> }) {
  const [bagWeight, setBagWeight] = useState(String(settings.bagWeightKg));
  const [reorderPoint, setReorderPoint] = useState(String(settings.reorderPointBags));
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setBagWeight(String(settings.bagWeightKg)); setReorderPoint(String(settings.reorderPointBags)); } }, [open, settings]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await onSave({ bagWeightKg: Number(bagWeight), reorderPointBags: Number(reorderPoint) }); toast.success("تم حفظ إعدادات المخزون"); onOpenChange(false); } catch (error) { toast.error("تعذر حفظ إعدادات المخزون", { description: errorText(error, "راجع القيم وصلاحيات الوصول ثم أعد المحاولة.") }); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent dir="rtl" className="sm:max-w-md"><DialogHeader><DialogTitle className="text-right">إعدادات مخزون العلف</DialogTitle><DialogDescription className="text-right">يُستخدم وزن الشيكارة لتحويل الرصيد إلى كيلوجرامات وربط التغطية بالاستهلاك المتوقع.</DialogDescription></DialogHeader><form className="mt-3 space-y-4" onSubmit={submit}><div><Label htmlFor="inventory-bag-weight">وزن الشيكارة (كجم)</Label><Input id="inventory-bag-weight" type="number" min="1" max="200" required value={bagWeight} onChange={(event) => setBagWeight(event.target.value)} className="mt-2 h-11 rounded-xl text-right" /></div><div><Label htmlFor="inventory-reorder-point">حد إعادة الطلب (شيكارة)</Label><Input id="inventory-reorder-point" type="number" min="0" required value={reorderPoint} onChange={(event) => setReorderPoint(event.target.value)} className="mt-2 h-11 rounded-xl text-right" /></div><div className="rounded-xl border border-[#eed9a7] bg-[#fff9ea] p-3 text-xs leading-6 text-[#7c642a]">اختر حداً يغطي زمن التوريد الفعلي للمورد مع هامش أمان تشغيلي.</div><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>إلغاء</Button><Button disabled={saving} type="submit" className="rounded-xl bg-primary font-bold">حفظ الإعدادات</Button></div></form></DialogContent></Dialog>;
}

function InventoryMovementDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (input: { movementType: "opening" | "receipt" | "issue" | "adjustment"; bagDelta: number; occurredAt: string; reference?: string; notes?: string }) => Promise<unknown> }) {
  const [movementType, setMovementType] = useState<"opening" | "receipt" | "issue" | "adjustment">("opening");
  const [bags, setBags] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setBags(""); setReference(""); setNotes(""); setOccurredAt(new Date().toISOString().slice(0, 10)); setMovementType("opening"); } }, [open]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const enteredBags = Number(bags); const bagDelta = movementType === "issue" ? -Math.abs(enteredBags) : movementType === "adjustment" ? enteredBags : Math.abs(enteredBags); setSaving(true); try { await onSave({ movementType, bagDelta, occurredAt, reference: reference || undefined, notes: notes || undefined }); toast.success("تم تسجيل حركة المخزون"); onOpenChange(false); } catch (error) { toast.error("تعذر تسجيل حركة المخزون", { description: errorText(error, "تأكد من الرصيد المتاح وصلاحيات الوصول ثم أعد المحاولة.") }); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent dir="rtl" className="sm:max-w-md"><DialogHeader><DialogTitle className="text-right">تسجيل حركة مخزون العلف</DialogTitle><DialogDescription className="text-right">أدخل حركة فعلية فقط. لا يسمح النظام بصرف كمية تتجاوز الرصيد المتاح. يمكن تسجيل كسور الشيكارة بدقة.</DialogDescription></DialogHeader><form className="mt-3 space-y-4" onSubmit={submit}><div><Label htmlFor="inventory-movement-type">نوع الحركة</Label><select id="inventory-movement-type" value={movementType} onChange={(event) => setMovementType(event.target.value as typeof movementType)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold"><option value="opening">رصيد افتتاحي</option><option value="receipt">توريد علف</option><option value="issue">صرف علف</option><option value="adjustment">تسوية مخزون</option></select></div><div><Label htmlFor="inventory-bags">عدد الشكاير {movementType === "adjustment" ? "(+ أو -)" : ""}</Label><Input id="inventory-bags" type="number" step="0.0001" required value={bags} onChange={(event) => setBags(event.target.value)} placeholder={movementType === "adjustment" ? "مثال: -2 أو 2" : "0"} className="mt-2 h-11 rounded-xl text-right" /></div><div><Label htmlFor="inventory-date">تاريخ الحركة</Label><Input id="inventory-date" type="date" required value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} className="mt-2 h-11 rounded-xl text-right" /></div><div><Label htmlFor="inventory-reference">مرجع التوريد أو الإيصال (اختياري)</Label><Input id="inventory-reference" value={reference} onChange={(event) => setReference(event.target.value)} className="mt-2 h-11 rounded-xl text-right" /></div><div><Label htmlFor="inventory-notes">ملاحظات (اختياري)</Label><Textarea id="inventory-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-20 rounded-xl text-right" /></div><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>إلغاء</Button><Button disabled={saving} type="submit" className="rounded-xl bg-primary font-bold">حفظ الحركة</Button></div></form></DialogContent></Dialog>;
}
