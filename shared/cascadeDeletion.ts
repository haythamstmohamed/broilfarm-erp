export type CascadeDeletionKind = "farm" | "cycle" | "house";

export type CascadeDeletionCounts = {
  farms: number;
  cycles: number;
  houses: number;
  cageRows: number;
  cageOccupancy: number;
  houseAssignments: number;
  dailyRecords: number;
  healthEvents: number;
  weightSamples: number;
  feedSettings: number;
  feedTransactions: number;
  expenses: number;
  weatherDays: number;
  workers: number;
  workerAccountEntries: number;
  traders: number;
  sales: number;
  weightBatches: number;
  payments: number;
  saleActivities: number;
  memberships: number;
  invitations: number;
};

export type CascadeDeletionImpact = {
  kind: CascadeDeletionKind;
  name: string;
  items: Array<{ key: keyof CascadeDeletionCounts; label: string; count: number }>;
  totalRelatedRecords: number;
};

const deletionLabels: Record<keyof CascadeDeletionCounts, string> = {
  farms: "مزرعة",
  cycles: "دورة",
  houses: "عنبر",
  cageRows: "صف أقفاص",
  cageOccupancy: "سجل إشغال بطاريات",
  houseAssignments: "توزيع عنبر بالدورة",
  dailyRecords: "سجل تشغيلي يومي",
  healthEvents: "سجل صحة أو تحصين",
  weightSamples: "عينة وزن",
  feedSettings: "إعداد مخزون علف",
  feedTransactions: "حركة مخزون علف",
  expenses: "مصروف",
  weatherDays: "سجل طقس",
  workers: "حساب عامل",
  workerAccountEntries: "حركة حساب عامل",
  traders: "تاجر",
  sales: "عملية بيع",
  weightBatches: "دفعة وزن",
  payments: "حركة رصيد",
  saleActivities: "نشاط بيع",
  memberships: "عضوية فريق",
  invitations: "دعوة وصول",
};

export function buildCascadeDeletionImpact(kind: CascadeDeletionKind, name: string, counts: CascadeDeletionCounts): CascadeDeletionImpact {
  const items = (Object.keys(deletionLabels) as Array<keyof CascadeDeletionCounts>)
    .map((key) => ({ key, label: deletionLabels[key], count: counts[key] }))
    .filter((item) => item.count > 0);
  return { kind, name, items, totalRelatedRecords: items.reduce((sum, item) => sum + item.count, 0) };
}
