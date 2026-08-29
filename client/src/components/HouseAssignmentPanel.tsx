import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bird, Plus } from "lucide-react";

const formatNumber = (value: number) => new Intl.NumberFormat("ar-EG").format(value);

export function HouseAssignmentPanel({ houses, assignments, cycleName, cycleBirdsPlaced, onAssign }: { houses: { id: number; name: string; capacity: number }[]; assignments: { houseId: number; assignedBirds: number }[]; cycleName: string; cycleBirdsPlaced: number; onAssign: () => void }) {
  const assigned = assignments.reduce((sum, assignment) => sum + assignment.assignedBirds, 0);
  const remaining = Math.max(0, cycleBirdsPlaced - assigned);
  return <article className="soft-card overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5"><div><p className="font-extrabold">ربط الدورة بالعنابر</p><p className="mt-1 text-sm text-muted-foreground">وزّع طيور دورة {cycleName} على العنابر الموجودة أولاً، ثم تُربط كل القراءات والتوقعات بها.</p></div><Button className="rounded-xl bg-primary font-bold" onClick={onAssign}><Plus className="h-4 w-4" />توزيع طيور الدورة</Button></div><div className="grid gap-3 border-b border-border bg-[#f6f9f3] p-5 sm:grid-cols-3"><Summary label="طيور الدورة" value={`${formatNumber(cycleBirdsPlaced)} طائر`} /><Summary label="موزع على العنابر" value={`${formatNumber(assigned)} طائر`} /><Summary label="متبقٍ للتوزيع" value={`${formatNumber(remaining)} طائر`} /></div><div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">{houses.length ? houses.map((house) => { const assignedBirds = assignments.find((assignment) => assignment.houseId === house.id)?.assignedBirds ?? 0; return <div key={house.id} className="rounded-xl border border-[#e1ead7] bg-[#fafcf8] p-4"><div className="flex items-center justify-between"><p className="font-bold">{house.name}</p><Bird className="h-4 w-4 text-primary" /></div><p className="mt-3 text-sm font-bold">{formatNumber(assignedBirds)} / {formatNumber(house.capacity)} طائر</p><Progress value={house.capacity ? Math.min(100, (assignedBirds / house.capacity) * 100) : 0} className="mt-2 h-2 bg-[#e8eee3] [&>div]:bg-primary" /></div>; }) : <p className="col-span-full py-4 text-center text-sm text-muted-foreground">أضف عنبراً لهذه المزرعة قبل توزيع طيور الدورة.</p>}</div></article>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-sm font-extrabold">{value}</p></div>; }
