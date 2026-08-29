export const expenseCategories = ["chicks", "feed", "health", "labor", "utilities", "maintenance", "transport", "equipment", "other"] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  chicks: "كتاكيت",
  feed: "علف",
  health: "صحة وتحصينات",
  labor: "عمالة",
  utilities: "مرافق وطاقة",
  maintenance: "صيانة",
  transport: "نقل وشحن",
  equipment: "معدات وتجهيزات",
  other: "مصروفات أخرى",
};

export type ExpenseSummaryItem = { category: ExpenseCategory; amountPiasters: number };

export function expenseSummary(items: ExpenseSummaryItem[]) {
  const totalPiasters = items.reduce((sum, item) => sum + item.amountPiasters, 0);
  const byCategory = expenseCategories.map((category) => {
    const amountPiasters = items.filter((item) => item.category === category).reduce((sum, item) => sum + item.amountPiasters, 0);
    return { category, amountPiasters, sharePercent: totalPiasters ? (amountPiasters / totalPiasters) * 100 : 0 };
  }).filter((item) => item.amountPiasters > 0);
  return { totalPiasters, byCategory };
}

export function amountToPiasters(amountEgp: number) {
  if (!Number.isFinite(amountEgp) || amountEgp <= 0) throw new Error("يجب إدخال قيمة مصروف أكبر من صفر");
  const piasters = Math.round(amountEgp * 100);
  if (!Number.isSafeInteger(piasters) || piasters > 1_000_000_000) throw new Error("قيمة المصروف غير صالحة");
  return piasters;
}

export function expenseCycleBelongsToFarm(farmId: number, cycleFarmId: number | null | undefined) {
  return cycleFarmId !== null && cycleFarmId !== undefined && farmId === cycleFarmId;
}
