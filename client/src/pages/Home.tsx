import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { LifecyclePanel } from "@/components/LifecyclePanel";
import { HouseAssignmentPanel } from "@/components/HouseAssignmentPanel";
import {
  HouseGrowthView,
  HouseHealthView,
  HouseOperationsView,
  type DailyOperationActivityRecord,
} from "@/components/HouseActivityPanels";
import {
  AssignedHouseOption,
  HouseAssignmentDialog,
  HouseHealthDialog,
  HouseOperationDialog,
  HouseWeightDialog,
  type DailyOperationFormRecord,
  type HealthEventFormRecord,
} from "@/components/HouseOperationDialogs";
import {
  FeedInventoryWorkspace,
  FeedStockAlert,
  type FeedInventorySettingsData,
} from "@/components/FeedInventory";
import { ExpenseManagementWorkspace } from "@/components/ExpenseManagement";
import { WorkerAccountsWorkspace } from "@/components/WorkerAccounts";
import { TraderSalesConsole } from "@/components/TraderSalesConsole";
import { MedicationDoseCalculator } from "@/components/MedicationDoseCalculator";
import {
  arabicWeatherLabel,
  cycleDayFromDate,
  weatherPanelState,
} from "../../../shared/weather";
import { allocationLimit } from "../../../shared/allocation";
import { FarmRole, roleLabels } from "../../../shared/accessControl";
import {
  DEFAULT_FEED_BAG_WEIGHT_KG,
  DEFAULT_WATER_TO_FEED_RATIO_L_PER_KG,
  expectedLiveWeightGramsForCycleDay,
  forecastHouseConsumption,
} from "../../../shared/consumptionForecast";
import { broilerEnvironmentTargetForCycleDay } from "../../../shared/environmentTargets";
import {
  dailyBroilerGuidanceForCycleDay,
  type DailyBroilerGuidance,
} from "../../../shared/dailyBroilerGuidance";
import {
  buildOperationalCsv,
  buildOperationalPdfHtml,
  operationalExportFilename,
  type OperationalExportSnapshot,
} from "../../../shared/operationalExport";
import { feedInventorySnapshot } from "../../../shared/feedInventory";
import { dashboardExceptionKinds } from "../../../shared/dashboardExceptions";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bird,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleDollarSign,
  ClipboardPlus,
  Droplets,
  FileBarChart2,
  FileDown,
  HandCoins,
  HeartPulse,
  Leaf,
  MapPin,
  Pencil,
  Plus,
  Printer,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  ThermometerSun,
  Trash2,
  TrendingUp,
  Warehouse,
  WalletCards,
  Wheat,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type DailyRecord = {
  date: string;
  houseId?: number;
  feed: number;
  water: number;
  mortality: number;
  culls: number;
};
type WeightRecord = { date: string; houseId?: number; weight: number };
type LifecycleTarget = {
  kind: "farm" | "cycle" | "house";
  id: number;
  name: string;
};

const arabicNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
const arabicDate = (value: string | Date) =>
  new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const pageMeta: Record<
  string,
  { title: string; description: string; icon: typeof Activity }
> = {
  "/": {
    title: "لوحة المتابعة",
    description: "نظرة لحظية على الدورة الحالية وما يحتاج إلى تسجيل اليوم.",
    icon: Activity,
  },
  "/farms": {
    title: "المزارع",
    description: "نظّم مزارعك وحدد المواقع والمسؤولين وتفاصيل التشغيل.",
    icon: Building2,
  },
  "/cycles": {
    title: "دورات التسمين",
    description: "أنشئ دورات الإنتاج وتابع حالتها ومؤشرات أدائها.",
    icon: CalendarDays,
  },
  "/housing": {
    title: "العنابر والأقفاص",
    description: "عرّف صفوف البطاريات والأقسام والطاقة الاستيعابية.",
    icon: Bird,
  },
  "/feed-stock": {
    title: "مخزون العلف",
    description:
      "تابع رصيد الشكاير، التوريدات، وحد إعادة الطلب قبل نفاد المخزون.",
    icon: Warehouse,
  },
  "/expenses": {
    title: "المصاريف",
    description:
      "تابع التكلفة التشغيلية للمزرعة والدورة من سجلات مصروفاتك الفعلية.",
    icon: CircleDollarSign,
  },
  "/workers": {
    title: "حسابات العمال",
    description:
      "تابع الراتب والسلف والمسحوبات لكل عامل في دفتر مستقل عن مصاريف المزرعة.",
    icon: WalletCards,
  },
  "/sales": {
    title: "المبيعات والتجار",
    description:
      "افتح حساب التاجر، وسجّل أوزان الأقفاص بالدفعات، وتابع الذمم وربحية الدورة.",
    icon: HandCoins,
  },
  "/operations": {
    title: "العمليات اليومية",
    description: "سجّل العلف والمياه والنافق والاستبعادات من مصدر واحد.",
    icon: ClipboardPlus,
  },
  "/health": {
    title: "الصحة والتحصين",
    description: "احتفظ بخطة العلاج والتحصين وسجل التنفيذ الطبي.",
    icon: HeartPulse,
  },
  "/growth": {
    title: "الأوزان والنمو",
    description: "تابع الوزن الحي وقيّم التحويل الغذائي مقابل المستهدف.",
    icon: Scale,
  },
  "/reports": {
    title: "التقارير",
    description: "استعرض ملخص الدورة وتقارير الإغلاق عند اكتمال البيانات.",
    icon: FileBarChart2,
  },
  "/access": {
    title: "إدارة الوصول",
    description: "أنشئ دعوات آمنة وحدد صلاحيات فريق العمل على مستوى المزرعة.",
    icon: ShieldCheck,
  },
};

