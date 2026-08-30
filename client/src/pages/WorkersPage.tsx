import React, { useMemo } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { WorkerAccountsWorkspace, type WorkerData, type WorkerAccountEntryData } from "@/components/WorkerAccounts";
import { trpc } from "@/lib/trpc";
import type { WorkerAccountEntryType } from "../../../shared/workerAccounts";

export default function WorkersPage() {
  const { workspace, activeFarmId, activeFarm, farmWorkers, refetch } = useWorkspaceContext();

  const createWorkerMutation = trpc.workspace.createWorker.useMutation({
    onSuccess: () => refetch(),
  });

  const updateWorkerMutation = trpc.workspace.updateWorker.useMutation({
    onSuccess: () => refetch(),
  });

  const addEntryMutation = trpc.workspace.addWorkerAccountEntry.useMutation({
    onSuccess: () => refetch(),
  });

  const updateEntryMutation = trpc.workspace.updateWorkerAccountEntry.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteEntryMutation = trpc.workspace.deleteWorkerAccountEntry.useMutation({
    onSuccess: () => refetch(),
  });

  const formattedWorkers: WorkerData[] = useMemo(() => {
    return farmWorkers.map((w) => ({
      id: w.id,
      farmId: w.farmId,
      name: w.name,
      jobTitle: w.jobTitle,
      phone: w.phone,
      notes: w.notes,
      isActive: w.isActive,
    }));
  }, [farmWorkers]);

  const formattedEntries: WorkerAccountEntryData[] = useMemo(() => {
    return (workspace?.workerAccountEntries || [])
      .filter((e) => e.farmId === activeFarmId)
      .map((e) => ({
        id: e.id,
        farmId: e.farmId,
        workerId: e.workerId,
        entryType: e.entryType as WorkerAccountEntryType,
        amountPiasters: e.amountPiasters,
        occurredAt: new Date(e.occurredAt),
        reference: e.reference,
        notes: e.notes,
      }));
  }, [workspace?.workerAccountEntries, activeFarmId]);

  if (!activeFarmId || !activeFarm) {
    return <div className="p-8 text-center text-muted-foreground">يرجى اختيار مزرعة أولاً.</div>;
  }

  return (
    <WorkerAccountsWorkspace
      farmName={activeFarm.name}
      workers={formattedWorkers}
      entries={formattedEntries}
      onCreateWorker={async (input) => {
        await createWorkerMutation.mutateAsync({
          farmId: activeFarmId,
          name: input.name,
          jobTitle: input.jobTitle,
          phone: input.phone,
          notes: input.notes,
        });
      }}
      onUpdateWorker={async (input) => {
        await updateWorkerMutation.mutateAsync({
          workerId: input.workerId,
          name: input.name,
          jobTitle: input.jobTitle,
          phone: input.phone,
          notes: input.notes,
          isActive: input.isActive,
        });
      }}
      onAddEntry={async (input) => {
        await addEntryMutation.mutateAsync({
          workerId: input.workerId,
          entryType: input.entryType,
          amountEgp: input.amountEgp,
          occurredAt: new Date(input.occurredAt),
          reference: input.reference,
          notes: input.notes,
        });
      }}
      onUpdateEntry={async (input) => {
        await updateEntryMutation.mutateAsync({
          entryId: input.entryId,
          entryType: input.entryType,
          amountEgp: input.amountEgp,
          occurredAt: new Date(input.occurredAt),
          reference: input.reference,
          notes: input.notes,
        });
      }}
      onDeleteEntry={async (entryId) => {
        await deleteEntryMutation.mutateAsync({ entryId });
      }}
    />
  );
}
