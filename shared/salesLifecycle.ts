import { amountToPiasters } from "./expenseManagement";
import { SaleCalculationInput, saleSettlement } from "./salesSettlement";

export type SaleWriteMutation = SaleCalculationInput & {
  farmId: number;
  cycleId: number;
  traderId: number;
  saleDate: Date;
  initialPaidEgp?: number;
  reference?: string;
  notes?: string;
};

export type SaleScope = { farmId: number; cycleId: number; houseId: number | null };

export async function executeSaleCreate(input: {
  userId: number;
  mutation: SaleWriteMutation;
  cycle: SaleScope | undefined;
  trader: { id: number; farmId: number } | undefined;
  requireSalesAccess: (userId: number, scope: SaleScope) => Promise<void>;
  persistSale: (record: SaleWriteMutation & ReturnType<typeof saleSettlement>) => Promise<{ id: number }>;
  persistPayment: (saleId: number, amountPiasters: number, paidAt: Date, reference?: string) => Promise<void>;
}) {
  if (!input.cycle || input.cycle.farmId !== input.mutation.farmId || input.cycle.cycleId !== input.mutation.cycleId) throw new Error("لا تنتمي الدورة المحددة إلى هذه المزرعة");
  if (!input.trader || input.trader.id !== input.mutation.traderId || input.trader.farmId !== input.mutation.farmId) throw new Error("التاجر المحدد لا ينتمي إلى هذه المزرعة");
  await input.requireSalesAccess(input.userId, input.cycle);
  const calculated = saleSettlement(input.mutation);
  const initialPaidPiasters = input.mutation.initialPaidEgp ? amountToPiasters(input.mutation.initialPaidEgp) : 0;
  if (initialPaidPiasters > calculated.totalPiasters) throw new Error("المبلغ المدفوع لا يمكن أن يتجاوز إجمالي البيع");
  const sale = await input.persistSale({ ...input.mutation, ...calculated });
  if (initialPaidPiasters > 0) await input.persistPayment(sale.id, initialPaidPiasters, input.mutation.saleDate, input.mutation.reference);
  return { saleId: sale.id, initialPaidPiasters, ...calculated };
}

export async function executeSalePaymentCreate(input: {
  userId: number;
  sale: { id: number; farmId: number; cycleId: number; totalPiasters: number } | undefined;
  cycle: SaleScope | undefined;
  amountEgp: number;
  paidAt: Date;
  existingPaidPiasters: number;
  reference?: string;
  requireSalesAccess: (userId: number, scope: SaleScope) => Promise<void>;
  persist: (amountPiasters: number) => Promise<void>;
}) {
  if (!input.sale || !input.cycle || input.sale.farmId !== input.cycle.farmId || input.sale.cycleId !== input.cycle.cycleId) throw new Error("عملية البيع غير صالحة للتسوية");
  await input.requireSalesAccess(input.userId, input.cycle);
  const amountPiasters = amountToPiasters(input.amountEgp);
  if (input.existingPaidPiasters + amountPiasters > input.sale.totalPiasters) throw new Error("الدفعة تتجاوز المبلغ المتبقي على التاجر");
  await input.persist(amountPiasters);
  return amountPiasters;
}
