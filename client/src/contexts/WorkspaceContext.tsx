import React, { createContext, useContext, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type WorkspaceData = NonNullable<RouterOutput["workspace"]["get"]>;

export type Farm = WorkspaceData["farms"][number];
export type House = WorkspaceData["houses"][number];
export type Cycle = WorkspaceData["cycles"][number];
export type DailyRecord = WorkspaceData["records"][number];
export type WeightSample = WorkspaceData["weights"][number];
export type HealthEvent = WorkspaceData["health"][number];
export type Expense = WorkspaceData["expenses"][number];
export type Worker = WorkspaceData["workers"][number];
export type Trader = WorkspaceData["traders"][number];
export type Sale = WorkspaceData["sales"][number];

interface WorkspaceContextType {
  workspace: WorkspaceData | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  activeFarmId: number | null;
  setActiveFarmId: (id: number | null) => void;
  activeFarm: Farm | undefined;
  activeCycleId: number | null;
  setActiveCycleId: (id: number | null) => void;
  activeCycle: Cycle | undefined;
  // Derived collections
  farmHouses: House[];
  farmCycles: Cycle[];
  cycleHouses: House[];
  cycleRecords: DailyRecord[];
  cycleWeights: WeightSample[];
  cycleHealth: HealthEvent[];
  farmExpenses: Expense[];
  farmWorkers: Worker[];
  farmTraders: Trader[];
  farmSales: Sale[];
  // Derived KPIs
  currentLiveBirds: number;
  totalMortality: number;
  totalFeedKg: number;
  totalWaterLiters: number;
  avgWeightGrams: number;
  currentFcr: number;
  cycleAgeDays: number;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: workspace, isLoading, isError, refetch } = trpc.workspace.get.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

  // Auto-select first farm if not set
  const activeFarmId = useMemo(() => {
    if (selectedFarmId && workspace?.farms.some((f) => f.id === selectedFarmId)) {
      return selectedFarmId;
    }
    return workspace?.farms[0]?.id ?? null;
  }, [selectedFarmId, workspace?.farms]);

  const activeFarm = useMemo(
    () => workspace?.farms.find((f) => f.id === activeFarmId),
    [workspace?.farms, activeFarmId]
  );

  const farmHouses = useMemo(
    () => (workspace?.houses ?? []).filter((h) => h.farmId === activeFarmId),
    [workspace?.houses, activeFarmId]
  );

  const farmCycles = useMemo(
    () => (workspace?.cycles ?? []).filter((c) => c.farmId === activeFarmId),
    [workspace?.cycles, activeFarmId]
  );

  // Auto-select active cycle or first cycle
  const activeCycleId = useMemo(() => {
    if (selectedCycleId && farmCycles.some((c) => c.id === selectedCycleId)) {
      return selectedCycleId;
    }
    const active = farmCycles.find((c) => c.status === "active");
    return active?.id ?? farmCycles[0]?.id ?? null;
  }, [selectedCycleId, farmCycles]);

  const activeCycle = useMemo(
    () => farmCycles.find((c) => c.id === activeCycleId),
    [farmCycles, activeCycleId]
  );

  const cycleHouses = useMemo(() => {
    if (!activeCycleId || !workspace) return farmHouses;
    const assignments = workspace.assignments.filter((a) => a.cycleId === activeCycleId);
    if (assignments.length > 0) {
      const assignedHouseIds = new Set(assignments.map((a) => a.houseId));
      return farmHouses.filter((h) => assignedHouseIds.has(h.id));
    }
    if (activeCycle?.houseId) {
      return farmHouses.filter((h) => h.id === activeCycle.houseId);
    }
    return farmHouses;
  }, [activeCycleId, workspace, farmHouses, activeCycle]);

  const cycleRecords = useMemo(
    () => (workspace?.records ?? []).filter((r) => r.cycleId === activeCycleId),
    [workspace?.records, activeCycleId]
  );

  const cycleWeights = useMemo(
    () => (workspace?.weights ?? []).filter((w) => w.cycleId === activeCycleId),
    [workspace?.weights, activeCycleId]
  );

  const cycleHealth = useMemo(
    () => (workspace?.health ?? []).filter((h) => h.cycleId === activeCycleId),
    [workspace?.health, activeCycleId]
  );

  const farmExpenses = useMemo(
    () => (workspace?.expenses ?? []).filter((e) => e.farmId === activeFarmId),
    [workspace?.expenses, activeFarmId]
  );

  const farmWorkers = useMemo(
    () => (workspace?.workers ?? []).filter((w) => w.farmId === activeFarmId),
    [workspace?.workers, activeFarmId]
  );

  const farmTraders = useMemo(
    () => (workspace?.traders ?? []).filter((t) => t.farmId === activeFarmId),
    [workspace?.traders, activeFarmId]
  );

  const farmSales = useMemo(
    () => (workspace?.sales ?? []).filter((s) => s.farmId === activeFarmId),
    [workspace?.sales, activeFarmId]
  );

  // Derived KPIs
  const totalMortality = useMemo(
    () => cycleRecords.reduce((sum, r) => sum + (r.mortality || 0) + (r.culls || 0), 0),
    [cycleRecords]
  );

  const currentLiveBirds = useMemo(() => {
    if (!activeCycle) return 0;
    return Math.max(0, activeCycle.birdsPlaced - totalMortality);
  }, [activeCycle, totalMortality]);

  const totalFeedKg = useMemo(
    () => cycleRecords.reduce((sum, r) => sum + (r.feedKg || 0), 0),
    [cycleRecords]
  );

  const totalWaterLiters = useMemo(
    () => cycleRecords.reduce((sum, r) => sum + (r.waterLiters || 0), 0),
    [cycleRecords]
  );

  const avgWeightGrams = useMemo(() => {
    if (cycleWeights.length === 0) return 0;
    const latest = [...cycleWeights].sort(
      (a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime()
    )[0];
    return latest?.averageWeightGrams || 0;
  }, [cycleWeights]);

  const currentFcr = useMemo(() => {
    if (currentLiveBirds === 0 || avgWeightGrams === 0) return 0;
    const totalLiveWeightKg = (currentLiveBirds * avgWeightGrams) / 1000;
    if (totalLiveWeightKg === 0) return 0;
    return Number((totalFeedKg / totalLiveWeightKg).toFixed(2));
  }, [currentLiveBirds, avgWeightGrams, totalFeedKg]);

  const cycleAgeDays = useMemo(() => {
    if (!activeCycle?.placementDate) return 0;
    const placed = new Date(activeCycle.placementDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - placed.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [activeCycle?.placementDate]);

  const value: WorkspaceContextType = {
    workspace,
    isLoading,
    isError,
    refetch,
    activeFarmId,
    setActiveFarmId: setSelectedFarmId,
    activeFarm,
    activeCycleId,
    setActiveCycleId: setSelectedCycleId,
    activeCycle,
    farmHouses,
    farmCycles,
    cycleHouses,
    cycleRecords,
    cycleWeights,
    cycleHealth,
    farmExpenses,
    farmWorkers,
    farmTraders,
    farmSales,
    currentLiveBirds,
    totalMortality,
    totalFeedKg,
    totalWaterLiters,
    avgWeightGrams,
    currentFcr,
    cycleAgeDays,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspaceContext = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceContext must be used within a WorkspaceProvider");
  }
  return context;
};
