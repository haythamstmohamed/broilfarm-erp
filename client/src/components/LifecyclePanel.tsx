import { Button } from "@/components/ui/button";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Farm = { id: number; name: string; governorate: string | null; location: string | null };
type Cycle = { id: number; name: string; placementDate: Date; birdsPlaced: number };
type House = { id: number; name: string; capacity: number };
type Target = { kind: "farm" | "cycle" | "house"; id: number; name: string };

export function LifecyclePanel({ farms, houses, cycles, onEditFarm, onEditCycle, onEditHouse, onDelete }: { farms: Farm[]; houses: House[]; cycles: Cycle[]; onEditFarm: (farm: Farm) => void; onEditCycle: (cycle: Cycle) => void; onEditHouse: (house: House) => void; onDelete: (target: Target) => void }) {
  const [farmId, setFarmId] = useState<number | undefined>();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [houseId, setHouseId] = useState<number | undefined>();
  useEffect(() => { setFarmId(farms[0]?.id); setCycleId(cycles[0]?.id); setHouseId(houses[0]?.id); }, [farms, cycles, houses]);
  const selectedFarm = farms.find((farm) => farm.id === farmId);
  const selectedCycle = cycles.find((cycle) => cycle.id === cycleId);
  const selectedHouse = houses.find((house) => house.id === houseId);
  return <section className="soft-card overflow-hidden"><div className="flex items-start gap-4 border-b border-border p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7ece8] text-[#ae5d45]"><Pencil className="h-5 w-5" /></span><div><p className="font-extrabold">تعديل وحذف بيانات المزرعة</p><p className="mt-1 text-sm text-muted-foreground">الحذف محمي: لن يُسمح بحذف سجل مرتبط بعنابر أو أقفاص أو سجلات تشغيل.</p></div></div><div className="grid gap-5 p-6 lg:grid-cols-3"><RecordControls label="المزرعة" icon={<Building2 className="h-4 w-4" />} value={farmId} onChange={setFarmId} options={farms.map((farm) => ({ id: farm.id, label: farm.name }))} disabled={!selectedFarm} onEdit={() => selectedFarm && onEditFarm(selectedFarm)} onDelete={() => selectedFarm && onDelete({ kind: "farm", id: selectedFarm.id, name: selectedFarm.name })} /><RecordControls label="دورة التسمين" value={cycleId} onChange={setCycleId} options={cycles.map((cycle) => ({ id: cycle.id, label: cycle.name }))} disabled={!selectedCycle} onEdit={() => selectedCycle && onEditCycle(selectedCycle)} onDelete={() => selectedCycle && onDelete({ kind: "cycle", id: selectedCycle.id, name: selectedCycle.name })} /><RecordControls label="العنبر" value={houseId} onChange={setHouseId} options={houses.map((house) => ({ id: house.id, label: house.name }))} disabled={!selectedHouse} onEdit={() => selectedHouse && onEditHouse(selectedHouse)} onDelete={() => selectedHouse && onDelete({ kind: "house", id: selectedHouse.id, name: selectedHouse.name })} /></div></section>;
}

function RecordControls({ label, icon, value, onChange, options, disabled, onEdit, onDelete }: { label: string; icon?: React.ReactNode; value?: number; onChange: (id: number) => void; options: { id: number; label: string }[]; disabled: boolean; onEdit: () => void; onDelete: () => void }) {
  return <div className="rounded-2xl border border-[#e1ead7] bg-[#fafcf8] p-4"><div className="flex items-center gap-2 text-sm font-extrabold">{icon}{label}</div><select value={value ?? ""} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" disabled={!options.length}><option value="">لا توجد سجلات</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select><div className="mt-3 flex gap-2"><Button variant="outline" className="flex-1 rounded-xl bg-card text-xs font-bold" onClick={onEdit} disabled={disabled}><Pencil className="h-3.5 w-3.5" />تعديل</Button><Button variant="outline" className="flex-1 rounded-xl border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 hover:text-red-700" onClick={onDelete} disabled={disabled}><Trash2 className="h-3.5 w-3.5" />حذف</Button></div></div>;
}
