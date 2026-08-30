import React, { useMemo } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { TraderSalesConsole } from "@/components/TraderSalesConsole";
import { trpc } from "@/lib/trpc";

export default function SalesPage() {
  const { workspace, activeFarmId, activeFarm, activeCycleId, activeCycle, refetch } = useWorkspaceContext();

  const createTraderSaleMutation = trpc.workspace.createTraderWithSimpleSale.useMutation({
    onSuccess: () => refetch(),
  });
  const addTareMutation = trpc.workspace.addSaleTareBatch.useMutation({ onSuccess: () => refetch() });
  const addFilledMutation = trpc.workspace.addSaleWeighBatch.useMutation({ onSuccess: () => refetch() });
  const updateTareMutation = trpc.workspace.updateSaleTareBatch.useMutation({ onSuccess: () => refetch() });
  const updateFilledMutation = trpc.workspace.updateSaleWeighBatch.useMutation({ onSuccess: () => refetch() });
  const deleteBatchMutation = trpc.workspace.deleteSaleWeighBatch.useMutation({ onSuccess: () => refetch() });
  const updateTraderMutation = trpc.workspace.updateTrader.useMutation({ onSuccess: () => refetch() });
  const deleteTraderMutation = trpc.workspace.deleteTrader.useMutation({ onSuccess: () => refetch() });
  const addPaymentMutation = trpc.workspace.addSalePayment.useMutation({ onSuccess: () => refetch() });
  const updatePaymentMutation = trpc.workspace.updateSalePayment.useMutation({ onSuccess: () => refetch() });
  const deletePaymentMutation = trpc.workspace.deleteSalePayment.useMutation({ onSuccess: () => refetch() });
  const calculateSaleMutation = trpc.workspace.calculateSaleTotal.useMutation({ onSuccess: () => refetch() });
  const completeSaleMutation = trpc.workspace.completeSale.useMutation({ onSuccess: () => refetch() });
  const reopenSaleMutation = trpc.workspace.reopenSale.useMutation({ onSuccess: () => refetch() });
  const finalizeCycleMutation = trpc.workspace.finalizeCycleSalesAndClose.useMutation({ onSuccess: () => refetch() });

  const traders = useMemo(() => {
    return (workspace?.traders || []).filter((t) => t.farmId === activeFarmId);
  }, [workspace?.traders, activeFarmId]);

  const sales = useMemo(() => {
    return (workspace?.sales || []).filter((s) => s.farmId === activeFarmId);
  }, [workspace?.sales, activeFarmId]);

  const batches = useMemo(() => {
    return (workspace?.saleWeighBatches || []).map((b) => ({
      ...b,
      weighedAt: new Date(b.weighedAt),
    }));
  }, [workspace?.saleWeighBatches]);

  const payments = useMemo(() => {
    return (workspace?.salePayments || []).map((p) => ({
      ...p,
      paidAt: new Date(p.paidAt),
    }));
  }, [workspace?.salePayments]);

  const expenses = useMemo(() => {
    return (workspace?.expenses || []).filter((e) => e.farmId === activeFarmId);
  }, [workspace?.expenses, activeFarmId]);

  if (!activeFarmId || !activeFarm) {
    return <div className="p-8 text-center text-muted-foreground">يرجى اختيار مزرعة أولاً.</div>;
  }

  return (
    <TraderSalesConsole
      farmName={activeFarm.name}
      cycleName={activeCycle?.name || "دورة غير محددة"}
      cycleId={activeCycleId || undefined}
      cycleStatus={activeCycle?.status || "active"}
      traders={traders}
      sales={sales}
      batches={batches}
      payments={payments}
      expenses={expenses}
      onCreateTraderSale={async (input) => {
        if (!activeCycleId) throw new Error("يرجى اختيار دورة تسمين");
        const res = await createTraderSaleMutation.mutateAsync({
          farmId: activeFarmId,
          cycleId: activeCycleId,
          name: input.name,
          phone: input.phone,
          pricePerKgEgp: input.pricePerKgEgp,
          notes: input.notes,
          saleDate: new Date(),
        });
        return res as any;
      }}
      onAddTare={async (input) => {
        await addTareMutation.mutateAsync({
          saleId: input.saleId,
          cageCount: input.cageCount,
          tareWeightKg: input.tareWeightKg,
          weighedAt: new Date(input.weighedAt),
          notes: input.notes,
        });
      }}
      onAddFilled={async (input) => {
        await addFilledMutation.mutateAsync({
          saleId: input.saleId,
          cageCount: input.cageCount,
          grossWeightKg: input.grossWeightKg,
          weighedAt: new Date(input.weighedAt),
          notes: input.notes,
        });
      }}
      onUpdateTare={async (input) => {
        await updateTareMutation.mutateAsync({
          batchId: input.batchId,
          cageCount: input.cageCount,
          tareWeightKg: input.tareWeightKg,
          weighedAt: new Date(input.weighedAt),
          notes: input.notes,
        });
      }}
      onUpdateFilled={async (input) => {
        await updateFilledMutation.mutateAsync({
          batchId: input.batchId,
          cageCount: input.cageCount,
          grossWeightKg: input.grossWeightKg,
          tareWeightKg: input.tareWeightKg,
          weighedAt: new Date(input.weighedAt),
          notes: input.notes,
        });
      }}
      onDeleteBatch={async (batchId) => {
        await deleteBatchMutation.mutateAsync({ batchId });
      }}
      onUpdateTrader={async (input) => {
        await updateTraderMutation.mutateAsync({
          traderId: input.traderId,
          name: input.name,
          phone: input.phone,
          notes: input.notes,
        });
      }}
      onDeleteTrader={async (traderId) => {
        await deleteTraderMutation.mutateAsync({ traderId });
      }}
      onAddPayment={async (input) => {
        await addPaymentMutation.mutateAsync({
          saleId: input.saleId,
          amountEgp: input.amountEgp,
          paidAt: new Date(input.paidAt),
          paymentMethod: input.paymentMethod,
          notes: input.notes,
        });
      }}
      onUpdatePayment={async (input) => {
        await updatePaymentMutation.mutateAsync({
          paymentId: input.paymentId,
          amountEgp: input.amountEgp,
          paidAt: new Date(input.paidAt),
          paymentMethod: input.paymentMethod,
          notes: input.notes,
        });
      }}
      onDeletePayment={async (paymentId) => {
        await deletePaymentMutation.mutateAsync({ paymentId });
      }}
      onCalculateSale={async (saleId) => {
        await calculateSaleMutation.mutateAsync({ saleId });
      }}
      onCompleteSale={async (saleId) => {
        await completeSaleMutation.mutateAsync({ saleId });
      }}
      onReopenSale={async (saleId) => {
        await reopenSaleMutation.mutateAsync({ saleId });
      }}
      onFinalizeCycle={async (cycleId) => {
        return finalizeCycleMutation.mutateAsync({ cycleId });
      }}
    />
  );
}
