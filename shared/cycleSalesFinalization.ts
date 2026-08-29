export type FinalizationSale = {
  id: number;
  status: "open" | "closed";
  isDeleted?: boolean;
  traderActive?: boolean;
  netWeightGrams: number;
  totalPiasters: number;
};

export function eligibleCycleSales<T extends { isDeleted?: boolean; traderActive?: boolean }>(sales: T[]) {
  return sales.filter((sale) => !sale.isDeleted && sale.traderActive !== false);
}

export function cycleSalesFinalizationReadiness(sales: FinalizationSale[]) {
  const activeSales = eligibleCycleSales(sales);
  const invalidOpenSales = activeSales.filter((sale) => sale.status === "open" && (sale.netWeightGrams <= 0 || sale.totalPiasters <= 0));
  return {
    activeSalesCount: activeSales.length,
    openSalesCount: activeSales.filter((sale) => sale.status === "open").length,
    closedSalesCount: activeSales.filter((sale) => sale.status === "closed").length,
    invalidOpenSaleIds: invalidOpenSales.map((sale) => sale.id),
    canFinalize: activeSales.length > 0 && invalidOpenSales.length === 0,
  };
}
