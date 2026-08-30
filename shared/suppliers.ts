/**
 * Suppliers & Purchase Order Management Engine
 * إدارة الموردين وأوامر الشراء والتوريدات
 * BroilFarm Enterprise ERP
 */

export const supplierCategories = [
  "feed_mill",
  "hatchery",
  "veterinary",
  "energy_gas",
  "equipment",
  "general",
] as const;

export type SupplierCategory = (typeof supplierCategories)[number];

export const supplierCategoryLabels: Record<SupplierCategory, string> = {
  feed_mill: "مصنع / مورد أعلاف",
  hatchery: "معمل تفريخ / مورد كتاكيت",
  veterinary: "شركة / صيدلية بيطرية",
  energy_gas: "مورد غاز وطاقة",
  equipment: "تجهيزات ومعدات عنابر",
  general: "مورد عام / خدمات",
};

export interface SupplierItem {
  id: number;
  farmId: number;
  name: string;
  category: SupplierCategory;
  phone?: string | null;
  companyName?: string | null;
  taxId?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  totalSuppliedEgp?: number;
  balanceDueEgp?: number;
}

export interface PurchaseOrder {
  id: number;
  farmId: number;
  supplierId: number;
  orderNumber: string;
  orderDate: Date | string;
  expectedDeliveryDate?: Date | string | null;
  category: SupplierCategory;
  totalAmountEgp: number;
  paidAmountEgp: number;
  status: "draft" | "ordered" | "delivered" | "cancelled";
  notes?: string | null;
}

export function evaluateSupplierBalance(orders: PurchaseOrder[]): {
  totalOrderedEgp: number;
  totalPaidEgp: number;
  outstandingBalanceEgp: number;
} {
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const totalOrderedEgp = activeOrders.reduce((sum, o) => sum + o.totalAmountEgp, 0);
  const totalPaidEgp = activeOrders.reduce((sum, o) => sum + o.paidAmountEgp, 0);
  const outstandingBalanceEgp = Math.max(0, totalOrderedEgp - totalPaidEgp);

  return {
    totalOrderedEgp: Number(totalOrderedEgp.toFixed(2)),
    totalPaidEgp: Number(totalPaidEgp.toFixed(2)),
    outstandingBalanceEgp: Number(outstandingBalanceEgp.toFixed(2)),
  };
}
