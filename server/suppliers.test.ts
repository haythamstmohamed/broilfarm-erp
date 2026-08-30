import { describe, expect, it } from "vitest";
import { evaluateSupplierBalance, supplierCategoryLabels } from "../shared/suppliers";

describe("Suppliers & Purchase Orders Engine", () => {
  it("correctly aggregates supplier orders, payments, and outstanding balances", () => {
    const orders = [
      {
        id: 1,
        farmId: 1,
        supplierId: 10,
        orderNumber: "PO-001",
        orderDate: new Date(),
        category: "feed_mill" as const,
        totalAmountEgp: 150000,
        paidAmountEgp: 100000,
        status: "delivered" as const,
      },
      {
        id: 2,
        farmId: 1,
        supplierId: 10,
        orderNumber: "PO-002",
        orderDate: new Date(),
        category: "feed_mill" as const,
        totalAmountEgp: 50000,
        paidAmountEgp: 50000,
        status: "delivered" as const,
      },
      {
        id: 3,
        farmId: 1,
        supplierId: 10,
        orderNumber: "PO-003",
        orderDate: new Date(),
        category: "feed_mill" as const,
        totalAmountEgp: 80000,
        paidAmountEgp: 0,
        status: "cancelled" as const, // Should be ignored
      },
    ];

    const result = evaluateSupplierBalance(orders);

    expect(result.totalOrderedEgp).toBe(200000);
    expect(result.totalPaidEgp).toBe(150000);
    expect(result.outstandingBalanceEgp).toBe(50000);
  });

  it("provides Arabic labels for all supplier categories", () => {
    expect(supplierCategoryLabels.feed_mill).toContain("أعلاف");
    expect(supplierCategoryLabels.hatchery).toContain("كتاكيت");
    expect(supplierCategoryLabels.veterinary).toContain("بيطرية");
  });
});
