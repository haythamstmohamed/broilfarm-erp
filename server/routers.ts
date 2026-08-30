import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import {
  addDailyRecord,
  addFarmExpense,
  addFeedInventoryTransaction,
  addHealthEvent,
  addHealthEvents,
  addSalePayment,
  addSaleTareBatch,
  addSaleWeighBatch,
  addWeightSample,
  addWorkerAccountEntry,
  bootstrapFarm,
  calculateSaleTotal,
  closeCycle,
  completeSale,
  createCageSection,
  createCycle,
  createFarm,
  createHouse,
  createInvitation,
  createSale,
  createTrader,
  createTraderWithSimpleSale,
  createWorker,
  deleteCycle,
  deleteDailyRecord,
  deleteFarm,
  deleteHealthEvent,
  deleteHouse,
  deleteSale,
  deleteSalePayment,
  deleteSaleWeighBatch,
  deleteTrader,
  deleteWorkerAccountEntry,
  fillSaleTareBatch,
  finalizeCycleSalesAndClose,
  getCascadeDeletionImpact,
  getWorkspace,
  listInvitations,
  redeemInvitation,
  regenerateInvitation,
  reopenSale,
  reorderSaleWeighBatches,
  revokeInvitation,
  setCageOccupancy,
  setCycleHouseAssignment,
  startTraderLoading,
  updateCycle,
  updateDailyRecord,
  updateFarm,
  updateFarmExpense,
  updateFarmLocation,
  updateFeedInventorySettings,
  updateHealthEvent,
  updateHouse,
  updateSaleDetails,
  updateSalePayment,
  updateSaleTareBatch,
  updateSaleWeighBatch,
  updateTrader,
  updateWorker,
  updateWorkerAccountEntry,
  listAlerts,
  acknowledgeAlert,
  resolveAlert,
  scanAndSyncCycleAlerts,
  getCompany,
  bootstrapCompany,
  updateCompany,
  listCompanyFarms,
  listCompanyUsers,
  getCycleAuditReport,
  getCycleAuditReportCsv,
  getCompanyExecutiveDashboard,
  approveExpense,
  rejectExpense,
  markExpensePaid,
  listMedicineInventory,
  addMedicineItem,
  updateMedicineQuantity,
  deleteMedicineItem,
  listAuditLogs,
  ingestSensorReadings,
  getLatestHouseReadings,
  getHouseTelemetryHistory,
  exportCompanyBackup,
  registerLocalUser,
  loginLocalUser,
  changeLocalUserPassword,
} from "./db";
import { farmRoles } from "../shared/accessControl";
import { expenseCategories } from "../shared/expenseManagement";
import { workerAccountEntryTypes } from "../shared/workerAccounts";
import { simulateCycleProfitability } from "../shared/profitabilitySimulator";
import { parseRawScaleData, calculateBatchNetMetrics } from "../shared/smartScaleBridge";
import { SUBSCRIPTION_PLANS, checkResourceLimit } from "../shared/subscriptionPlans";
import { getCycleDayWeather } from "./weather";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(180),
          email: z.string().trim().email(),
          password: z.string().min(6).max(100),
          companyName: z.string().trim().max(180).optional(),
          phone: z.string().trim().max(40).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { user, sessionToken } = await registerLocalUser(input);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return { success: true, user };
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { user, sessionToken } = await loginLocalUser(input);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return { success: true, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    changePassword: protectedProcedure
      .input(
        z.object({
          oldPassword: z.string().min(1),
          newPassword: z.string().min(6).max(100),
        })
      )
      .mutation(({ ctx, input }) => changeLocalUserPassword(ctx.user.id, input)),
  }),
  workspace: router({
    get: protectedProcedure.query(({ ctx }) => getWorkspace(ctx.user.id)),
    bootstrap: protectedProcedure.input(z.object({
      farmName: z.string().trim().min(2).max(180),
      governorate: z.string().trim().max(100).optional(),
      location: z.string().trim().max(500).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      locationSource: z.enum(["manual", "device"]).optional(),
      cycleName: z.string().trim().min(2).max(180),
      placementDate: z.coerce.date(),
      birdsPlaced: z.number().int().positive().max(1_000_000),
    })).mutation(({ ctx, input }) => bootstrapFarm(ctx.user.id, input)),
    createFarm: protectedProcedure.input(z.object({
      name: z.string().trim().min(2).max(180), governorate: z.string().trim().max(100).optional(), location: z.string().trim().max(500).optional(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), locationSource: z.enum(["manual", "device"]).optional(),
    })).mutation(({ ctx, input }) => createFarm(ctx.user.id, input)),
    updateFarmLocation: protectedProcedure.input(z.object({
      farmId: z.number().int().positive(), location: z.string().trim().max(500).optional(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), locationSource: z.enum(["manual", "device"]),
    })).mutation(({ ctx, input }) => updateFarmLocation(ctx.user.id, input)),
    updateFarm: protectedProcedure.input(z.object({ farmId: z.number().int().positive(), name: z.string().trim().min(2).max(180), governorate: z.string().trim().max(100).optional(), location: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => updateFarm(ctx.user.id, input)),
    getCascadeDeletionImpact: protectedProcedure.input(z.object({ kind: z.enum(["farm", "cycle", "house"]), id: z.number().int().positive() })).query(({ ctx, input }) => getCascadeDeletionImpact(ctx.user.id, input)),
    deleteFarm: protectedProcedure.input(z.object({ farmId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteFarm(ctx.user.id, input.farmId)),
    createCycle: protectedProcedure.input(z.object({
      farmId: z.number().int().positive(), name: z.string().trim().min(2).max(180), placementDate: z.coerce.date(), birdsPlaced: z.number().int().positive().max(1_000_000),
    })).mutation(({ ctx, input }) => createCycle(ctx.user.id, input)),
    updateCycle: protectedProcedure.input(z.object({ cycleId: z.number().int().positive(), name: z.string().trim().min(2).max(180), placementDate: z.coerce.date(), birdsPlaced: z.number().int().positive().max(1_000_000) })).mutation(({ ctx, input }) => updateCycle(ctx.user.id, input)),
    deleteCycle: protectedProcedure.input(z.object({ cycleId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteCycle(ctx.user.id, input.cycleId)),
    addDailyRecord: protectedProcedure.input(z.object({
      cycleId: z.number().int().positive(), houseId: z.number().int().positive(), recordDate: z.coerce.date(), feedKg: z.number().int().min(0), waterLiters: z.number().int().min(0), mortality: z.number().int().min(0), culls: z.number().int().min(0),
    })).mutation(({ ctx, input }) => addDailyRecord(ctx.user.id, input)),
    updateDailyRecord: protectedProcedure.input(z.object({
      recordId: z.number().int().positive(), recordDate: z.coerce.date(), feedKg: z.number().int().min(0), waterLiters: z.number().int().min(0), mortality: z.number().int().min(0), culls: z.number().int().min(0),
    })).mutation(({ ctx, input }) => updateDailyRecord(ctx.user.id, input)),
    deleteDailyRecord: protectedProcedure.input(z.object({ recordId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteDailyRecord(ctx.user.id, input.recordId)),
    addWeightSample: protectedProcedure.input(z.object({
      cycleId: z.number().int().positive(), houseId: z.number().int().positive(), sampleDate: z.coerce.date(), averageWeightGrams: z.number().int().positive(),
    })).mutation(({ ctx, input }) => addWeightSample(ctx.user.id, input)),
    addHealthEvent: protectedProcedure.input(z.object({
      cycleId: z.number().int().positive(), houseId: z.number().int().positive(), eventDate: z.coerce.date(), eventType: z.enum(["medication", "vaccination"]), productName: z.string().trim().min(2).max(180), dosage: z.string().trim().min(1).max(180), administrationRoute: z.string().trim().max(120).optional(), notes: z.string().trim().max(1000).optional(),
    })).mutation(({ ctx, input }) => addHealthEvent(ctx.user.id, input)),
    addHealthEvents: protectedProcedure.input(z.object({
      cycleId: z.number().int().positive(), houseIds: z.array(z.number().int().positive()).min(1).max(500), eventDate: z.coerce.date(), eventType: z.enum(["medication", "vaccination"]), productName: z.string().trim().min(2).max(180), dosage: z.string().trim().min(1).max(180), administrationRoute: z.string().trim().max(120).optional(), notes: z.string().trim().max(1000).optional(),
    })).mutation(({ ctx, input }) => addHealthEvents(ctx.user.id, input)),
    updateHealthEvent: protectedProcedure.input(z.object({
      healthEventId: z.number().int().positive(), houseId: z.number().int().positive(), eventDate: z.coerce.date(), eventType: z.enum(["medication", "vaccination"]), productName: z.string().trim().min(2).max(180), dosage: z.string().trim().min(1).max(180), administrationRoute: z.string().trim().max(120).optional(), notes: z.string().trim().max(1000).optional(),
    })).mutation(({ ctx, input }) => updateHealthEvent(ctx.user.id, input)),
    deleteHealthEvent: protectedProcedure.input(z.object({ healthEventId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteHealthEvent(ctx.user.id, input.healthEventId)),
    createHouse: protectedProcedure.input(z.object({
      farmId: z.number().int().positive(), name: z.string().trim().min(2).max(180), capacity: z.number().int().min(0).max(1_000_000),
    })).mutation(({ ctx, input }) => createHouse(ctx.user.id, input)),
    updateHouse: protectedProcedure.input(z.object({ houseId: z.number().int().positive(), name: z.string().trim().min(2).max(180), capacity: z.number().int().min(0).max(1_000_000) })).mutation(({ ctx, input }) => updateHouse(ctx.user.id, input)),
    deleteHouse: protectedProcedure.input(z.object({ houseId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteHouse(ctx.user.id, input.houseId)),
    createCageSection: protectedProcedure.input(z.object({
      cycleId: z.number().int().positive(), houseId: z.number().int().positive(), name: z.string().trim().min(2).max(180), rowName: z.string().trim().min(1).max(100), cageCount: z.number().int().positive().max(100_000), capacityPerCage: z.number().int().positive().max(1_000),
    })).mutation(({ ctx, input }) => createCageSection(ctx.user.id, input)),
    setCageOccupancy: protectedProcedure.input(z.object({
      cycleId: z.number().int().positive(), cageSectionId: z.number().int().positive(), occupiedBirds: z.number().int().min(0).max(1_000_000),
    })).mutation(({ ctx, input }) => setCageOccupancy(ctx.user.id, input)),
    setCycleHouseAssignment: protectedProcedure.input(z.object({
      cycleId: z.number().int().positive(), houseId: z.number().int().positive(), assignedBirds: z.number().int().min(0).max(1_000_000),
    })).mutation(({ ctx, input }) => setCycleHouseAssignment(ctx.user.id, input)),
    updateFeedInventorySettings: protectedProcedure.input(z.object({ farmId: z.number().int().positive(), bagWeightKg: z.number().int().min(1).max(200), reorderPointBags: z.number().int().min(0).max(1_000_000) })).mutation(({ ctx, input }) => updateFeedInventorySettings(ctx.user.id, input)),
    addFeedInventoryTransaction: protectedProcedure.input(z.object({ farmId: z.number().int().positive(), movementType: z.enum(["opening", "receipt", "issue", "adjustment"]), bagDelta: z.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0, "يجب إدخال عدد شكاير غير صفري"), occurredAt: z.coerce.date(), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => addFeedInventoryTransaction(ctx.user.id, input)),
    addFarmExpense: protectedProcedure.input(z.object({ farmId: z.number().int().positive(), cycleId: z.number().int().positive().optional(), category: z.enum(expenseCategories), amountEgp: z.number().positive().max(10_000_000), expenseDate: z.coerce.date(), supplier: z.string().trim().max(180).optional(), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => addFarmExpense(ctx.user.id, input)),
    updateFarmExpense: protectedProcedure.input(z.object({ expenseId: z.number().int().positive(), cycleId: z.number().int().positive().optional(), category: z.enum(expenseCategories), amountEgp: z.number().positive().max(10_000_000), expenseDate: z.coerce.date(), supplier: z.string().trim().max(180).optional(), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => updateFarmExpense(ctx.user.id, input)),
    approveExpense: protectedProcedure.input(z.object({ expenseId: z.number().int().positive() })).mutation(({ ctx, input }) => approveExpense(ctx.user.id, input.expenseId)),
    rejectExpense: protectedProcedure.input(z.object({ expenseId: z.number().int().positive(), reason: z.string().trim().min(2).max(500) })).mutation(({ ctx, input }) => rejectExpense(ctx.user.id, input)),
    markExpensePaid: protectedProcedure.input(z.object({ expenseId: z.number().int().positive() })).mutation(({ ctx, input }) => markExpensePaid(ctx.user.id, input.expenseId)),
    createWorker: protectedProcedure.input(z.object({ farmId: z.number().int().positive(), name: z.string().trim().min(2).max(180), jobTitle: z.string().trim().max(140).optional(), phone: z.string().trim().max(40).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => createWorker(ctx.user.id, input)),
    updateWorker: protectedProcedure.input(z.object({ workerId: z.number().int().positive(), name: z.string().trim().min(2).max(180), jobTitle: z.string().trim().max(140).optional(), phone: z.string().trim().max(40).optional(), notes: z.string().trim().max(1_000).optional(), isActive: z.boolean() })).mutation(({ ctx, input }) => updateWorker(ctx.user.id, input)),
    addWorkerAccountEntry: protectedProcedure.input(z.object({ workerId: z.number().int().positive(), entryType: z.enum(workerAccountEntryTypes), amountEgp: z.number().min(-10_000_000).max(10_000_000).refine((value) => value !== 0, "يجب إدخال مبلغ غير صفري"), occurredAt: z.coerce.date(), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => addWorkerAccountEntry(ctx.user.id, input)),
    updateWorkerAccountEntry: protectedProcedure.input(z.object({ entryId: z.number().int().positive(), entryType: z.enum(workerAccountEntryTypes), amountEgp: z.number().min(-10_000_000).max(10_000_000).refine((value) => value !== 0, "يجب إدخال مبلغ غير صفري"), occurredAt: z.coerce.date(), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => updateWorkerAccountEntry(ctx.user.id, input)),
    deleteWorkerAccountEntry: protectedProcedure.input(z.object({ entryId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteWorkerAccountEntry(ctx.user.id, input.entryId)),
    createTrader: protectedProcedure.input(z.object({ farmId: z.number().int().positive(), name: z.string().trim().min(2).max(180), phone: z.string().trim().max(40).optional(), companyName: z.string().trim().max(180).optional(), address: z.string().trim().max(300).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => createTrader(ctx.user.id, input)),
    createTraderWithSimpleSale: protectedProcedure.input(z.object({ farmId: z.number().int().positive(), cycleId: z.number().int().positive(), name: z.string().trim().min(2).max(180), phone: z.string().trim().max(40).optional(), pricePerKgEgp: z.number().positive().max(100_000), notes: z.string().trim().max(1_000).optional(), saleDate: z.coerce.date() })).mutation(({ ctx, input }) => createTraderWithSimpleSale(ctx.user.id, input)),
    updateTrader: protectedProcedure.input(z.object({ traderId: z.number().int().positive(), name: z.string().trim().min(2).max(180), phone: z.string().trim().max(40).optional(), companyName: z.string().trim().max(180).optional(), address: z.string().trim().max(300).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => updateTrader(ctx.user.id, input)),
    deleteTrader: protectedProcedure.input(z.object({ traderId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteTrader(ctx.user.id, input.traderId)),
    createSale: protectedProcedure.input(z.object({ farmId: z.number().int().positive(), cycleId: z.number().int().positive(), traderId: z.number().int().positive(), saleDate: z.coerce.date(), grossWeightKg: z.number().positive().max(1_000_000), loadedCageCount: z.number().int().positive().max(100_000), tareWeightKg: z.number().positive().max(1_000_000), tareCageCount: z.number().int().positive().max(100_000), pricePerKgEgp: z.number().positive().max(100_000), initialPaidEgp: z.number().min(0).max(1_000_000_000).optional(), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => createSale(ctx.user.id, input)),
    startTraderLoading: protectedProcedure.input(z.object({ farmId: z.number().int().positive(), cycleId: z.number().int().positive(), traderId: z.number().int().positive(), saleDate: z.coerce.date(), plannedCageCount: z.number().int().min(0).max(100_000), batchCageCount: z.number().int().positive().max(100_000), weighingMode: z.enum(["fixed", "variable", "direct"]).optional(), birdsPerCage: z.number().int().min(0).max(10_000).optional(), tareWeightKg: z.number().min(0).max(1_000_000), tareCageCount: z.number().int().min(0).max(100_000), pricePerKgEgp: z.number().positive().max(100_000), discountEgp: z.number().min(0).max(1_000_000_000).optional(), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => startTraderLoading(ctx.user.id, input)),
    addSaleTareBatch: protectedProcedure.input(z.object({ saleId: z.number().int().positive(), cageCount: z.number().int().positive().max(100_000), tareWeightKg: z.number().min(0).max(1_000_000), weighedAt: z.coerce.date(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => addSaleTareBatch(ctx.user.id, input)),
    fillSaleTareBatch: protectedProcedure.input(z.object({ batchId: z.number().int().positive(), grossWeightKg: z.number().positive().max(1_000_000), weighedAt: z.coerce.date(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => fillSaleTareBatch(ctx.user.id, input)),
    updateSaleTareBatch: protectedProcedure.input(z.object({ batchId: z.number().int().positive(), cageCount: z.number().int().positive().max(100_000), tareWeightKg: z.number().min(0).max(1_000_000), weighedAt: z.coerce.date(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => updateSaleTareBatch(ctx.user.id, input)),
    addSaleWeighBatch: protectedProcedure.input(z.object({ saleId: z.number().int().positive(), cageCount: z.number().int().min(0).max(100_000).optional(), grossWeightKg: z.number().positive().max(1_000_000), tareWeightKg: z.number().min(0).max(1_000_000).optional(), weighedAt: z.coerce.date(), notes: z.string().trim().max(1_000).optional(), allowOverage: z.boolean().optional() })).mutation(({ ctx, input }) => addSaleWeighBatch(ctx.user.id, input)),
    updateSaleWeighBatch: protectedProcedure.input(z.object({ batchId: z.number().int().positive(), cageCount: z.number().int().min(0).max(100_000).optional(), grossWeightKg: z.number().positive().max(1_000_000), tareWeightKg: z.number().min(0).max(1_000_000).optional(), weighedAt: z.coerce.date(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => updateSaleWeighBatch(ctx.user.id, input)),
    updateSaleDetails: protectedProcedure.input(z.object({ saleId: z.number().int().positive(), pricePerKgEgp: z.number().positive().max(100_000), discountEgp: z.number().min(0).max(1_000_000_000), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => updateSaleDetails(ctx.user.id, input)),
    deleteSaleWeighBatch: protectedProcedure.input(z.object({ batchId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteSaleWeighBatch(ctx.user.id, input.batchId)),
    reorderSaleWeighBatches: protectedProcedure.input(z.object({ saleId: z.number().int().positive(), batchIds: z.array(z.number().int().positive()).min(1).max(10_000) })).mutation(({ ctx, input }) => reorderSaleWeighBatches(ctx.user.id, input)),
    calculateSaleTotal: protectedProcedure.input(z.object({ saleId: z.number().int().positive() })).mutation(({ ctx, input }) => calculateSaleTotal(ctx.user.id, input.saleId)),
    completeSale: protectedProcedure.input(z.object({ saleId: z.number().int().positive() })).mutation(({ ctx, input }) => completeSale(ctx.user.id, input.saleId)),
    reopenSale: protectedProcedure.input(z.object({ saleId: z.number().int().positive() })).mutation(({ ctx, input }) => reopenSale(ctx.user.id, input.saleId)),
    deleteSale: protectedProcedure.input(z.object({ saleId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteSale(ctx.user.id, input.saleId)),
    addSalePayment: protectedProcedure.input(z.object({ saleId: z.number().int().positive(), amountEgp: z.number().positive().max(1_000_000_000), paidAt: z.coerce.date(), paymentMethod: z.enum(["cash", "transfer", "credit", "other"]).optional(), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => addSalePayment(ctx.user.id, input)),
    updateSalePayment: protectedProcedure.input(z.object({ paymentId: z.number().int().positive(), amountEgp: z.number().positive().max(1_000_000_000), paidAt: z.coerce.date(), paymentMethod: z.enum(["cash", "transfer", "credit", "other"]).optional(), reference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1_000).optional() })).mutation(({ ctx, input }) => updateSalePayment(ctx.user.id, input)),
    deleteSalePayment: protectedProcedure.input(z.object({ paymentId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteSalePayment(ctx.user.id, input.paymentId)),
    closeCycle: protectedProcedure.input(z.object({ cycleId: z.number().int().positive() })).mutation(({ ctx, input }) => closeCycle(ctx.user.id, input.cycleId)),
    finalizeCycleSalesAndClose: protectedProcedure.input(z.object({ cycleId: z.number().int().positive() })).mutation(({ ctx, input }) => finalizeCycleSalesAndClose(ctx.user.id, input.cycleId)),
    invitations: protectedProcedure.query(({ ctx }) => listInvitations(ctx.user.id)),
    createInvitation: protectedProcedure.input(z.object({
      farmId: z.number().int().positive(), houseId: z.number().int().positive().optional(), cycleId: z.number().int().positive().optional(), role: z.enum(farmRoles), maxUses: z.number().int().positive().max(100), expiresAt: z.coerce.date().optional(), notes: z.string().trim().max(500).optional(),
    })).mutation(({ ctx, input }) => createInvitation(ctx.user.id, input)),
    revokeInvitation: protectedProcedure.input(z.object({ invitationId: z.number().int().positive() })).mutation(({ ctx, input }) => revokeInvitation(ctx.user.id, input.invitationId)),
    regenerateInvitation: protectedProcedure.input(z.object({ invitationId: z.number().int().positive() })).mutation(({ ctx, input }) => regenerateInvitation(ctx.user.id, input.invitationId)),
    redeemInvitation: protectedProcedure.input(z.object({ code: z.string().trim().min(8).max(64) })).mutation(({ ctx, input }) => redeemInvitation(ctx.user.id, input.code)),
  }),
  alerts: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number().int().positive().optional(), cycleId: z.number().int().positive().optional(), status: z.enum(["active", "acknowledged", "resolved", "dismissed"]).optional() }).optional())
      .query(({ ctx, input }) => listAlerts(ctx.user.id, input)),
    acknowledge: protectedProcedure
      .input(z.object({ alertId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => acknowledgeAlert(ctx.user.id, input.alertId)),
    resolve: protectedProcedure
      .input(z.object({ alertId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => resolveAlert(ctx.user.id, input.alertId)),
    scan: protectedProcedure
      .input(z.object({ farmId: z.number().int().positive(), cycleId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => scanAndSyncCycleAlerts(ctx.user.id, input.farmId, input.cycleId)),
  }),
  companies: router({
    get: protectedProcedure
      .input(z.object({ companyId: z.number().int().positive().optional() }).optional())
      .query(({ ctx, input }) => getCompany(ctx.user.id, input?.companyId)),
    bootstrap: protectedProcedure
      .input(z.object({ name: z.string().trim().min(2).max(255), legalName: z.string().trim().max(255).optional(), subscriptionPlan: z.enum(["free", "starter", "pro", "business", "enterprise"]).optional() }))
      .mutation(({ ctx, input }) => bootstrapCompany(ctx.user.id, input)),
    update: protectedProcedure
      .input(z.object({
        companyId: z.number().int().positive(),
        name: z.string().trim().min(2).max(255).optional(),
        legalName: z.string().trim().max(255).optional(),
        taxId: z.string().trim().max(100).optional(),
        registrationNumber: z.string().trim().max(100).optional(),
        phone: z.string().trim().max(40).optional(),
        email: z.string().trim().email().optional(),
        address: z.string().trim().max(500).optional(),
        governorate: z.string().trim().max(100).optional(),
      }))
      .mutation(({ ctx, input }) => updateCompany(ctx.user.id, input)),
    listFarms: protectedProcedure
      .input(z.object({ companyId: z.number().int().positive() }))
      .query(({ ctx, input }) => listCompanyFarms(ctx.user.id, input.companyId)),
    listUsers: protectedProcedure
      .input(z.object({ companyId: z.number().int().positive() }))
      .query(({ ctx, input }) => listCompanyUsers(ctx.user.id, input.companyId)),
  }),
  reports: router({
    cycleAudit: protectedProcedure
      .input(z.object({ cycleId: z.number().int().positive() }))
      .query(({ ctx, input }) => getCycleAuditReport(ctx.user.id, input.cycleId)),
    cycleAuditCsv: protectedProcedure
      .input(z.object({ cycleId: z.number().int().positive() }))
      .query(({ ctx, input }) => getCycleAuditReportCsv(ctx.user.id, input.cycleId)),
    executiveDashboard: protectedProcedure
      .input(z.object({ companyId: z.number().int().positive().optional() }).optional())
      .query(({ ctx, input }) => getCompanyExecutiveDashboard(ctx.user.id, input?.companyId)),
  }),
  medicineInventory: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number().int().positive() }))
      .query(({ ctx, input }) => listMedicineInventory(ctx.user.id, input.farmId)),
    add: protectedProcedure
      .input(
        z.object({
          farmId: z.number().int().positive(),
          productName: z.string().trim().min(2).max(255),
          category: z.enum(["vaccine", "antibiotic", "vitamin", "disinfectant", "supplement", "other"]).optional(),
          batchNumber: z.string().trim().max(100).optional(),
          expiryDate: z.coerce.date().optional(),
          quantity: z.number().min(0),
          unit: z.string().trim().max(50).optional(),
          unitCostEgp: z.number().min(0).optional(),
          reorderPoint: z.number().min(0).optional(),
          notes: z.string().trim().max(1000).optional(),
        })
      )
      .mutation(({ ctx, input }) => addMedicineItem(ctx.user.id, input)),
    adjust: protectedProcedure
      .input(
        z.object({
          itemId: z.number().int().positive(),
          quantityDelta: z.number(),
          reason: z.string().trim().max(500).optional(),
        })
      )
      .mutation(({ ctx, input }) => updateMedicineQuantity(ctx.user.id, input)),
    delete: protectedProcedure
      .input(z.object({ itemId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => deleteMedicineItem(ctx.user.id, input.itemId)),
  }),
  auditLogs: router({
    list: protectedProcedure
      .input(
        z
          .object({
            farmId: z.number().int().positive().optional(),
            cycleId: z.number().int().positive().optional(),
            entityType: z.string().optional(),
            action: z.string().optional(),
            limit: z.number().int().positive().max(500).optional(),
          })
          .optional()
      )
      .query(({ ctx, input }) => listAuditLogs(ctx.user.id, input)),
  }),
  sensors: router({
    ingest: protectedProcedure
      .input(
        z.object({
          farmId: z.number().int().positive(),
          houseId: z.number().int().positive(),
          readings: z
            .array(
              z.object({
                sensorType: z.enum([
                  "temperature",
                  "humidity",
                  "ammonia_nh3",
                  "co2",
                  "static_pressure",
                  "water_flow",
                  "light_lux",
                ]),
                value: z.number(),
                unit: z.string().trim().min(1).max(30),
                deviceId: z.string().trim().max(100).optional(),
                readingTime: z.coerce.date().optional(),
              })
            )
            .min(1),
        })
      )
      .mutation(({ ctx, input }) => ingestSensorReadings(ctx.user.id, input)),
    getLatest: protectedProcedure
      .input(z.object({ farmId: z.number().int().positive(), houseId: z.number().int().positive() }))
      .query(({ ctx, input }) => getLatestHouseReadings(ctx.user.id, input.farmId, input.houseId)),
    getHistory: protectedProcedure
      .input(
        z.object({
          farmId: z.number().int().positive(),
          houseId: z.number().int().positive(),
          sensorType: z
            .enum([
              "temperature",
              "humidity",
              "ammonia_nh3",
              "co2",
              "static_pressure",
              "water_flow",
              "light_lux",
            ])
            .optional(),
          hours: z.number().int().positive().max(720).optional(),
        })
      )
      .query(({ ctx, input }) => getHouseTelemetryHistory(ctx.user.id, input)),
  }),
  simulator: router({
    simulate: protectedProcedure
      .input(
        z.object({
          birdsPlaced: z.number().int().positive(),
          currentAgeDays: z.number().int().positive(),
          currentLiveBirds: z.number().int().positive(),
          currentAvgWeightGrams: z.number().int().positive(),
          feedCostPerKgEgp: z.number().positive(),
          chickCostPerBirdEgp: z.number().positive(),
          veterinaryCostPerBirdEgp: z.number().positive().optional(),
          fixedDailyOverheadEgp: z.number().min(0),
          targetSellingPricePerKgEgp: z.number().positive(),
          expectedDailyMortalityRate: z.number().min(0).max(0.1).optional(),
        })
      )
      .query(({ input }) => simulateCycleProfitability(input)),
  }),
  smartScale: router({
    parse: protectedProcedure
      .input(z.object({ rawStream: z.string() }))
      .query(({ input }) => parseRawScaleData(input.rawStream)),
    computeMetrics: protectedProcedure
      .input(
        z.object({
          grossWeightKg: z.number().min(0),
          tareWeightKg: z.number().min(0),
          cageCount: z.number().int().min(0),
          birdCount: z.number().int().min(0),
        })
      )
      .query(({ input }) => calculateBatchNetMetrics(input)),
  }),
  backup: router({
    export: protectedProcedure
      .input(z.object({ farmId: z.number().int().positive().optional() }).optional())
      .query(({ ctx, input }) => exportCompanyBackup(ctx.user.id, input?.farmId)),
  }),
  subscription: router({
    plans: publicProcedure.query(() => SUBSCRIPTION_PLANS),
    checkLimit: protectedProcedure
      .input(
        z.object({
          resourceType: z.enum(["farms", "houses", "users", "cycles"]),
          currentCount: z.number().int().min(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const company = ctx.user.companyId ? await getCompany(ctx.user.id, ctx.user.companyId) : null;
        const plan = (company?.subscriptionPlan as any) || "free";
        return checkResourceLimit(plan, input.resourceType, input.currentCount);
      }),
  }),
  weather: router({
    forCycleDay: protectedProcedure.input(z.object({ cycleId: z.number().int().positive(), weatherDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(({ ctx, input }) => getCycleDayWeather(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