export default function Home() {
  const [location, setLocation] = useLocation();
  const meta = pageMeta[location] ?? pageMeta["/"];
  const [setupStep, setSetupStep] = useState(0);
  const [farmName, setFarmName] = useState("");
  const [farmLatitude, setFarmLatitude] = useState("");
  const [farmLongitude, setFarmLongitude] = useState("");
  const [farmLocationSource, setFarmLocationSource] = useState<
    "manual" | "device"
  >("manual");
  const [cycleName, setCycleName] = useState("");
  const [placementDate, setPlacementDate] = useState("");
  const [placedBirds, setPlacedBirds] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isOperationsOpen, setIsOperationsOpen] = useState(false);
  const [editingDailyRecord, setEditingDailyRecord] =
    useState<DailyOperationFormRecord | null>(null);
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isDoseCalculatorOpen, setIsDoseCalculatorOpen] = useState(false);
  const [isHouseOpen, setIsHouseOpen] = useState(false);
  const [isCageOpen, setIsCageOpen] = useState(false);
  const [isFarmOpen, setIsFarmOpen] = useState(false);
  const [isCycleOpen, setIsCycleOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>();
  const [isOccupancyOpen, setIsOccupancyOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isInvitationOpen, setIsInvitationOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [editingFarmLocation, setEditingFarmLocation] = useState<{
    id: number;
    name: string;
    location: string | null;
    latitude: string | null;
    longitude: string | null;
  } | null>(null);
  const [generatedInvitationCode, setGeneratedInvitationCode] = useState<
    string | null
  >(null);
  const [editingFarm, setEditingFarm] = useState<{
    id: number;
    name: string;
    governorate: string | null;
    location: string | null;
  } | null>(null);
  const [editingCycle, setEditingCycle] = useState<{
    id: number;
    name: string;
    placementDate: Date;
    birdsPlaced: number;
  } | null>(null);
  const [editingHouse, setEditingHouse] = useState<{
    id: number;
    name: string;
    capacity: number;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LifecycleTarget | null>(
    null
  );
  const [editingHealthEvent, setEditingHealthEvent] =
    useState<HealthEventFormRecord | null>(null);
  const [healthDeleteTarget, setHealthDeleteTarget] =
    useState<HealthEventFormRecord | null>(null);
  const [lifecycleError, setLifecycleError] = useState("");
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthEventFormRecord[]>(
    []
  );
  const workspace = trpc.workspace.get.useQuery();
  const [weatherDate, setWeatherDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [feedBagWeightKg, setFeedBagWeightKg] = useState(
    DEFAULT_FEED_BAG_WEIGHT_KG
  );
  const bootstrap = trpc.workspace.bootstrap.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const addDailyRecord = trpc.workspace.addDailyRecord.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const updateDailyRecord = trpc.workspace.updateDailyRecord.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const deleteDailyRecord = trpc.workspace.deleteDailyRecord.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const addWeightSample = trpc.workspace.addWeightSample.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const addHealthEvent = trpc.workspace.addHealthEvent.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const addHealthEvents = trpc.workspace.addHealthEvents.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const updateHealthEvent = trpc.workspace.updateHealthEvent.useMutation({
    onSuccess: () => {
      workspace.refetch();
      setEditingHealthEvent(null);
    },
    onError: error => setLifecycleError(error.message),
  });
  const deleteHealthEvent = trpc.workspace.deleteHealthEvent.useMutation({
    onSuccess: () => {
      workspace.refetch();
      setHealthDeleteTarget(null);
    },
    onError: error => setLifecycleError(error.message),
  });
  const createHouse = trpc.workspace.createHouse.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const createCageSection = trpc.workspace.createCageSection.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const createFarm = trpc.workspace.createFarm.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const updateFarmLocation = trpc.workspace.updateFarmLocation.useMutation({
    onSuccess: () => {
      workspace.refetch();
      setEditingFarmLocation(null);
    },
  });
  const createCycle = trpc.workspace.createCycle.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const updateFarm = trpc.workspace.updateFarm.useMutation({
    onSuccess: () => {
      workspace.refetch();
      setEditingFarm(null);
    },
    onError: error => setLifecycleError(error.message),
  });
  const updateCycle = trpc.workspace.updateCycle.useMutation({
    onSuccess: () => {
      workspace.refetch();
      setEditingCycle(null);
    },
    onError: error => setLifecycleError(error.message),
  });
  const updateHouse = trpc.workspace.updateHouse.useMutation({
    onSuccess: () => {
      workspace.refetch();
      setEditingHouse(null);
    },
    onError: error => setLifecycleError(error.message),
  });
  const deleteFarm = trpc.workspace.deleteFarm.useMutation({
    onSuccess: () => {
      workspace.refetch();
      setDeleteTarget(null);
      setSelectedFarmId(undefined);
    },
    onError: error => setLifecycleError(error.message),
  });
  const deleteCycle = trpc.workspace.deleteCycle.useMutation({
    onSuccess: () => {
      workspace.refetch();
      setDeleteTarget(null);
      setSelectedCycleId(undefined);
    },
    onError: error => setLifecycleError(error.message),
  });
  const deleteHouse = trpc.workspace.deleteHouse.useMutation({
    onSuccess: () => {
      workspace.refetch();
      setDeleteTarget(null);
    },
    onError: error => setLifecycleError(error.message),
  });
  const setCageOccupancy = trpc.workspace.setCageOccupancy.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const setCycleHouseAssignment =
    trpc.workspace.setCycleHouseAssignment.useMutation({
      onSuccess: () => workspace.refetch(),
    });
  const updateFeedInventorySettings =
    trpc.workspace.updateFeedInventorySettings.useMutation({
      onSuccess: () => workspace.refetch(),
    });
  const addFeedInventoryTransaction =
    trpc.workspace.addFeedInventoryTransaction.useMutation({
      onSuccess: () => workspace.refetch(),
    });
  const addFarmExpense = trpc.workspace.addFarmExpense.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const updateFarmExpense = trpc.workspace.updateFarmExpense.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const createWorker = trpc.workspace.createWorker.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const updateWorker = trpc.workspace.updateWorker.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const addWorkerAccountEntry =
    trpc.workspace.addWorkerAccountEntry.useMutation({
      onSuccess: () => workspace.refetch(),
    });
  const updateWorkerAccountEntry =
    trpc.workspace.updateWorkerAccountEntry.useMutation({
      onSuccess: () => workspace.refetch(),
    });
  const deleteWorkerAccountEntry =
    trpc.workspace.deleteWorkerAccountEntry.useMutation({
      onSuccess: () => workspace.refetch(),
    });
  const createTrader = trpc.workspace.createTrader.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const createTraderWithSimpleSale =
    trpc.workspace.createTraderWithSimpleSale.useMutation({
      onSuccess: () => workspace.refetch(),
    });
  const updateTrader = trpc.workspace.updateTrader.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const deleteTrader = trpc.workspace.deleteTrader.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const startTraderLoading = trpc.workspace.startTraderLoading.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const addSaleTareBatch = trpc.workspace.addSaleTareBatch.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const fillSaleTareBatch = trpc.workspace.fillSaleTareBatch.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const updateSaleTareBatch = trpc.workspace.updateSaleTareBatch.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const addSaleWeighBatch = trpc.workspace.addSaleWeighBatch.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const updateSaleWeighBatch = trpc.workspace.updateSaleWeighBatch.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const deleteSaleWeighBatch = trpc.workspace.deleteSaleWeighBatch.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const reorderSaleWeighBatches =
    trpc.workspace.reorderSaleWeighBatches.useMutation({
      onSuccess: () => workspace.refetch(),
    });
  const completeSale = trpc.workspace.completeSale.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const calculateSaleTotal = trpc.workspace.calculateSaleTotal.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const reopenSale = trpc.workspace.reopenSale.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const deleteSale = trpc.workspace.deleteSale.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const addSalePayment = trpc.workspace.addSalePayment.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const updateSalePayment = trpc.workspace.updateSalePayment.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const deleteSalePayment = trpc.workspace.deleteSalePayment.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const closeCycle = trpc.workspace.closeCycle.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const finalizeCycleSalesAndClose =
    trpc.workspace.finalizeCycleSalesAndClose.useMutation({
      onSuccess: () => workspace.refetch(),
    });
  const invitations = trpc.workspace.invitations.useQuery();
  const createInvitation = trpc.workspace.createInvitation.useMutation({
    onSuccess: result => {
      setGeneratedInvitationCode(result.code);
      invitations.refetch();
    },
  });
  const revokeInvitation = trpc.workspace.revokeInvitation.useMutation({
    onSuccess: () => invitations.refetch(),
  });
  const regenerateInvitation = trpc.workspace.regenerateInvitation.useMutation({
    onSuccess: result => {
      setGeneratedInvitationCode(result.code);
      invitations.refetch();
    },
  });
  const redeemInvitation = trpc.workspace.redeemInvitation.useMutation({
    onSuccess: () => workspace.refetch(),
  });
  const visibleCycles = (workspace.data?.cycles ?? []).filter(
    cycle => !selectedFarmId || cycle.farmId === selectedFarmId
  );
  const storedCycle =
    visibleCycles.find(cycle => cycle.id === selectedCycleId) ??
    visibleCycles.find(cycle => cycle.status === "active") ??
    visibleCycles[0];
  const weatherInput = useMemo(
    () => ({ cycleId: storedCycle?.id ?? 0, weatherDate }),
    [storedCycle?.id, weatherDate]
  );
  const cycleWeather = trpc.weather.forCycleDay.useQuery(weatherInput, {
    enabled: Boolean(storedCycle?.id),
  });
  const storedRecords = (workspace.data?.records ?? [])
    .filter(record => record.cycleId === storedCycle?.id)
    .map(record => ({
      id: record.id,
      date: new Date(record.recordDate).toISOString().slice(0, 10),
      houseId: record.houseId ?? undefined,
      feed: record.feedKg,
      water: record.waterLiters,
      mortality: record.mortality,
      culls: record.culls,
    }));
  const storedWeights = (workspace.data?.weights ?? [])
    .filter(record => record.cycleId === storedCycle?.id)
    .map(record => ({
      date: new Date(record.sampleDate).toISOString().slice(0, 10),
      houseId: record.houseId ?? undefined,
      weight: record.averageWeightGrams,
    }));
  const storedHealth = (workspace.data?.health ?? [])
    .filter(record => record.cycleId === storedCycle?.id)
    .map(record => ({
      id: record.id,
      date: new Date(record.eventDate).toISOString().slice(0, 10),
      houseId: record.houseId ?? undefined,
      eventType: record.eventType,
      productName: record.productName,
      dosage: record.dosage,
      administrationRoute: record.administrationRoute,
      notes: record.notes,
    }));
  const effectiveDailyRecords = workspace.data ? storedRecords : dailyRecords;
  const effectiveWeightRecords = workspace.data ? storedWeights : weightRecords;
  const effectiveHealthRecords = workspace.data ? storedHealth : healthRecords;

  const placed = storedCycle?.birdsPlaced ?? Number(placedBirds || 0);
  const totalFeed = effectiveDailyRecords.reduce(
    (sum, item) => sum + item.feed,
    0
  );
  const totalWater = effectiveDailyRecords.reduce(
    (sum, item) => sum + item.water,
    0
  );
  const mortality = effectiveDailyRecords.reduce(
    (sum, item) => sum + item.mortality,
    0
  );
  const culls = effectiveDailyRecords.reduce(
    (sum, item) => sum + item.culls,
    0
  );
  const liveBirds = Math.max(placed - mortality - culls, 0);
  const latestWeight = effectiveWeightRecords.at(-1)?.weight ?? 0;
  const fcr =
    latestWeight > 0 && liveBirds > 0
      ? totalFeed / ((latestWeight / 1000) * liveBirds)
      : 0;
  const activePlacementDate = storedCycle?.placementDate
    ? new Date(storedCycle.placementDate).toISOString().slice(0, 10)
    : placementDate;
  const ageDays = activePlacementDate
    ? cycleDayFromDate(
        new Date(`${activePlacementDate}T00:00:00Z`),
        weatherDate
      )
    : 0;
  const expectedLiveWeight = expectedLiveWeightGramsForCycleDay(ageDays);
  const environmentTarget = broilerEnvironmentTargetForCycleDay(ageDays);
  const dailyGuidance = dailyBroilerGuidanceForCycleDay(ageDays);
  useEffect(() => {
    if (!activePlacementDate || !storedCycle?.id) return;
    const today = new Date().toISOString().slice(0, 10);
    setWeatherDate(today < activePlacementDate ? activePlacementDate : today);
  }, [storedCycle?.id, activePlacementDate]);
  const chartData = effectiveDailyRecords.map(record => ({
    ...record,
    label: arabicDate(record.date),
  }));
  const activeFarmId =
    storedCycle?.farmId ?? selectedFarmId ?? workspace.data?.farms[0]?.id;
  const currentFarm =
    workspace.data?.farms.find(farm => farm.id === activeFarmId)?.name ||
    farmName.trim() ||
    "مزرعتك الأولى";
  const currentCycle = storedCycle?.name || cycleName.trim() || "دورة جديدة";
  const selectedCycleAssignments = useMemo(
    () =>
      (workspace.data?.assignments ?? []).filter(
        assignment => assignment.cycleId === storedCycle?.id
      ),
    [storedCycle?.id, workspace.data?.assignments]
  );
  const assignedHouses = useMemo<AssignedHouseOption[]>(
    () =>
      selectedCycleAssignments
        .map(assignment => {
          const house = (workspace.data?.houses ?? []).find(
            item => item.id === assignment.houseId
          );
          return house
            ? {
                id: house.id,
                name: house.name,
                assignedBirds: assignment.assignedBirds,
              }
            : null;
        })
        .filter((house): house is AssignedHouseOption => Boolean(house)),
    [selectedCycleAssignments, workspace.data?.houses]
  );
  const exportSnapshot = useMemo<OperationalExportSnapshot>(() => {
    const selectedWeather =
      cycleWeather.data?.state === "ready" ? cycleWeather.data : undefined;
    return {
      farmName: currentFarm,
      cycleName: currentCycle,
      selectedDate: weatherDate,
      cycleDay: ageDays,
      actualTemperatureC: selectedWeather?.currentTemperature ?? null,
      actualHumidityPercent: selectedWeather?.humidity ?? null,
      targetTemperatureMinC: environmentTarget.temperatureMinC,
      targetTemperatureMaxC: environmentTarget.temperatureMaxC,
      targetHumidityMinPercent: environmentTarget.humidityMinPercent,
      targetHumidityMaxPercent: environmentTarget.humidityMaxPercent,
      weights: effectiveWeightRecords.map(record => ({
        date: record.date,
        houseName:
          assignedHouses.find(house => house.id === record.houseId)?.name ??
          "عنبر غير محدد",
        averageWeightGrams: record.weight,
      })),
    };
  }, [
    ageDays,
    assignedHouses,
    currentCycle,
    currentFarm,
    cycleWeather.data,
    effectiveWeightRecords,
    environmentTarget,
    weatherDate,
  ]);
  const activeFarmHouses = useMemo(
    () =>
      (workspace.data?.houses ?? []).filter(
        house => house.farmId === activeFarmId
      ),
    [activeFarmId, workspace.data?.houses]
  );
  const selectedCycleOccupancy = useMemo(
    () =>
      (workspace.data?.occupancy ?? []).filter(
        item => item.cycleId === storedCycle?.id
      ),
    [storedCycle?.id, workspace.data?.occupancy]
  );
  const cycleCageRows = useMemo(
    () =>
      (workspace.data?.cageSections ?? [])
        .filter(section =>
          assignedHouses.some(house => house.id === section.houseId)
        )
        .map(section => ({
          ...section,
          houseName:
            assignedHouses.find(house => house.id === section.houseId)?.name ??
            "عنبر غير محدد",
          assignedBirds:
            assignedHouses.find(house => house.id === section.houseId)
              ?.assignedBirds ?? 0,
          occupiedBirds:
            selectedCycleOccupancy.find(
              occupancy => occupancy.cageSectionId === section.id
            )?.occupiedBirds ?? 0,
        })),
    [assignedHouses, selectedCycleOccupancy, workspace.data?.cageSections]
  );
  const houseForecasts = useMemo(() => {
    return assignedHouses
      .map(house => {
        const assignedBirds = house.assignedBirds;
        return {
          houseId: house.id,
          houseName: house.name,
          occupiedBirds: assignedBirds,
          ...forecastHouseConsumption({
            birds: assignedBirds,
            cycleDay: ageDays,
            bagWeightKg: feedBagWeightKg,
          }),
        };
      })
      .filter(forecast => forecast.occupiedBirds > 0);
  }, [ageDays, assignedHouses, feedBagWeightKg]);
  const rowForecasts = useMemo(
    () =>
      cycleCageRows
        .filter(row => row.occupiedBirds > 0)
        .map(row => ({
          rowId: row.id,
          houseName: row.houseName,
          rowName: row.rowName,
          cageCount: row.cageCount,
          birdsPerCage: row.capacityPerCage,
          occupiedBirds: row.occupiedBirds,
          ...forecastHouseConsumption({
            birds: row.occupiedBirds,
            cycleDay: ageDays,
            bagWeightKg: feedBagWeightKg,
          }),
        })),
    [ageDays, cycleCageRows, feedBagWeightKg]
  );
  const feedInventorySettings =
    (workspace.data?.feedInventorySettings ?? []).find(
      settings => settings.farmId === activeFarmId
    ) ??
    ({
      bagWeightKg: DEFAULT_FEED_BAG_WEIGHT_KG,
      reorderPointBags: 0,
    } satisfies FeedInventorySettingsData);
  const feedInventoryTransactions = useMemo(
    () =>
      (workspace.data?.feedInventoryTransactions ?? [])
        .filter(transaction => transaction.farmId === activeFarmId)
        .map(transaction => ({
          ...transaction,
          bagDelta: Number(transaction.bagDelta),
        })),
    [activeFarmId, workspace.data?.feedInventoryTransactions]
  );
  const farmExpenses = useMemo(
    () =>
      (workspace.data?.expenses ?? []).filter(
        expense => expense.farmId === activeFarmId
      ),
    [activeFarmId, workspace.data?.expenses]
  );
  const farmWorkers = useMemo(
    () =>
      (workspace.data?.workers ?? []).filter(
        worker => worker.farmId === activeFarmId
      ),
    [activeFarmId, workspace.data?.workers]
  );
  const farmWorkerAccountEntries = useMemo(
    () =>
      (workspace.data?.workerAccountEntries ?? []).filter(
        entry => entry.farmId === activeFarmId
      ),
    [activeFarmId, workspace.data?.workerAccountEntries]
  );
  const farmTraders = useMemo(
    () =>
      (workspace.data?.traders ?? []).filter(
        trader => trader.farmId === activeFarmId && trader.isActive
      ),
    [activeFarmId, workspace.data?.traders]
  );
  const farmSales = useMemo(
    () =>
      (workspace.data?.sales ?? []).filter(
        sale => sale.farmId === activeFarmId
      ),
    [activeFarmId, workspace.data?.sales]
  );
  const farmSalePayments = useMemo(
    () =>
      (workspace.data?.salePayments ?? []).filter(
        payment => payment.farmId === activeFarmId
      ),
    [activeFarmId, workspace.data?.salePayments]
  );
  const farmSaleWeighBatches = useMemo(() => {
    const saleIds = new Set(farmSales.map(sale => sale.id));
    return (workspace.data?.saleWeighBatches ?? []).filter(batch =>
      saleIds.has(batch.saleId)
    );
  }, [farmSales, workspace.data?.saleWeighBatches]);
  const farmSaleActivities = useMemo(() => {
    const saleIds = new Set(farmSales.map(sale => sale.id));
    return (workspace.data?.saleActivities ?? []).filter(activity =>
      saleIds.has(activity.saleId)
    );
  }, [farmSales, workspace.data?.saleActivities]);
  const farmExpenseCycles = useMemo(
    () =>
      (workspace.data?.cycles ?? [])
        .filter(cycle => cycle.farmId === activeFarmId)
        .map(cycle => ({
          id: cycle.id,
          name: cycle.name,
          status: cycle.status,
          birdsPlaced: cycle.birdsPlaced,
        })),
    [activeFarmId, workspace.data?.cycles]
  );
  const dailyForecastFeedKg = houseForecasts.reduce(
    (sum, forecast) => sum + forecast.feedKg,
    0
  );
  const feedStockSnapshot = useMemo(
    () =>
      feedInventorySnapshot({
        availableBags: feedInventoryTransactions.reduce(
          (sum, transaction) => sum + transaction.bagDelta,
          0
        ),
        reorderPointBags: feedInventorySettings.reorderPointBags,
        bagWeightKg: feedInventorySettings.bagWeightKg,
        forecastFeedKg: dailyForecastFeedKg,
        hasTrackedStock: feedInventoryTransactions.length > 0,
      }),
    [
      dailyForecastFeedKg,
      feedInventorySettings.bagWeightKg,
      feedInventorySettings.reorderPointBags,
      feedInventoryTransactions,
    ]
  );
  useEffect(() => {
    setFeedBagWeightKg(feedInventorySettings.bagWeightKg);
  }, [activeFarmId, feedInventorySettings.bagWeightKg]);

  const kpis = useMemo(
    () => [
      {
        label: "عمر القطيع",
        value:
          activePlacementDate && ageDays > 0
            ? `${arabicNumber(ageDays)} يوم`
            : "—",
        icon: CalendarDays,
        tone: "bg-[#edf4e4] text-[#3c754d]",
      },
      {
        label: "معدل النفوق",
        value: placed ? `%${arabicNumber((mortality / placed) * 100, 1)}` : "—",
        icon: HeartPulse,
        tone: "bg-[#fff0e6] text-[#c06232]",
      },
      {
        label: "إجمالي العلف",
        value: totalFeed ? `${arabicNumber(totalFeed, 1)} كجم` : "—",
        icon: Wheat,
        tone: "bg-[#f5f0d9] text-[#8a6e24]",
      },
      {
        label: "متوسط الوزن",
        value: latestWeight ? `${arabicNumber(latestWeight)} جم` : "—",
        icon: Scale,
        tone: "bg-[#eaf1f2] text-[#3f7178]",
      },
      {
        label: "معامل التحويل",
        value: fcr ? arabicNumber(fcr, 2) : "—",
        icon: TrendingUp,
        tone: "bg-[#eeeafb] text-[#6755a5]",
      },
    ],
    [
      activePlacementDate,
      ageDays,
      fcr,
      latestWeight,
      mortality,
      placed,
      totalFeed,
    ]
  );

  if (workspace.isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <div className="rounded-2xl bg-card px-5 py-4 text-sm font-bold text-muted-foreground">
          جارٍ تجهيز مساحة العمل…
        </div>
      </div>
    );
  }

  if (!isReady && !workspace.data?.farms.length) {
    return (
      <Onboarding
        setupStep={setupStep}
        setSetupStep={setSetupStep}
        farmName={farmName}
        setFarmName={setFarmName}
        farmLatitude={farmLatitude}
        setFarmLatitude={setFarmLatitude}
        farmLongitude={farmLongitude}
        setFarmLongitude={setFarmLongitude}
        locationSource={farmLocationSource}
        onUseDeviceLocation={() => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(position => {
            setFarmLatitude(position.coords.latitude.toFixed(6));
            setFarmLongitude(position.coords.longitude.toFixed(6));
            setFarmLocationSource("device");
          });
        }}
        cycleName={cycleName}
        setCycleName={setCycleName}
        placementDate={placementDate}
        setPlacementDate={setPlacementDate}
        placedBirds={placedBirds}
        setPlacedBirds={setPlacedBirds}
        onComplete={() =>
          bootstrap.mutate(
            {
              farmName,
              cycleName,
              placementDate,
              birdsPlaced: Number(placedBirds),
              latitude: farmLatitude ? Number(farmLatitude) : undefined,
              longitude: farmLongitude ? Number(farmLongitude) : undefined,
              locationSource: farmLocationSource,
            },
            { onSuccess: () => setIsReady(true) }
          )
        }
      />
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-[1600px] space-y-5">
      <header className="flex flex-col justify-between gap-5 rounded-3xl border border-white/70 bg-card/80 p-5 shadow-[0_12px_34px_-24px_rgba(36,81,60,0.38)] backdrop-blur-sm lg:flex-row lg:items-center lg:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <meta.icon className="h-5 w-5" />
          </span>
          <div>
            <p className="mb-1 text-xs font-bold text-primary">
              {currentFarm}{" "}
              <span className="mx-1 text-muted-foreground">/</span>{" "}
              {currentCycle}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {meta.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {meta.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="اختيار المزرعة"
            value={activeFarmId ?? ""}
            onChange={event => {
              setSelectedFarmId(Number(event.target.value));
              setSelectedCycleId(undefined);
            }}
            className="h-10 max-w-[180px] rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground"
          >
            <option value="">المزارع</option>
            {(workspace.data?.farms ?? []).map(farm => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#dce9cf] bg-[#f2f7ec] px-3 py-2 text-xs font-bold text-[#4a784a]">
            <span className="h-2 w-2 rounded-full bg-[#6ea158]" />
            {storedCycle?.status === "closed" ? "دورة مغلقة" : "دورة نشطة"}
          </span>
          <Button
            variant="outline"
            className="h-10 rounded-xl border-border bg-card text-sm font-bold"
            onClick={() => setIsOperationsOpen(true)}
          >
            <Plus className="h-4 w-4" />
            تسجيل اليوم
          </Button>
        </div>
      </header>

      {location === "/" && (
        <DashboardView
          kpis={kpis}
          chartData={chartData}
          placed={placed}
          liveBirds={liveBirds}
          totalWater={totalWater}
          latestWeight={latestWeight}
          expectedLiveWeight={expectedLiveWeight}
          ageDays={ageDays}
          environmentTarget={environmentTarget}
          dailyGuidance={dailyGuidance}
          exportSnapshot={exportSnapshot}
          totalFeed={totalFeed}
          cycleName={currentCycle}
          houseForecasts={houseForecasts}
          rowForecasts={rowForecasts}
          feedBagWeightKg={feedBagWeightKg}
          onFeedBagWeightChange={setFeedBagWeightKg}
          feedStockSnapshot={feedStockSnapshot}
          feedInventorySettings={feedInventorySettings}
          onManageFeed={() => setLocation("/feed-stock")}
          weather={cycleWeather.data}
          weatherLoading={cycleWeather.isLoading}
          weatherDate={weatherDate}
          placementDate={activePlacementDate}
          onWeatherDateChange={setWeatherDate}
          onConfigureLocation={() => {
            const farm = (workspace.data?.farms ?? []).find(
              item => item.id === activeFarmId
            );
            if (farm) setEditingFarmLocation(farm);
            setLocation("/farms");
          }}
          onAddOperation={() => setIsOperationsOpen(true)}
          onAddWeight={() => setIsWeightOpen(true)}
        />
      )}
      {location === "/farms" && (
        <>
          <FarmsView
            farms={workspace.data?.farms ?? []}
            houses={workspace.data?.houses ?? []}
            cycles={workspace.data?.cycles ?? []}
            sections={workspace.data?.cageSections ?? []}
            allocations={selectedCycleOccupancy}
            activeFarmId={activeFarmId}
            selectedCycle={storedCycle}
            onSelectFarm={farmId => {
              setSelectedFarmId(farmId);
              setSelectedCycleId(undefined);
            }}
            onSelectCycle={setSelectedCycleId}
            onAdd={() => setIsFarmOpen(true)}
            onAddHouse={() => setIsHouseOpen(true)}
            onAddCycle={() => setIsCycleOpen(true)}
            onGoHousing={() => setLocation("/housing")}
            onEditLocation={farm => setEditingFarmLocation(farm)}
          />
          <LifecyclePanel
            farms={workspace.data?.farms ?? []}
            houses={workspace.data?.houses ?? []}
            cycles={workspace.data?.cycles ?? []}
            onEditFarm={farm => {
              setLifecycleError("");
              setEditingFarm(farm);
            }}
            onEditCycle={cycle => {
              setLifecycleError("");
              setEditingCycle(cycle);
            }}
            onEditHouse={house => {
              setLifecycleError("");
              setEditingHouse(house);
            }}
            onDelete={target => {
              setLifecycleError("");
              setDeleteTarget(target);
            }}
          />
        </>
      )}
      {location === "/farms" && storedCycle && (
        <HouseAssignmentPanel
          houses={activeFarmHouses}
          assignments={selectedCycleAssignments}
          cycleName={storedCycle.name}
          cycleBirdsPlaced={storedCycle.birdsPlaced}
          onAssign={() => setIsAssignmentOpen(true)}
        />
      )}
      {location === "/cycles" && (
        <CyclesView
          cycles={visibleCycles}
          selectedCycleId={storedCycle?.id}
          onAdd={() => setIsCycleOpen(true)}
          onSelect={setSelectedCycleId}
        />
      )}
      {location === "/housing" && (
        <HousingView
          cycleName={currentCycle}
          houses={assignedHouses}
          rows={cycleCageRows}
          onAddCage={() => setIsCageOpen(true)}
        />
      )}
      {location === "/feed-stock" && (
        <FeedInventoryWorkspace
          farmName={currentFarm}
          settings={feedInventorySettings}
          transactions={feedInventoryTransactions}
          snapshot={feedStockSnapshot}
          onSaveSettings={input =>
            activeFarmId
              ? updateFeedInventorySettings.mutateAsync({
                  farmId: activeFarmId,
                  ...input,
                })
              : Promise.reject(new Error("اختر مزرعة أولاً"))
          }
          onAddMovement={input =>
            activeFarmId
              ? addFeedInventoryTransaction.mutateAsync({
                  farmId: activeFarmId,
                  ...input,
                })
              : Promise.reject(new Error("اختر مزرعة أولاً"))
          }
        />
      )}
      {location === "/expenses" && (
        <ExpenseManagementWorkspace
          farmName={currentFarm}
          expenses={farmExpenses}
          cycles={farmExpenseCycles}
          activeCycleId={storedCycle?.id}
          onAddExpense={input =>
            activeFarmId
              ? addFarmExpense.mutateAsync({ farmId: activeFarmId, ...input })
              : Promise.reject(new Error("اختر مزرعة أولاً"))
          }
          onUpdateExpense={input => updateFarmExpense.mutateAsync(input)}
        />
      )}
      {location === "/workers" && (
        <WorkerAccountsWorkspace
          farmName={currentFarm}
          workers={farmWorkers}
          entries={farmWorkerAccountEntries}
          onCreateWorker={input =>
            activeFarmId
              ? createWorker.mutateAsync({ farmId: activeFarmId, ...input })
              : Promise.reject(new Error("اختر مزرعة أولاً"))
          }
          onUpdateWorker={input => updateWorker.mutateAsync(input)}
          onAddEntry={input =>
            addWorkerAccountEntry.mutateAsync({
              ...input,
              occurredAt: new Date(input.occurredAt),
            })
          }
          onUpdateEntry={input =>
            updateWorkerAccountEntry.mutateAsync({
              ...input,
              occurredAt: new Date(input.occurredAt),
            })
          }
          onDeleteEntry={entryId =>
            deleteWorkerAccountEntry.mutateAsync({ entryId })
          }
        />
      )}
      {location === "/sales" && (
        <TraderSalesConsole
          farmName={currentFarm}
          cycleName={currentCycle}
          cycleId={storedCycle?.id}
          cycleStatus={storedCycle?.status ?? "upcoming"}
          traders={farmTraders}
          sales={farmSales}
          batches={farmSaleWeighBatches}
          payments={farmSalePayments}
          expenses={farmExpenses}
          onCreateTraderSale={input =>
            activeFarmId && storedCycle
              ? createTraderWithSimpleSale.mutateAsync({
                  farmId: activeFarmId,
                  cycleId: storedCycle.id,
                  saleDate: new Date(),
                  ...input,
                })
              : Promise.reject(new Error("اختر مزرعة ودورة نشطة أولاً"))
          }
          onAddTare={input =>
            addSaleTareBatch.mutateAsync({
              ...input,
              weighedAt: new Date(input.weighedAt),
            })
          }
          onAddFilled={input =>
            addSaleWeighBatch.mutateAsync({
              ...input,
              weighedAt: new Date(input.weighedAt),
              tareWeightKg: 0,
            })
          }
          onUpdateTare={input =>
            updateSaleTareBatch.mutateAsync({
              ...input,
              weighedAt: new Date(input.weighedAt),
            })
          }
          onUpdateFilled={input =>
            updateSaleWeighBatch.mutateAsync({
              ...input,
              weighedAt: new Date(input.weighedAt),
            })
          }
          onDeleteBatch={batchId =>
            deleteSaleWeighBatch.mutateAsync({ batchId })
          }
          onUpdateTrader={input => updateTrader.mutateAsync(input)}
          onDeleteTrader={traderId => deleteTrader.mutateAsync({ traderId })}
          onAddPayment={input =>
            addSalePayment.mutateAsync({
              ...input,
              paidAt: new Date(input.paidAt),
            })
          }
          onUpdatePayment={input =>
            updateSalePayment.mutateAsync({
              ...input,
              paidAt: new Date(input.paidAt),
            })
          }
          onDeletePayment={paymentId =>
            deleteSalePayment.mutateAsync({ paymentId })
          }
          onCalculateSale={saleId => calculateSaleTotal.mutateAsync({ saleId })}
          onCompleteSale={saleId => completeSale.mutateAsync({ saleId })}
          onReopenSale={saleId => reopenSale.mutateAsync({ saleId })}
          onFinalizeCycle={cycleId =>
            finalizeCycleSalesAndClose.mutateAsync({ cycleId })
          }
        />
      )}
      {location === "/operations" && (
        <HouseOperationsView
          records={effectiveDailyRecords}
          houses={assignedHouses}
          onAdd={() => {
            setEditingDailyRecord(null);
            setIsOperationsOpen(true);
          }}
          onEdit={(record: DailyOperationActivityRecord) => {
            if (record.id) {
              setEditingDailyRecord(record as DailyOperationFormRecord);
              setIsOperationsOpen(true);
            }
          }}
          onDelete={(record: DailyOperationActivityRecord) => {
            if (
              record.id &&
              window.confirm(
                "هل تريد حذف قراءة التشغيل هذه؟ ستُعاد كمية العلف المسجلة إلى المخزون تلقائياً."
              )
            )
              deleteDailyRecord.mutate({ recordId: record.id });
          }}
        />
      )}
      {location === "/health" && (
        <HouseHealthView
          records={effectiveHealthRecords}
          houses={assignedHouses}
          placementDate={storedCycle?.placementDate}
          onAdd={() => {
            setEditingHealthEvent(null);
            setIsHealthOpen(true);
          }}
          onDoseCalculator={() => setIsDoseCalculatorOpen(true)}
          onEdit={record => {
            setLifecycleError("");
            setEditingHealthEvent(record);
            setIsHealthOpen(true);
          }}
          onDelete={record => {
            setLifecycleError("");
            setHealthDeleteTarget(record);
          }}
        />
      )}
      {location === "/growth" && (
        <HouseGrowthView
          records={effectiveWeightRecords}
          houses={assignedHouses}
          onAdd={() => setIsWeightOpen(true)}
        />
      )}
      {location === "/reports" && (
        <ReportsView
          placed={placed}
          mortality={mortality}
          totalFeed={totalFeed}
          latestWeight={latestWeight}
          fcr={fcr}
          ageDays={ageDays}
          status={storedCycle?.status ?? "upcoming"}
          onClose={() =>
            storedCycle && closeCycle.mutate({ cycleId: storedCycle.id })
          }
        />
      )}
      {location === "/access" && (
        <AccessView
          invitations={invitations.data ?? []}
          farms={workspace.data?.farms ?? []}
          onCreate={() => setIsInvitationOpen(true)}
          onRedeem={() => setIsRedeemOpen(true)}
          onRevoke={invitationId => revokeInvitation.mutate({ invitationId })}
          onRegenerate={invitationId =>
            regenerateInvitation.mutate({ invitationId })
          }
        />
      )}

      <HouseOperationDialog
        open={isOperationsOpen}
        onOpenChange={open => {
          setIsOperationsOpen(open);
          if (!open) setEditingDailyRecord(null);
        }}
        houses={assignedHouses}
        record={editingDailyRecord}
        bagWeightKg={feedInventorySettings.bagWeightKg}
        availableBags={feedStockSnapshot.availableBags}
        onSubmit={record =>
          editingDailyRecord
            ? updateDailyRecord.mutateAsync({
                recordId: editingDailyRecord.id,
                recordDate: record.date,
                feedKg: Math.round(record.feed),
                waterLiters: Math.round(record.water),
                mortality: record.mortality,
                culls: record.culls,
              })
            : storedCycle
              ? addDailyRecord.mutateAsync({
                  cycleId: storedCycle.id,
                  houseId: record.houseId,
                  recordDate: record.date,
                  feedKg: Math.round(record.feed),
                  waterLiters: Math.round(record.water),
                  mortality: record.mortality,
                  culls: record.culls,
                })
              : Promise.reject(new Error("اختر دورة نشطة أولاً"))
        }
      />
      <HouseWeightDialog
        open={isWeightOpen}
        onOpenChange={setIsWeightOpen}
        houses={assignedHouses}
        onSubmit={record =>
          storedCycle
            ? addWeightSample.mutateAsync({
                cycleId: storedCycle.id,
                houseId: record.houseId,
                sampleDate: record.date,
                averageWeightGrams: record.weight,
              })
            : Promise.reject(new Error("اختر دورة نشطة أولاً"))
        }
      />
      <HouseHealthDialog
        open={isHealthOpen}
        onOpenChange={open => {
          setIsHealthOpen(open);
          if (!open) setEditingHealthEvent(null);
        }}
        houses={assignedHouses}
        record={editingHealthEvent}
        onSubmit={async record => {
          if (!storedCycle || !record.houseIds.length)
            throw new Error("اختر دورة نشطة وعنبرًا موزعًا عليه طيور أولاً");
          const normalized = {
            houseId: record.houseIds[0],
            eventDate: record.date,
            eventType: record.eventType,
            productName: record.productName,
            dosage: record.dosage,
            administrationRoute: record.administrationRoute ?? undefined,
            notes: record.notes ?? undefined,
          };
          if (record.id) {
            await updateHealthEvent.mutateAsync({
              healthEventId: record.id,
              ...normalized,
            });
            return;
          }
          if (record.houseIds.length === 1) {
            await addHealthEvent.mutateAsync({
              cycleId: storedCycle.id,
              ...normalized,
            });
            return;
          }
          await addHealthEvents.mutateAsync({
            cycleId: storedCycle.id,
            houseIds: record.houseIds,
            eventDate: normalized.eventDate,
            eventType: normalized.eventType,
            productName: normalized.productName,
            dosage: normalized.dosage,
            administrationRoute: normalized.administrationRoute,
            notes: normalized.notes,
          });
        }}
      />
      <MedicationDoseCalculator
        open={isDoseCalculatorOpen}
        onOpenChange={setIsDoseCalculatorOpen}
        houses={assignedHouses}
      />
      <HouseDialog
        open={isHouseOpen}
        onOpenChange={setIsHouseOpen}
        onSubmit={house =>
          activeFarmId && createHouse.mutate({ farmId: activeFarmId, ...house })
        }
      />
      <CageDialog
        open={isCageOpen}
        onOpenChange={setIsCageOpen}
        houses={assignedHouses}
        onSubmit={section => {
          if (!storedCycle) return;
          createCageSection.mutate({ cycleId: storedCycle.id, ...section });
        }}
      />
      <FarmDialog
        open={isFarmOpen}
        onOpenChange={setIsFarmOpen}
        onSubmit={farm => createFarm.mutate(farm)}
      />
      <FarmLocationDialog
        farm={editingFarmLocation}
        onClose={() => setEditingFarmLocation(null)}
        onSubmit={location => updateFarmLocation.mutate(location)}
      />
      <CycleDialog
        open={isCycleOpen}
        onOpenChange={setIsCycleOpen}
        farms={workspace.data?.farms ?? []}
        selectedFarmId={activeFarmId}
        onSubmit={cycle => createCycle.mutate(cycle)}
      />
      <OccupancyDialog
        open={isOccupancyOpen}
        onOpenChange={setIsOccupancyOpen}
        cycleId={storedCycle?.id}
        cycleBirdsPlaced={storedCycle?.birdsPlaced ?? 0}
        sections={(workspace.data?.cageSections ?? []).filter(section =>
          assignedHouses.some(house => house.id === section.houseId)
        )}
        allocations={selectedCycleOccupancy}
        onSubmit={async occupancy => {
          await setCageOccupancy.mutateAsync(occupancy);
        }}
      />
      <HouseAssignmentDialog
        open={isAssignmentOpen}
        onOpenChange={setIsAssignmentOpen}
        houses={activeFarmHouses}
        assignments={selectedCycleAssignments}
        cycleBirdsPlaced={storedCycle?.birdsPlaced ?? 0}
        onSubmit={assignment =>
          storedCycle
            ? setCycleHouseAssignment.mutateAsync({
                cycleId: storedCycle.id,
                ...assignment,
              })
            : Promise.reject(new Error("اختر دورة نشطة أولاً"))
        }
      />
      <InvitationDialog
        open={isInvitationOpen}
        onOpenChange={setIsInvitationOpen}
        farms={workspace.data?.farms ?? []}
        houses={workspace.data?.houses ?? []}
        cycles={workspace.data?.cycles ?? []}
        onSubmit={invitation => createInvitation.mutate(invitation)}
      />
      <RedeemInvitationDialog
        open={isRedeemOpen}
        onOpenChange={setIsRedeemOpen}
        onSubmit={code => redeemInvitation.mutate({ code })}
      />
      <GeneratedInvitationDialog
        code={generatedInvitationCode}
        onClose={() => setGeneratedInvitationCode(null)}
      />
      <EditFarmDialog
        farm={editingFarm}
        error={lifecycleError}
        onClose={() => setEditingFarm(null)}
        onSubmit={input => updateFarm.mutate(input)}
      />
      <EditCycleDialog
        cycle={editingCycle}
        error={lifecycleError}
        onClose={() => setEditingCycle(null)}
        onSubmit={input => updateCycle.mutate(input)}
      />
      <EditHouseDialog
        house={editingHouse}
        error={lifecycleError}
        onClose={() => setEditingHouse(null)}
        onSubmit={input => updateHouse.mutate(input)}
      />
      <DeleteRecordDialog
        target={deleteTarget}
        error={lifecycleError}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.kind === "farm")
            deleteFarm.mutate({ farmId: deleteTarget.id });
          if (deleteTarget.kind === "cycle")
            deleteCycle.mutate({ cycleId: deleteTarget.id });
          if (deleteTarget.kind === "house")
            deleteHouse.mutate({ houseId: deleteTarget.id });
        }}
      />
      <DeleteHealthEventDialog
        record={healthDeleteTarget}
        error={lifecycleError}
        onClose={() => setHealthDeleteTarget(null)}
        onConfirm={() =>
          healthDeleteTarget &&
          deleteHealthEvent.mutate({ healthEventId: healthDeleteTarget.id })
        }
      />
    </div>
  );
}

function Onboarding({
  setupStep,
  setSetupStep,
  farmName,
  setFarmName,
  farmLatitude,
  setFarmLatitude,
  farmLongitude,
  setFarmLongitude,
  locationSource,
  onUseDeviceLocation,
  cycleName,
  setCycleName,
  placementDate,
  setPlacementDate,
  placedBirds,
  setPlacedBirds,
  onComplete,
}: {
  setupStep: number;
  setSetupStep: (step: number) => void;
  farmName: string;
  setFarmName: (value: string) => void;
  farmLatitude: string;
  setFarmLatitude: (value: string) => void;
  farmLongitude: string;
  setFarmLongitude: (value: string) => void;
  locationSource: "manual" | "device";
  onUseDeviceLocation: () => void;
  cycleName: string;
  setCycleName: (value: string) => void;
  placementDate: string;
  setPlacementDate: (value: string) => void;
  placedBirds: string;
  setPlacedBirds: (value: string) => void;
  onComplete: () => void;
}) {
  const steps = ["بيانات المزرعة", "دورة التسمين", "مراجعة الإعداد"];
  const canProceed =
    (setupStep === 0 && farmName.trim()) ||
    (setupStep === 1 &&
      cycleName.trim() &&
      placementDate &&
      Number(placedBirds) > 0) ||
    setupStep === 2;
  return (
    <div
      dir="rtl"
      className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]"
    >
      <section className="rounded-3xl bg-[#285c3b] p-8 text-[#fbf9ed] shadow-[0_24px_60px_-28px_rgba(18,63,41,0.85)] lg:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dfeecb] text-[#285c3b]">
          <Leaf className="h-7 w-7" />
        </div>
        <p className="mt-9 text-sm font-bold text-[#dfeecb]">
          مرحباً بك في مزارع
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight">
          ابدأ منظومة
          <br />
          المتابعة الخاصة بك.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-8 text-[#e5efe0]/85">
          نرتّب مساحة العمل حول بياناتك الحقيقية فقط. أضف مزرعتك الأولى ثم دورة
          التسمين، وبعدها تبدأ السجلات والمؤشرات بالظهور.
        </p>
        <div className="mt-10 space-y-3">
          {steps.map((label, index) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold",
                index === setupStep
                  ? "bg-white/12 text-white"
                  : index < setupStep
                    ? "text-[#dfeecb]"
                    : "text-white/50"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  index < setupStep
                    ? "bg-[#dfeecb] text-[#285c3b]"
                    : index === setupStep
                      ? "bg-white text-[#285c3b]"
                      : "bg-white/10"
                )}
              >
                {index < setupStep ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  arabicNumber(index + 1)
                )}
              </span>
              {label}
            </div>
          ))}
        </div>
      </section>
      <section className="soft-card p-6 sm:p-9">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-primary">
              خطوة {arabicNumber(setupStep + 1)} من {arabicNumber(3)}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">{steps[setupStep]}</h2>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            إعداد آمن وخالٍ من البيانات التجريبية
          </span>
        </div>
        <Progress
          value={(setupStep + 1) * 33.33}
          className="mb-9 h-2 bg-[#eff2ea] [&>div]:bg-primary"
        />
        {setupStep === 0 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="farm-name">اسم المزرعة</Label>
              <Input
                id="farm-name"
                value={farmName}
                onChange={event => setFarmName(event.target.value)}
                placeholder="مثال: مزرعة النور للتسمين"
                className="mt-2 h-12 rounded-xl text-right"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>المحافظة</Label>
                <Input
                  placeholder="اختر أو اكتب المحافظة"
                  className="mt-2 h-12 rounded-xl text-right"
                />
              </div>
              <div>
                <Label>الموقع</Label>
                <Input
                  placeholder="العنوان أو إحداثيات الموقع"
                  className="mt-2 h-12 rounded-xl text-right"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-[#dce9cf] bg-[#f7fbf3] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">موقع الطقس للمزرعة</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    اربط الإحداثيات للحصول على طقس كل يوم من أيام الدورة.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl bg-card text-xs font-bold"
                  onClick={onUseDeviceLocation}
                >
                  استخدام موقع الجهاز
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="farm-latitude">خط العرض</Label>
                  <Input
                    id="farm-latitude"
                    type="number"
                    step="0.000001"
                    value={farmLatitude}
                    onChange={event => setFarmLatitude(event.target.value)}
                    placeholder="مثال: 30.0444"
                    className="mt-2 h-11 rounded-xl text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="farm-longitude">خط الطول</Label>
                  <Input
                    id="farm-longitude"
                    type="number"
                    step="0.000001"
                    value={farmLongitude}
                    onChange={event => setFarmLongitude(event.target.value)}
                    placeholder="مثال: 31.2357"
                    className="mt-2 h-11 rounded-xl text-right"
                  />
                </div>
              </div>
              {farmLatitude && farmLongitude && (
                <p className="mt-3 text-xs font-bold text-primary">
                  <MapPin className="ml-1 inline h-3.5 w-3.5" />
                  تم ربط موقع الطقس (
                  {locationSource === "device" ? "من الجهاز" : "إدخال يدوي"}).
                </p>
              )}
            </div>
          </div>
        )}
        {setupStep === 1 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="cycle-name">اسم دورة التسمين</Label>
              <Input
                id="cycle-name"
                value={cycleName}
                onChange={event => setCycleName(event.target.value)}
                placeholder="مثال: دورة خريف ٢٠٢٦"
                className="mt-2 h-12 rounded-xl text-right"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="placement-date">تاريخ الاستقبال</Label>
                <Input
                  id="placement-date"
                  type="date"
                  value={placementDate}
                  onChange={event => setPlacementDate(event.target.value)}
                  className="mt-2 h-12 rounded-xl text-right"
                />
              </div>
              <div>
                <Label htmlFor="placed-birds">عدد الكتاكيت المستقبلة</Label>
                <Input
                  id="placed-birds"
                  type="number"
                  min="1"
                  value={placedBirds}
                  onChange={event => setPlacedBirds(event.target.value)}
                  placeholder="٠"
                  className="mt-2 h-12 rounded-xl text-right"
                />
              </div>
            </div>
            <div className="rounded-xl border border-[#e0ebd4] bg-[#f8fbf4] p-4 text-sm leading-7 text-muted-foreground">
              <Target className="ml-1 inline h-4 w-4 text-primary" />
              ستظهر مؤشرات الأداء بعد تسجيل أول قراءة فعلية للعلف أو المياه أو
              الوزن.
            </div>
          </div>
        )}
        {setupStep === 2 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-[#f4f8ef] p-5">
              <p className="text-sm font-bold text-primary">
                جاهز لبدء المتابعة
              </p>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <SummaryCell label="المزرعة" value={farmName} />
                <SummaryCell label="الدورة" value={cycleName} />
                <SummaryCell
                  label="تاريخ الاستقبال"
                  value={placementDate ? arabicDate(placementDate) : "—"}
                />
                <SummaryCell
                  label="عدد الطيور"
                  value={arabicNumber(Number(placedBirds))}
                />
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              لن نعرض أي مؤشرات تشغيلية إلا من سجلاتك الفعلية. أضف العنابر
              والأقفاص ثم ابدأ تسجيل العمليات اليومية عند الحاجة.
            </p>
          </div>
        )}
        <div className="mt-10 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="rounded-xl text-muted-foreground"
            onClick={() => setSetupStep(Math.max(0, setupStep - 1))}
            disabled={setupStep === 0}
          >
            السابق
          </Button>
          <Button
            className="h-11 rounded-xl bg-primary px-6 font-bold hover:bg-primary/90"
            disabled={!canProceed}
            onClick={() =>
              setupStep === 2 ? onComplete() : setSetupStep(setupStep + 1)
            }
          >
            {setupStep === 2 ? "فتح لوحة المتابعة" : "متابعة"}
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold text-foreground">{value || "—"}</p>
    </div>
  );
}

