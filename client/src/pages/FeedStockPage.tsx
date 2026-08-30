import React, { useMemo } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { FeedInventoryWorkspace } from "@/components/FeedInventory";
import { trpc } from "@/lib/trpc";
import { feedInventorySnapshot } from "../../../shared/feedInventory";

export default function FeedStockPage() {
  const { workspace, activeFarmId, activeFarm, activeCycle, refetch } = useWorkspaceContext();

  const updateSettingsMutation = trpc.workspace.updateFeedInventorySettings.useMutation({
    onSuccess: () => refetch(),
  });

  const addMovementMutation = trpc.workspace.addFeedInventoryTransaction.useMutation({
    onSuccess: () => refetch(),
  });

  const farmSettings = useMemo(() => {
    const raw = (workspace?.feedInventorySettings || []).find((s) => s.farmId === activeFarmId);
    return {
      bagWeightKg: raw?.bagWeightKg || 50,
      reorderPointBags: raw?.reorderPointBags || 0,
    };
  }, [workspace?.feedInventorySettings, activeFarmId]);

  const farmTransactions = useMemo(() => {
    return (workspace?.feedInventoryTransactions || [])
      .filter((t) => t.farmId === activeFarmId)
      .map((t) => ({
        id: t.id,
        movementType: t.movementType as "opening" | "receipt" | "issue" | "adjustment",
        bagDelta: Number(t.bagDelta),
        occurredAt: new Date(t.occurredAt),
        reference: t.reference,
        notes: t.notes,
      }));
  }, [workspace?.feedInventoryTransactions, activeFarmId]);

  const snapshot = useMemo(() => {
    const age = Math.max(1, activeCycle ? Math.ceil((new Date().getTime() - new Date(activeCycle.placementDate).getTime()) / (1000 * 60 * 60 * 24)) : 21);
    // Standard daily intake per bird at current age (e.g. ~140g)
    const dailyFeedGramsPerBird = Math.min(220, Math.max(20, 20 + age * 4.2));
    const liveCount = (activeCycle?.birdsPlaced || 10000);
    const dailyDemandKg = (liveCount * dailyFeedGramsPerBird) / 1000;
    const bagWeight = farmSettings.bagWeightKg || 50;
    const dailyDemandBags = bagWeight > 0 ? Number((dailyDemandKg / bagWeight).toFixed(2)) : 0;

    const availableBags = farmTransactions.reduce((total, transaction) => total + transaction.bagDelta, 0);
    return feedInventorySnapshot({
      availableBags,
      reorderPointBags: farmSettings.reorderPointBags,
      bagWeightKg: bagWeight,
      forecastFeedKg: dailyDemandKg,
      hasTrackedStock: farmTransactions.length > 0,
    });
  }, [farmSettings, farmTransactions, activeCycle]);

  if (!activeFarmId || !activeFarm) {
    return <div className="p-8 text-center text-muted-foreground">يرجى اختيار مزرعة أولاً.</div>;
  }

  return (
    <FeedInventoryWorkspace
      farmName={activeFarm.name}
      settings={farmSettings}
      transactions={farmTransactions}
      snapshot={snapshot}
      onSaveSettings={async (input) => {
        await updateSettingsMutation.mutateAsync({
          farmId: activeFarmId,
          bagWeightKg: input.bagWeightKg,
          reorderPointBags: input.reorderPointBags,
        });
      }}
      onAddMovement={async (input) => {
        await addMovementMutation.mutateAsync({
          farmId: activeFarmId,
          movementType: input.movementType,
          bagDelta: input.bagDelta,
          occurredAt: new Date(input.occurredAt),
          reference: input.reference,
          notes: input.notes,
        });
      }}
    />
  );
}