function DashboardView({
  kpis,
  chartData,
  placed,
  liveBirds,
  totalWater,
  latestWeight,
  expectedLiveWeight,
  ageDays,
  environmentTarget,
  dailyGuidance,
  exportSnapshot,
  totalFeed,
  cycleName,
  houseForecasts,
  rowForecasts,
  feedBagWeightKg,
  onFeedBagWeightChange,
  feedStockSnapshot,
  feedInventorySettings,
  onManageFeed,
  weather,
  weatherLoading,
  weatherDate,
  placementDate,
  onWeatherDateChange,
  onConfigureLocation,
  onAddOperation,
  onAddWeight,
}: {
  kpis: { label: string; value: string; icon: typeof Activity; tone: string }[];
  chartData: {
    date: string;
    label: string;
    feed: number;
    water: number;
    mortality: number;
    culls: number;
  }[];
  placed: number;
  liveBirds: number;
  totalWater: number;
  latestWeight: number;
  expectedLiveWeight: number;
  ageDays: number;
  environmentTarget: {
    cycleDay: number;
    temperatureMinC: number;
    temperatureMaxC: number;
    humidityMinPercent: number;
    humidityMaxPercent: number;
  };
  dailyGuidance: DailyBroilerGuidance;
  exportSnapshot: OperationalExportSnapshot;
  totalFeed: number;
  cycleName: string;
  houseForecasts: {
    houseId: number;
    houseName: string;
    occupiedBirds: number;
    dailyFeedGramsPerBird: number;
    feedKg: number;
    feedBags: number;
    feedBuckets: number;
    waterLiters: number;
  }[];
  rowForecasts: {
    rowId: number;
    houseName: string;
    rowName: string;
    cageCount: number;
    birdsPerCage: number;
    occupiedBirds: number;
    dailyFeedGramsPerBird: number;
    feedKg: number;
    feedBags: number;
    feedBuckets: number;
    waterLiters: number;
  }[];
  feedBagWeightKg: number;
  onFeedBagWeightChange: (value: number) => void;
  feedStockSnapshot: {
    availableBags: number;
    availableKg: number;
    dailyDemandBags: number;
    daysOfCover: number | null;
    recommendedOrderBags: number;
    status: "setup" | "healthy" | "reorder" | "critical";
  };
  feedInventorySettings: FeedInventorySettingsData;
  onManageFeed: () => void;
  weather?:
    | {
        state: "ready";
        weatherDate: string;
        cycleDay: number;
        weatherCode: number;
        currentTemperature: number | null;
        temperatureHigh: number;
        temperatureLow: number;
        humidity: number | null;
        windSpeed: number | null;
        apparentTemperature: number | null;
      }
    | { state: "location_required"; farmName: string };
  weatherLoading: boolean;
  weatherDate: string;
  placementDate: string;
  onWeatherDateChange: (value: string) => void;
  onConfigureLocation: () => void;
  onAddOperation: () => void;
  onAddWeight: () => void;
}) {
  const hasData = chartData.length > 0;
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(item => {
          const needsWeight =
            (item.label === "متوسط الوزن" || item.label === "معامل التحويل") &&
            item.value === "—";
          return (
            <article
              className={cn(
                "soft-card p-4",
                needsWeight && "border-[#ebd7a4] bg-[#fffdf6]"
              )}
              key={item.label}
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    item.tone
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {needsWeight ? "بحاجة لوزن" : "المسجل"}
                </span>
              </div>
              <p className="mt-5 text-2xl font-extrabold tracking-tight">
                {item.value}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {item.label}
                </p>
                {needsWeight && (
                  <button
                    type="button"
                    className="text-xs font-extrabold text-primary underline underline-offset-4"
                    onClick={onAddWeight}
                  >
                    سجل عينة
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
      <TodayExceptions
        snapshot={feedStockSnapshot}
        latestWeight={latestWeight}
        weather={weather}
        target={environmentTarget}
        onManageFeed={onManageFeed}
        onAddWeight={onAddWeight}
      />
      <WeatherCard
        weather={weather}
        loading={weatherLoading}
        weatherDate={weatherDate}
        placementDate={placementDate}
        onWeatherDateChange={onWeatherDateChange}
        onConfigureLocation={onConfigureLocation}
      />
      <div id="environment-target">
        <EnvironmentTargetCard target={environmentTarget} />
      </div>
      <DailyGuidanceCard guidance={dailyGuidance} />
      <FeedStockAlert
        snapshot={feedStockSnapshot}
        settings={feedInventorySettings}
        onOpen={onManageFeed}
      />
      <ExportPanel snapshot={exportSnapshot} />
      <ConsumptionForecastPanel
        forecasts={houseForecasts}
        rowForecasts={rowForecasts}
        expectedLiveWeight={expectedLiveWeight}
        ageDays={ageDays}
        bagWeightKg={feedBagWeightKg}
        onBagWeightChange={onFeedBagWeightChange}
      />
      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <article className="soft-card min-h-[360px] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-extrabold">العلف والمياه اليومية</p>
              <p className="mt-1 text-xs text-muted-foreground">
                قراءاتك الفعلية خلال دورة {cycleName}
              </p>
            </div>
            {hasData && (
              <span className="rounded-lg bg-[#eff5e9] px-2.5 py-1 text-xs font-bold text-primary">
                {arabicNumber(chartData.length)} سجلات
              </span>
            )}
          </div>
          {hasData ? (
            <div className="mt-6 h-[255px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="feedGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#5f9d60"
                        stopOpacity={0.32}
                      />
                      <stop offset="100%" stopColor="#5f9d60" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#edf0e8" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#708073", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#708073", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#dfe7d8",
                      fontFamily: "Cairo",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="feed"
                    name="العلف (كجم)"
                    stroke="#4f8753"
                    strokeWidth={2.5}
                    fill="url(#feedGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="water"
                    name="المياه (لتر)"
                    stroke="#c18a35"
                    strokeWidth={2.2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart
              title="لا توجد قراءات يومية حتى الآن"
              description="عند تسجيل العلف أو المياه ستظهر الحركة اليومية هنا."
              action="تسجيل اليوم"
              onAction={onAddOperation}
            />
          )}
        </article>
        <article className="overflow-hidden rounded-2xl bg-[#285c3b] p-6 text-white shadow-[0_18px_44px_-28px_rgba(18,63,41,0.85)]">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#e4f0d5]">
              <Bird className="h-5 w-5" />
            </span>
            <span className="rounded-lg bg-[#dfeecb] px-2.5 py-1 text-xs font-bold text-[#285c3b]">
              القطيع الحالي
            </span>
          </div>
          <p className="mt-7 text-3xl font-extrabold">
            {placed ? arabicNumber(liveBirds) : "—"}
          </p>
          <p className="mt-1 text-sm text-white/70">طائر حي</p>
          <div className="mt-8 space-y-4 border-t border-white/12 pt-5">
            <MetricLine
              label="عدد المستقبَل"
              value={placed ? arabicNumber(placed) : "—"}
            />
            <MetricLine
              label="إجمالي المياه"
              value={totalWater ? `${arabicNumber(totalWater)} لتر` : "—"}
            />
            <MetricLine
              label="آخر وزن حي"
              value={latestWeight ? `${arabicNumber(latestWeight)} جم` : "—"}
            />
          </div>
        </article>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="soft-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-extrabold">متابعة اليوم</p>
              <p className="mt-1 text-xs text-muted-foreground">
                خطوات عملية لتحديث حالة الدورة.
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-[#af8b38]" />
          </div>
          <div className="mt-6 space-y-3">
            <TaskRow
              done={hasData}
              title="تسجيل العلف والمياه"
              caption={
                hasData
                  ? "تم تسجيل قراءة تشغيلية."
                  : "أضف القراءة الفعلية لهذا اليوم."
              }
              action={onAddOperation}
            />
            <TaskRow
              done={latestWeight > 0}
              title="تحديث عينة الوزن"
              caption={
                latestWeight > 0
                  ? "تمت إضافة آخر عينة وزن."
                  : "أضف عينة لقياس منحنى النمو."
              }
              action={onAddWeight}
            />
            <TaskRow
              done={false}
              title="مراجعة الحالة الصحية"
              caption="أضف تحصيناً أو علاجاً عند التنفيذ."
            />
          </div>
        </article>
        <article className="soft-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-extrabold">ملخص التشغيل</p>
              <p className="mt-1 text-xs text-muted-foreground">
                الأرقام تظهر فقط من بياناتك المسجلة.
              </p>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <SummaryTile
              label="العلف التراكمي"
              value={
                totalFeed ? `${arabicNumber(totalFeed, 1)} كجم` : "لا بيانات"
              }
            />
            <SummaryTile label="حالة الدورة" value="نشطة" />
            <SummaryTile
              label="آخر قراءة"
              value={
                hasData ? arabicDate(chartData.at(-1)?.date ?? "") : "لا توجد"
              }
            />
            <SummaryTile
              label="الجاهزية"
              value={hasData ? "محدّثة" : "بانتظار أول سجل"}
            />
          </div>
        </article>
      </section>
      <MobileQuickActions
        onAddOperation={onAddOperation}
        onAddWeight={onAddWeight}
        onManageFeed={onManageFeed}
      />
    </>
  );
}

function TodayExceptions({
  snapshot,
  latestWeight,
  weather,
  target,
  onManageFeed,
  onAddWeight,
}: {
  snapshot: {
    availableBags: number;
    recommendedOrderBags: number;
    status: "setup" | "healthy" | "reorder" | "critical";
  };
  latestWeight: number;
  weather?:
    | { state: "ready"; temperatureHigh: number; humidity: number | null }
    | { state: "location_required"; farmName: string };
  target: { temperatureMaxC: number; humidityMinPercent: number };
  onManageFeed: () => void;
  onAddWeight: () => void;
}) {
  const kinds = dashboardExceptionKinds({
    stockStatus: snapshot.status,
    hasWeight: latestWeight > 0,
    temperatureHigh:
      weather?.state === "ready" ? weather.temperatureHigh : null,
    humidity: weather?.state === "ready" ? weather.humidity : null,
    targetTemperatureMaxC: target.temperatureMaxC,
    targetHumidityMinPercent: target.humidityMinPercent,
  });
  const cards = kinds.map(kind =>
    kind === "feed"
      ? {
          title:
            snapshot.status === "critical"
              ? "مخزون العلف يحتاج إجراءً عاجلاً"
              : "مخزون العلف يحتاج تخطيطاً",
          description: `الرصيد يحتاج متابعة؛ اقترح طلب ${arabicNumber(snapshot.recommendedOrderBags)} شيكارة.`,
          action: "إدارة المخزون",
          onClick: onManageFeed,
          tone:
            snapshot.status === "critical"
              ? "border-[#f0c4b9] bg-[#fff3ef] text-[#9d4734]"
              : "border-[#f0d9a4] bg-[#fff9e9] text-[#87601e]",
          icon: Warehouse,
        }
      : kind === "weight"
        ? {
            title: "لا توجد عينة وزن فعلية",
            description:
              "لا يمكن حساب متوسط الوزن أو معامل التحويل قبل تسجيل عينة ممثلة.",
            action: "إضافة عينة وزن",
            onClick: onAddWeight,
            tone: "border-[#d8d1ee] bg-[#f6f3ff] text-[#61508d]",
            icon: Scale,
          }
        : {
            title: "الظروف الخارجية تتطلب مراجعة",
            description:
              "راجع التهوية وسرعة الهواء عند مستوى القفص وفق هدف اليوم قبل أي تعديل.",
            action: "عرض هدف البيئة",
            onClick: () =>
              document
                .getElementById("environment-target")
                ?.scrollIntoView({ behavior: "smooth", block: "center" }),
            tone: "border-[#f0d9a4] bg-[#fff9e9] text-[#87601e]",
            icon: ThermometerSun,
          }
  );
  if (!cards.length) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-[#d7e6d2] bg-white shadow-[0_14px_32px_-28px_rgba(36,81,60,0.5)]">
      <div className="flex items-center justify-between border-b border-[#e3ecdf] bg-[#f4f8ef] px-5 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#aa7227]" />
          <p className="text-sm font-extrabold">استثناءات اليوم</p>
        </div>
        <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-primary">
          {arabicNumber(cards.length)} يحتاج متابعة
        </span>
      </div>
      <div className="grid gap-3 p-4 lg:grid-cols-3">
        {cards.map(card => (
          <article
            key={card.title}
            className={cn("rounded-xl border p-4", card.tone)}
          >
            <div className="flex gap-3">
              <card.icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{card.title}</p>
                <p className="mt-1 text-xs leading-6 opacity-85">
                  {card.description}
                </p>
                <button
                  type="button"
                  onClick={card.onClick}
                  className="mt-3 text-xs font-extrabold underline underline-offset-4"
                >
                  {card.action}
                  <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
function MobileQuickActions({
  onAddOperation,
  onAddWeight,
  onManageFeed,
}: {
  onAddOperation: () => void;
  onAddWeight: () => void;
  onManageFeed: () => void;
}) {
  return (
    <>
      <div className="h-24 lg:hidden" />
      <nav
        aria-label="إجراءات اليوم السريعة"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto grid max-w-md grid-cols-3 gap-2 rounded-2xl border border-[#cfe1cb] bg-white/95 p-2 shadow-[0_16px_34px_-16px_rgba(36,81,60,0.45)] backdrop-blur lg:hidden"
      >
        <Button
          size="sm"
          className="h-11 rounded-xl bg-primary text-xs font-extrabold"
          onClick={onAddOperation}
        >
          <Plus className="h-4 w-4" />
          تسجيل اليوم
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-11 rounded-xl bg-white text-xs font-extrabold"
          onClick={onAddWeight}
        >
          <Scale className="h-4 w-4" />
          إضافة وزن
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-11 rounded-xl bg-white text-xs font-extrabold"
          onClick={onManageFeed}
        >
          <Warehouse className="h-4 w-4" />
          المخزون
        </Button>
      </nav>
    </>
  );
}

function ConsumptionForecastPanel({
  forecasts,
  rowForecasts,
  expectedLiveWeight,
  ageDays,
  bagWeightKg,
  onBagWeightChange,
}: {
  forecasts: {
    houseId: number;
    houseName: string;
    occupiedBirds: number;
    dailyFeedGramsPerBird: number;
    feedKg: number;
    feedBags: number;
    feedBuckets: number;
    waterLiters: number;
  }[];
  rowForecasts: {
    rowId: number;
    houseName: string;
    rowName: string;
    cageCount: number;
    birdsPerCage: number;
    occupiedBirds: number;
    dailyFeedGramsPerBird: number;
    feedKg: number;
    feedBags: number;
    feedBuckets: number;
    waterLiters: number;
  }[];
  expectedLiveWeight: number;
  ageDays: number;
  bagWeightKg: number;
  onBagWeightChange: (value: number) => void;
}) {
  const totalFeedKg = forecasts.reduce((sum, item) => sum + item.feedKg, 0);
  const totalWaterLiters = forecasts.reduce(
    (sum, item) => sum + item.waterLiters,
    0
  );
  const totalHouseBirds = forecasts.reduce(
    (sum, item) => sum + item.occupiedBirds,
    0
  );
  const totalRowBirds = rowForecasts.reduce(
    (sum, item) => sum + item.occupiedBirds,
    0
  );
  return (
    <article className="soft-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4e4] text-primary">
              <Wheat className="h-4 w-4" />
            </span>
            <p className="font-extrabold">
              الاستهلاك والوزن المتوقعان حسب العمر
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            بطاقات العنابر تمثل كامل الطيور الموزعة؛ أما تفصيل الصفوف فيخص صفوف
            الأقفاص المهيأة فقط ولا يُجمع مع إجمالي العنبر.
          </p>
        </div>
        <div className="w-full sm:w-40">
          <Label htmlFor="feed-bag-weight" className="text-xs">
            وزن الشيكارة (كجم)
          </Label>
          <Input
            id="feed-bag-weight"
            type="number"
            min="10"
            max="100"
            step="1"
            value={bagWeightKg}
            onChange={event =>
              onBagWeightChange(
                Math.max(
                  10,
                  Math.min(
                    100,
                    Number(event.target.value) || DEFAULT_FEED_BAG_WEIGHT_KG
                  )
                )
              )
            }
            className="mt-1 h-10 rounded-xl text-right"
          />
        </div>
      </div>
      <div className="border-b border-[#dce9cf] bg-[#f3f8ef] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
              <Scale className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold">متوسط الوزن المتوقع</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                مرجع Cobb 500 لعمر اليوم{" "}
                {ageDays > 0 ? arabicNumber(ageDays) : "—"} من الدورة
              </p>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-primary">
            {expectedLiveWeight > 0
              ? `${arabicNumber(expectedLiveWeight)} جم/طائر`
              : "—"}
          </p>
        </div>
      </div>
      {forecasts.length ? (
        <>
          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {forecasts.map(forecast => (
              <section
                key={forecast.houseId}
                className="rounded-2xl border border-[#dfebd6] bg-[#fbfdf9] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold">{forecast.houseName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {arabicNumber(forecast.occupiedBirds)} طائر ·{" "}
                      {arabicNumber(forecast.dailyFeedGramsPerBird)} جم/طائر
                    </p>
                  </div>
                  <Bird className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <SummaryTile
                    label="العلف"
                    value={`${arabicNumber(forecast.feedKg, 1)} كجم`}
                  />
                  <SummaryTile
                    label="الشيكارة"
                    value={`${arabicNumber(forecast.feedBags, 2)}`}
                  />
                  <SummaryTile
                    label="المياه"
                    value={`${arabicNumber(forecast.waterLiters, 1)} لتر`}
                  />
                </div>
              </section>
            ))}
          </div>
          {rowForecasts.length ? (
            <div className="border-t border-[#dce9cf] bg-[#fcfdf9] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold">العلف المتوقع لكل صف أقفاص</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    الصفوف أدناه تغطي {arabicNumber(totalRowBirds)} من{" "}
                    {arabicNumber(totalHouseBirds)} طائر موزع؛ لا تُجمع مع
                    بطاقات العنابر. الشيكارة = ٤ جرادل.
                  </p>
                </div>
                <span className="rounded-lg bg-[#eaf3e2] px-2.5 py-1 text-xs font-bold text-primary">
                  {arabicNumber(rowForecasts.length)} صفوف مهيأة فقط
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rowForecasts.map(row => (
                  <section
                    key={row.rowId}
                    className="rounded-2xl border border-[#dfebd6] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-extrabold">
                          {row.houseName} · صف {row.rowName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {arabicNumber(row.cageCount)} قفص ×{" "}
                          {arabicNumber(row.birdsPerCage)} طائر ·{" "}
                          {arabicNumber(row.occupiedBirds)} طائر
                        </p>
                      </div>
                      <Wheat className="h-4 w-4 text-primary" />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <SummaryTile
                        label="العلف"
                        value={`${arabicNumber(row.feedKg, 1)} كجم`}
                      />
                      <SummaryTile
                        label="الجرادل"
                        value={arabicNumber(row.feedBuckets, 2)}
                      />
                      <SummaryTile
                        label="الشيكارة"
                        value={arabicNumber(row.feedBags, 2)}
                      />
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-dashed border-[#dce9cf] bg-[#fcfdf9] px-5 py-4 text-sm text-muted-foreground">
              أضف صف أقفاص للعنبر من صفحة العنابر والأقفاص لإظهار الاستهلاك
              المتوقع لكل صف.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-[#f6f9f3] px-5 py-4 text-sm">
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <span>
                <strong>إجمالي العلف:</strong> {arabicNumber(totalFeedKg, 1)}{" "}
                كجم
              </span>
              <span>
                <strong>إجمالي المياه:</strong>{" "}
                {arabicNumber(totalWaterLiters, 1)} لتر
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              المياه: {DEFAULT_WATER_TO_FEED_RATIO_L_PER_KG} لتر لكل كجم علف
              كافتراض مرجعي.
            </span>
          </div>
        </>
      ) : (
        <div className="p-8 text-center">
          <Bird className="mx-auto h-6 w-6 text-[#91a889]" />
          <p className="mt-3 font-bold">لا يوجد توزيع طيور فعلي في العنابر</p>
          <p className="mt-1 text-sm text-muted-foreground">
            وزّع طيور الدورة على العنابر لإظهار تقدير الاستهلاك لكل عنبر وصف.
          </p>
        </div>
      )}
      <div className="border-t border-border bg-[#fffdf6] px-5 py-3 text-xs leading-6 text-muted-foreground">
        مرجع التخطيط: أهداف العلف والوزن الحي لـ{" "}
        <a
          className="font-bold text-primary underline"
          href="https://www.cobbgenetics.com/en_US/resources"
          target="_blank"
          rel="noreferrer"
        >
          Cobb 500
        </a>
        . هذه توقعات تشغيلية وليست ضماناً أو بديلاً عن متابعة الطبيب البيطري
        وأخصائي التغذية؛ تتأثر بالسلالة والعلف ودرجة الحرارة والتهوية وصحة
        القطيع.
      </div>
    </article>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/65">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
function DailyGuidanceCard({ guidance }: { guidance: DailyBroilerGuidance }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-[#cfe2d4] bg-[linear-gradient(135deg,#f4faf2_0%,#ffffff_55%,#eef7f5_100%)] shadow-[0_12px_34px_-24px_rgba(36,81,60,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dcebdc] bg-[#eaf4e8]/80 p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f7650] text-white shadow-lg shadow-[#2f7650]/20">
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <p className="font-extrabold">نصيحة تشغيلية لليوم</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {guidance.phase} · اليوم {arabicNumber(guidance.cycleDay)} من
              الدورة
            </p>
          </div>
        </div>
        <span className="rounded-lg border border-[#c5dfca] bg-white px-3 py-1.5 text-xs font-bold text-[#2f7650]">
          متزامنة مع العمر
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-[#254c37]">
          {guidance.title}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
          {guidance.summary}
        </p>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {guidance.checks.map(check => (
            <div
              key={check}
              className="flex gap-3 rounded-2xl border border-[#dce9df] bg-white/85 p-4"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3d8057]" />
              <p className="text-sm leading-6 text-[#3d5143]">{check}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3 rounded-2xl border border-[#f0d3b7] bg-[#fff8ef] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#bc7130]" />
          <p className="text-sm leading-6 text-[#78552f]">
            <strong>متى تُصعِّد الملاحظة:</strong> {guidance.escalation}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dcebdc] bg-white/70 px-5 py-3 text-xs text-muted-foreground sm:px-6">
        <span>
          مرجع إرشادي؛ راقب القطيع عند مستوى الطائر واتبع خطة الطبيب البيطري
          ومسؤول الإنتاج.
        </span>
        <a
          href={guidance.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-primary underline"
        >
          {guidance.sourceLabel}
        </a>
      </div>
    </article>
  );
}
function TaskRow({
  done,
  title,
  caption,
  action,
}: {
  done: boolean;
  title: string;
  caption: string;
  action?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          done
            ? "bg-[#e5f1db] text-[#4b844d]"
            : "bg-muted text-muted-foreground"
        )}
      >
        {done ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
      </div>
      {action && (
        <Button
          variant="ghost"
          size="icon"
          onClick={action}
          className="h-8 w-8 rounded-lg"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f5f8f2] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-extrabold">{value}</p>
    </div>
  );
}
function EmptyChart({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex h-[255px] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f5ea] text-primary">
        <TrendingUp className="h-6 w-6" />
      </span>
      <p className="mt-4 font-bold">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <Button
        variant="outline"
        className="mt-4 rounded-xl bg-card font-bold"
        onClick={onAction}
      >
        {action}
        <ArrowLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}

function FarmsView({
  farms,
  houses,
  cycles,
  sections,
  allocations,
  activeFarmId,
  selectedCycle,
  onSelectFarm,
  onSelectCycle,
  onAdd,
  onAddHouse,
  onAddCycle,
  onGoHousing,
  onEditLocation,
}: {
  farms: {
    id: number;
    name: string;
    governorate: string | null;
    location: string | null;
    latitude: string | null;
    longitude: string | null;
    status: string;
  }[];
  houses: {
    id: number;
    farmId: number;
    name: string;
    capacity: number;
    status: string;
  }[];
  cycles: {
    id: number;
    farmId: number;
    name: string;
    placementDate: Date;
    birdsPlaced: number;
    status: string;
  }[];
  sections: { id: number; houseId: number }[];
  allocations: { cageSectionId: number; occupiedBirds: number }[];
  activeFarmId?: number;
  selectedCycle?: {
    id: number;
    farmId: number;
    birdsPlaced: number;
    name: string;
    status: string;
  };
  onSelectFarm: (farmId: number) => void;
  onSelectCycle: (cycleId: number) => void;
  onAdd: () => void;
  onAddHouse: () => void;
  onAddCycle: () => void;
  onGoHousing: () => void;
  onEditLocation: (farm: {
    id: number;
    name: string;
    location: string | null;
    latitude: string | null;
    longitude: string | null;
  }) => void;
}) {
  const activeFarm = farms.find(farm => farm.id === activeFarmId) ?? farms[0];
  const farmHouses = houses.filter(house => house.farmId === activeFarm?.id);
  const farmCycles = cycles.filter(cycle => cycle.farmId === activeFarm?.id);
  const totalHouseCapacity = farmHouses.reduce(
    (sum, house) => sum + house.capacity,
    0
  );
  const activeFarmCycle =
    selectedCycle?.farmId === activeFarm?.id
      ? selectedCycle
      : farmCycles.find(cycle => cycle.status === "active");
  const allocatedBirds =
    activeFarmCycle?.id === selectedCycle?.id
      ? allocations.reduce(
          (sum, allocation) => sum + allocation.occupiedBirds,
          0
        )
      : 0;
  const remainingAssignable = activeFarmCycle
    ? Math.max(0, activeFarmCycle.birdsPlaced - allocatedBirds)
    : 0;
  const statusLabel = (status: string) =>
    status === "active"
      ? "نشطة"
      : status === "upcoming"
        ? "قادمة"
        : status === "closed"
          ? "مغلقة"
          : "مسودة";
  return (
    <section className="space-y-5">
      <article className="soft-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="font-extrabold">المزارع وإعداداتها</p>
            <p className="mt-1 text-sm text-muted-foreground">
              اختر مزرعة لإدارة العنابر والدورات التابعة لها من نفس الصفحة.
            </p>
          </div>
          <Button className="rounded-xl bg-primary font-bold" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            إضافة مزرعة
          </Button>
        </div>
        <div className="grid gap-3 border-t border-border p-5 lg:grid-cols-2">
          {farms.map(farm => {
            const capacity = houses
              .filter(house => house.farmId === farm.id)
              .reduce((sum, house) => sum + house.capacity, 0);
            return (
              <button
                key={farm.id}
                onClick={() => onSelectFarm(farm.id)}
                className={cn(
                  "grid items-center gap-4 rounded-2xl border p-4 text-right transition-colors sm:grid-cols-[auto_1fr_auto]",
                  activeFarm?.id === farm.id
                    ? "border-primary/40 bg-[#f1f7ed]"
                    : "border-[#e1ead7] bg-[#fafcf8] hover:border-primary/30"
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1dc] text-primary">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-extrabold">{farm.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {arabicNumber(capacity)} طائر سعة إجمالية ·{" "}
                    {arabicNumber(
                      houses.filter(house => house.farmId === farm.id).length
                    )}{" "}
                    عنبر
                  </p>
                </div>
                <ChevronLeft className="h-4 w-4 text-primary" />
              </button>
            );
          })}
        </div>
      </article>
      {activeFarm && (
        <article className="soft-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-6">
            <div>
              <p className="text-xs font-bold text-primary">
                إعدادات المزرعة المحددة
              </p>
              <h2 className="mt-1 text-xl font-extrabold">{activeFarm.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                العنابر والدورات أدناه جزء من هذه المزرعة فقط.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl bg-card text-xs font-bold"
                onClick={() => onEditLocation(activeFarm)}
              >
                {activeFarm.latitude && activeFarm.longitude
                  ? "تحديث موقع الطقس"
                  : "ربط موقع الطقس"}
              </Button>
              <Button
                className="rounded-xl bg-primary text-xs font-bold"
                onClick={onAddHouse}
              >
                <Plus className="h-4 w-4" />
                إضافة عنبر
              </Button>
              <Button
                className="rounded-xl bg-primary text-xs font-bold"
                onClick={onAddCycle}
              >
                <Plus className="h-4 w-4" />
                إنشاء دورة
              </Button>
            </div>
          </div>
          <div className="grid gap-3 border-b border-border bg-[#f6f9f3] p-5 sm:grid-cols-4">
            <SummaryTile
              label="السعة الإجمالية للعنابر"
              value={`${arabicNumber(totalHouseCapacity)} طائر`}
            />
            <SummaryTile
              label="طيور الدورة المحددة"
              value={
                activeFarmCycle
                  ? `${arabicNumber(activeFarmCycle.birdsPlaced)} طائر`
                  : "لا توجد دورة"
              }
            />
            <SummaryTile
              label="المتبقي للتوزيع"
              value={
                activeFarmCycle
                  ? `${arabicNumber(remainingAssignable)} طائر`
                  : "—"
              }
            />
            <SummaryTile
              label="عدد العنابر"
              value={`${arabicNumber(farmHouses.length)} عنبر`}
            />
          </div>
          <div className="grid gap-0 lg:grid-cols-2">
            <section className="border-b border-border p-6 lg:border-b-0 lg:border-l">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold">إعدادات العنابر</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    السعة، الحالة، وأقسام البطاريات التابعة للمزرعة.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="rounded-xl text-primary"
                  onClick={onGoHousing}
                >
                  تفاصيل الأقفاص
                </Button>
              </div>
              {farmHouses.length ? (
                <div className="mt-5 space-y-3">
                  {farmHouses.map(house => (
                    <div
                      key={house.id}
                      className="rounded-xl border border-[#e1ead7] bg-[#fafcf8] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{house.name}</p>
                        <span className="rounded-lg bg-[#eaf3e2] px-2 py-1 text-xs font-bold text-primary">
                          {statusLabel(house.status)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <SummaryCell
                          label="السعة"
                          value={`${arabicNumber(house.capacity)} طائر`}
                        />
                        <SummaryCell
                          label="أقسام الأقفاص"
                          value={arabicNumber(
                            sections.filter(
                              section => section.houseId === house.id
                            ).length
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-[#cfdcc6] p-5 text-center">
                  <Bird className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-bold">
                    لم تُضف عنابر لهذه المزرعة
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 rounded-xl bg-card text-xs font-bold"
                    onClick={onAddHouse}
                  >
                    إضافة أول عنبر
                  </Button>
                </div>
              )}
            </section>
            <section className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold">إعدادات الدورات</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    إنشاء الدورات ومراجعة الحالة وبيانات الاستقبال.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="rounded-xl text-primary"
                  onClick={onAddCycle}
                >
                  إنشاء دورة
                </Button>
              </div>
              {farmCycles.length ? (
                <div className="mt-5 space-y-3">
                  {farmCycles.map(cycle => (
                    <button
                      key={cycle.id}
                      onClick={() => onSelectCycle(cycle.id)}
                      className={cn(
                        "grid w-full gap-3 rounded-xl border p-4 text-right sm:grid-cols-[1fr_auto_auto]",
                        activeFarmCycle?.id === cycle.id
                          ? "border-primary/40 bg-[#f1f7ed]"
                          : "border-[#e1ead7] bg-[#fafcf8]"
                      )}
                    >
                      <div>
                        <p className="font-bold">{cycle.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          استقبال: {arabicDate(cycle.placementDate)} ·{" "}
                          {arabicNumber(cycle.birdsPlaced)} طائر
                        </p>
                      </div>
                      <span className="rounded-lg bg-[#edf4e4] px-2 py-1 text-xs font-bold text-primary">
                        {statusLabel(cycle.status)}
                      </span>
                      <ChevronLeft className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-[#cfdcc6] p-5 text-center">
                  <CalendarDays className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-bold">
                    لا توجد دورات لهذه المزرعة
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 rounded-xl bg-card text-xs font-bold"
                    onClick={onAddCycle}
                  >
                    إنشاء أول دورة
                  </Button>
                </div>
              )}
            </section>
          </div>
        </article>
      )}
    </section>
  );
}
function CyclesView({
  cycles,
  selectedCycleId,
  onAdd,
  onSelect,
}: {
  cycles: {
    id: number;
    name: string;
    birdsPlaced: number;
    placementDate: Date;
    status: string;
  }[];
  selectedCycleId?: number;
  onAdd: () => void;
  onSelect: (id: number) => void;
}) {
  const label = (status: string) =>
    status === "active"
      ? "نشطة"
      : status === "upcoming"
        ? "قادمة"
        : status === "closed"
          ? "مغلقة"
          : "مسودة";
  return (
    <section className="soft-card overflow-hidden">
      <div className="flex items-center justify-between p-6">
        <div>
          <p className="font-extrabold">دورات التسمين</p>
          <p className="mt-1 text-sm text-muted-foreground">
            تابع الحالة التشغيلية لكل دورة واختر السياق المعروض في لوحة
            المتابعة.
          </p>
        </div>
        <Button className="rounded-xl bg-primary font-bold" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          إنشاء دورة
        </Button>
      </div>
      <div className="space-y-3 border-t border-border p-6">
        {cycles.map(cycle => (
          <button
            key={cycle.id}
            onClick={() => onSelect(cycle.id)}
            className={cn(
              "grid w-full gap-4 rounded-2xl border p-5 text-right transition-colors md:grid-cols-4",
              selectedCycleId === cycle.id
                ? "border-primary/40 bg-[#f1f7ed]"
                : "border-[#e1ead7] bg-[#fafcf8] hover:border-primary/30"
            )}
          >
            <SummaryCell label="الدورة" value={cycle.name} />
            <SummaryCell
              label="الكتاكيت المستقبلة"
              value={arabicNumber(cycle.birdsPlaced)}
            />
            <SummaryCell
              label="الاستقبال"
              value={arabicDate(cycle.placementDate)}
            />
            <SummaryCell label="الحالة" value={label(cycle.status)} />
          </button>
        ))}
      </div>
    </section>
  );
}
function HousingView({
  cycleName,
  houses,
  rows,
  onAddCage,
}: {
  cycleName: string;
  houses: AssignedHouseOption[];
  rows: {
    id: number;
    houseId: number;
    houseName: string;
    name: string;
    rowName: string;
    cageCount: number;
    capacityPerCage: number;
    assignedBirds: number;
    occupiedBirds: number;
  }[];
  onAddCage: () => void;
}) {
  return (
    <section className="space-y-5">
      <article className="rounded-3xl bg-[#285c3b] p-6 text-white shadow-[0_18px_44px_-28px_rgba(18,63,41,0.8)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#dfeecb]">
              <Bird className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl font-extrabold">
              صفوف أقفاص دورة {cycleName}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/75">
              تظهر هنا العنابر التي لديها طيور مخصّصة في الدورة فقط. أضف صفاً
              عبر عدد الأقفاص وعدد الكتاكيت في القفص؛ يُسجّل الصف مباشرة على
              الدورة الحالية.
            </p>
          </div>
          <Button
            className="rounded-xl bg-[#dfeecb] font-bold text-[#285c3b] hover:bg-[#edf5e4]"
            onClick={onAddCage}
            disabled={!houses.length}
          >
            <Plus className="h-4 w-4" />
            إضافة صف أقفاص
          </Button>
        </div>
      </article>
      {houses.length ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {houses.map(house => {
            const houseRows = rows.filter(row => row.houseId === house.id);
            const rowCapacity = houseRows.reduce(
              (sum, row) => sum + row.cageCount * row.capacityPerCage,
              0
            );
            const occupiedBirds = houseRows.reduce(
              (sum, row) => sum + row.occupiedBirds,
              0
            );
            return (
              <article key={house.id} className="soft-card overflow-hidden">
                <div className="flex items-start justify-between border-b border-border bg-[#f5f9f0] p-5">
                  <div>
                    <p className="font-extrabold">{house.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {arabicNumber(house.assignedBirds)} طائر مخصص للدورة
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#e7f2df] px-2.5 py-1 text-xs font-bold text-primary">
                    {arabicNumber(houseRows.length)} صفوف
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 border-b border-border p-4">
                  <SummaryTile
                    label="سعة الصفوف"
                    value={`${arabicNumber(rowCapacity)} طائر`}
                  />
                  <SummaryTile
                    label="المشغّل"
                    value={`${arabicNumber(occupiedBirds)} طائر`}
                  />
                </div>
                {houseRows.length ? (
                  <div className="divide-y divide-border">
                    {houseRows.map(row => {
                      const capacity = row.cageCount * row.capacityPerCage;
                      return (
                        <div key={row.id} className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold">صف {row.rowName}</p>
                            <span className="rounded-lg bg-[#eaf3e2] px-2.5 py-1 text-xs font-bold text-primary">
                              {arabicNumber(row.occupiedBirds)} /{" "}
                              {arabicNumber(capacity)}
                            </span>
                          </div>
                          <Progress
                            value={
                              capacity
                                ? Math.min(
                                    100,
                                    (row.occupiedBirds / capacity) * 100
                                  )
                                : 0
                            }
                            className="mt-3 h-2 bg-[#e8eee3] [&>div]:bg-primary"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            {arabicNumber(row.cageCount)} قفص ×{" "}
                            {arabicNumber(row.capacityPerCage)} كتكوت في القفص
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 text-center">
                    <p className="text-sm font-bold">
                      لا توجد صفوف أقفاص لهذا العنبر
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3 rounded-xl bg-card text-xs font-bold"
                      onClick={onAddCage}
                    >
                      إضافة أول صف
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <article className="soft-card p-10 text-center">
          <Bird className="mx-auto h-8 w-8 text-[#91a889]" />
          <p className="mt-4 font-extrabold">وزّع الطيور على العنابر أولاً</p>
          <p className="mt-2 text-sm text-muted-foreground">
            تظهر صفوف الأقفاص فقط للعنابر المرتبطة بالدورة الحالية وبها عدد طيور
            فعلي.
          </p>
        </article>
      )}
    </section>
  );
}
function OperationsView({
  records,
  onAdd,
}: {
  records: DailyRecord[];
  onAdd: () => void;
}) {
  return (
    <section className="soft-card overflow-hidden">
      <div className="flex items-center justify-between p-6">
        <div>
          <p className="font-extrabold">سجل العمليات اليومية</p>
          <p className="mt-1 text-sm text-muted-foreground">
            العلف والمياه والنافق والاستبعادات حسب تاريخ التسجيل.
          </p>
        </div>
        <Button className="rounded-xl bg-primary font-bold" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          إضافة سجل
        </Button>
      </div>
      <div className="overflow-x-auto border-t border-border">
        {records.length ? (
          <table className="w-full min-w-[680px] text-right text-sm">
            <thead className="bg-[#f6f8f2] text-xs text-muted-foreground">
              <tr>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">العلف</th>
                <th className="p-4 font-bold">المياه</th>
                <th className="p-4 font-bold">النافق</th>
                <th className="p-4 font-bold">الاستبعادات</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.date} className="border-t border-border/70">
                  <td className="p-4 font-bold">{arabicDate(record.date)}</td>
                  <td className="p-4">{arabicNumber(record.feed, 1)} كجم</td>
                  <td className="p-4">{arabicNumber(record.water, 1)} لتر</td>
                  <td className="p-4">{arabicNumber(record.mortality)}</td>
                  <td className="p-4">{arabicNumber(record.culls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyTable
            title="لا توجد عمليات مسجلة"
            description="أضف أول سجل يومي لبناء مؤشرات هذه الدورة."
            action="إضافة سجل"
            onAction={onAdd}
          />
        )}
      </div>
    </section>
  );
}
function HealthView({
  records,
  onAdd,
}: {
  records: { date: string; name: string; type: string; dosage: string }[];
  onAdd: () => void;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      <article className="soft-card overflow-hidden">
        <div className="flex items-center justify-between p-6">
          <div>
            <p className="font-extrabold">العلاج والتحصين</p>
            <p className="mt-1 text-sm text-muted-foreground">
              سجل التنفيذ الطبي وخطة الأحداث القادمة.
            </p>
          </div>
          <Button className="rounded-xl bg-primary font-bold" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            إضافة حدث
          </Button>
        </div>
        {records.length ? (
          <div className="divide-y divide-border">
            {records.map(record => (
              <div
                key={`${record.name}-${record.date}`}
                className="flex items-center gap-4 p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f2df] text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="font-bold">{record.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {record.type} · {record.dosage} · {arabicDate(record.date)}
                  </p>
                </div>
                <Check className="h-4 w-4 text-primary" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyTable
            title="لا توجد أحداث صحية بعد"
            description="أضف علاجاً أو تحصيناً ليظهر هنا في السجل الطبي."
            action="إضافة حدث"
            onAction={onAdd}
          />
        )}
      </article>
      <article className="rounded-2xl bg-[#f0f6eb] p-6">
        <ThermometerSun className="h-6 w-6 text-primary" />
        <p className="mt-5 font-extrabold">تذكير بالمتابعة</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          احتفظ باسم المستحضر والجرعة وطريقة الإعطاء وتاريخ التنفيذ في كل حدث
          لتسهيل المراجعة البيطرية.
        </p>
      </article>
    </section>
  );
}
function GrowthView({
  records,
  fcr,
  onAdd,
}: {
  records: WeightRecord[];
  fcr: number;
  onAdd: () => void;
}) {
  const data = records.map(record => ({
    ...record,
    label: arabicDate(record.date),
  }));
  return (
    <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
      <article className="soft-card min-h-[380px] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold">منحنى الوزن الحي</p>
            <p className="mt-1 text-sm text-muted-foreground">
              سجّل عينات منتظمة لرؤية مسار النمو الفعلي.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl bg-card font-bold"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" />
            إضافة وزن
          </Button>
        </div>
        {data.length ? (
          <div className="mt-7 h-[260px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid vertical={false} stroke="#edf0e8" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#708073", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#708073", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#dfe7d8",
                    fontFamily: "Cairo",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="الوزن (جم)"
                  stroke="#4f8753"
                  strokeWidth={3}
                  dot={{ fill: "#4f8753", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart
            title="سجّل أول عينة وزن"
            description="المقارنة مع المستهدف تبدأ عندما تضيف القراءات الفعلية."
            action="إضافة وزن"
            onAction={onAdd}
          />
        )}
      </article>
      <article className="soft-card p-6">
        <p className="font-extrabold">مؤشرات النمو</p>
        <div className="mt-6 space-y-3">
          <SummaryTile
            label="معامل التحويل الغذائي"
            value={fcr ? arabicNumber(fcr, 2) : "لا بيانات"}
          />
          <SummaryTile
            label="عينات الوزن"
            value={`${arabicNumber(records.length)} عينة`}
          />
          <SummaryTile label="منحنى المستهدف" value="يُضبط من إعدادات الدورة" />
        </div>
      </article>
    </section>
  );
}
function ReportsView({
  placed,
  mortality,
  totalFeed,
  latestWeight,
  fcr,
  ageDays,
  status,
  onClose,
}: {
  placed: number;
  mortality: number;
  totalFeed: number;
  latestWeight: number;
  fcr: number;
  ageDays: number;
  status: string;
  onClose: () => void;
}) {
  const hasReportData = placed > 0 && latestWeight > 0 && totalFeed > 0;
  const epef =
    hasReportData && ageDays > 0
      ? ((1 - mortality / placed) * latestWeight * 10) / (fcr * ageDays)
      : 0;
  const isClosed = status === "closed";
  return (
    <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <article className="soft-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-extrabold">تقرير إغلاق الدورة</p>
            <p className="mt-1 text-sm text-muted-foreground">
              يتكوّن من بيانات التشغيل الفعلية عند جاهزية الدورة للإغلاق.
            </p>
          </div>
          <FileBarChart2 className="h-5 w-5 text-primary" />
        </div>
        {hasReportData ? (
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <SummaryTile
              label="الكتاكيت المستقبلة"
              value={arabicNumber(placed)}
            />
            <SummaryTile
              label="إجمالي النافق"
              value={arabicNumber(mortality)}
            />
            <SummaryTile
              label="إجمالي العلف"
              value={`${arabicNumber(totalFeed, 1)} كجم`}
            />
            <SummaryTile
              label="الوزن النهائي"
              value={`${arabicNumber(latestWeight)} جم`}
            />
            <SummaryTile label="معامل التحويل" value={arabicNumber(fcr, 2)} />
            <SummaryTile label="EPEF" value={arabicNumber(epef, 1)} />
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-[#cfdcc6] p-8 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-[#af8b38]" />
            <p className="mt-3 font-bold">التقرير بانتظار بيانات كافية</p>
            <p className="mt-1 text-sm text-muted-foreground">
              أضف الوزن والعلف والقراءات اليومية ليكتمل ملخص الإغلاق.
            </p>
          </div>
        )}
      </article>
      <article className="rounded-2xl bg-[#285c3b] p-6 text-white">
        <p className="text-sm font-bold text-[#dfeecb]">
          {isClosed ? "تم الإغلاق" : "قبل الإغلاق"}
        </p>
        <p className="mt-3 text-xl font-extrabold">
          {isClosed
            ? "تم حفظ التقرير التاريخي للدورة."
            : "راجع البيانات واتخذ قرارك بثقة."}
        </p>
        <p className="mt-3 text-sm leading-7 text-white/70">
          يظل سجل الدورة محفوظاً عند الإغلاق لتتمكن من المقارنة والتحليل لاحقاً.
        </p>
        <Button
          disabled={!hasReportData || isClosed}
          onClick={onClose}
          className="mt-7 w-full rounded-xl bg-[#dfeecb] font-bold text-[#285c3b] hover:bg-[#edf5e4]"
        >
          {isClosed ? "الدورة مغلقة" : "إنهاء الدورة وإصدار التقرير"}
        </Button>
      </article>
    </section>
  );
}
function EmptyTable({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1f5ec] text-primary">
        <ClipboardPlus className="h-5 w-5" />
      </span>
      <p className="mt-4 font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <Button
        variant="outline"
        className="mt-5 rounded-xl bg-card font-bold"
        onClick={onAction}
      >
        {action}
        <ArrowLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}

function OperationDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSubmit: (record: DailyRecord) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      date: String(form.get("date")),
      feed: Number(form.get("feed") || 0),
      water: Number(form.get("water") || 0),
      mortality: Number(form.get("mortality") || 0),
      culls: Number(form.get("culls") || 0),
    });
    onOpenChange(false);
    event.currentTarget.reset();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة قراءة يومية</DialogTitle>
          <DialogDescription className="text-right">
            أدخل القيم الفعلية لليوم. يمكنك مراجعتها لاحقاً من سجل العمليات.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="operation-date">التاريخ</Label>
            <Input
              id="operation-date"
              name="date"
              type="date"
              required
              className="mt-2 h-11 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field name="feed" label="العلف (كجم)" min="0" step="0.1" />
            <Field name="water" label="المياه (لتر)" min="0" step="0.1" />
            <Field name="mortality" label="النافق" min="0" step="1" />
            <Field name="culls" label="الاستبعادات" min="0" step="1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              حفظ القراءة
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function WeightDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSubmit: (record: WeightRecord) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      date: String(form.get("date")),
      weight: Number(form.get("weight") || 0),
    });
    onOpenChange(false);
    event.currentTarget.reset();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة عينة وزن</DialogTitle>
          <DialogDescription className="text-right">
            سجل متوسط الوزن الحي لعينة ممثلة من القطيع.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="weight-date">التاريخ</Label>
            <Input
              id="weight-date"
              name="date"
              type="date"
              required
              className="mt-2 h-11 rounded-xl"
            />
          </div>
          <Field
            name="weight"
            label="متوسط الوزن (جم)"
            min="1"
            step="1"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              حفظ العينة
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function HealthDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSubmit: (record: {
    date: string;
    name: string;
    type: string;
    dosage: string;
  }) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      date: String(form.get("date")),
      name: String(form.get("name")),
      type: String(form.get("type")),
      dosage: String(form.get("dosage")),
    });
    onOpenChange(false);
    event.currentTarget.reset();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة حدث صحي</DialogTitle>
          <DialogDescription className="text-right">
            سجل بيانات العلاج أو التحصين القابلة للمراجعة.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Field name="name" label="اسم المستحضر" required />
            <Field name="type" label="النوع (علاج/تحصين)" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field name="dosage" label="الجرعة وطريقة الإعطاء" required />
            <div>
              <Label htmlFor="health-date">تاريخ التنفيذ</Label>
              <Input
                id="health-date"
                name="date"
                type="date"
                required
                className="mt-2 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              حفظ الحدث
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function HouseDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSubmit: (house: { name: string; capacity: number }) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      name: String(form.get("name")),
      capacity: Number(form.get("capacity") || 0),
    });
    onOpenChange(false);
    event.currentTarget.reset();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة عنبر</DialogTitle>
          <DialogDescription className="text-right">
            أدخل تعريف العنبر الفعلي قبل إعداد البطاريات.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <Field name="name" label="اسم أو رقم العنبر" required />
          <Field name="capacity" label="الطاقة الاستيعابية" min="0" step="1" />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              حفظ العنبر
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function CageDialog({
  open,
  onOpenChange,
  houses,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  houses: { id: number; name: string }[];
  onSubmit: (section: {
    houseId: number;
    name: string;
    rowName: string;
    cageCount: number;
    capacityPerCage: number;
  }) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rowName = String(form.get("rowName")).trim();
    onSubmit({
      houseId: Number(form.get("houseId")),
      name: `صف ${rowName}`,
      rowName,
      cageCount: Number(form.get("cageCount")),
      capacityPerCage: Number(form.get("capacityPerCage")),
    });
    onOpenChange(false);
    event.currentTarget.reset();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">
            إضافة صف أقفاص للدورة
          </DialogTitle>
          <DialogDescription className="text-right">
            اختر أحد عنابر الدورة، ثم أدخل عدد الأقفاص وعدد الكتاكيت في القفص.
            لا يمكن تجاوز طيور العنبر المخصصة أو سعته.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="houseId">عنبر الدورة</Label>
            <select
              id="houseId"
              name="houseId"
              required
              defaultValue={houses[0]?.id}
              className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              {houses.map(house => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </div>
          <Field name="rowName" label="اسم أو رمز الصف" required />
          <div className="grid grid-cols-2 gap-4">
            <Field
              name="cageCount"
              label="عدد الأقفاص في الصف"
              min="1"
              step="1"
              required
            />
            <Field
              name="capacityPerCage"
              label="عدد الكتاكيت في القفص"
              min="1"
              step="1"
              required
            />
          </div>
          <div className="rounded-xl bg-[#f5f8f2] p-3 text-xs leading-6 text-muted-foreground">
            سيظهر استهلاك العلف المتوقع لهذا الصف في لوحة المتابعة بالكيلو
            والجرادل والشكاير. الشيكارة = ٤ جرادل.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              حفظ صف الأقفاص
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function FarmDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSubmit: (farm: {
    name: string;
    governorate?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    locationSource?: "manual" | "device";
  }) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const latitude = String(form.get("latitude") || "");
    const longitude = String(form.get("longitude") || "");
    onSubmit({
      name: String(form.get("name")),
      governorate: String(form.get("governorate") || ""),
      location: String(form.get("location") || ""),
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      locationSource: "manual",
    });
    onOpenChange(false);
    event.currentTarget.reset();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة مزرعة</DialogTitle>
          <DialogDescription className="text-right">
            أدخل الموقع والإحداثيات لربط طقس الدورة بالمزرعة.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <Field name="name" label="اسم المزرعة" required />
          <Field name="governorate" label="المحافظة" />
          <Field name="location" label="الموقع أو العنوان" />
          <div className="grid grid-cols-2 gap-4">
            <Field name="latitude" label="خط العرض" />
            <Field name="longitude" label="خط الطول" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              حفظ المزرعة
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function EditFarmDialog({
  farm,
  error,
  onClose,
  onSubmit,
}: {
  farm: {
    id: number;
    name: string;
    governorate: string | null;
    location: string | null;
  } | null;
  error: string;
  onClose: () => void;
  onSubmit: (input: {
    farmId: number;
    name: string;
    governorate?: string;
    location?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [location, setLocation] = useState("");
  useEffect(() => {
    setName(farm?.name ?? "");
    setGovernorate(farm?.governorate ?? "");
    setLocation(farm?.location ?? "");
  }, [farm]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (farm)
      onSubmit({
        farmId: farm.id,
        name,
        governorate: governorate || undefined,
        location: location || undefined,
      });
  };
  return (
    <Dialog open={Boolean(farm)} onOpenChange={open => !open && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تعديل بيانات المزرعة</DialogTitle>
          <DialogDescription className="text-right">
            عدّل بيانات تعريف المزرعة بدون تغيير العنابر أو الدورات التابعة لها.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="edit-farm-name">اسم المزرعة</Label>
            <Input
              id="edit-farm-name"
              value={name}
              onChange={event => setName(event.target.value)}
              required
              className="mt-2 h-11 rounded-xl text-right"
            />
          </div>
          <div>
            <Label htmlFor="edit-farm-governorate">المحافظة</Label>
            <Input
              id="edit-farm-governorate"
              value={governorate}
              onChange={event => setGovernorate(event.target.value)}
              className="mt-2 h-11 rounded-xl text-right"
            />
          </div>
          <div>
            <Label htmlFor="edit-farm-location">الموقع أو العنوان</Label>
            <Input
              id="edit-farm-location"
              value={location}
              onChange={event => setLocation(event.target.value)}
              className="mt-2 h-11 rounded-xl text-right"
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </p>
          )}
          <DialogActions onClose={onClose} label="حفظ التعديلات" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
function EditCycleDialog({
  cycle,
  error,
  onClose,
  onSubmit,
}: {
  cycle: {
    id: number;
    name: string;
    placementDate: Date;
    birdsPlaced: number;
  } | null;
  error: string;
  onClose: () => void;
  onSubmit: (input: {
    cycleId: number;
    name: string;
    placementDate: string;
    birdsPlaced: number;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [placementDate, setPlacementDate] = useState("");
  const [birdsPlaced, setBirdsPlaced] = useState("");
  useEffect(() => {
    setName(cycle?.name ?? "");
    setPlacementDate(
      cycle ? new Date(cycle.placementDate).toISOString().slice(0, 10) : ""
    );
    setBirdsPlaced(cycle ? String(cycle.birdsPlaced) : "");
  }, [cycle]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cycle)
      onSubmit({
        cycleId: cycle.id,
        name,
        placementDate,
        birdsPlaced: Number(birdsPlaced),
      });
  };
  return (
    <Dialog open={Boolean(cycle)} onOpenChange={open => !open && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تعديل دورة التسمين</DialogTitle>
          <DialogDescription className="text-right">
            لا يمكن تقليل عدد طيور الدورة عن العدد الموزع بالفعل على العنابر.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="edit-cycle-name">اسم الدورة</Label>
            <Input
              id="edit-cycle-name"
              value={name}
              onChange={event => setName(event.target.value)}
              required
              className="mt-2 h-11 rounded-xl text-right"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-cycle-date">تاريخ الاستقبال</Label>
              <Input
                id="edit-cycle-date"
                type="date"
                value={placementDate}
                onChange={event => setPlacementDate(event.target.value)}
                required
                className="mt-2 h-11 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="edit-cycle-birds">الطيور المستقبلة</Label>
              <Input
                id="edit-cycle-birds"
                type="number"
                min="1"
                value={birdsPlaced}
                onChange={event => setBirdsPlaced(event.target.value)}
                required
                className="mt-2 h-11 rounded-xl text-right"
              />
            </div>
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </p>
          )}
          <DialogActions onClose={onClose} label="حفظ التعديلات" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
function EditHouseDialog({
  house,
  error,
  onClose,
  onSubmit,
}: {
  house: { id: number; name: string; capacity: number } | null;
  error: string;
  onClose: () => void;
  onSubmit: (input: {
    houseId: number;
    name: string;
    capacity: number;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  useEffect(() => {
    setName(house?.name ?? "");
    setCapacity(house ? String(house.capacity) : "");
  }, [house]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (house)
      onSubmit({ houseId: house.id, name, capacity: Number(capacity) });
  };
  return (
    <Dialog open={Boolean(house)} onOpenChange={open => !open && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تعديل بيانات العنبر</DialogTitle>
          <DialogDescription className="text-right">
            لا يمكن أن تقل السعة عن مجموع سعات أقسام الأقفاص المعرّفة داخله.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="edit-house-name">اسم العنبر</Label>
            <Input
              id="edit-house-name"
              value={name}
              onChange={event => setName(event.target.value)}
              required
              className="mt-2 h-11 rounded-xl text-right"
            />
          </div>
          <div>
            <Label htmlFor="edit-house-capacity">السعة الاستيعابية</Label>
            <Input
              id="edit-house-capacity"
              type="number"
              min="0"
              value={capacity}
              onChange={event => setCapacity(event.target.value)}
              required
              className="mt-2 h-11 rounded-xl text-right"
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </p>
          )}
          <DialogActions onClose={onClose} label="حفظ التعديلات" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
function DeleteRecordDialog({
  target,
  error,
  onClose,
  onConfirm,
}: {
  target: LifecycleTarget | null;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const typeLabel =
    target?.kind === "farm"
      ? "المزرعة"
      : target?.kind === "cycle"
        ? "الدورة"
        : "العنبر";
  const impact = trpc.workspace.getCascadeDeletionImpact.useQuery(
    { kind: target?.kind ?? "farm", id: target?.id ?? 1 },
    { enabled: Boolean(target) }
  );
  return (
    <Dialog open={Boolean(target)} onOpenChange={open => !open && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right text-destructive">
            تأكيد حذف {typeLabel}
          </DialogTitle>
          <DialogDescription className="text-right">
            سيُحذف {typeLabel} «{target?.name}» وكل السجلات التابعة له نهائياً.
            لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-800">
          <AlertTriangle className="ml-1 inline h-4 w-4" />
          {impact.isLoading ? (
            "جارٍ حصر البيانات التابعة…"
          ) : impact.data ? (
            <>
              <strong>
                سيشمل الحذف {arabicNumber(impact.data.totalRelatedRecords)}{" "}
                سجلًا:
              </strong>
              <ul className="mt-2 list-disc space-y-1 pr-5">
                {impact.data.items.map(item => (
                  <li key={item.key}>
                    {arabicNumber(item.count)} {item.label}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            "تعذر حصر البيانات التابعة. أعد المحاولة قبل التأكيد."
          )}
        </div>
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={onClose}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl font-bold"
            onClick={onConfirm}
            disabled={impact.isLoading || !impact.data}
          >
            <Trash2 className="h-4 w-4" />
            حذف نهائياً وكل ما يرتبط به
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function DeleteHealthEventDialog({
  record,
  error,
  onClose,
  onConfirm,
}: {
  record: HealthEventFormRecord | null;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(record)} onOpenChange={open => !open && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right text-destructive">
            تأكيد حذف السجل الصحي
          </DialogTitle>
          <DialogDescription className="text-right">
            سيُحذف سجل «{record?.productName}» من العنبر المرتبط به. لا يمكن
            التراجع عن هذه العملية.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-800">
          <AlertTriangle className="ml-1 inline h-4 w-4" />
          راجع المنتج والتاريخ قبل الحذف، ثم أعد تسجيله فقط إذا كان التنفيذ
          الفعلي يتطلب ذلك.
        </div>
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={onClose}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl font-bold"
            onClick={onConfirm}
          >
            <Trash2 className="h-4 w-4" />
            حذف السجل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function DialogActions({
  onClose,
  label,
}: {
  onClose: () => void;
  label: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button
        type="button"
        variant="ghost"
        className="rounded-xl"
        onClick={onClose}
      >
        إلغاء
      </Button>
      <Button type="submit" className="rounded-xl bg-primary font-bold">
        {label}
      </Button>
    </div>
  );
}
function WeatherCard({
  weather,
  loading,
  weatherDate,
  placementDate,
  onWeatherDateChange,
  onConfigureLocation,
}: {
  weather?:
    | {
        state: "ready";
        weatherDate: string;
        cycleDay: number;
        weatherCode: number;
        currentTemperature: number | null;
        temperatureHigh: number;
        temperatureLow: number;
        humidity: number | null;
        windSpeed: number | null;
        apparentTemperature: number | null;
      }
    | { state: "location_required"; farmName: string };
  loading: boolean;
  weatherDate: string;
  placementDate: string;
  onWeatherDateChange: (value: string) => void;
  onConfigureLocation: () => void;
}) {
  const panelState = weatherPanelState(weather, loading);
  const dateControl = (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <Label htmlFor="cycle-weather-date" className="text-xs text-white/70">
        تاريخ يوم الدورة
      </Label>
      <Input
        id="cycle-weather-date"
        type="date"
        min={placementDate || undefined}
        value={weatherDate}
        onChange={event => onWeatherDateChange(event.target.value)}
        className="mt-1 h-8 border-white/20 bg-white/10 text-xs text-white [color-scheme:dark]"
      />
    </div>
  );
  if (panelState === "loading")
    return (
      <section className="soft-card flex min-h-32 items-center justify-center p-5 text-sm font-bold text-muted-foreground">
        جارٍ مزامنة حالة الطقس مع يوم الدورة…
      </section>
    );
  if (
    panelState === "location_required" &&
    weather?.state === "location_required"
  )
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e8d7ac] bg-[#fff9ea] p-5">
        <div>
          <p className="font-extrabold text-[#7a6328]">
            يتطلب الطقس موقع المزرعة
          </p>
          <p className="mt-1 text-sm text-[#8b7745]">
            أضف خط العرض وخط الطول لمزرعة {weather.farmName} لعرض الطقس المتزامن
            مع الدورة.
          </p>
        </div>
        <Button
          className="rounded-xl bg-[#8a6e24] font-bold hover:bg-[#735b1f]"
          onClick={onConfigureLocation}
        >
          إعداد موقع المزرعة
        </Button>
      </section>
    );
  if (panelState === "ready" && weather?.state === "ready")
    return (
      <section className="overflow-hidden rounded-2xl bg-[#285c3b] p-5 text-white shadow-[0_18px_44px_-28px_rgba(18,63,41,0.8)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#dfeecb]">
              طقس يوم الدورة {arabicNumber(weather.cycleDay)}
            </p>
            <p className="mt-1 text-lg font-extrabold">
              {arabicWeatherLabel(weather.weatherCode)} ·{" "}
              {arabicDate(weather.weatherDate)}
            </p>
          </div>
          {dateControl}
          <div className="rounded-xl bg-white/10 px-4 py-2">
            <p className="text-xs text-white/65">الآن</p>
            <p className="mt-1 text-2xl font-extrabold">
              {weather.currentTemperature === null
                ? "—"
                : `${arabicNumber(weather.currentTemperature, 1)}°`}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 border-t border-white/12 pt-4 sm:grid-cols-4">
          <WeatherMetric
            label="العظمى / الصغرى"
            value={`${arabicNumber(weather.temperatureHigh, 1)}° / ${arabicNumber(weather.temperatureLow, 1)}°`}
          />
          <WeatherMetric
            label="الرطوبة"
            value={
              weather.humidity === null
                ? "—"
                : `%${arabicNumber(weather.humidity)}`
            }
          />
          <WeatherMetric
            label="سرعة الرياح"
            value={
              weather.windSpeed === null
                ? "—"
                : `${arabicNumber(weather.windSpeed, 1)} كم/س`
            }
          />
          <WeatherMetric
            label="المحسوسة"
            value={
              weather.apparentTemperature === null
                ? "—"
                : `${arabicNumber(weather.apparentTemperature, 1)}°`
            }
          />
        </div>
      </section>
    );
  return (
    <section className="soft-card p-5 text-sm text-muted-foreground">
      لا تتوفر بيانات طقس للدورة المختارة بعد.
    </section>
  );
}
function FarmLocationDialog({
  farm,
  onClose,
  onSubmit,
}: {
  farm: {
    id: number;
    name: string;
    location: string | null;
    latitude: string | null;
    longitude: string | null;
  } | null;
  onClose: () => void;
  onSubmit: (value: {
    farmId: number;
    location?: string;
    latitude: number;
    longitude: number;
    locationSource: "manual" | "device";
  }) => void;
}) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState<"manual" | "device">("manual");
  useEffect(() => {
    setLatitude(farm?.latitude ?? "");
    setLongitude(farm?.longitude ?? "");
    setLocation(farm?.location ?? "");
    setSource("manual");
  }, [farm]);
  const useDeviceLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(position => {
      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
      setSource("device");
    });
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!farm) return;
    onSubmit({
      farmId: farm.id,
      location: location || undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      locationSource: source,
    });
  };
  return (
    <Dialog open={Boolean(farm)} onOpenChange={open => !open && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">ربط موقع الطقس</DialogTitle>
          <DialogDescription className="text-right">
            حدد موقع مزرعة {farm?.name} كي تُعرض قراءات الطقس المتزامنة مع أيام
            الدورة.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="weather-location-name">وصف الموقع</Label>
            <Input
              id="weather-location-name"
              value={location}
              onChange={event => setLocation(event.target.value)}
              className="mt-2 h-11 rounded-xl text-right"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weather-latitude">خط العرض</Label>
              <Input
                id="weather-latitude"
                type="number"
                step="0.000001"
                required
                value={latitude}
                onChange={event => {
                  setLatitude(event.target.value);
                  setSource("manual");
                }}
                className="mt-2 h-11 rounded-xl text-right"
              />
            </div>
            <div>
              <Label htmlFor="weather-longitude">خط الطول</Label>
              <Input
                id="weather-longitude"
                type="number"
                step="0.000001"
                required
                value={longitude}
                onChange={event => {
                  setLongitude(event.target.value);
                  setSource("manual");
                }}
                className="mt-2 h-11 rounded-xl text-right"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl bg-card font-bold"
            onClick={useDeviceLocation}
          >
            استخدام موقع الجهاز
          </Button>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={onClose}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              حفظ موقع الطقس
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function WeatherMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
function EnvironmentTargetCard({
  target,
}: {
  target: {
    cycleDay: number;
    temperatureMinC: number;
    temperatureMaxC: number;
    humidityMinPercent: number;
    humidityMaxPercent: number;
  };
}) {
  if (target.cycleDay < 1) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dce9cf] bg-[#f5faef] shadow-[0_10px_28px_-24px_rgba(36,81,60,0.55)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dce9cf] bg-[#edf6e4] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <ThermometerSun className="h-5 w-5" />
          </span>
          <div>
            <p className="font-extrabold">البيئة المستهدفة لعمر القطيع</p>
            <p className="mt-1 text-xs text-muted-foreground">
              مرجع تشغيلي متزامن مع اليوم {arabicNumber(target.cycleDay)} من
              الدورة وعلى مستوى الطيور.
            </p>
          </div>
        </div>
        <span className="rounded-lg bg-[#285c3b] px-2.5 py-1 text-xs font-bold text-white">
          مرجع تخطيطي
        </span>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl bg-white p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3dc] text-primary">
            <ThermometerSun className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">الحرارة المستهدفة</p>
            <p className="mt-1 text-lg font-extrabold">
              {arabicNumber(target.temperatureMinC, 1)}–
              {arabicNumber(target.temperatureMaxC, 1)}°م
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3dc] text-primary">
            <Droplets className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">
              الرطوبة النسبية المستهدفة
            </p>
            <p className="mt-1 text-lg font-extrabold">
              {arabicNumber(target.humidityMinPercent)}–
              {arabicNumber(target.humidityMaxPercent)}%
            </p>
          </div>
        </div>
      </div>
      <p className="border-t border-[#dce9cf] px-5 py-3 text-xs leading-6 text-muted-foreground">
        تُعدّل هذه الحدود بحسب سلوك القطيع، سرعة الهواء، نوع التهوية، حالة
        الفرشة، السلالة، والظروف المحلية؛ لا تغني عن توجيه الطبيب البيطري أو
        أخصائي الإنتاج.
      </p>
    </section>
  );
}
function ExportPanel({ snapshot }: { snapshot: OperationalExportSnapshot }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const downloadCsv = () => {
    const blob = new Blob([buildOperationalCsv(snapshot)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = operationalExportFilename(snapshot, "csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const printPdf = () => {
    const report = window.open("", "_blank");
    if (!report) {
      window.alert(
        "تعذر فتح معاينة التقرير. اسمح للنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة."
      );
      return;
    }
    report.opener = null;
    report.document.open();
    report.document.write(buildOperationalPdfHtml(snapshot));
    report.document.close();
    window.setTimeout(() => {
      report.focus();
      report.print();
    }, 250);
  };
  const targetTemperature = `${arabicNumber(snapshot.targetTemperatureMinC, 1)}–${arabicNumber(snapshot.targetTemperatureMaxC, 1)}°م`;
  const targetHumidity = `${arabicNumber(snapshot.targetHumidityMinPercent)}–${arabicNumber(snapshot.targetHumidityMaxPercent)}%`;
  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d8e6d1] bg-white px-5 py-4 shadow-[0_10px_28px_-26px_rgba(36,81,60,0.55)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf6e4] text-primary">
            <FileDown className="h-5 w-5" />
          </span>
          <div>
            <p className="font-extrabold">تصدير الأوزان والبيئة</p>
            <p className="mt-1 text-xs text-muted-foreground">
              يشمل عينات الوزن الفعلية وسياق الحرارة والرطوبة لليوم المحدد.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl bg-card font-bold"
            onClick={downloadCsv}
          >
            <FileDown className="h-4 w-4" />
            تنزيل CSV
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-primary font-bold"
            onClick={() => setPreviewOpen(true)}
          >
            <Printer className="h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </section>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          dir="rtl"
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        >
          <DialogHeader>
            <DialogTitle className="text-right">
              معاينة تقرير الأوزان والبيئة
            </DialogTitle>
            <DialogDescription className="text-right">
              راجع التقرير قبل فتح نافذة الطباعة واختيار «حفظ كملف PDF».
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 rounded-2xl border border-[#d8e6d1] bg-[#fbfdf9] p-5 text-right">
            <div className="border-b-2 border-primary pb-4">
              <p className="text-xl font-extrabold">
                تقرير الأوزان والبيئة التشغيلية
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {snapshot.farmName} · {snapshot.cycleName} ·{" "}
                {arabicDate(snapshot.selectedDate)}
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SummaryTile
                label="عمر القطيع"
                value={`${arabicNumber(snapshot.cycleDay)} يوم`}
              />
              <SummaryTile
                label="الحرارة الفعلية"
                value={
                  snapshot.actualTemperatureC === null
                    ? "غير متاح"
                    : `${arabicNumber(snapshot.actualTemperatureC, 1)}°م`
                }
              />
              <SummaryTile
                label="الرطوبة الفعلية"
                value={
                  snapshot.actualHumidityPercent === null
                    ? "غير متاح"
                    : `${arabicNumber(snapshot.actualHumidityPercent)}%`
                }
              />
              <SummaryTile
                label="الحرارة المستهدفة"
                value={targetTemperature}
              />
              <SummaryTile label="الرطوبة المستهدفة" value={targetHumidity} />
            </div>
            <p className="mt-5 font-extrabold">عينات الوزن الفعلية</p>
            {snapshot.weights.length ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-[#dce9cf]">
                <table className="w-full text-sm">
                  <thead className="bg-[#edf6e4] text-right">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">العنبر</th>
                      <th className="p-3">متوسط الوزن</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.weights.map(weight => (
                      <tr
                        key={`${weight.date}-${weight.houseName}`}
                        className="border-t border-[#e8f0e3]"
                      >
                        <td className="p-3">{arabicDate(weight.date)}</td>
                        <td className="p-3">{weight.houseName}</td>
                        <td className="p-3">
                          {arabicNumber(weight.averageWeightGrams)} جم
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-[#dce9cf] bg-white p-4 text-sm text-muted-foreground">
                لا توجد عينات وزن فعلية مسجلة للدورة الحالية.
              </p>
            )}
            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              يجمع التقرير عينات الوزن المسجلة مع سياق الطقس واليوم التشغيلي
              المحدد لحظة التصدير. الأهداف البيئية مرجع تخطيطي.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => setPreviewOpen(false)}
            >
              إغلاق
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-primary font-bold"
              onClick={printPdf}
            >
              <Printer className="h-4 w-4" />
              فتح نافذة الطباعة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
function CycleDialog({
  open,
  onOpenChange,
  farms,
  selectedFarmId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  farms: { id: number; name: string }[];
  selectedFarmId?: number;
  onSubmit: (cycle: {
    farmId: number;
    name: string;
    placementDate: string;
    birdsPlaced: number;
  }) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      farmId: Number(form.get("farmId")),
      name: String(form.get("name")),
      placementDate: String(form.get("placementDate")),
      birdsPlaced: Number(form.get("birdsPlaced")),
    });
    onOpenChange(false);
    event.currentTarget.reset();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">إنشاء دورة تسمين</DialogTitle>
          <DialogDescription className="text-right">
            تُنشأ الدورة ضمن المزرعة المحددة حالياً، ويمكن تغييرها عند الحاجة.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="farmId">المزرعة</Label>
            <select
              id="farmId"
              name="farmId"
              required
              defaultValue={selectedFarmId ?? farms[0]?.id ?? ""}
              className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              {farms.map(farm => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field name="name" label="اسم الدورة" required />
            <div>
              <Label htmlFor="placementDate">تاريخ الاستقبال</Label>
              <Input
                id="placementDate"
                name="placementDate"
                type="date"
                required
                className="mt-2 h-11 rounded-xl"
              />
            </div>
          </div>
          <Field
            name="birdsPlaced"
            label="عدد الكتاكيت المستقبلة"
            min="1"
            step="1"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              إنشاء الدورة
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function OccupancyDialog({
  open,
  onOpenChange,
  cycleId,
  cycleBirdsPlaced,
  sections,
  allocations,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  cycleId?: number;
  cycleBirdsPlaced: number;
  sections: {
    id: number;
    name: string;
    rowName: string;
    cageCount: number;
    capacityPerCage: number;
  }[];
  allocations: { cageSectionId: number; occupiedBirds: number }[];
  onSubmit: (value: {
    cycleId: number;
    cageSectionId: number;
    occupiedBirds: number;
  }) => Promise<void>;
}) {
  const [sectionId, setSectionId] = useState<number | undefined>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setSectionId(sections[0]?.id);
      setError("");
      setSaving(false);
    }
  }, [open, sections]);
  const selectedSection =
    sections.find(section => section.id === sectionId) ?? sections[0];
  const sectionCapacity = selectedSection
    ? selectedSection.cageCount * selectedSection.capacityPerCage
    : 0;
  const { assignedElsewhere, remainingForCycle, maxAssignable } =
    selectedSection
      ? allocationLimit({
          birdsPlaced: cycleBirdsPlaced,
          targetSectionId: selectedSection.id,
          sectionCapacity,
          allocations,
        })
      : { assignedElsewhere: 0, remainingForCycle: 0, maxAssignable: 0 };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cycleId || !selectedSection) return;
    const form = new FormData(event.currentTarget);
    const occupiedBirds = Number(form.get("occupiedBirds"));
    if (occupiedBirds > maxAssignable) {
      setError(
        `الحد الأقصى المتاح لهذا القسم هو ${arabicNumber(maxAssignable)} طائر.`
      );
      return;
    }
    try {
      setSaving(true);
      await onSubmit({
        cycleId,
        cageSectionId: selectedSection.id,
        occupiedBirds,
      });
      onOpenChange(false);
      event.currentTarget.reset();
    } catch {
      setError(
        "تعذر حفظ التوزيع لأن إجمالي الطيور الموزعة تجاوز عدد طيور الدورة. حدّث البيانات ثم حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">
            توزيع الطيور على الأقفاص
          </DialogTitle>
          <DialogDescription className="text-right">
            لا يمكن أن يتجاوز التوزيع عدد طيور الدورة أو سعة قسم الأقفاص.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="cageSectionId">قسم الأقفاص</Label>
            <select
              id="cageSectionId"
              name="cageSectionId"
              required
              value={sectionId ?? ""}
              onChange={event => {
                setSectionId(Number(event.target.value));
                setError("");
              }}
              className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              disabled={saving}
            >
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name} · صف {section.rowName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#f5f8f2] p-3 text-center">
            <SummaryCell
              label="طيور الدورة"
              value={arabicNumber(cycleBirdsPlaced)}
            />
            <SummaryCell
              label="موزع سابقاً"
              value={arabicNumber(assignedElsewhere)}
            />
            <SummaryCell
              label="متاح للقسم"
              value={arabicNumber(maxAssignable)}
            />
          </div>
          <div>
            <Label htmlFor="occupiedBirds">الطيور المشغلة</Label>
            <Input
              id="occupiedBirds"
              name="occupiedBirds"
              type="number"
              min="0"
              max={maxAssignable}
              step="1"
              required
              className="mt-2 h-11 rounded-xl text-right"
              disabled={saving}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              سعة القسم: {arabicNumber(sectionCapacity)} طائر · المتبقي من
              الدورة: {arabicNumber(remainingForCycle)} طائر
            </p>
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-primary font-bold"
              disabled={!selectedSection || saving}
            >
              {saving ? "جارٍ الحفظ…" : "حفظ التوزيع"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function AccessView({
  invitations,
  farms,
  onCreate,
  onRedeem,
  onRevoke,
  onRegenerate,
}: {
  invitations: {
    id: number;
    codePrefix: string;
    role: FarmRole;
    maxUses: number;
    usedCount: number;
    expiresAt: Date | null;
    status: "active" | "revoked" | "expired" | "used";
    createdAt: Date;
  }[];
  farms: { id: number; name: string }[];
  onCreate: () => void;
  onRedeem: () => void;
  onRevoke: (id: number) => void;
  onRegenerate: (id: number) => void;
}) {
  const roleLabel: Record<string, string> = roleLabels;
  const statusLabel: Record<string, string> = {
    active: "نشط",
    revoked: "ملغى",
    expired: "منتهي",
    used: "مكتمل",
  };
  return (
    <section className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl bg-[#285c3b] p-6 text-white">
          <ShieldCheck className="h-7 w-7 text-[#dfeecb]" />
          <p className="mt-5 text-xl font-extrabold">
            وصول محكوم لفريق المزرعة
          </p>
          <p className="mt-2 max-w-xl text-sm leading-7 text-white/70">
            تُمنح الدعوات بحسب الدور والنطاق. يبقى المالك وحده قادراً على إصدار
            أو إلغاء رموز الوصول.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["مدير مزرعة", "طبيب بيطري", "مهندس إنتاج", "عامل"].map(role => (
              <span
                key={role}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold"
              >
                {role}
              </span>
            ))}
          </div>
        </article>
        <article className="soft-card p-6">
          <p className="font-extrabold">لديك رمز دعوة؟</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            أدخل الرمز لتطبيق الدور والنطاق المحددين من مالك المزرعة على حسابك.
          </p>
          <Button
            variant="outline"
            className="mt-5 w-full rounded-xl bg-card font-bold"
            onClick={onRedeem}
          >
            إدخال رمز دعوة
          </Button>
        </article>
      </div>
      <article className="soft-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="font-extrabold">رموز الدعوة</p>
            <p className="mt-1 text-sm text-muted-foreground">
              أعد إنشاء أي رمز نشط لنسخ نسخة جديدة وآمنة منه.
            </p>
          </div>
          <Button
            className="rounded-xl bg-primary font-bold"
            onClick={onCreate}
            disabled={!farms.length}
          >
            <Plus className="h-4 w-4" />
            إنشاء رمز دعوة
          </Button>
        </div>
        {invitations.length ? (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-[#f6f8f2] text-xs text-muted-foreground">
                <tr>
                  <th className="p-4 font-bold">الرمز</th>
                  <th className="p-4 font-bold">الدور</th>
                  <th className="p-4 font-bold">الاستخدام</th>
                  <th className="p-4 font-bold">الانتهاء</th>
                  <th className="p-4 font-bold">الحالة</th>
                  <th className="p-4 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(invitation => (
                  <tr key={invitation.id} className="border-t border-border/70">
                    <td className="p-4 font-mono font-bold tracking-wide text-primary">
                      {invitation.codePrefix}
                    </td>
                    <td className="p-4">{roleLabel[invitation.role]}</td>
                    <td className="p-4">
                      {arabicNumber(invitation.usedCount)} /{" "}
                      {arabicNumber(invitation.maxUses)}
                    </td>
                    <td className="p-4">
                      {invitation.expiresAt
                        ? arabicDate(invitation.expiresAt)
                        : "دون انتهاء"}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-bold",
                          invitation.status === "active"
                            ? "bg-[#eaf3e2] text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {statusLabel[invitation.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      {invitation.status === "active" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            className="h-8 rounded-lg text-primary hover:text-primary"
                            onClick={() => onRegenerate(invitation.id)}
                          >
                            نسخ جديد
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 rounded-lg text-destructive hover:text-destructive"
                            onClick={() => onRevoke(invitation.id)}
                          >
                            إلغاء
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center">
            <ShieldCheck className="mx-auto h-7 w-7 text-primary" />
            <p className="mt-3 font-bold">لا توجد دعوات صادرة بعد</p>
            <p className="mt-1 text-sm text-muted-foreground">
              أنشئ رمزاً آمناً لمشاركة الوصول حسب دور الموظف.
            </p>
          </div>
        )}
      </article>
    </section>
  );
}
function InvitationDialog({
  open,
  onOpenChange,
  farms,
  houses,
  cycles,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  farms: { id: number; name: string }[];
  houses: { id: number; name: string }[];
  cycles: { id: number; name: string }[];
  onSubmit: (value: {
    farmId: number;
    houseId?: number;
    cycleId?: number;
    role: FarmRole;
    maxUses: number;
    expiresAt?: string;
    notes?: string;
  }) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const houseId = String(form.get("houseId") || "");
    const cycleId = String(form.get("cycleId") || "");
    const expiresAt = String(form.get("expiresAt") || "");
    onSubmit({
      farmId: Number(form.get("farmId")),
      houseId: houseId ? Number(houseId) : undefined,
      cycleId: cycleId ? Number(cycleId) : undefined,
      role: String(form.get("role")) as FarmRole,
      maxUses: Number(form.get("maxUses")),
      expiresAt: expiresAt || undefined,
      notes: String(form.get("notes") || "") || undefined,
    });
    onOpenChange(false);
    event.currentTarget.reset();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-right">إنشاء رمز دعوة آمن</DialogTitle>
          <DialogDescription className="text-right">
            يُخزن الرمز بصيغة مشفرة، ويُعرض مرة واحدة فقط بعد إنشائه.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invite-farm">المزرعة</Label>
              <select
                id="invite-farm"
                name="farmId"
                required
                defaultValue={farms[0]?.id}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {farms.map(farm => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="invite-role">الدور</Label>
              <select
                id="invite-role"
                name="role"
                required
                defaultValue="worker"
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="farm_manager">مدير مزرعة</option>
                <option value="veterinarian">طبيب بيطري</option>
                <option value="engineer">مهندس إنتاج</option>
                <option value="worker">عامل</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invite-house">العنبر (اختياري)</Label>
              <select
                id="invite-house"
                name="houseId"
                defaultValue=""
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">كل العنابر المصرح بها</option>
                {houses.map(house => (
                  <option key={house.id} value={house.id}>
                    {house.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="invite-cycle">الدورة (اختياري)</Label>
              <select
                id="invite-cycle"
                name="cycleId"
                defaultValue=""
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">كل الدورات المصرح بها</option>
                {cycles.map(cycle => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              name="maxUses"
              label="حد الاستخدام"
              min="1"
              step="1"
              required
            />
            <div>
              <Label htmlFor="invite-expiry">تاريخ الانتهاء</Label>
              <Input
                id="invite-expiry"
                name="expiresAt"
                type="date"
                className="mt-2 h-11 rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="invite-notes">ملاحظات اختيارية</Label>
            <Input
              id="invite-notes"
              name="notes"
              className="mt-2 h-11 rounded-xl text-right"
              placeholder="مثال: وردية المتابعة المسائية"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              إنشاء الرمز
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function RedeemInvitationDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSubmit: (code: string) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit(String(form.get("code")));
    onOpenChange(false);
    event.currentTarget.reset();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">إدخال رمز دعوة</DialogTitle>
          <DialogDescription className="text-right">
            سيُطبق الدور ونطاق الوصول فوراً عند صحة الرمز.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="redeem-code">رمز الدعوة</Label>
            <Input
              id="redeem-code"
              name="code"
              required
              className="mt-2 h-12 rounded-xl text-center font-mono tracking-wider"
              placeholder="BROILER-XXXXXXXXXX"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl bg-primary font-bold">
              تأكيد الانضمام
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function GeneratedInvitationDialog({
  code,
  onClose,
}: {
  code: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(code)} onOpenChange={open => !open && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تم إنشاء رمز الدعوة</DialogTitle>
          <DialogDescription className="text-right">
            انسخ الرمز الآن وشاركه عبر قناة موثوقة؛ لن يُعرض النص السري مجدداً.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-2xl border border-dashed border-[#bcd2ad] bg-[#f5faef] p-4 text-center">
          <p className="font-mono text-lg font-extrabold tracking-wider text-primary">
            {code}
          </p>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-xl bg-card font-bold"
            onClick={() => code && navigator.clipboard.writeText(code)}
          >
            نسخ الرمز
          </Button>
          <Button className="rounded-xl bg-primary font-bold" onClick={onClose}>
            تم
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Field({
  name,
  label,
  required,
  min,
  step,
}: {
  name: string;
  label: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={min !== undefined ? "number" : "text"}
        min={min}
        step={step}
        required={required}
        className="mt-2 h-11 rounded-xl text-right"
      />
    </div>
  );
}
