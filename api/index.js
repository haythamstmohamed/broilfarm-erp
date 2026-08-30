var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  alerts: () => alerts,
  auditLogs: () => auditLogs,
  cageSections: () => cageSections,
  companies: () => companies,
  cycleCageOccupancy: () => cycleCageOccupancy,
  cycleHouseAssignments: () => cycleHouseAssignments,
  cycles: () => cycles,
  dailyRecords: () => dailyRecords,
  farmExpenses: () => farmExpenses,
  farmMemberships: () => farmMemberships,
  farmWeatherDays: () => farmWeatherDays,
  farms: () => farms,
  feedInventorySettings: () => feedInventorySettings,
  feedInventoryTransactions: () => feedInventoryTransactions,
  healthEvents: () => healthEvents,
  houses: () => houses,
  invitationCodes: () => invitationCodes,
  medicineInventory: () => medicineInventory,
  saleActivities: () => saleActivities,
  salePayments: () => salePayments,
  saleWeighBatches: () => saleWeighBatches,
  sales: () => sales,
  sensorReadings: () => sensorReadings,
  traders: () => traders,
  users: () => users,
  weightSamples: () => weightSamples,
  workerAccountEntries: () => workerAccountEntries,
  workers: () => workers
});
import { boolean, date, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
var companies, users, farms, houses, cycles, cycleHouseAssignments, cageSections, dailyRecords, healthEvents, weightSamples, cycleCageOccupancy, farmMemberships, invitationCodes, farmWeatherDays, feedInventorySettings, feedInventoryTransactions, farmExpenses, medicineInventory, workers, workerAccountEntries, traders, sales, saleWeighBatches, salePayments, saleActivities, auditLogs, alerts, sensorReadings;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    companies = mysqlTable("companies", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      legalName: varchar("legalName", { length: 255 }),
      registrationNumber: varchar("registrationNumber", { length: 100 }),
      taxId: varchar("taxId", { length: 100 }),
      phone: varchar("phone", { length: 40 }),
      email: varchar("email", { length: 320 }),
      address: text("address"),
      governorate: varchar("governorate", { length: 100 }),
      status: mysqlEnum("status", ["active", "suspended", "trial"]).default("trial").notNull(),
      subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "starter", "pro", "business", "enterprise"]).default("free").notNull(),
      maxFarms: int("maxFarms").default(1).notNull(),
      maxUsersPerFarm: int("maxUsersPerFarm").default(5).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      companyId: int("companyId"),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      phone: varchar("phone", { length: 40 }),
      passwordHash: varchar("passwordHash", { length: 255 }),
      isEmailVerified: boolean("isEmailVerified").default(false).notNull(),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    }, (table) => [index("users_company_idx").on(table.companyId), index("users_email_idx").on(table.email)]);
    farms = mysqlTable("farms", {
      id: int("id").autoincrement().primaryKey(),
      companyId: int("companyId"),
      ownerId: int("ownerId").notNull(),
      name: varchar("name", { length: 180 }).notNull(),
      governorate: varchar("governorate", { length: 100 }),
      location: text("location"),
      latitude: decimal("latitude", { precision: 9, scale: 6 }),
      longitude: decimal("longitude", { precision: 9, scale: 6 }),
      locationSource: mysqlEnum("locationSource", ["manual", "device"]).default("manual").notNull(),
      status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("farms_owner_idx").on(table.ownerId)]);
    houses = mysqlTable("houses", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      name: varchar("name", { length: 180 }).notNull(),
      capacity: int("capacity").default(0).notNull(),
      status: mysqlEnum("status", ["empty", "preparing", "active", "cleaning", "maintenance"]).default("empty").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("houses_farm_idx").on(table.farmId)]);
    cycles = mysqlTable("cycles", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      houseId: int("houseId"),
      name: varchar("name", { length: 180 }).notNull(),
      status: mysqlEnum("status", ["draft", "upcoming", "active", "closed"]).default("upcoming").notNull(),
      placementDate: timestamp("placementDate").notNull(),
      birdsPlaced: int("birdsPlaced").notNull(),
      targetMarketWeight: int("targetMarketWeight"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("cycles_farm_idx").on(table.farmId), index("cycles_house_idx").on(table.houseId)]);
    cycleHouseAssignments = mysqlTable("cycleHouseAssignments", {
      id: int("id").autoincrement().primaryKey(),
      cycleId: int("cycleId").notNull(),
      houseId: int("houseId").notNull(),
      assignedBirds: int("assignedBirds").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [uniqueIndex("cycle_house_assignment_unique").on(table.cycleId, table.houseId), index("assignments_cycle_idx").on(table.cycleId), index("assignments_house_idx").on(table.houseId)]);
    cageSections = mysqlTable("cageSections", {
      id: int("id").autoincrement().primaryKey(),
      houseId: int("houseId").notNull(),
      name: varchar("name", { length: 180 }).notNull(),
      rowName: varchar("rowName", { length: 100 }).notNull(),
      cageCount: int("cageCount").notNull(),
      capacityPerCage: int("capacityPerCage").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [index("cages_house_idx").on(table.houseId)]);
    dailyRecords = mysqlTable("dailyRecords", {
      id: int("id").autoincrement().primaryKey(),
      cycleId: int("cycleId").notNull(),
      houseId: int("houseId"),
      cageSectionId: int("cageSectionId"),
      recordDate: timestamp("recordDate").notNull(),
      feedKg: int("feedKg").default(0).notNull(),
      waterLiters: int("waterLiters").default(0).notNull(),
      mortality: int("mortality").default(0).notNull(),
      culls: int("culls").default(0).notNull(),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("records_cycle_date_idx").on(table.cycleId, table.recordDate), index("records_house_date_idx").on(table.houseId, table.recordDate)]);
    healthEvents = mysqlTable("healthEvents", {
      id: int("id").autoincrement().primaryKey(),
      cycleId: int("cycleId").notNull(),
      houseId: int("houseId"),
      eventDate: timestamp("eventDate").notNull(),
      eventType: mysqlEnum("eventType", ["medication", "vaccination"]).notNull(),
      productName: varchar("productName", { length: 180 }).notNull(),
      dosage: varchar("dosage", { length: 180 }).notNull(),
      administrationRoute: varchar("administrationRoute", { length: 120 }),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [index("health_cycle_date_idx").on(table.cycleId, table.eventDate), index("health_house_date_idx").on(table.houseId, table.eventDate)]);
    weightSamples = mysqlTable("weightSamples", {
      id: int("id").autoincrement().primaryKey(),
      cycleId: int("cycleId").notNull(),
      houseId: int("houseId"),
      sampleDate: timestamp("sampleDate").notNull(),
      averageWeightGrams: int("averageWeightGrams").notNull(),
      sampleSize: int("sampleSize"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [index("weights_cycle_date_idx").on(table.cycleId, table.sampleDate), index("weights_house_date_idx").on(table.houseId, table.sampleDate)]);
    cycleCageOccupancy = mysqlTable("cycleCageOccupancy", {
      id: int("id").autoincrement().primaryKey(),
      cycleId: int("cycleId").notNull(),
      cageSectionId: int("cageSectionId").notNull(),
      occupiedBirds: int("occupiedBirds").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [uniqueIndex("occupancy_cycle_section_unique").on(table.cycleId, table.cageSectionId)]);
    farmMemberships = mysqlTable("farmMemberships", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      farmId: int("farmId").notNull(),
      role: mysqlEnum("role", ["general_manager", "farm_manager", "veterinarian", "engineer", "supervisor", "accountant", "worker", "viewer"]).notNull(),
      houseId: int("houseId"),
      cycleId: int("cycleId"),
      isActive: boolean("isActive").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("memberships_user_idx").on(table.userId), index("memberships_farm_idx").on(table.farmId), uniqueIndex("membership_user_farm_unique").on(table.userId, table.farmId)]);
    invitationCodes = mysqlTable("invitationCodes", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      houseId: int("houseId"),
      cycleId: int("cycleId"),
      createdByUserId: int("createdByUserId").notNull(),
      codeHash: varchar("codeHash", { length: 64 }).notNull(),
      codePrefix: varchar("codePrefix", { length: 22 }).notNull(),
      role: mysqlEnum("role", ["general_manager", "farm_manager", "veterinarian", "engineer", "supervisor", "accountant", "worker", "viewer"]).notNull(),
      maxUses: int("maxUses").default(1).notNull(),
      usedCount: int("usedCount").default(0).notNull(),
      expiresAt: timestamp("expiresAt"),
      status: mysqlEnum("status", ["active", "revoked", "expired", "used"]).default("active").notNull(),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [uniqueIndex("invitation_code_hash_unique").on(table.codeHash), index("invitations_farm_idx").on(table.farmId), index("invitations_status_idx").on(table.status)]);
    farmWeatherDays = mysqlTable("farmWeatherDays", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      weatherDate: date("weatherDate").notNull(),
      weatherCode: int("weatherCode").notNull(),
      currentTemperature: decimal("currentTemperature", { precision: 5, scale: 1 }),
      temperatureHigh: decimal("temperatureHigh", { precision: 5, scale: 1 }).notNull(),
      temperatureLow: decimal("temperatureLow", { precision: 5, scale: 1 }).notNull(),
      humidity: int("humidity"),
      windSpeed: decimal("windSpeed", { precision: 5, scale: 1 }),
      apparentTemperature: decimal("apparentTemperature", { precision: 5, scale: 1 }),
      source: varchar("source", { length: 40 }).notNull(),
      syncedAt: timestamp("syncedAt").defaultNow().notNull()
    }, (table) => [uniqueIndex("weather_farm_date_unique").on(table.farmId, table.weatherDate), index("weather_farm_date_idx").on(table.farmId, table.weatherDate)]);
    feedInventorySettings = mysqlTable("feedInventorySettings", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      bagWeightKg: int("bagWeightKg").default(50).notNull(),
      reorderPointBags: int("reorderPointBags").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [uniqueIndex("feed_inventory_settings_farm_unique").on(table.farmId)]);
    feedInventoryTransactions = mysqlTable("feedInventoryTransactions", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      dailyRecordId: int("dailyRecordId"),
      movementType: mysqlEnum("movementType", ["opening", "receipt", "issue", "adjustment"]).notNull(),
      bagDelta: decimal("bagDelta", { precision: 12, scale: 4 }).notNull(),
      occurredAt: timestamp("occurredAt").notNull(),
      reference: varchar("reference", { length: 160 }),
      notes: text("notes"),
      createdByUserId: int("createdByUserId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [index("feed_inventory_transactions_farm_date_idx").on(table.farmId, table.occurredAt), uniqueIndex("feed_inventory_transactions_daily_record_unique").on(table.dailyRecordId)]);
    farmExpenses = mysqlTable("farmExpenses", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      cycleId: int("cycleId"),
      category: mysqlEnum("category", ["chicks", "feed", "health", "labor", "utilities", "maintenance", "transport", "equipment", "other"]).notNull(),
      amountPiasters: int("amountPiasters").notNull(),
      expenseDate: timestamp("expenseDate").notNull(),
      supplier: varchar("supplier", { length: 180 }),
      reference: varchar("reference", { length: 160 }),
      notes: text("notes"),
      approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected", "paid"]).default("approved").notNull(),
      approvedByUserId: int("approvedByUserId"),
      approvedAt: timestamp("approvedAt"),
      rejectionReason: text("rejectionReason"),
      createdByUserId: int("createdByUserId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("expenses_farm_date_idx").on(table.farmId, table.expenseDate), index("expenses_cycle_date_idx").on(table.cycleId, table.expenseDate), index("expenses_status_idx").on(table.approvalStatus)]);
    medicineInventory = mysqlTable("medicineInventory", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      productName: varchar("productName", { length: 255 }).notNull(),
      category: mysqlEnum("category", ["vaccine", "antibiotic", "vitamin", "disinfectant", "supplement", "other"]).default("other").notNull(),
      batchNumber: varchar("batchNumber", { length: 100 }),
      expiryDate: date("expiryDate"),
      quantity: decimal("quantity", { precision: 10, scale: 2 }).default("0.00").notNull(),
      unit: varchar("unit", { length: 50 }).default("\u0639\u0628\u0648\u0629").notNull(),
      unitCostPiasters: int("unitCostPiasters").default(0).notNull(),
      reorderPoint: decimal("reorderPoint", { precision: 10, scale: 2 }).default("5.00").notNull(),
      notes: text("notes"),
      createdByUserId: int("createdByUserId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("medicine_inventory_farm_idx").on(table.farmId)]);
    workers = mysqlTable("workers", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      name: varchar("name", { length: 180 }).notNull(),
      jobTitle: varchar("jobTitle", { length: 140 }),
      phone: varchar("phone", { length: 40 }),
      notes: text("notes"),
      isActive: boolean("isActive").default(true).notNull(),
      createdByUserId: int("createdByUserId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("workers_farm_active_idx").on(table.farmId, table.isActive)]);
    workerAccountEntries = mysqlTable("workerAccountEntries", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      workerId: int("workerId").notNull(),
      entryType: mysqlEnum("entryType", ["salary_credit", "advance", "withdrawal", "adjustment"]).notNull(),
      amountPiasters: int("amountPiasters").notNull(),
      occurredAt: timestamp("occurredAt").notNull(),
      reference: varchar("reference", { length: 160 }),
      notes: text("notes"),
      createdByUserId: int("createdByUserId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("worker_account_entries_worker_date_idx").on(table.workerId, table.occurredAt), index("worker_account_entries_farm_date_idx").on(table.farmId, table.occurredAt)]);
    traders = mysqlTable("traders", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      name: varchar("name", { length: 180 }).notNull(),
      phone: varchar("phone", { length: 40 }),
      companyName: varchar("companyName", { length: 180 }),
      address: varchar("address", { length: 300 }),
      notes: text("notes"),
      isActive: boolean("isActive").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [index("traders_farm_idx").on(table.farmId)]);
    sales = mysqlTable("sales", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      cycleId: int("cycleId").notNull(),
      traderId: int("traderId").notNull(),
      saleDate: timestamp("saleDate").notNull(),
      grossWeightGrams: int("grossWeightGrams").notNull(),
      loadedCageCount: int("loadedCageCount").notNull(),
      plannedCageCount: int("plannedCageCount").default(0).notNull(),
      batchCageCount: int("batchCageCount").default(5).notNull(),
      weighingMode: mysqlEnum("weighingMode", ["fixed", "variable", "direct"]).default("fixed").notNull(),
      birdsPerCage: int("birdsPerCage").default(0).notNull(),
      status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
      tareWeightGrams: int("tareWeightGrams").notNull(),
      tareCageCount: int("tareCageCount").notNull(),
      netWeightGrams: int("netWeightGrams").notNull(),
      pricePerKgPiasters: int("pricePerKgPiasters").notNull(),
      totalPiasters: int("totalPiasters").notNull(),
      discountPiasters: int("discountPiasters").default(0).notNull(),
      isDeleted: boolean("isDeleted").default(false).notNull(),
      deletedAt: timestamp("deletedAt"),
      reference: varchar("reference", { length: 160 }),
      notes: text("notes"),
      createdByUserId: int("createdByUserId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [
      index("sales_farm_date_idx").on(table.farmId, table.saleDate),
      index("sales_cycle_date_idx").on(table.cycleId, table.saleDate),
      index("sales_trader_idx").on(table.traderId),
      index("sales_is_deleted_idx").on(table.isDeleted)
    ]);
    saleWeighBatches = mysqlTable("saleWeighBatches", {
      id: int("id").autoincrement().primaryKey(),
      saleId: int("saleId").notNull(),
      sequence: int("sequence").notNull(),
      weighingStage: mysqlEnum("weighingStage", ["tare_pending", "filled"]).default("filled").notNull(),
      cageCount: int("cageCount").default(0).notNull(),
      birdCount: int("birdCount").default(0).notNull(),
      grossWeightGrams: int("grossWeightGrams").notNull(),
      tareWeightGrams: int("tareWeightGrams").notNull(),
      netWeightGrams: int("netWeightGrams").notNull(),
      totalPiasters: int("totalPiasters").notNull(),
      weighedAt: timestamp("weighedAt").notNull(),
      notes: text("notes"),
      createdByUserId: int("createdByUserId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [uniqueIndex("sale_batch_sequence_unique").on(table.saleId, table.sequence), index("sale_batches_sale_date_idx").on(table.saleId, table.weighedAt)]);
    salePayments = mysqlTable("salePayments", {
      id: int("id").autoincrement().primaryKey(),
      saleId: int("saleId").notNull(),
      farmId: int("farmId").notNull(),
      amountPiasters: int("amountPiasters").notNull(),
      paymentMethod: mysqlEnum("paymentMethod", ["cash", "transfer", "credit", "other"]).default("cash").notNull(),
      paidAt: timestamp("paidAt").notNull(),
      reference: varchar("reference", { length: 160 }),
      notes: text("notes"),
      createdByUserId: int("createdByUserId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [index("sale_payments_sale_idx").on(table.saleId, table.paidAt), index("sale_payments_farm_idx").on(table.farmId, table.paidAt)]);
    saleActivities = mysqlTable("saleActivities", {
      id: int("id").autoincrement().primaryKey(),
      saleId: int("saleId").notNull(),
      farmId: int("farmId").notNull(),
      actorUserId: int("actorUserId").notNull(),
      action: mysqlEnum("action", ["sale_started", "sale_updated", "sale_completed", "batch_added", "batch_updated", "batch_deleted", "batches_reordered", "payment_added", "sale_deleted"]).notNull(),
      details: text("details"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [index("sale_activities_sale_date_idx").on(table.saleId, table.createdAt), index("sale_activities_farm_date_idx").on(table.farmId, table.createdAt)]);
    auditLogs = mysqlTable("auditLogs", {
      id: int("id").autoincrement().primaryKey(),
      companyId: int("companyId"),
      farmId: int("farmId"),
      cycleId: int("cycleId"),
      userId: int("userId").notNull(),
      entityType: varchar("entityType", { length: 64 }).notNull(),
      entityId: int("entityId").notNull(),
      action: varchar("action", { length: 64 }).notNull(),
      oldValues: text("oldValues"),
      newValues: text("newValues"),
      details: text("details"),
      ipAddress: varchar("ipAddress", { length: 45 }),
      userAgent: varchar("userAgent", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [
      index("audit_logs_company_idx").on(table.companyId),
      index("audit_logs_farm_idx").on(table.farmId),
      index("audit_logs_entity_idx").on(table.entityType, table.entityId),
      index("audit_logs_user_date_idx").on(table.userId, table.createdAt)
    ]);
    alerts = mysqlTable("alerts", {
      id: int("id").autoincrement().primaryKey(),
      companyId: int("companyId"),
      farmId: int("farmId").notNull(),
      cycleId: int("cycleId"),
      houseId: int("houseId"),
      alertType: mysqlEnum("alertType", [
        "high_mortality",
        "low_weight",
        "abnormal_fcr",
        "low_feed_stock",
        "vaccine_due",
        "water_consumption_anomaly",
        "missing_daily_record",
        "system_notification"
      ]).notNull(),
      severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("warning").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      message: text("message").notNull(),
      status: mysqlEnum("status", ["active", "acknowledged", "resolved", "dismissed"]).default("active").notNull(),
      acknowledgedByUserId: int("acknowledgedByUserId"),
      acknowledgedAt: timestamp("acknowledgedAt"),
      resolvedAt: timestamp("resolvedAt"),
      metadata: text("metadata"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [
      index("alerts_farm_status_idx").on(table.farmId, table.status),
      index("alerts_cycle_idx").on(table.cycleId),
      index("alerts_created_idx").on(table.createdAt)
    ]);
    sensorReadings = mysqlTable("sensorReadings", {
      id: int("id").autoincrement().primaryKey(),
      farmId: int("farmId").notNull(),
      houseId: int("houseId").notNull(),
      sensorType: mysqlEnum("sensorType", [
        "temperature",
        "humidity",
        "ammonia_nh3",
        "co2",
        "static_pressure",
        "water_flow",
        "light_lux"
      ]).notNull(),
      value: decimal("value", { precision: 10, scale: 2 }).notNull(),
      unit: varchar("unit", { length: 30 }).notNull(),
      deviceId: varchar("deviceId", { length: 100 }),
      readingTime: timestamp("readingTime").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [
      index("sensor_readings_house_time_idx").on(table.houseId, table.readingTime),
      index("sensor_readings_farm_sensor_idx").on(table.farmId, table.sensorType)
    ]);
  }
});

// server/api.ts
import "dotenv/config";
import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/routers.ts
import { z as z2 } from "zod";

// server/db/connection.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
var _db = null;
var _pool = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = process.env.DATABASE_URL;
      const isCloudDb = url.includes("ssl") || url.includes("aiven") || url.includes("planetscale") || url.includes("tidb") || url.includes("railway") || url.includes("render");
      _pool = mysql.createPool({
        uri: url,
        ssl: isCloudDb ? { rejectUnauthorized: false } : void 0,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 6e4,
        enableKeepAlive: true
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.error("[Database] Connection pool initialization failed:", error);
      _db = null;
    }
  }
  return _db;
}

// server/db/users.ts
init_schema();
import { eq } from "drizzle-orm";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db/users.ts
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? void 0,
    lastSignedIn: user.lastSignedIn ?? /* @__PURE__ */ new Date()
  };
  if (user.role) values.role = user.role;
  else if (user.openId === ENV.ownerOpenId) values.role = "admin";
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: values.lastSignedIn } });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// server/db/workspace.ts
init_schema();
import { and, desc, eq as eq2, inArray } from "drizzle-orm";

// shared/accessControl.ts
var farmRoles = [
  "general_manager",
  "farm_manager",
  "veterinarian",
  "engineer",
  "supervisor",
  "accountant",
  "worker",
  "viewer"
];
var capabilities = {
  owner: [
    "manage_access",
    "manage_farms",
    "manage_cycles",
    "manage_housing",
    "manage_inventory",
    "manage_expenses",
    "approve_expenses",
    "manage_sales",
    "record_sales_weights",
    "record_operations",
    "manage_health",
    "record_weights",
    "view_reports",
    "view_audit_logs",
    "close_cycles"
  ],
  general_manager: [
    "manage_access",
    "manage_farms",
    "manage_cycles",
    "manage_housing",
    "manage_inventory",
    "manage_expenses",
    "approve_expenses",
    "manage_sales",
    "record_sales_weights",
    "record_operations",
    "manage_health",
    "record_weights",
    "view_reports",
    "view_audit_logs",
    "close_cycles"
  ],
  farm_manager: [
    "manage_cycles",
    "manage_housing",
    "manage_inventory",
    "manage_expenses",
    "approve_expenses",
    "manage_sales",
    "record_sales_weights",
    "record_operations",
    "record_weights",
    "view_reports",
    "manage_health",
    "view_audit_logs"
  ],
  veterinarian: ["manage_health", "view_reports"],
  engineer: [
    "manage_housing",
    "manage_inventory",
    "manage_expenses",
    "manage_sales",
    "record_sales_weights",
    "record_operations",
    "record_weights",
    "view_reports"
  ],
  supervisor: ["record_operations", "record_weights", "record_sales_weights", "view_reports"],
  accountant: ["manage_expenses", "approve_expenses", "manage_sales", "manage_inventory", "view_reports", "view_audit_logs"],
  worker: ["record_sales_weights", "record_operations"],
  viewer: ["view_reports"]
};
function roleCan(role, capability) {
  return capabilities[role].includes(capability);
}
function scopeAllows(granted, requested) {
  if (granted.houseId && granted.houseId !== requested.houseId) return false;
  if (granted.cycleId && granted.cycleId !== requested.cycleId) return false;
  return true;
}

// server/db/workspace.ts
async function getWorkspace(ownerId) {
  const db = await getDb();
  if (!db) return { farms: [], houses: [], cageSections: [], occupancy: [], cycles: [], records: [], weights: [], health: [], feedInventorySettings: [], feedInventoryTransactions: [], expenses: [], workers: [], workerAccountEntries: [], traders: [], sales: [], salePayments: [], saleWeighBatches: [], saleActivities: [] };
  const [ownedFarms, memberships] = await Promise.all([
    db.select().from(farms).where(eq2(farms.ownerId, ownerId)).orderBy(desc(farms.createdAt)),
    db.select().from(farmMemberships).where(and(eq2(farmMemberships.userId, ownerId), eq2(farmMemberships.isActive, true)))
  ]);
  const memberFarmIds = memberships.map((membership) => membership.farmId);
  const sharedFarms = memberFarmIds.length ? await db.select().from(farms).where(inArray(farms.id, memberFarmIds)) : [];
  const accessibleFarms = [...ownedFarms, ...sharedFarms.filter((farm) => !ownedFarms.some((owned) => owned.id === farm.id))];
  if (!accessibleFarms.length) return { farms: [], houses: [], cageSections: [], occupancy: [], cycles: [], records: [], weights: [], health: [], memberships: [], invitations: [], feedInventorySettings: [], feedInventoryTransactions: [], expenses: [], workers: [], workerAccountEntries: [], traders: [], sales: [], salePayments: [], saleWeighBatches: [], saleActivities: [] };
  const farmIds = accessibleFarms.map((farm) => farm.id);
  const [rawHouses, rawCycles] = await Promise.all([
    db.select().from(houses).where(inArray(houses.farmId, farmIds)),
    db.select().from(cycles).where(inArray(cycles.farmId, farmIds))
  ]);
  const ownedFarmIds = ownedFarms.map((farm) => farm.id);
  const workerAccountFarmIds = accessibleFarms.filter((farm) => ownedFarmIds.includes(farm.id) || memberships.some((membership) => membership.farmId === farm.id && !membership.houseId && !membership.cycleId && roleCan(membership.role, "manage_expenses"))).map((farm) => farm.id);
  const allHouses = rawHouses.filter((house) => ownedFarmIds.includes(house.farmId) || memberships.some((membership) => membership.farmId === house.farmId && (!membership.houseId || membership.houseId === house.id)));
  const allCycles = rawCycles.filter((cycle) => ownedFarmIds.includes(cycle.farmId) || memberships.some((membership) => membership.farmId === cycle.farmId && (!membership.houseId || membership.houseId === cycle.houseId) && (!membership.cycleId || membership.cycleId === cycle.id)));
  const activeCycle = allCycles.find((cycle) => cycle.status === "active") ?? allCycles[0];
  const allSections = allHouses.length ? (await Promise.all(allHouses.map((house) => db.select().from(cageSections).where(eq2(cageSections.houseId, house.id))))).flat() : [];
  const invitations = ownedFarmIds.length ? await db.select().from(invitationCodes).where(inArray(invitationCodes.farmId, ownedFarmIds)).orderBy(desc(invitationCodes.createdAt)) : [];
  const cycleIds = allCycles.map((cycle) => cycle.id);
  const [inventorySettings, inventoryTransactions, rawExpenses, rawWorkers, rawWorkerAccountEntries, workspaceTraders, workspaceSales, workspaceSalePayments] = await Promise.all([
    db.select().from(feedInventorySettings).where(inArray(feedInventorySettings.farmId, farmIds)),
    db.select().from(feedInventoryTransactions).where(inArray(feedInventoryTransactions.farmId, farmIds)).orderBy(desc(feedInventoryTransactions.occurredAt)),
    db.select().from(farmExpenses).where(inArray(farmExpenses.farmId, farmIds)).orderBy(desc(farmExpenses.expenseDate)),
    workerAccountFarmIds.length ? db.select().from(workers).where(inArray(workers.farmId, workerAccountFarmIds)).orderBy(desc(workers.createdAt)) : Promise.resolve([]),
    workerAccountFarmIds.length ? db.select().from(workerAccountEntries).where(inArray(workerAccountEntries.farmId, workerAccountFarmIds)).orderBy(desc(workerAccountEntries.occurredAt)) : Promise.resolve([]),
    db.select().from(traders).where(inArray(traders.farmId, farmIds)).orderBy(desc(traders.createdAt)),
    db.select().from(sales).where(and(inArray(sales.farmId, farmIds), eq2(sales.isDeleted, false))).orderBy(desc(sales.saleDate)),
    db.select().from(salePayments).where(inArray(salePayments.farmId, farmIds)).orderBy(desc(salePayments.paidAt))
  ]);
  const workspaceSaleWeighBatches = workspaceSales.length ? await db.select().from(saleWeighBatches).where(inArray(saleWeighBatches.saleId, workspaceSales.map((sale) => sale.id))).orderBy(desc(saleWeighBatches.weighedAt)) : [];
  const workspaceSaleActivities = workspaceSales.length ? await db.select().from(saleActivities).where(inArray(saleActivities.saleId, workspaceSales.map((sale) => sale.id))).orderBy(desc(saleActivities.createdAt)) : [];
  const expenses = rawExpenses.filter((expense) => ownedFarmIds.includes(expense.farmId) || memberships.some((membership) => {
    if (membership.farmId !== expense.farmId) return false;
    const expenseCycle = allCycles.find((cycle) => cycle.id === expense.cycleId);
    return (!membership.cycleId || membership.cycleId === expense.cycleId) && (!membership.houseId || expenseCycle?.houseId === membership.houseId);
  }));
  if (!activeCycle) return { farms: accessibleFarms, houses: allHouses, cageSections: allSections, assignments: [], occupancy: [], cycles: allCycles, records: [], weights: [], health: [], memberships, invitations, feedInventorySettings: inventorySettings, feedInventoryTransactions: inventoryTransactions, expenses, workers: rawWorkers, workerAccountEntries: rawWorkerAccountEntries, traders: workspaceTraders, sales: workspaceSales, salePayments: workspaceSalePayments, saleWeighBatches: workspaceSaleWeighBatches, saleActivities: workspaceSaleActivities };
  const [records, weights, health, occupancy, assignments] = await Promise.all([
    cycleIds.length ? db.select().from(dailyRecords).where(inArray(dailyRecords.cycleId, cycleIds)).orderBy(dailyRecords.recordDate) : Promise.resolve([]),
    cycleIds.length ? db.select().from(weightSamples).where(inArray(weightSamples.cycleId, cycleIds)).orderBy(weightSamples.sampleDate) : Promise.resolve([]),
    cycleIds.length ? db.select().from(healthEvents).where(inArray(healthEvents.cycleId, cycleIds)).orderBy(desc(healthEvents.eventDate)) : Promise.resolve([]),
    cycleIds.length ? db.select().from(cycleCageOccupancy).where(inArray(cycleCageOccupancy.cycleId, cycleIds)) : Promise.resolve([]),
    cycleIds.length ? db.select().from(cycleHouseAssignments).where(inArray(cycleHouseAssignments.cycleId, cycleIds)) : Promise.resolve([])
  ]);
  return { farms: accessibleFarms, houses: allHouses, cageSections: allSections, assignments, occupancy, cycles: allCycles, records, weights, health, memberships, invitations, feedInventorySettings: inventorySettings, feedInventoryTransactions: inventoryTransactions, expenses, workers: rawWorkers, workerAccountEntries: rawWorkerAccountEntries, traders: workspaceTraders, sales: workspaceSales, salePayments: workspaceSalePayments, saleWeighBatches: workspaceSaleWeighBatches, saleActivities: workspaceSaleActivities };
}

// server/db/inventory.ts
init_schema();
import { eq as eq4, sql } from "drizzle-orm";

// shared/feedInventory.ts
function inventoryMovementDelta(type, bags) {
  if (!Number.isFinite(bags) || bags === 0) throw new Error("Quantity must be a non-zero number of bags");
  if ((type === "opening" || type === "receipt") && bags < 0) throw new Error("Opening and receipt movements must add bags");
  if (type === "issue" && bags > 0) throw new Error("Issue movements must remove bags");
  return bags;
}
function dailyFeedIssueBags(feedKg, bagWeightKg) {
  if (!Number.isFinite(feedKg) || feedKg < 0) throw new Error("Daily feed must be a non-negative number");
  if (!Number.isFinite(bagWeightKg) || bagWeightKg <= 0) throw new Error("Bag weight must be a positive number");
  return feedKg === 0 ? 0 : -Number((feedKg / bagWeightKg).toFixed(4));
}

// server/db/auth.ts
init_schema();
import { and as and2, eq as eq3 } from "drizzle-orm";

// shared/cycleMutationPolicy.ts
function assertCycleAllowsOperationalMutation(status) {
  if (status === "closed") throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u062F\u0648\u0631\u0629 \u0645\u063A\u0644\u0642\u0629");
}

// shared/houseScopedPolicy.ts
function canRecordForHouse({ cycleFarmId, houseFarmId, assignedBirds }) {
  return cycleFarmId === houseFarmId && (assignedBirds ?? 0) > 0;
}
function canDistributeCagesForHouse({ assignedBirds, houseSectionCapacity }) {
  return (assignedBirds ?? 0) > 0 && houseSectionCapacity > 0;
}

// server/houseScopedGuards.ts
function requireHouseScopedRecord({ cycleFarmId, houseFarmId, assignedBirds }) {
  if (!canRecordForHouse({ cycleFarmId, houseFarmId, assignedBirds })) throw new Error("Assign birds to this house before recording operations");
}
function requireHouseCageDistribution({ assignedBirds, houseSectionCapacity }) {
  if (!canDistributeCagesForHouse({ assignedBirds, houseSectionCapacity })) throw new Error("Assign birds to this house before distributing them to cage sections");
}

// server/db/auth.ts
async function resolveFarmAccess(userId, farmId) {
  const db = await getDb();
  if (!db) return null;
  const [farm] = await db.select({ ownerId: farms.ownerId }).from(farms).where(eq3(farms.id, farmId)).limit(1);
  if (!farm) return null;
  if (farm.ownerId === userId) return { role: "owner", scope: { houseId: null, cycleId: null } };
  const [membership] = await db.select({ role: farmMemberships.role, houseId: farmMemberships.houseId, cycleId: farmMemberships.cycleId }).from(farmMemberships).where(and2(eq3(farmMemberships.userId, userId), eq3(farmMemberships.farmId, farmId), eq3(farmMemberships.isActive, true))).limit(1);
  return membership ? { role: membership.role, scope: { houseId: membership.houseId, cycleId: membership.cycleId } } : null;
}
async function requireFarmCapability(userId, farmId, capability, resourceScope = { houseId: null, cycleId: null }) {
  const access = await resolveFarmAccess(userId, farmId);
  if (!access || !roleCan(access.role, capability) || !scopeAllows(access.scope, resourceScope)) throw new Error("You do not have permission for this farm action");
  return access.role;
}
async function requireCycleCapability(userId, cycleId, capability) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, houseId: cycles.houseId }).from(cycles).where(eq3(cycles.id, cycleId)).limit(1);
  if (!cycle) throw new Error("Cycle not found");
  return requireFarmCapability(userId, cycle.farmId, capability, { houseId: cycle.houseId, cycleId });
}
async function requireCycleHouseAssignment(userId, cycleId, houseId, capability) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq3(cycles.id, cycleId)).limit(1);
  const [house] = await db.select({ farmId: houses.farmId }).from(houses).where(eq3(houses.id, houseId)).limit(1);
  if (!cycle || !house || cycle.farmId !== house.farmId) throw new Error("House does not belong to this cycle farm");
  assertCycleAllowsOperationalMutation(cycle.status);
  await requireFarmCapability(userId, cycle.farmId, capability, { houseId, cycleId });
  const [assignment] = await db.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(and2(eq3(cycleHouseAssignments.cycleId, cycleId), eq3(cycleHouseAssignments.houseId, houseId))).limit(1);
  requireHouseScopedRecord({ cycleFarmId: cycle.farmId, houseFarmId: house.farmId, assignedBirds: assignment?.assignedBirds });
  return assignment;
}

// server/db/inventory.ts
async function updateFeedInventorySettings(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_inventory");
  await db.insert(feedInventorySettings).values(input).onDuplicateKeyUpdate({ set: { bagWeightKg: input.bagWeightKg, reorderPointBags: input.reorderPointBags } });
}
async function addFeedInventoryTransaction(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_inventory");
  const bagDelta = inventoryMovementDelta(input.movementType, input.bagDelta);
  await db.transaction(async (tx) => {
    const [summary] = await tx.select({ balance: sql`coalesce(sum(${feedInventoryTransactions.bagDelta}), 0)` }).from(feedInventoryTransactions).where(eq4(feedInventoryTransactions.farmId, input.farmId));
    const currentBalance = Number(summary?.balance ?? 0);
    if (currentBalance + bagDelta < 0) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0635\u0631\u0641 \u0639\u062F\u062F \u0634\u0643\u0627\u064A\u0631 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0645\u062A\u0627\u062D \u0641\u064A \u0627\u0644\u0645\u062E\u0632\u0646");
    await tx.insert(feedInventoryTransactions).values({ ...input, bagDelta: bagDelta.toFixed(4), reference: input.reference || null, notes: input.notes || null, createdByUserId: userId });
  });
}

// server/db/expenses.ts
init_schema();
import { eq as eq5 } from "drizzle-orm";

// shared/expenseManagement.ts
var expenseCategories = ["chicks", "feed", "health", "labor", "utilities", "maintenance", "transport", "equipment", "other"];
function amountToPiasters(amountEgp) {
  if (!Number.isFinite(amountEgp) || amountEgp <= 0) throw new Error("\u064A\u062C\u0628 \u0625\u062F\u062E\u0627\u0644 \u0642\u064A\u0645\u0629 \u0645\u0635\u0631\u0648\u0641 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
  const piasters = Math.round(amountEgp * 100);
  if (!Number.isSafeInteger(piasters) || piasters > 1e9) throw new Error("\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
  return piasters;
}
function expenseCycleBelongsToFarm(farmId, cycleFarmId) {
  return cycleFarmId !== null && cycleFarmId !== void 0 && farmId === cycleFarmId;
}

// shared/expenseLifecycle.ts
async function executeFarmExpenseCreate(input) {
  if (input.mutation.cycleId) {
    if (!input.cycle || input.cycle.id !== input.mutation.cycleId || !expenseCycleBelongsToFarm(input.mutation.farmId, input.cycle.farmId)) {
      throw new Error("\u0644\u0627 \u062A\u0646\u062A\u0645\u064A \u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0645\u0632\u0631\u0639\u0629");
    }
    if (input.cycle.status) {
      assertCycleAllowsOperationalMutation(input.cycle.status);
    }
  }
  await input.requireExpenseAccess(input.userId, input.mutation.farmId, { houseId: input.cycle?.houseId ?? null, cycleId: input.mutation.cycleId ?? null });
  const record = { ...input.mutation, amountPiasters: amountToPiasters(input.mutation.amountEgp) };
  await input.persist(record);
  return record;
}
async function executeFarmExpenseUpdate(input) {
  return executeFarmExpenseCreate(input);
}

// server/db/expenses.ts
async function addFarmExpense(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  let cycle;
  if (input.cycleId) {
    const [storedCycle] = await db.select({ id: cycles.id, farmId: cycles.farmId, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq5(cycles.id, input.cycleId)).limit(1);
    cycle = storedCycle;
  }
  await executeFarmExpenseCreate({
    userId,
    mutation: input,
    cycle,
    requireExpenseAccess: async (actorId, farmId, scope) => {
      await requireFarmCapability(actorId, farmId, "manage_expenses", scope);
    },
    persist: async (record) => {
      await db.insert(farmExpenses).values({
        farmId: record.farmId,
        cycleId: record.cycleId ?? null,
        category: record.category,
        amountPiasters: record.amountPiasters,
        expenseDate: record.expenseDate,
        supplier: record.supplier || null,
        reference: record.reference || null,
        notes: record.notes || null,
        createdByUserId: userId
      });
    }
  });
}
async function updateFarmExpense(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [storedExpense] = await db.select().from(farmExpenses).where(eq5(farmExpenses.id, input.expenseId)).limit(1);
  if (!storedExpense) throw new Error("\u0633\u062C\u0644 \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  const [currentCycle] = storedExpense.cycleId ? await db.select({ id: cycles.id, farmId: cycles.farmId, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq5(cycles.id, storedExpense.cycleId)).limit(1) : [void 0];
  if (currentCycle?.status) {
    assertCycleAllowsOperationalMutation(currentCycle.status);
  }
  await requireFarmCapability(userId, storedExpense.farmId, "manage_expenses", { houseId: currentCycle?.houseId ?? null, cycleId: storedExpense.cycleId ?? null });
  let targetCycle;
  if (input.cycleId) {
    const [cycle] = await db.select({ id: cycles.id, farmId: cycles.farmId, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq5(cycles.id, input.cycleId)).limit(1);
    targetCycle = cycle;
  }
  await executeFarmExpenseUpdate({
    userId,
    mutation: { farmId: storedExpense.farmId, cycleId: input.cycleId, category: input.category, amountEgp: input.amountEgp, expenseDate: input.expenseDate, supplier: input.supplier, reference: input.reference, notes: input.notes },
    cycle: targetCycle,
    requireExpenseAccess: async (actorId, farmId, scope) => {
      await requireFarmCapability(actorId, farmId, "manage_expenses", scope);
    },
    persist: async (record) => {
      await db.update(farmExpenses).set({ cycleId: record.cycleId ?? null, category: record.category, amountPiasters: record.amountPiasters, expenseDate: record.expenseDate, supplier: record.supplier || null, reference: record.reference || null, notes: record.notes || null }).where(eq5(farmExpenses.id, storedExpense.id));
    }
  });
}
async function approveExpense(userId, expenseId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [expense] = await db.select().from(farmExpenses).where(eq5(farmExpenses.id, expenseId)).limit(1);
  if (!expense) throw new Error("\u0633\u062C\u0644 \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  await requireFarmCapability(userId, expense.farmId, "approve_expenses");
  await db.update(farmExpenses).set({
    approvalStatus: "approved",
    approvedByUserId: userId,
    approvedAt: /* @__PURE__ */ new Date()
  }).where(eq5(farmExpenses.id, expenseId));
  return { success: true };
}
async function rejectExpense(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [expense] = await db.select().from(farmExpenses).where(eq5(farmExpenses.id, input.expenseId)).limit(1);
  if (!expense) throw new Error("\u0633\u062C\u0644 \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  await requireFarmCapability(userId, expense.farmId, "approve_expenses");
  await db.update(farmExpenses).set({
    approvalStatus: "rejected",
    rejectionReason: input.reason
  }).where(eq5(farmExpenses.id, input.expenseId));
  return { success: true };
}
async function markExpensePaid(userId, expenseId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [expense] = await db.select().from(farmExpenses).where(eq5(farmExpenses.id, expenseId)).limit(1);
  if (!expense) throw new Error("\u0633\u062C\u0644 \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  await requireFarmCapability(userId, expense.farmId, "manage_expenses");
  await db.update(farmExpenses).set({
    approvalStatus: "paid"
  }).where(eq5(farmExpenses.id, expenseId));
  return { success: true };
}

// server/db/workers.ts
init_schema();
import { eq as eq6 } from "drizzle-orm";

// shared/workerAccounts.ts
var workerAccountEntryTypes = ["salary_credit", "advance", "withdrawal", "adjustment"];
function workerAccountAmountToPiasters(entryType, amountEgp) {
  const allowsSignedAmount = entryType === "adjustment";
  if (!Number.isFinite(amountEgp) || (allowsSignedAmount ? amountEgp === 0 : amountEgp <= 0)) throw new Error("\u0642\u064A\u0645\u0629 \u062D\u0631\u0643\u0629 \u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0627\u0645\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
  const piasters = Math.round(amountEgp * 100);
  if (!Number.isSafeInteger(piasters) || Math.abs(piasters) > 1e9) throw new Error("\u0642\u064A\u0645\u0629 \u062D\u0631\u0643\u0629 \u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0627\u0645\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
  return piasters;
}

// server/db/workers.ts
async function createWorker(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_expenses");
  await db.insert(workers).values({ farmId: input.farmId, name: input.name, jobTitle: input.jobTitle || null, phone: input.phone || null, notes: input.notes || null, createdByUserId: userId });
}
async function updateWorker(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [worker] = await db.select().from(workers).where(eq6(workers.id, input.workerId)).limit(1);
  if (!worker) throw new Error("\u0627\u0644\u0639\u0627\u0645\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  await requireFarmCapability(userId, worker.farmId, "manage_expenses");
  await db.update(workers).set({ name: input.name, jobTitle: input.jobTitle || null, phone: input.phone || null, notes: input.notes || null, isActive: input.isActive }).where(eq6(workers.id, worker.id));
}
async function requireWorkerAccountAccess(db, userId, workerId) {
  const [worker] = await db.select().from(workers).where(eq6(workers.id, workerId)).limit(1);
  if (!worker) throw new Error("\u0627\u0644\u0639\u0627\u0645\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  await requireFarmCapability(userId, worker.farmId, "manage_expenses");
  return worker;
}
async function addWorkerAccountEntry(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const worker = await requireWorkerAccountAccess(db, userId, input.workerId);
  await db.insert(workerAccountEntries).values({ farmId: worker.farmId, workerId: worker.id, entryType: input.entryType, amountPiasters: workerAccountAmountToPiasters(input.entryType, input.amountEgp), occurredAt: input.occurredAt, reference: input.reference || null, notes: input.notes || null, createdByUserId: userId });
}
async function updateWorkerAccountEntry(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [entry] = await db.select().from(workerAccountEntries).where(eq6(workerAccountEntries.id, input.entryId)).limit(1);
  if (!entry) throw new Error("\u062D\u0631\u0643\u0629 \u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0627\u0645\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
  const worker = await requireWorkerAccountAccess(db, userId, entry.workerId);
  await db.update(workerAccountEntries).set({ farmId: worker.farmId, entryType: input.entryType, amountPiasters: workerAccountAmountToPiasters(input.entryType, input.amountEgp), occurredAt: input.occurredAt, reference: input.reference || null, notes: input.notes || null }).where(eq6(workerAccountEntries.id, entry.id));
}
async function deleteWorkerAccountEntry(userId, entryId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [entry] = await db.select().from(workerAccountEntries).where(eq6(workerAccountEntries.id, entryId)).limit(1);
  if (!entry) throw new Error("\u062D\u0631\u0643\u0629 \u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0627\u0645\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
  await requireWorkerAccountAccess(db, userId, entry.workerId);
  await db.delete(workerAccountEntries).where(eq6(workerAccountEntries.id, entry.id));
}

// server/db/sales.ts
init_schema();
import { and as and3, eq as eq7, sql as sql2 } from "drizzle-orm";

// shared/salesSettlement.ts
function kilogramsToGrams(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631`);
  const grams = Math.round(value * 1e3);
  if (!Number.isSafeInteger(grams)) throw new Error(`${label} \u063A\u064A\u0631 \u0635\u0627\u0644\u062D`);
  return grams;
}
function saleSettlement(input) {
  if (!Number.isInteger(input.loadedCageCount) || input.loadedCageCount <= 0) throw new Error("\u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u0627\u0644\u0645\u062D\u0645\u0644\u0629 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
  if (!Number.isInteger(input.tareCageCount) || input.tareCageCount <= 0) throw new Error("\u0639\u062F\u062F \u0623\u0642\u0641\u0627\u0635 \u0627\u0644\u0641\u0627\u0631\u063A \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
  const grossWeightGrams = kilogramsToGrams(input.grossWeightKg, "\u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A");
  const tareWeightGrams = kilogramsToGrams(input.tareWeightKg, "\u0648\u0632\u0646 \u0627\u0644\u0641\u0627\u0631\u063A");
  const tarePerCageGrams = tareWeightGrams / input.tareCageCount;
  const totalTareGrams = Math.round(tarePerCageGrams * input.loadedCageCount);
  const netWeightGrams = grossWeightGrams - totalTareGrams;
  if (netWeightGrams <= 0) throw new Error("\u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0635\u0627\u0641\u064A \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631 \u0628\u0639\u062F \u062E\u0635\u0645 \u0648\u0632\u0646 \u0627\u0644\u0623\u0642\u0641\u0627\u0635");
  const pricePerKgPiasters = amountToPiasters(input.pricePerKgEgp);
  const totalPiasters = Math.round(netWeightGrams * pricePerKgPiasters / 1e3);
  return { grossWeightGrams, tareWeightGrams, tarePerCageGrams, totalTareGrams, netWeightGrams, pricePerKgPiasters, totalPiasters };
}

// shared/salesLifecycle.ts
async function executeSaleCreate(input) {
  if (!input.cycle || input.cycle.farmId !== input.mutation.farmId || input.cycle.cycleId !== input.mutation.cycleId) throw new Error("\u0644\u0627 \u062A\u0646\u062A\u0645\u064A \u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0645\u0632\u0631\u0639\u0629");
  if (!input.trader || input.trader.id !== input.mutation.traderId || input.trader.farmId !== input.mutation.farmId) throw new Error("\u0627\u0644\u062A\u0627\u062C\u0631 \u0627\u0644\u0645\u062D\u062F\u062F \u0644\u0627 \u064A\u0646\u062A\u0645\u064A \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0645\u0632\u0631\u0639\u0629");
  await input.requireSalesAccess(input.userId, input.cycle);
  const calculated = saleSettlement(input.mutation);
  const initialPaidPiasters = input.mutation.initialPaidEgp ? amountToPiasters(input.mutation.initialPaidEgp) : 0;
  if (initialPaidPiasters > calculated.totalPiasters) throw new Error("\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u062F\u0641\u0648\u0639 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u062A\u062C\u0627\u0648\u0632 \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0628\u064A\u0639");
  const sale = await input.persistSale({ ...input.mutation, ...calculated });
  if (initialPaidPiasters > 0) await input.persistPayment(sale.id, initialPaidPiasters, input.mutation.saleDate, input.mutation.reference);
  return { saleId: sale.id, initialPaidPiasters, ...calculated };
}

// shared/batchWeighing.ts
function flexibleBatchWeighingCalculation(input) {
  const grossWeightGrams = kilogramsToGrams(input.grossWeightKg, "\u0648\u0632\u0646 \u0627\u0644\u062F\u0641\u0639\u0629");
  const cageCount = Math.max(0, Math.floor(input.cageCount ?? 0));
  if (input.weighingMode !== "direct" && cageCount <= 0) throw new Error("\u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u0641\u064A \u0627\u0644\u062F\u0641\u0639\u0629 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
  if (input.batchTareWeightKg !== void 0) {
    if (!Number.isFinite(input.batchTareWeightKg) || input.batchTareWeightKg < 0) throw new Error("\u0648\u0632\u0646 \u0627\u0644\u0641\u0627\u0631\u063A \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0635\u0641\u0631\u0627\u064B \u0623\u0648 \u0623\u0643\u0628\u0631");
    const batchTareWeightGrams = Math.round(input.batchTareWeightKg * 1e3);
    const netWeightGrams2 = grossWeightGrams - batchTareWeightGrams;
    if (netWeightGrams2 <= 0) throw new Error("\u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0635\u0627\u0641\u064A \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631 \u0628\u0639\u062F \u062E\u0635\u0645 \u0627\u0644\u0641\u0627\u0631\u063A");
    return { cageCount, birdCount: Math.max(0, cageCount * Math.max(0, input.birdsPerCage)), grossWeightGrams, tareWeightGrams: batchTareWeightGrams, netWeightGrams: netWeightGrams2, totalPiasters: Math.round(netWeightGrams2 * input.pricePerKgPiasters / 1e3), tarePerCageGrams: cageCount > 0 ? Math.round(batchTareWeightGrams / cageCount) : 0 };
  }
  if (input.weighingMode === "direct" && cageCount === 0) {
    return { cageCount: 0, birdCount: 0, grossWeightGrams, tareWeightGrams: 0, netWeightGrams: grossWeightGrams, totalPiasters: Math.round(grossWeightGrams * input.pricePerKgPiasters / 1e3), tarePerCageGrams: 0 };
  }
  if (input.tareWeightGrams === 0 && input.tareCageCount === 0) {
    return { cageCount, birdCount: Math.max(0, cageCount * Math.max(0, input.birdsPerCage)), grossWeightGrams, tareWeightGrams: 0, netWeightGrams: grossWeightGrams, totalPiasters: Math.round(grossWeightGrams * input.pricePerKgPiasters / 1e3), tarePerCageGrams: 0 };
  }
  if (!Number.isInteger(input.tareCageCount) || input.tareCageCount <= 0) throw new Error("\u0639\u062F\u062F \u0623\u0642\u0641\u0627\u0635 \u0627\u0644\u0641\u0627\u0631\u063A \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
  const tarePerCageGrams = input.tareWeightGrams / input.tareCageCount;
  const tareWeightGrams = Math.round(tarePerCageGrams * cageCount);
  const netWeightGrams = grossWeightGrams - tareWeightGrams;
  if (netWeightGrams <= 0) throw new Error("\u0648\u0632\u0646 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0635\u0627\u0641\u064A \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
  return { cageCount, birdCount: Math.max(0, cageCount * Math.max(0, input.birdsPerCage)), grossWeightGrams, tareWeightGrams, netWeightGrams, totalPiasters: Math.round(netWeightGrams * input.pricePerKgPiasters / 1e3), tarePerCageGrams };
}
function remainingCages(plannedCageCount, loadedCageCount) {
  return Math.max(plannedCageCount - loadedCageCount, 0);
}

// shared/salesManagementLifecycle.ts
function evaluateBatchCageEntry(input) {
  if (input.weighingMode === "direct") return { requiresManagerOverride: false };
  if (!Number.isInteger(input.cageCount) || input.cageCount <= 0) throw new Error("\u0639\u062F\u062F \u0623\u0642\u0641\u0627\u0635 \u0627\u0644\u062F\u0641\u0639\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D");
  if (input.cageCount <= input.remainingCages) return { requiresManagerOverride: false };
  if (!input.allowOverage) throw new Error(`\u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0641\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u0647\u0648 ${input.remainingCages} \u0642\u0641\u0635 \u0641\u0642\u0637. \u064A\u0644\u0632\u0645 \u062A\u0623\u0643\u064A\u062F \u0625\u062F\u0627\u0631\u064A \u0644\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0639\u062F\u062F \u0627\u0644\u0645\u062E\u0637\u0637.`);
  return { requiresManagerOverride: true };
}
function assertSaleCanComplete(input) {
  if (input.usesIndependentLedgers) return;
  if (input.weighingMode !== "direct" && input.loadedCageCount < input.plannedCageCount) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u064A\u0639 \u0642\u0628\u0644 \u0648\u0632\u0646 \u0643\u0644 \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u0627\u0644\u0645\u062E\u0637\u0637\u0629");
}
function assertSaleUpdateKeepsPaymentsCovered(input) {
  if (input.discountPiasters > input.totalPiasters) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062E\u0635\u0645 \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0628\u064A\u0639");
  if (input.paidPiasters > input.totalPiasters - input.discountPiasters) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0635\u0628\u062D \u0635\u0627\u0641\u064A \u0627\u0644\u0645\u0633\u062A\u062D\u0642 \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u062F\u0641\u0639\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629");
}
function assertSaleCanSoftDelete(isDeleted) {
  if (isDeleted) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
}
function assertBatchOrder(currentIds, requestedIds) {
  if (currentIds.length !== requestedIds.length || currentIds.some((id) => !requestedIds.includes(id))) throw new Error("\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u062F\u0641\u0639\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644");
}
function nextBatchSequence(highestExistingSequence) {
  if (!Number.isInteger(highestExistingSequence) || highestExistingSequence < 0) throw new Error("\u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u062F\u0641\u0639\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D");
  return highestExistingSequence + 1;
}

// shared/salesDashboard.ts
function saleValueFromLedgerWeight(netWeightGrams, pricePerKgPiasters) {
  if (!Number.isSafeInteger(netWeightGrams) || netWeightGrams < 0 || !Number.isSafeInteger(pricePerKgPiasters) || pricePerKgPiasters <= 0) throw new Error("\u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0635\u0627\u0641\u064A \u0623\u0648 \u0633\u0639\u0631 \u0627\u0644\u0643\u064A\u0644\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D");
  return Math.round(netWeightGrams * pricePerKgPiasters / 1e3);
}

// server/db/sales.ts
async function createTrader(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_sales");
  await db.insert(traders).values({ farmId: input.farmId, name: input.name, phone: input.phone || null, companyName: input.companyName || null, address: input.address || null, notes: input.notes || null });
}
async function createTraderWithSimpleSale(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq7(cycles.id, input.cycleId)).limit(1);
  if (!cycle || cycle.farmId !== input.farmId) throw new Error("\u0627\u0644\u062F\u0648\u0631\u0629 \u0644\u0627 \u062A\u0646\u062A\u0645\u064A \u0625\u0644\u0649 \u0627\u0644\u0645\u0632\u0631\u0639\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629");
  assertCycleAllowsOperationalMutation(cycle.status);
  if (!Number.isFinite(input.pricePerKgEgp) || input.pricePerKgEgp <= 0) throw new Error("\u0623\u062F\u062E\u0644 \u0633\u0639\u0631 \u0643\u064A\u0644\u0648 \u0635\u0627\u0644\u062D\u0627\u064B");
  await requireFarmCapability(userId, input.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
  return db.transaction(async (tx) => {
    const [trader] = await tx.insert(traders).values({ farmId: input.farmId, name: input.name, phone: input.phone || null, notes: input.notes || null }).$returningId();
    const [sale] = await tx.insert(sales).values({
      farmId: input.farmId,
      cycleId: input.cycleId,
      traderId: trader.id,
      saleDate: input.saleDate,
      grossWeightGrams: 0,
      loadedCageCount: 0,
      plannedCageCount: 0,
      batchCageCount: 1,
      weighingMode: "direct",
      birdsPerCage: 0,
      status: "open",
      tareWeightGrams: 0,
      tareCageCount: 0,
      netWeightGrams: 0,
      pricePerKgPiasters: Math.round(input.pricePerKgEgp * 100),
      totalPiasters: 0,
      discountPiasters: 0,
      notes: input.notes || null,
      createdByUserId: userId
    }).$returningId();
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: input.farmId, actorUserId: userId, action: "sale_started", details: "\u0628\u062F\u0621 \u0628\u064A\u0639 \u0645\u0628\u0633\u0637 \u0628\u0627\u0644\u062A\u062C\u0645\u064A\u0639 \u0627\u0644\u0641\u0639\u0644\u064A \u0644\u0644\u0641\u0627\u0631\u063A \u0648\u0627\u0644\u0645\u0645\u0644\u0648\u0621" });
    return { traderId: trader.id, saleId: sale.id };
  });
}
async function createSale(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [[cycle], [trader]] = await Promise.all([
    db.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq7(cycles.id, input.cycleId)).limit(1),
    db.select({ id: traders.id, farmId: traders.farmId }).from(traders).where(eq7(traders.id, input.traderId)).limit(1)
  ]);
  if (cycle) {
    assertCycleAllowsOperationalMutation(cycle.status);
  }
  return db.transaction(async (tx) => executeSaleCreate({
    userId,
    mutation: input,
    cycle,
    trader,
    requireSalesAccess: async (actorId, scope) => {
      await requireFarmCapability(actorId, scope.farmId, "manage_sales", { houseId: scope.houseId, cycleId: scope.cycleId });
    },
    persistSale: async (record) => {
      const [created] = await tx.insert(sales).values({
        farmId: record.farmId,
        cycleId: record.cycleId,
        traderId: record.traderId,
        saleDate: record.saleDate,
        grossWeightGrams: record.grossWeightGrams,
        loadedCageCount: record.loadedCageCount,
        tareWeightGrams: record.tareWeightGrams,
        tareCageCount: record.tareCageCount,
        netWeightGrams: record.netWeightGrams,
        pricePerKgPiasters: record.pricePerKgPiasters,
        totalPiasters: record.totalPiasters,
        reference: record.reference || null,
        notes: record.notes || null,
        createdByUserId: userId
      }).$returningId();
      return created;
    },
    persistPayment: async (saleId, amountPiasters, paidAt, reference) => {
      await tx.insert(salePayments).values({ saleId, farmId: input.farmId, amountPiasters, paidAt, reference: reference || null, createdByUserId: userId });
    }
  }));
}
async function startTraderLoading(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [[cycle], [trader]] = await Promise.all([
    db.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq7(cycles.id, input.cycleId)).limit(1),
    db.select({ id: traders.id, farmId: traders.farmId }).from(traders).where(eq7(traders.id, input.traderId)).limit(1)
  ]);
  if (!cycle || cycle.farmId !== input.farmId || !trader || trader.farmId !== input.farmId) throw new Error("\u0627\u0644\u062F\u0648\u0631\u0629 \u0623\u0648 \u0627\u0644\u062A\u0627\u062C\u0631 \u0644\u0627 \u064A\u0646\u062A\u0645\u064A \u0625\u0644\u0649 \u0627\u0644\u0645\u0632\u0631\u0639\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629");
  assertCycleAllowsOperationalMutation(cycle.status);
  const weighingMode = input.weighingMode ?? "fixed";
  if (!Number.isInteger(input.plannedCageCount) || input.plannedCageCount < 0 || (!Number.isInteger(input.batchCageCount) || input.batchCageCount <= 0) || weighingMode === "fixed" && input.plannedCageCount > 0 && input.batchCageCount > input.plannedCageCount) throw new Error("\u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u0627\u0644\u0645\u062E\u0637\u0637 \u0648\u062D\u062C\u0645 \u0627\u0644\u062F\u0641\u0639\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u064A\u0646");
  if (weighingMode !== "direct" && input.plannedCageCount <= 0) throw new Error("\u062D\u062F\u062F \u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u0627\u0644\u0645\u062E\u0637\u0637 \u0644\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639");
  const tareWeightGrams = Math.round(input.tareWeightKg * 1e3);
  const directWithoutCages = weighingMode === "direct" && input.plannedCageCount === 0;
  const noTare = tareWeightGrams === 0 && input.tareCageCount === 0;
  if (!Number.isSafeInteger(tareWeightGrams) || !noTare && (directWithoutCages ? tareWeightGrams < 0 : tareWeightGrams <= 0) || !Number.isInteger(input.tareCageCount) || !noTare && (directWithoutCages ? input.tareCageCount < 0 : input.tareCageCount <= 0) || input.pricePerKgEgp <= 0) throw new Error("\u0648\u0632\u0646 \u0627\u0644\u0641\u0627\u0631\u063A \u0648\u0627\u0644\u0633\u0639\u0631 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646\u0627 \u0635\u0627\u0644\u062D\u064A\u0646");
  await requireFarmCapability(userId, input.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
  const discountPiasters = Math.round(Math.max(0, input.discountEgp ?? 0) * 100);
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(sales).values({ farmId: input.farmId, cycleId: input.cycleId, traderId: input.traderId, saleDate: input.saleDate, grossWeightGrams: 0, loadedCageCount: 0, plannedCageCount: input.plannedCageCount, batchCageCount: input.batchCageCount, weighingMode, birdsPerCage: Math.max(0, input.birdsPerCage ?? 0), status: "open", tareWeightGrams, tareCageCount: input.tareCageCount, netWeightGrams: 0, pricePerKgPiasters: Math.round(input.pricePerKgEgp * 100), totalPiasters: 0, discountPiasters, reference: input.reference || null, notes: input.notes || null, createdByUserId: userId }).$returningId();
    await tx.insert(saleActivities).values({ saleId: created.id, farmId: input.farmId, actorUserId: userId, action: "sale_started", details: `\u0628\u062F\u0621 \u062A\u062D\u0645\u064A\u0644: ${input.plannedCageCount} \u0642\u0641\u0635\u060C \u0648\u0636\u0639 ${weighingMode}` });
    return created;
  });
}
async function addSaleWeighBatch(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, input.saleId)).for("update").limit(1);
    if (!sale) throw new Error("\u062C\u0644\u0633\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    const [cycle] = await tx.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId, status: cycles.status }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1);
    if (!cycle || cycle.farmId !== sale.farmId) throw new Error("\u062C\u0644\u0633\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    assertCycleAllowsOperationalMutation(cycle.status);
    await requireFarmCapability(userId, sale.farmId, "record_sales_weights", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("\u062A\u0645 \u0625\u063A\u0644\u0627\u0642 \u062C\u0644\u0633\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u062F\u0641\u0639\u0627\u062A \u062C\u062F\u064A\u062F\u0629");
    const cageCount = Math.max(0, Math.floor(input.cageCount ?? 0));
    const cagesRemaining = remainingCages(sale.plannedCageCount, sale.loadedCageCount);
    const cageDecision = evaluateBatchCageEntry({ weighingMode: sale.weighingMode, cageCount, remainingCages: cagesRemaining, allowOverage: input.allowOverage });
    if (cageDecision.requiresManagerOverride) {
      await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    }
    const calculation = flexibleBatchWeighingCalculation({ weighingMode: sale.weighingMode, grossWeightKg: input.grossWeightKg, batchTareWeightKg: input.tareWeightKg, cageCount, birdsPerCage: sale.birdsPerCage, tareWeightGrams: sale.tareWeightGrams, tareCageCount: sale.tareCageCount, pricePerKgPiasters: sale.pricePerKgPiasters });
    if (calculation.birdCount > 0) {
      const [[cycleInfo], [cycleLosses], [cycleSold]] = await Promise.all([
        tx.select({ birdsPlaced: cycles.birdsPlaced }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1),
        tx.select({ totalLosses: sql2`coalesce(sum(${dailyRecords.mortality} + ${dailyRecords.culls}), 0)` }).from(dailyRecords).where(eq7(dailyRecords.cycleId, sale.cycleId)),
        tx.select({ totalSoldBirds: sql2`coalesce(sum(${saleWeighBatches.birdCount}), 0)` }).from(saleWeighBatches).innerJoin(sales, eq7(saleWeighBatches.saleId, sales.id)).where(and3(eq7(sales.cycleId, sale.cycleId), eq7(sales.isDeleted, false), eq7(saleWeighBatches.weighingStage, "filled")))
      ]);
      const birdsPlaced = cycleInfo?.birdsPlaced ?? 0;
      const totalLosses = Number(cycleLosses?.totalLosses ?? 0);
      const totalSold = Number(cycleSold?.totalSoldBirds ?? 0);
      const remainingLiveBirds = Math.max(0, birdsPlaced - totalLosses - totalSold);
      if (birdsPlaced > 0 && calculation.birdCount > remainingLiveBirds) {
        throw new Error(`\u0639\u062F\u062F \u0627\u0644\u0637\u064A\u0648\u0631 \u0641\u064A \u0627\u0644\u062F\u0641\u0639\u0629 (${calculation.birdCount}) \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u062D\u064A \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0641\u064A \u0627\u0644\u062F\u0648\u0631\u0629 (${remainingLiveBirds} \u0637\u0627\u0626\u0631)`);
      }
    }
    const [existing] = await tx.select({ highestSequence: sql2`coalesce(max(${saleWeighBatches.sequence}), 0)` }).from(saleWeighBatches).where(eq7(saleWeighBatches.saleId, sale.id));
    const sequence = nextBatchSequence(Number(existing?.highestSequence ?? 0));
    await tx.insert(saleWeighBatches).values({ saleId: sale.id, sequence, weighingStage: "filled", cageCount: calculation.cageCount, birdCount: calculation.birdCount, grossWeightGrams: calculation.grossWeightGrams, tareWeightGrams: calculation.tareWeightGrams, netWeightGrams: calculation.netWeightGrams, totalPiasters: calculation.totalPiasters, weighedAt: input.weighedAt, notes: input.notes || null, createdByUserId: userId });
    const totals = await refreshSaleFromBatches(tx, sale);
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_added", details: `\u062F\u0641\u0639\u0629 ${sequence}: ${calculation.cageCount} \u0642\u0641\u0635\u060C ${calculation.netWeightGrams / 1e3} \u0643\u062C\u0645 \u0635\u0627\u0641\u064A${input.allowOverage && calculation.cageCount > cagesRemaining ? " (\u062A\u062C\u0627\u0648\u0632 \u0645\u0624\u0643\u062F \u0644\u0644\u0639\u062F\u062F \u0627\u0644\u0645\u062E\u0637\u0637)" : ""}` });
    return { sequence, nextLoadedCages: totals.loadedCageCount, remainingCages: 0, ...calculation };
  });
}
async function addSaleTareBatch(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, input.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.isDeleted) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    await requireFarmCapability(userId, sale.farmId, "record_sales_weights", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u0648\u0632\u0646 \u0641\u0627\u0631\u063A \u0628\u0639\u062F \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u064A\u0639");
    const cageCount = Math.floor(input.cageCount);
    const tareWeightGrams = Math.round(input.tareWeightKg * 1e3);
    if (!Number.isInteger(cageCount) || cageCount <= 0 || !Number.isSafeInteger(tareWeightGrams) || tareWeightGrams < 0) throw new Error("\u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u0623\u0648 \u0648\u0632\u0646 \u0627\u0644\u0641\u0627\u0631\u063A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D");
    const [pending] = await tx.select({ cageCount: sql2`coalesce(sum(${saleWeighBatches.cageCount}), 0)` }).from(saleWeighBatches).where(and3(eq7(saleWeighBatches.saleId, sale.id), eq7(saleWeighBatches.weighingStage, "tare_pending")));
    const reservedCages = sale.loadedCageCount + Number(pending?.cageCount ?? 0);
    if (sale.weighingMode !== "direct" && reservedCages + cageCount > sale.plannedCageCount) throw new Error(`\u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u0627\u0644\u0641\u0627\u0631\u063A\u0629 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0627\u0644\u0645\u062A\u0627\u062D (${sale.plannedCageCount - reservedCages} \u0642\u0641\u0635)`);
    const [existing] = await tx.select({ highestSequence: sql2`coalesce(max(${saleWeighBatches.sequence}), 0)` }).from(saleWeighBatches).where(eq7(saleWeighBatches.saleId, sale.id));
    const sequence = nextBatchSequence(Number(existing?.highestSequence ?? 0));
    const [created] = await tx.insert(saleWeighBatches).values({ saleId: sale.id, sequence, weighingStage: "tare_pending", cageCount, birdCount: 0, grossWeightGrams: 0, tareWeightGrams, netWeightGrams: 0, totalPiasters: 0, weighedAt: input.weighedAt, notes: input.notes || null, createdByUserId: userId }).$returningId();
    await refreshSaleFromBatches(tx, sale);
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_added", details: `\u062A\u0633\u062C\u064A\u0644 \u0641\u0627\u0631\u063A \u0644\u0644\u062F\u0641\u0639\u0629 ${sequence}: ${cageCount} \u0642\u0641\u0635\u060C ${tareWeightGrams / 1e3} \u0643\u062C\u0645` });
    return { id: created.id, sequence, cageCount, tareWeightGrams };
  });
}
async function fillSaleTareBatch(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(saleWeighBatches).where(eq7(saleWeighBatches.id, input.batchId)).for("update").limit(1);
    const [sale] = batch ? await tx.select().from(sales).where(eq7(sales.id, batch.saleId)).for("update").limit(1) : [];
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!batch || !sale || !cycle || sale.isDeleted) throw new Error("\u062F\u0641\u0639\u0629 \u0627\u0644\u0648\u0632\u0646 \u0623\u0648 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    await requireFarmCapability(userId, sale.farmId, "record_sales_weights", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open" || batch.weighingStage !== "tare_pending") throw new Error("\u0647\u0630\u0647 \u0627\u0644\u062F\u0641\u0639\u0629 \u0644\u0627 \u062A\u0646\u062A\u0638\u0631 \u0648\u0632\u0646\u0627\u064B \u0645\u0645\u0644\u0648\u0621\u0627\u064B");
    const calculation = flexibleBatchWeighingCalculation({ weighingMode: sale.weighingMode, grossWeightKg: input.grossWeightKg, batchTareWeightKg: batch.tareWeightGrams / 1e3, cageCount: batch.cageCount, birdsPerCage: sale.birdsPerCage, tareWeightGrams: sale.tareWeightGrams, tareCageCount: sale.tareCageCount, pricePerKgPiasters: sale.pricePerKgPiasters });
    await tx.update(saleWeighBatches).set({ weighingStage: "filled", birdCount: calculation.birdCount, grossWeightGrams: calculation.grossWeightGrams, netWeightGrams: calculation.netWeightGrams, totalPiasters: calculation.totalPiasters, weighedAt: input.weighedAt, notes: input.notes || batch.notes }).where(eq7(saleWeighBatches.id, batch.id));
    await refreshSaleFromBatches(tx, sale);
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_updated", details: `\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0645\u0645\u0644\u0648\u0621 \u0644\u0644\u062F\u0641\u0639\u0629 ${batch.sequence}: ${calculation.grossWeightGrams / 1e3} \u0643\u062C\u0645\u060C \u0635\u0627\u0641\u064A ${calculation.netWeightGrams / 1e3} \u0643\u062C\u0645` });
    return calculation;
  });
}
async function updateSaleTareBatch(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(saleWeighBatches).where(eq7(saleWeighBatches.id, input.batchId)).for("update").limit(1);
    const [sale] = batch ? await tx.select().from(sales).where(eq7(sales.id, batch.saleId)).for("update").limit(1) : [];
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!batch || !sale || !cycle || sale.isDeleted) throw new Error("\u062F\u0641\u0639\u0629 \u0627\u0644\u0641\u0627\u0631\u063A \u0623\u0648 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0623\u0648\u0632\u0627\u0646 \u0628\u0639\u062F \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u064A\u0639");
    const cageCount = Math.floor(input.cageCount);
    const tareWeightGrams = Math.round(input.tareWeightKg * 1e3);
    if (!Number.isInteger(cageCount) || cageCount <= 0 || !Number.isSafeInteger(tareWeightGrams) || tareWeightGrams < 0) throw new Error("\u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u0623\u0648 \u0648\u0632\u0646 \u0627\u0644\u0641\u0627\u0631\u063A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D");
    const [pending] = await tx.select({ cageCount: sql2`coalesce(sum(${saleWeighBatches.cageCount}), 0)` }).from(saleWeighBatches).where(and3(eq7(saleWeighBatches.saleId, sale.id), eq7(saleWeighBatches.weighingStage, "tare_pending")));
    const reservedCages = sale.loadedCageCount + Number(pending?.cageCount ?? 0) - batch.cageCount;
    if (sale.weighingMode !== "direct" && reservedCages + cageCount > sale.plannedCageCount) throw new Error("\u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u0627\u0644\u0641\u0627\u0631\u063A\u0629 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0627\u0644\u0645\u062A\u0627\u062D");
    if (batch.weighingStage === "filled") {
      const calculation = flexibleBatchWeighingCalculation({ weighingMode: sale.weighingMode, grossWeightKg: batch.grossWeightGrams / 1e3, batchTareWeightKg: input.tareWeightKg, cageCount, birdsPerCage: sale.birdsPerCage, tareWeightGrams: sale.tareWeightGrams, tareCageCount: sale.tareCageCount, pricePerKgPiasters: sale.pricePerKgPiasters });
      await tx.update(saleWeighBatches).set({ cageCount, birdCount: calculation.birdCount, tareWeightGrams, netWeightGrams: calculation.netWeightGrams, totalPiasters: calculation.totalPiasters, weighedAt: input.weighedAt, notes: input.notes || null }).where(eq7(saleWeighBatches.id, batch.id));
      await refreshSaleFromBatches(tx, sale);
    } else {
      await tx.update(saleWeighBatches).set({ cageCount, tareWeightGrams, weighedAt: input.weighedAt, notes: input.notes || null }).where(eq7(saleWeighBatches.id, batch.id));
      await refreshSaleFromBatches(tx, sale);
    }
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_updated", details: `\u062A\u0639\u062F\u064A\u0644 \u0641\u0627\u0631\u063A \u0627\u0644\u062F\u0641\u0639\u0629 ${batch.sequence}` });
  });
}
async function refreshSaleFromBatches(tx, sale) {
  const [[filledTotals], [tareTotals]] = await Promise.all([
    tx.select({ grossWeightGrams: sql2`coalesce(sum(${saleWeighBatches.grossWeightGrams}), 0)`, loadedCageCount: sql2`coalesce(sum(${saleWeighBatches.cageCount}), 0)` }).from(saleWeighBatches).where(and3(eq7(saleWeighBatches.saleId, sale.id), eq7(saleWeighBatches.weighingStage, "filled"))),
    tx.select({ tareWeightGrams: sql2`coalesce(sum(${saleWeighBatches.tareWeightGrams}), 0)` }).from(saleWeighBatches).where(eq7(saleWeighBatches.saleId, sale.id))
  ]);
  const grossWeightGrams = Number(filledTotals?.grossWeightGrams ?? 0);
  const tareWeightGrams = Number(tareTotals?.tareWeightGrams ?? 0);
  const netWeightGrams = Math.max(grossWeightGrams - tareWeightGrams, 0);
  const totalPiasters = saleValueFromLedgerWeight(netWeightGrams, sale.pricePerKgPiasters);
  const next = { grossWeightGrams, loadedCageCount: Number(filledTotals?.loadedCageCount ?? 0), tareWeightGrams, netWeightGrams, totalPiasters };
  await tx.update(sales).set(next).where(eq7(sales.id, sale.id));
  return next;
}
async function calculateSaleTotal(userId, saleId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.isDeleted) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    if (sale.status !== "open") throw new Error("\u0623\u0639\u062F \u0641\u062A\u062D \u0627\u0644\u0628\u064A\u0639 \u0644\u0644\u062A\u0639\u062F\u064A\u0644 \u0642\u0628\u0644 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062D\u0633\u0627\u0628");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    const totals = await refreshSaleFromBatches(tx, sale);
    if (totals.netWeightGrams <= 0) throw new Error("\u0633\u062C\u0651\u0644 \u0648\u0632\u0646\u0627\u064B \u0645\u0645\u0644\u0648\u0621\u0627\u064B \u0623\u0643\u0628\u0631 \u0645\u0646 \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0641\u0627\u0631\u063A \u0642\u0628\u0644 \u062D\u0633\u0627\u0628 \u0642\u064A\u0645\u0629 \u0627\u0644\u0628\u064A\u0639");
    const [paid] = await tx.select({ total: sql2`coalesce(sum(${salePayments.amountPiasters}), 0)` }).from(salePayments).where(eq7(salePayments.saleId, sale.id));
    assertSaleUpdateKeepsPaymentsCovered({ totalPiasters: totals.totalPiasters, discountPiasters: sale.discountPiasters, paidPiasters: Number(paid?.total ?? 0) });
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: `\u062D\u0633\u0627\u0628 \u0642\u064A\u0645\u0629 \u0627\u0644\u0628\u064A\u0639: ${totals.netWeightGrams / 1e3} \u0643\u062C\u0645 \u0635\u0627\u0641\u064A\u060C ${totals.totalPiasters / 100} \u062C.\u0645` });
    return totals;
  });
}
async function reopenSale(userId, saleId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.isDeleted) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    if (sale.status !== "closed") throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u0645\u0641\u062A\u0648\u062D\u0629 \u0628\u0627\u0644\u0641\u0639\u0644 \u0644\u0644\u062A\u0639\u062F\u064A\u0644");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    await tx.update(sales).set({ status: "open" }).where(eq7(sales.id, sale.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: "\u0625\u0639\u0627\u062F\u0629 \u0641\u062A\u062D \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u0644\u0644\u062A\u0639\u062F\u064A\u0644 \u0648\u0625\u0636\u0627\u0641\u0629 \u0633\u062C\u0644\u0627\u062A \u062C\u062F\u064A\u062F\u0629" });
  });
}
async function updateTrader(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [trader] = await db.select().from(traders).where(eq7(traders.id, input.traderId)).limit(1);
  if (!trader) throw new Error("\u062D\u0633\u0627\u0628 \u0627\u0644\u062A\u0627\u062C\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  await requireFarmCapability(userId, trader.farmId, "manage_sales");
  await db.update(traders).set({ name: input.name, phone: input.phone || null, companyName: input.companyName || null, address: input.address || null, notes: input.notes || null }).where(eq7(traders.id, trader.id));
}
async function deleteTrader(userId, traderId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [trader] = await db.select().from(traders).where(eq7(traders.id, traderId)).limit(1);
  if (!trader) throw new Error("\u062D\u0633\u0627\u0628 \u0627\u0644\u062A\u0627\u062C\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  await requireFarmCapability(userId, trader.farmId, "manage_sales");
  await db.update(traders).set({ isActive: false }).where(eq7(traders.id, trader.id));
}
async function updateSaleWeighBatch(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(saleWeighBatches).where(eq7(saleWeighBatches.id, input.batchId)).for("update").limit(1);
    if (!batch) throw new Error("\u0633\u062C\u0644 \u0627\u0644\u0648\u0632\u0646 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, batch.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || cycle.farmId !== sale.farmId) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0623\u0648\u0632\u0627\u0646 \u0628\u0639\u062F \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u064A\u0639");
    if (batch.weighingStage !== "filled") throw new Error("\u0639\u062F\u0651\u0644 \u0648\u0632\u0646 \u0627\u0644\u0641\u0627\u0631\u063A \u0645\u0646 \u0633\u062C\u0644 \u0627\u0644\u0641\u0627\u0631\u063A \u0623\u0648 \u0633\u062C\u0651\u0644 \u0648\u0632\u0646 \u0627\u0644\u0645\u0645\u0644\u0648\u0621 \u0644\u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u062F\u0641\u0639\u0629");
    const cageCount = Math.max(0, Math.floor(input.cageCount ?? batch.cageCount));
    const available = sale.plannedCageCount - (sale.loadedCageCount - batch.cageCount);
    if (sale.weighingMode !== "direct" && (cageCount <= 0 || cageCount > available)) throw new Error(`\u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0641\u0627\u0635 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0628\u064A\u0646 \u0661 \u0648${available}`);
    const calculation = flexibleBatchWeighingCalculation({ weighingMode: sale.weighingMode, grossWeightKg: input.grossWeightKg, batchTareWeightKg: input.tareWeightKg ?? batch.tareWeightGrams / 1e3, cageCount, birdsPerCage: sale.birdsPerCage, tareWeightGrams: sale.tareWeightGrams, tareCageCount: sale.tareCageCount, pricePerKgPiasters: sale.pricePerKgPiasters });
    await tx.update(saleWeighBatches).set({ cageCount: calculation.cageCount, birdCount: calculation.birdCount, grossWeightGrams: calculation.grossWeightGrams, tareWeightGrams: calculation.tareWeightGrams, netWeightGrams: calculation.netWeightGrams, totalPiasters: calculation.totalPiasters, weighedAt: input.weighedAt, notes: input.notes || null }).where(eq7(saleWeighBatches.id, batch.id));
    await refreshSaleFromBatches(tx, sale);
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_updated", details: `\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062F\u0641\u0639\u0629 ${batch.sequence}` });
  });
}
async function deleteSaleWeighBatch(userId, batchId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(saleWeighBatches).where(eq7(saleWeighBatches.id, batchId)).for("update").limit(1);
    if (!batch) throw new Error("\u0633\u062C\u0644 \u0627\u0644\u0648\u0632\u0646 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, batch.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u0623\u0648\u0632\u0627\u0646 \u0628\u0639\u062F \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u064A\u0639");
    await tx.delete(saleWeighBatches).where(eq7(saleWeighBatches.id, batch.id));
    await refreshSaleFromBatches(tx, sale);
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batch_deleted", details: `\u062D\u0630\u0641 \u0627\u0644\u062F\u0641\u0639\u0629 ${batch.sequence}` });
  });
}
async function completeSale(userId, saleId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u0645\u0646\u062A\u0647\u064A\u0629 \u0628\u0627\u0644\u0641\u0639\u0644");
    const totals = await refreshSaleFromBatches(tx, sale);
    if (totals.netWeightGrams <= 0 || totals.totalPiasters <= 0) throw new Error("\u0627\u062D\u0633\u0628 \u0642\u064A\u0645\u0629 \u0627\u0644\u0628\u064A\u0639 \u0628\u0639\u062F \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0623\u0648\u0632\u0627\u0646 \u0642\u0628\u0644 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0639\u0645\u0644\u064A\u0629");
    const [independentLedger] = await tx.select({ count: sql2`coalesce(count(*), 0)` }).from(saleWeighBatches).where(and3(eq7(saleWeighBatches.saleId, sale.id), eq7(saleWeighBatches.weighingStage, "tare_pending")));
    assertSaleCanComplete({ weighingMode: sale.weighingMode, loadedCageCount: sale.loadedCageCount, plannedCageCount: sale.plannedCageCount, usesIndependentLedgers: Number(independentLedger?.count ?? 0) > 0 });
    await tx.update(sales).set({ status: "closed" }).where(eq7(sales.id, sale.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_completed", details: "\u0625\u0646\u0647\u0627\u0621 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639" });
  });
}
async function updateSaleDetails(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, input.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.isDeleted) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    if (sale.status !== "open") throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0633\u0639\u0631 \u0623\u0648 \u062E\u0635\u0645 \u0627\u0644\u0628\u064A\u0639 \u0628\u0639\u062F \u0627\u0644\u0625\u0646\u0647\u0627\u0621");
    const pricePerKgPiasters = Math.round(input.pricePerKgEgp * 100);
    const discountPiasters = Math.round(Math.max(0, input.discountEgp) * 100);
    if (!Number.isSafeInteger(pricePerKgPiasters) || pricePerKgPiasters <= 0 || !Number.isSafeInteger(discountPiasters)) throw new Error("\u0627\u0644\u0633\u0639\u0631 \u0623\u0648 \u0627\u0644\u062E\u0635\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u064A\u0646");
    const rows = await tx.select().from(saleWeighBatches).where(eq7(saleWeighBatches.saleId, sale.id)).for("update");
    let totalPiasters = 0;
    for (const row of rows) {
      const lineTotal = Math.round(row.netWeightGrams * pricePerKgPiasters / 1e3);
      totalPiasters += lineTotal;
      await tx.update(saleWeighBatches).set({ totalPiasters: lineTotal }).where(eq7(saleWeighBatches.id, row.id));
    }
    const [paid] = await tx.select({ total: sql2`coalesce(sum(${salePayments.amountPiasters}), 0)` }).from(salePayments).where(eq7(salePayments.saleId, sale.id));
    assertSaleUpdateKeepsPaymentsCovered({ totalPiasters, discountPiasters, paidPiasters: Number(paid?.total ?? 0) });
    await tx.update(sales).set({ pricePerKgPiasters, discountPiasters, totalPiasters, reference: input.reference || null, notes: input.notes || null }).where(eq7(sales.id, sale.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: "\u062A\u0639\u062F\u064A\u0644 \u0633\u0639\u0631 \u0627\u0644\u0628\u064A\u0639 \u0623\u0648 \u0627\u0644\u062E\u0635\u0645 \u0623\u0648 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A" });
  });
}
async function reorderSaleWeighBatches(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, input.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle || sale.status !== "open") throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0639\u0627\u062F\u0629 \u062A\u0631\u062A\u064A\u0628 \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    const rows = await tx.select({ id: saleWeighBatches.id }).from(saleWeighBatches).where(eq7(saleWeighBatches.saleId, sale.id));
    assertBatchOrder(rows.map((row) => row.id), input.batchIds);
    for (let index2 = 0; index2 < input.batchIds.length; index2 += 1) await tx.update(saleWeighBatches).set({ sequence: index2 + 1e5 }).where(eq7(saleWeighBatches.id, input.batchIds[index2]));
    for (let index2 = 0; index2 < input.batchIds.length; index2 += 1) await tx.update(saleWeighBatches).set({ sequence: index2 + 1 }).where(eq7(saleWeighBatches.id, input.batchIds[index2]));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "batches_reordered", details: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0631\u062A\u064A\u0628 \u062F\u0641\u0639\u0627\u062A \u0627\u0644\u0648\u0632\u0646" });
  });
}
async function deleteSale(userId, saleId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select().from(sales).where(eq7(sales.id, saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!sale || !cycle) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    assertSaleCanSoftDelete(sale.isDeleted);
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    await tx.update(sales).set({ isDeleted: true, deletedAt: /* @__PURE__ */ new Date() }).where(eq7(sales.id, sale.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_deleted", details: "\u0625\u0632\u0627\u0644\u0629 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u0645\u0646 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0646\u0634\u0637" });
  });
}
async function addSalePayment(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select({ id: sales.id, farmId: sales.farmId, cycleId: sales.cycleId, totalPiasters: sales.totalPiasters, discountPiasters: sales.discountPiasters }).from(sales).where(eq7(sales.id, input.saleId)).for("update").limit(1);
    const [cycle] = sale ? await tx.select({ farmId: cycles.farmId, cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    const [paid] = sale ? await tx.select({ total: sql2`coalesce(sum(${salePayments.amountPiasters}), 0)` }).from(salePayments).where(eq7(salePayments.saleId, sale.id)) : [];
    if (!sale || !cycle) throw new Error("\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    const amountPiasters = Math.round(input.amountEgp * 100);
    const netDuePiasters = Math.max(sale.totalPiasters - sale.discountPiasters, 0);
    const currentPaidPiasters = Number(paid?.total ?? 0);
    if (!Number.isSafeInteger(amountPiasters) || amountPiasters <= 0) throw new Error("\u0642\u064A\u0645\u0629 \u0627\u0644\u062F\u0641\u0639\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    if (currentPaidPiasters + amountPiasters > netDuePiasters) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062F\u0641\u0639\u0629 \u0635\u0627\u0641\u064A \u0627\u0644\u0645\u0633\u062A\u062D\u0642 \u0639\u0644\u0649 \u0627\u0644\u062A\u0627\u062C\u0631");
    await tx.insert(salePayments).values({ saleId: input.saleId, farmId: sale.farmId, amountPiasters, paymentMethod: input.paymentMethod ?? "cash", paidAt: input.paidAt, reference: input.reference || null, notes: input.notes || null, createdByUserId: userId });
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "payment_added", details: `\u062F\u0641\u0639\u0629 ${amountPiasters / 100} \u062C.\u0645` });
    return { remainingPiasters: netDuePiasters - currentPaidPiasters - amountPiasters };
  });
}
async function updateSalePayment(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [payment] = await tx.select().from(salePayments).where(eq7(salePayments.id, input.paymentId)).for("update").limit(1);
    const [sale] = payment ? await tx.select().from(sales).where(eq7(sales.id, payment.saleId)).for("update").limit(1) : [];
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!payment || !sale || !cycle || sale.isDeleted) throw new Error("\u062D\u0631\u0643\u0629 \u0627\u0644\u0631\u0635\u064A\u062F \u0623\u0648 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    const amountPiasters = Math.round(input.amountEgp * 100);
    if (!Number.isSafeInteger(amountPiasters) || amountPiasters <= 0) throw new Error("\u0642\u064A\u0645\u0629 \u0627\u0644\u0631\u0635\u064A\u062F \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    const [others] = await tx.select({ total: sql2`coalesce(sum(case when ${salePayments.id} <> ${payment.id} then ${salePayments.amountPiasters} else 0 end), 0)` }).from(salePayments).where(eq7(salePayments.saleId, sale.id));
    const netDuePiasters = Math.max(sale.totalPiasters - sale.discountPiasters, 0);
    if (Number(others?.total ?? 0) + amountPiasters > netDuePiasters) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u0631\u0643\u0629 \u0635\u0627\u0641\u064A \u0627\u0644\u0645\u0633\u062A\u062D\u0642 \u0639\u0644\u0649 \u0627\u0644\u062A\u0627\u062C\u0631");
    await tx.update(salePayments).set({ amountPiasters, paidAt: input.paidAt, paymentMethod: input.paymentMethod ?? payment.paymentMethod, reference: input.reference || null, notes: input.notes || null }).where(eq7(salePayments.id, payment.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: `\u062A\u0639\u062F\u064A\u0644 \u0631\u0635\u064A\u062F \u0627\u0644\u062A\u0627\u062C\u0631 \u0625\u0644\u0649 ${amountPiasters / 100} \u062C.\u0645` });
  });
}
async function deleteSalePayment(userId, paymentId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const [payment] = await tx.select().from(salePayments).where(eq7(salePayments.id, paymentId)).for("update").limit(1);
    const [sale] = payment ? await tx.select().from(sales).where(eq7(sales.id, payment.saleId)).for("update").limit(1) : [];
    const [cycle] = sale ? await tx.select({ cycleId: cycles.id, houseId: cycles.houseId }).from(cycles).where(eq7(cycles.id, sale.cycleId)).limit(1) : [];
    if (!payment || !sale || !cycle || sale.isDeleted) throw new Error("\u062D\u0631\u0643\u0629 \u0627\u0644\u0631\u0635\u064A\u062F \u0623\u0648 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0628\u064A\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    await requireFarmCapability(userId, sale.farmId, "manage_sales", { houseId: cycle.houseId, cycleId: cycle.cycleId });
    await tx.delete(salePayments).where(eq7(salePayments.id, payment.id));
    await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: userId, action: "sale_updated", details: `\u062D\u0630\u0641 \u0631\u0635\u064A\u062F \u0627\u0644\u062A\u0627\u062C\u0631 ${payment.amountPiasters / 100} \u062C.\u0645` });
  });
}

// server/db/access.ts
init_schema();
import { and as and4, desc as desc2, eq as eq8, inArray as inArray3 } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
function invitationHash(code) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}
function createInvitationCode() {
  return `BROILER-${randomBytes(5).toString("hex").toUpperCase()}`;
}
async function createInvitation(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(ownerId, input.farmId, "manage_access");
  if (input.houseId) {
    const [house] = await db.select({ farmId: houses.farmId }).from(houses).where(eq8(houses.id, input.houseId)).limit(1);
    if (!house || house.farmId !== input.farmId) throw new Error("House does not belong to this farm");
  }
  if (input.cycleId) {
    const [cycle] = await db.select({ farmId: cycles.farmId }).from(cycles).where(eq8(cycles.id, input.cycleId)).limit(1);
    if (!cycle || cycle.farmId !== input.farmId) throw new Error("Cycle does not belong to this farm");
  }
  const code = createInvitationCode();
  await db.insert(invitationCodes).values({ farmId: input.farmId, houseId: input.houseId ?? null, cycleId: input.cycleId ?? null, createdByUserId: ownerId, codeHash: invitationHash(code), codePrefix: code, role: input.role, maxUses: input.maxUses, expiresAt: input.expiresAt ?? null, notes: input.notes ?? null });
  return { code };
}
async function listInvitations(ownerId) {
  const db = await getDb();
  if (!db) return [];
  const owned = await db.select({ id: farms.id }).from(farms).where(eq8(farms.ownerId, ownerId));
  if (!owned.length) return [];
  return db.select().from(invitationCodes).where(inArray3(invitationCodes.farmId, owned.map((farm) => farm.id))).orderBy(desc2(invitationCodes.createdAt));
}
async function revokeInvitation(ownerId, invitationId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [invitation] = await db.select({ farmId: invitationCodes.farmId }).from(invitationCodes).where(eq8(invitationCodes.id, invitationId)).limit(1);
  if (!invitation) throw new Error("Invitation not found");
  await requireFarmCapability(ownerId, invitation.farmId, "manage_access");
  await db.update(invitationCodes).set({ status: "revoked" }).where(eq8(invitationCodes.id, invitationId));
}
async function regenerateInvitation(ownerId, invitationId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [invitation] = await db.select({ farmId: invitationCodes.farmId, status: invitationCodes.status }).from(invitationCodes).where(eq8(invitationCodes.id, invitationId)).limit(1);
  if (!invitation || invitation.status !== "active") throw new Error("Only active invitations can be regenerated");
  await requireFarmCapability(ownerId, invitation.farmId, "manage_access");
  const code = createInvitationCode();
  await db.update(invitationCodes).set({ codeHash: invitationHash(code), codePrefix: code, usedCount: 0, status: "active" }).where(eq8(invitationCodes.id, invitationId));
  return { code };
}
async function redeemInvitation(userId, code) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [invitation] = await db.select().from(invitationCodes).where(eq8(invitationCodes.codeHash, invitationHash(code))).limit(1);
  if (!invitation) throw new Error("Invalid invitation code");
  const now = /* @__PURE__ */ new Date();
  if (invitation.status !== "active" || invitation.expiresAt && invitation.expiresAt < now || invitation.usedCount >= invitation.maxUses) {
    if (invitation.status === "active") await db.update(invitationCodes).set({ status: invitation.usedCount >= invitation.maxUses ? "used" : "expired" }).where(eq8(invitationCodes.id, invitation.id));
    throw new Error("This invitation code is no longer available");
  }
  const [existing] = await db.select({ id: farmMemberships.id }).from(farmMemberships).where(and4(eq8(farmMemberships.userId, userId), eq8(farmMemberships.farmId, invitation.farmId))).limit(1);
  if (existing) await db.update(farmMemberships).set({ role: invitation.role, houseId: invitation.houseId, cycleId: invitation.cycleId, isActive: true }).where(eq8(farmMemberships.id, existing.id));
  else await db.insert(farmMemberships).values({ userId, farmId: invitation.farmId, role: invitation.role, houseId: invitation.houseId, cycleId: invitation.cycleId });
  const nextUsed = invitation.usedCount + 1;
  await db.update(invitationCodes).set({ usedCount: nextUsed, status: nextUsed >= invitation.maxUses ? "used" : "active" }).where(eq8(invitationCodes.id, invitation.id));
  return { farmId: invitation.farmId, role: invitation.role };
}

// server/db/farms.ts
init_schema();
import { eq as eq9, inArray as inArray4 } from "drizzle-orm";

// shared/cascadeDeletion.ts
var deletionLabels = {
  farms: "\u0645\u0632\u0631\u0639\u0629",
  cycles: "\u062F\u0648\u0631\u0629",
  houses: "\u0639\u0646\u0628\u0631",
  cageRows: "\u0635\u0641 \u0623\u0642\u0641\u0627\u0635",
  cageOccupancy: "\u0633\u062C\u0644 \u0625\u0634\u063A\u0627\u0644 \u0628\u0637\u0627\u0631\u064A\u0627\u062A",
  houseAssignments: "\u062A\u0648\u0632\u064A\u0639 \u0639\u0646\u0628\u0631 \u0628\u0627\u0644\u062F\u0648\u0631\u0629",
  dailyRecords: "\u0633\u062C\u0644 \u062A\u0634\u063A\u064A\u0644\u064A \u064A\u0648\u0645\u064A",
  healthEvents: "\u0633\u062C\u0644 \u0635\u062D\u0629 \u0623\u0648 \u062A\u062D\u0635\u064A\u0646",
  weightSamples: "\u0639\u064A\u0646\u0629 \u0648\u0632\u0646",
  feedSettings: "\u0625\u0639\u062F\u0627\u062F \u0645\u062E\u0632\u0648\u0646 \u0639\u0644\u0641",
  feedTransactions: "\u062D\u0631\u0643\u0629 \u0645\u062E\u0632\u0648\u0646 \u0639\u0644\u0641",
  expenses: "\u0645\u0635\u0631\u0648\u0641",
  weatherDays: "\u0633\u062C\u0644 \u0637\u0642\u0633",
  workers: "\u062D\u0633\u0627\u0628 \u0639\u0627\u0645\u0644",
  workerAccountEntries: "\u062D\u0631\u0643\u0629 \u062D\u0633\u0627\u0628 \u0639\u0627\u0645\u0644",
  traders: "\u062A\u0627\u062C\u0631",
  sales: "\u0639\u0645\u0644\u064A\u0629 \u0628\u064A\u0639",
  weightBatches: "\u062F\u0641\u0639\u0629 \u0648\u0632\u0646",
  payments: "\u062D\u0631\u0643\u0629 \u0631\u0635\u064A\u062F",
  saleActivities: "\u0646\u0634\u0627\u0637 \u0628\u064A\u0639",
  memberships: "\u0639\u0636\u0648\u064A\u0629 \u0641\u0631\u064A\u0642",
  invitations: "\u062F\u0639\u0648\u0629 \u0648\u0635\u0648\u0644"
};
function buildCascadeDeletionImpact(kind, name, counts) {
  const items = Object.keys(deletionLabels).map((key) => ({ key, label: deletionLabels[key], count: counts[key] })).filter((item) => item.count > 0);
  return { kind, name, items, totalRelatedRecords: items.reduce((sum, item) => sum + item.count, 0) };
}

// server/db/farms.ts
async function bootstrapFarm(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [farm] = await db.insert(farms).values({ ownerId, name: input.farmName, governorate: input.governorate || null, location: input.location || null, latitude: input.latitude?.toFixed(6) ?? null, longitude: input.longitude?.toFixed(6) ?? null, locationSource: input.locationSource ?? "manual" }).$returningId();
  const [cycle] = await db.insert(cycles).values({ farmId: farm.id, name: input.cycleName, placementDate: input.placementDate, birdsPlaced: input.birdsPlaced, status: "active" }).$returningId();
  return { farmId: farm.id, cycleId: cycle.id };
}
async function createFarm(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(farms).values({ ownerId, name: input.name, governorate: input.governorate || null, location: input.location || null, latitude: input.latitude?.toFixed(6) ?? null, longitude: input.longitude?.toFixed(6) ?? null, locationSource: input.locationSource ?? "manual" });
}
async function updateFarmLocation(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_farms");
  await db.update(farms).set({ location: input.location || null, latitude: input.latitude.toFixed(6), longitude: input.longitude.toFixed(6), locationSource: input.locationSource }).where(eq9(farms.id, input.farmId));
}
async function updateFarm(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(ownerId, input.farmId, "manage_farms");
  await db.update(farms).set({ name: input.name, governorate: input.governorate || null, location: input.location || null }).where(eq9(farms.id, input.farmId));
}
var emptyCounts = () => ({ farms: 0, cycles: 0, houses: 0, cageRows: 0, cageOccupancy: 0, houseAssignments: 0, dailyRecords: 0, healthEvents: 0, weightSamples: 0, feedSettings: 0, feedTransactions: 0, expenses: 0, weatherDays: 0, workers: 0, workerAccountEntries: 0, traders: 0, sales: 0, weightBatches: 0, payments: 0, saleActivities: 0, memberships: 0, invitations: 0 });
async function resolveCascadeScope(db, kind, id) {
  if (kind === "farm") {
    const [farm] = await db.select({ id: farms.id, name: farms.name }).from(farms).where(eq9(farms.id, id)).limit(1);
    if (!farm) throw new Error("Farm not found");
    const [cycleRows, houseRows, saleRows2] = await Promise.all([
      db.select({ id: cycles.id }).from(cycles).where(eq9(cycles.farmId, id)),
      db.select({ id: houses.id }).from(houses).where(eq9(houses.farmId, id)),
      db.select({ id: sales.id }).from(sales).where(eq9(sales.farmId, id))
    ]);
    const houseIds = houseRows.map((row) => row.id);
    const sectionRows2 = houseIds.length ? await db.select({ id: cageSections.id }).from(cageSections).where(inArray4(cageSections.houseId, houseIds)) : [];
    return { farmId: id, cycleIds: cycleRows.map((row) => row.id), houseIds, sectionIds: sectionRows2.map((row) => row.id), saleIds: saleRows2.map((row) => row.id), name: farm.name };
  }
  if (kind === "cycle") {
    const [cycle] = await db.select({ id: cycles.id, farmId: cycles.farmId, name: cycles.name }).from(cycles).where(eq9(cycles.id, id)).limit(1);
    if (!cycle) throw new Error("Cycle not found");
    const [assignmentRows, saleRows2] = await Promise.all([
      db.select({ houseId: cycleHouseAssignments.houseId }).from(cycleHouseAssignments).where(eq9(cycleHouseAssignments.cycleId, id)),
      db.select({ id: sales.id }).from(sales).where(eq9(sales.cycleId, id))
    ]);
    return { farmId: cycle.farmId, cycleIds: [id], houseIds: assignmentRows.map((row) => row.houseId), sectionIds: [], saleIds: saleRows2.map((row) => row.id), name: cycle.name };
  }
  const [house] = await db.select({ id: houses.id, farmId: houses.farmId, name: houses.name }).from(houses).where(eq9(houses.id, id)).limit(1);
  if (!house) throw new Error("House not found");
  const [sectionRows, legacyCycleRows] = await Promise.all([
    db.select({ id: cageSections.id }).from(cageSections).where(eq9(cageSections.houseId, id)),
    db.select({ id: cycles.id }).from(cycles).where(eq9(cycles.houseId, id))
  ]);
  const cycleIds = legacyCycleRows.map((row) => row.id);
  const saleRows = cycleIds.length ? await db.select({ id: sales.id }).from(sales).where(inArray4(sales.cycleId, cycleIds)) : [];
  return { farmId: house.farmId, cycleIds, houseIds: [id], sectionIds: sectionRows.map((row) => row.id), saleIds: saleRows.map((row) => row.id), name: house.name };
}
async function getCascadeCounts(db, scope, kind) {
  const counts = emptyCounts();
  counts.farms = kind === "farm" ? 1 : 0;
  counts.cycles = scope.cycleIds.length;
  counts.houses = kind === "farm" ? scope.houseIds.length : 0;
  counts.cageRows = scope.sectionIds.length;
  const [cycleOccupancy, assignments, dailyByCycle, healthByCycle, weightsByCycle, expensesByCycle, salesBatches, payments, activities] = await Promise.all([
    scope.cycleIds.length ? db.select({ id: cycleCageOccupancy.id }).from(cycleCageOccupancy).where(inArray4(cycleCageOccupancy.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: cycleHouseAssignments.id }).from(cycleHouseAssignments).where(inArray4(cycleHouseAssignments.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: dailyRecords.id }).from(dailyRecords).where(inArray4(dailyRecords.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: healthEvents.id }).from(healthEvents).where(inArray4(healthEvents.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: weightSamples.id }).from(weightSamples).where(inArray4(weightSamples.cycleId, scope.cycleIds)) : [],
    scope.cycleIds.length ? db.select({ id: farmExpenses.id }).from(farmExpenses).where(inArray4(farmExpenses.cycleId, scope.cycleIds)) : [],
    scope.saleIds.length ? db.select({ id: saleWeighBatches.id }).from(saleWeighBatches).where(inArray4(saleWeighBatches.saleId, scope.saleIds)) : [],
    scope.saleIds.length ? db.select({ id: salePayments.id }).from(salePayments).where(inArray4(salePayments.saleId, scope.saleIds)) : [],
    scope.saleIds.length ? db.select({ id: saleActivities.id }).from(saleActivities).where(inArray4(saleActivities.saleId, scope.saleIds)) : []
  ]);
  counts.cageOccupancy = cycleOccupancy.length;
  counts.houseAssignments = assignments.length;
  counts.dailyRecords = dailyByCycle.length;
  counts.healthEvents = healthByCycle.length;
  counts.weightSamples = weightsByCycle.length;
  counts.expenses = expensesByCycle.length;
  counts.sales = scope.saleIds.length;
  counts.weightBatches = salesBatches.length;
  counts.payments = payments.length;
  counts.saleActivities = activities.length;
  if (kind === "house") {
    const [daily, health, weights, assignmentsForHouse, invitationsForHouse] = await Promise.all([
      db.select({ id: dailyRecords.id }).from(dailyRecords).where(eq9(dailyRecords.houseId, scope.houseIds[0])),
      db.select({ id: healthEvents.id }).from(healthEvents).where(eq9(healthEvents.houseId, scope.houseIds[0])),
      db.select({ id: weightSamples.id }).from(weightSamples).where(eq9(weightSamples.houseId, scope.houseIds[0])),
      db.select({ id: cycleHouseAssignments.id }).from(cycleHouseAssignments).where(eq9(cycleHouseAssignments.houseId, scope.houseIds[0])),
      db.select({ id: invitationCodes.id }).from(invitationCodes).where(eq9(invitationCodes.houseId, scope.houseIds[0]))
    ]);
    counts.dailyRecords = Math.max(counts.dailyRecords, daily.length);
    counts.healthEvents = Math.max(counts.healthEvents, health.length);
    counts.weightSamples = Math.max(counts.weightSamples, weights.length);
    counts.houseAssignments = Math.max(counts.houseAssignments, assignmentsForHouse.length);
    counts.invitations = invitationsForHouse.length;
  }
  if (kind === "farm") {
    const [settings, transactions, allExpenses, weather, allWorkers, workerEntries, allTraders, memberships, invitations] = await Promise.all([
      db.select({ id: feedInventorySettings.id }).from(feedInventorySettings).where(eq9(feedInventorySettings.farmId, scope.farmId)),
      db.select({ id: feedInventoryTransactions.id }).from(feedInventoryTransactions).where(eq9(feedInventoryTransactions.farmId, scope.farmId)),
      db.select({ id: farmExpenses.id }).from(farmExpenses).where(eq9(farmExpenses.farmId, scope.farmId)),
      db.select({ id: farmWeatherDays.id }).from(farmWeatherDays).where(eq9(farmWeatherDays.farmId, scope.farmId)),
      db.select({ id: workers.id }).from(workers).where(eq9(workers.farmId, scope.farmId)),
      db.select({ id: workerAccountEntries.id }).from(workerAccountEntries).where(eq9(workerAccountEntries.farmId, scope.farmId)),
      db.select({ id: traders.id }).from(traders).where(eq9(traders.farmId, scope.farmId)),
      db.select({ id: farmMemberships.id }).from(farmMemberships).where(eq9(farmMemberships.farmId, scope.farmId)),
      db.select({ id: invitationCodes.id }).from(invitationCodes).where(eq9(invitationCodes.farmId, scope.farmId))
    ]);
    counts.feedSettings = settings.length;
    counts.feedTransactions = transactions.length;
    counts.expenses = allExpenses.length;
    counts.weatherDays = weather.length;
    counts.workers = allWorkers.length;
    counts.workerAccountEntries = workerEntries.length;
    counts.traders = allTraders.length;
    counts.memberships = memberships.length;
    counts.invitations = invitations.length;
  }
  return counts;
}
async function getCascadeDeletionImpact(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const scope = await resolveCascadeScope(db, input.kind, input.id);
  await requireFarmCapability(ownerId, scope.farmId, input.kind === "house" ? "manage_housing" : input.kind === "cycle" ? "manage_cycles" : "manage_farms", { houseId: input.kind === "house" ? input.id : null, cycleId: input.kind === "cycle" ? input.id : null });
  return buildCascadeDeletionImpact(input.kind, scope.name, await getCascadeCounts(db, scope, input.kind));
}
async function deleteCascadeScope(tx, scope, kind) {
  if (scope.saleIds.length) {
    await tx.delete(saleActivities).where(inArray4(saleActivities.saleId, scope.saleIds));
    await tx.delete(salePayments).where(inArray4(salePayments.saleId, scope.saleIds));
    await tx.delete(saleWeighBatches).where(inArray4(saleWeighBatches.saleId, scope.saleIds));
    await tx.delete(sales).where(inArray4(sales.id, scope.saleIds));
  }
  if (scope.cycleIds.length) {
    await tx.delete(dailyRecords).where(inArray4(dailyRecords.cycleId, scope.cycleIds));
    await tx.delete(healthEvents).where(inArray4(healthEvents.cycleId, scope.cycleIds));
    await tx.delete(weightSamples).where(inArray4(weightSamples.cycleId, scope.cycleIds));
    await tx.delete(farmExpenses).where(inArray4(farmExpenses.cycleId, scope.cycleIds));
    await tx.delete(cycleCageOccupancy).where(inArray4(cycleCageOccupancy.cycleId, scope.cycleIds));
    await tx.delete(cycleHouseAssignments).where(inArray4(cycleHouseAssignments.cycleId, scope.cycleIds));
    await tx.delete(invitationCodes).where(inArray4(invitationCodes.cycleId, scope.cycleIds));
    await tx.delete(cycles).where(inArray4(cycles.id, scope.cycleIds));
  }
  if (kind === "house") {
    const houseId = scope.houseIds[0];
    await tx.delete(dailyRecords).where(eq9(dailyRecords.houseId, houseId));
    await tx.delete(healthEvents).where(eq9(healthEvents.houseId, houseId));
    await tx.delete(weightSamples).where(eq9(weightSamples.houseId, houseId));
    await tx.delete(cycleHouseAssignments).where(eq9(cycleHouseAssignments.houseId, houseId));
    await tx.delete(invitationCodes).where(eq9(invitationCodes.houseId, houseId));
  }
  if (scope.sectionIds.length) {
    await tx.delete(cycleCageOccupancy).where(inArray4(cycleCageOccupancy.cageSectionId, scope.sectionIds));
    await tx.delete(cageSections).where(inArray4(cageSections.id, scope.sectionIds));
  }
  if (kind === "house") await tx.delete(houses).where(eq9(houses.id, scope.houseIds[0]));
  if (kind === "farm") {
    await tx.delete(farmExpenses).where(eq9(farmExpenses.farmId, scope.farmId));
    await tx.delete(workerAccountEntries).where(eq9(workerAccountEntries.farmId, scope.farmId));
    await tx.delete(workers).where(eq9(workers.farmId, scope.farmId));
    await tx.delete(feedInventoryTransactions).where(eq9(feedInventoryTransactions.farmId, scope.farmId));
    await tx.delete(feedInventorySettings).where(eq9(feedInventorySettings.farmId, scope.farmId));
    await tx.delete(farmWeatherDays).where(eq9(farmWeatherDays.farmId, scope.farmId));
    await tx.delete(invitationCodes).where(eq9(invitationCodes.farmId, scope.farmId));
    await tx.delete(farmMemberships).where(eq9(farmMemberships.farmId, scope.farmId));
    await tx.delete(traders).where(eq9(traders.farmId, scope.farmId));
    await tx.delete(houses).where(eq9(houses.farmId, scope.farmId));
    await tx.delete(farms).where(eq9(farms.id, scope.farmId));
  }
}
async function deleteFarm(ownerId, farmId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const scope = await resolveCascadeScope(db, "farm", farmId);
  await requireFarmCapability(ownerId, farmId, "manage_farms");
  await db.transaction(async (tx) => deleteCascadeScope(tx, scope, "farm"));
}

// server/db/cycles.ts
init_schema();
import { and as and5, eq as eq10, inArray as inArray5, sql as sql3 } from "drizzle-orm";

// shared/lifecyclePolicy.ts
function canSetCycleBirds(birdsPlaced, assignedBirds) {
  return birdsPlaced >= assignedBirds;
}
function canSetHouseCapacity(capacity, configuredCageCapacity) {
  return capacity >= configuredCageCapacity;
}

// shared/cycleSalesFinalization.ts
function eligibleCycleSales(sales2) {
  return sales2.filter((sale) => !sale.isDeleted && sale.traderActive !== false);
}
function cycleSalesFinalizationReadiness(sales2) {
  const activeSales = eligibleCycleSales(sales2);
  const invalidOpenSales = activeSales.filter((sale) => sale.status === "open" && (sale.netWeightGrams <= 0 || sale.totalPiasters <= 0));
  return {
    activeSalesCount: activeSales.length,
    openSalesCount: activeSales.filter((sale) => sale.status === "open").length,
    closedSalesCount: activeSales.filter((sale) => sale.status === "closed").length,
    invalidOpenSaleIds: invalidOpenSales.map((sale) => sale.id),
    canFinalize: activeSales.length > 0 && invalidOpenSales.length === 0
  };
}

// server/db/cycles.ts
async function createCycle(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(ownerId, input.farmId, "manage_cycles");
  await db.insert(cycles).values({ ...input, status: "upcoming" });
}
async function updateCycle(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq10(cycles.id, input.cycleId)).limit(1);
  if (!cycle) throw new Error("Cycle not found");
  assertCycleAllowsOperationalMutation(cycle.status);
  await requireFarmCapability(ownerId, cycle.farmId, "manage_cycles", { houseId: null, cycleId: input.cycleId });
  const assignments = await db.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(eq10(cycleHouseAssignments.cycleId, input.cycleId));
  const assignedBirds = assignments.reduce((sum, assignment) => sum + assignment.assignedBirds, 0);
  if (!canSetCycleBirds(input.birdsPlaced, assignedBirds)) throw new Error("Cycle birds placed cannot be less than birds already allocated to houses");
  await db.update(cycles).set({ name: input.name, placementDate: input.placementDate, birdsPlaced: input.birdsPlaced }).where(eq10(cycles.id, input.cycleId));
}
async function deleteCycle(ownerId, cycleId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const scope = await resolveCascadeScope(db, "cycle", cycleId);
  await requireFarmCapability(ownerId, scope.farmId, "manage_cycles", { houseId: null, cycleId });
  await db.transaction(async (tx) => deleteCascadeScope(tx, scope, "cycle"));
}
async function closeCycle(ownerId, cycleId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleCapability(ownerId, cycleId, "close_cycles");
  await db.update(cycles).set({ status: "closed" }).where(eq10(cycles.id, cycleId));
}
async function finalizeCycleSalesAndClose(ownerId, cycleId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleCapability(ownerId, cycleId, "close_cycles");
  const [cycleAccess] = await db.select({ farmId: cycles.farmId, houseId: cycles.houseId }).from(cycles).where(eq10(cycles.id, cycleId)).limit(1);
  if (!cycleAccess) throw new Error("\u0627\u0644\u062F\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
  await requireFarmCapability(ownerId, cycleAccess.farmId, "manage_sales", { houseId: cycleAccess.houseId, cycleId });
  return db.transaction(async (tx) => {
    const [cycle] = await tx.select().from(cycles).where(eq10(cycles.id, cycleId)).for("update").limit(1);
    if (!cycle) throw new Error("\u0627\u0644\u062F\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    if (cycle.status === "closed") throw new Error("\u0647\u0630\u0647 \u0627\u0644\u062F\u0648\u0631\u0629 \u0645\u0646\u062A\u0647\u064A\u0629 \u0628\u0627\u0644\u0641\u0639\u0644");
    const activeTraderRows = await tx.select({ id: traders.id }).from(traders).where(and5(eq10(traders.farmId, cycle.farmId), eq10(traders.isActive, true)));
    const activeTraderIds = activeTraderRows.map((trader) => trader.id);
    const cycleSales = activeTraderIds.length ? await tx.select().from(sales).where(and5(eq10(sales.cycleId, cycleId), eq10(sales.isDeleted, false), inArray5(sales.traderId, activeTraderIds))).for("update") : [];
    const readiness = cycleSalesFinalizationReadiness(cycleSales);
    if (!readiness.activeSalesCount) throw new Error("\u0644\u0627 \u062A\u0648\u062C\u062F \u0639\u0645\u0644\u064A\u0627\u062A \u0628\u064A\u0639 \u0646\u0634\u0637\u0629 \u0644\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u062F\u0648\u0631\u0629");
    let completedSalesCount = 0;
    for (const sale of cycleSales) {
      if (sale.status === "closed") continue;
      const totals = await refreshSaleFromBatches(tx, sale);
      if (totals.netWeightGrams <= 0 || totals.totalPiasters <= 0) throw new Error("\u0647\u0646\u0627\u0643 \u0639\u0645\u0644\u064A\u0629 \u0628\u064A\u0639 \u0645\u0641\u062A\u0648\u062D\u0629 \u0644\u0627 \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0648\u0632\u0646 \u0635\u0627\u0641\u064D \u0623\u0648 \u0642\u064A\u0645\u0629 \u0628\u064A\u0639 \u0645\u062D\u0633\u0648\u0628\u0629");
      const [independentLedger] = await tx.select({ count: sql3`coalesce(count(*), 0)` }).from(saleWeighBatches).where(and5(eq10(saleWeighBatches.saleId, sale.id), eq10(saleWeighBatches.weighingStage, "tare_pending")));
      assertSaleCanComplete({ weighingMode: sale.weighingMode, loadedCageCount: sale.loadedCageCount, plannedCageCount: sale.plannedCageCount, usesIndependentLedgers: Number(independentLedger?.count ?? 0) > 0 });
      await tx.update(sales).set({ status: "closed" }).where(eq10(sales.id, sale.id));
      await tx.insert(saleActivities).values({ saleId: sale.id, farmId: sale.farmId, actorUserId: ownerId, action: "sale_completed", details: "\u0625\u0646\u0647\u0627\u0621 \u062A\u0644\u0642\u0627\u0626\u064A \u0636\u0645\u0646 \u0625\u0642\u0641\u0627\u0644 \u0627\u0644\u062F\u0648\u0631\u0629" });
      completedSalesCount += 1;
    }
    await tx.update(cycles).set({ status: "closed" }).where(eq10(cycles.id, cycle.id));
    return { cycleId: cycle.id, completedSalesCount, totalSalesCount: readiness.activeSalesCount };
  });
}

// server/db/houses.ts
init_schema();
import { and as and6, eq as eq11, inArray as inArray6 } from "drizzle-orm";

// shared/allocation.ts
function allocationLimit({ birdsPlaced, targetSectionId, sectionCapacity, allocations }) {
  const assignedElsewhere = allocations.filter((allocation) => allocation.cageSectionId !== targetSectionId).reduce((sum, allocation) => sum + allocation.occupiedBirds, 0);
  const remainingForCycle = Math.max(0, birdsPlaced - assignedElsewhere);
  return { assignedElsewhere, remainingForCycle, maxAssignable: Math.max(0, Math.min(sectionCapacity, remainingForCycle)) };
}

// shared/cageRows.ts
function cageRowCapacity(cageCount, birdsPerCage) {
  return Math.max(0, Math.floor(cageCount)) * Math.max(0, Math.floor(birdsPerCage));
}
function canAddCycleCageRow({ houseCapacity, assignedBirds, existingRowCapacity, existingCycleBirds, cageCount, birdsPerCage }) {
  const rowCapacity = cageRowCapacity(cageCount, birdsPerCage);
  return rowCapacity > 0 && existingRowCapacity + rowCapacity <= houseCapacity && existingCycleBirds + rowCapacity <= assignedBirds;
}

// shared/houseAssignment.ts
function maxHouseAssignment({ cycleBirdsPlaced, houseId, houseCapacity, assignments }) {
  const assignedElsewhere = assignments.filter((assignment) => assignment.houseId !== houseId).reduce((sum, assignment) => sum + assignment.assignedBirds, 0);
  return Math.max(0, Math.min(houseCapacity, cycleBirdsPlaced - assignedElsewhere));
}

// server/db/houses.ts
async function setCycleHouseAssignment(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq11(cycles.id, input.cycleId)).limit(1);
  const [house] = await db.select({ farmId: houses.farmId, capacity: houses.capacity }).from(houses).where(eq11(houses.id, input.houseId)).limit(1);
  if (!cycle || !house || cycle.farmId !== house.farmId) throw new Error("House does not belong to this cycle farm");
  assertCycleAllowsOperationalMutation(cycle.status);
  await requireFarmCapability(ownerId, cycle.farmId, "manage_housing", { houseId: input.houseId, cycleId: input.cycleId });
  await db.transaction(async (tx) => {
    const [lockedCycle] = await tx.select({ birdsPlaced: cycles.birdsPlaced }).from(cycles).where(eq11(cycles.id, input.cycleId)).for("update").limit(1);
    const assignments = await tx.select({ houseId: cycleHouseAssignments.houseId, assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(eq11(cycleHouseAssignments.cycleId, input.cycleId)).for("update");
    const allowedBirds = lockedCycle ? maxHouseAssignment({ cycleBirdsPlaced: lockedCycle.birdsPlaced, houseId: input.houseId, houseCapacity: house.capacity, assignments }) : 0;
    if (!lockedCycle || input.assignedBirds > allowedBirds) throw new Error("House birds cannot exceed its capacity or the total birds placed in this cycle");
    const [existing] = await tx.select({ id: cycleHouseAssignments.id }).from(cycleHouseAssignments).where(and6(eq11(cycleHouseAssignments.cycleId, input.cycleId), eq11(cycleHouseAssignments.houseId, input.houseId))).for("update").limit(1);
    if (input.assignedBirds === 0 && existing) await tx.delete(cycleHouseAssignments).where(eq11(cycleHouseAssignments.id, existing.id));
    else if (existing) await tx.update(cycleHouseAssignments).set({ assignedBirds: input.assignedBirds }).where(eq11(cycleHouseAssignments.id, existing.id));
    else if (input.assignedBirds > 0) await tx.insert(cycleHouseAssignments).values(input);
  });
}
async function createHouse(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(ownerId, input.farmId, "manage_housing");
  await db.insert(houses).values(input);
}
async function updateHouse(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [house] = await db.select({ farmId: houses.farmId }).from(houses).where(eq11(houses.id, input.houseId)).limit(1);
  if (!house) throw new Error("House not found");
  await requireFarmCapability(ownerId, house.farmId, "manage_housing", { houseId: input.houseId, cycleId: null });
  const sections = await db.select({ cageCount: cageSections.cageCount, capacityPerCage: cageSections.capacityPerCage }).from(cageSections).where(eq11(cageSections.houseId, input.houseId));
  const configuredCapacity = sections.reduce((sum, section) => sum + section.cageCount * section.capacityPerCage, 0);
  const assignments = await db.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(eq11(cycleHouseAssignments.houseId, input.houseId));
  const highestAssignedBirds = assignments.reduce((max, assignment) => Math.max(max, assignment.assignedBirds), 0);
  if (!canSetHouseCapacity(input.capacity, Math.max(configuredCapacity, highestAssignedBirds))) throw new Error("House capacity cannot be less than cage capacity or assigned cycle birds");
  await db.update(houses).set({ name: input.name, capacity: input.capacity }).where(eq11(houses.id, input.houseId));
}
async function deleteHouse(ownerId, houseId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const scope = await resolveCascadeScope(db, "house", houseId);
  await requireFarmCapability(ownerId, scope.farmId, "manage_housing", { houseId, cycleId: null });
  await db.transaction(async (tx) => deleteCascadeScope(tx, scope, "house"));
}
async function createCageSection(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const assignment = await requireCycleHouseAssignment(ownerId, input.cycleId, input.houseId, "manage_housing");
  const [house] = await db.select({ capacity: houses.capacity }).from(houses).where(eq11(houses.id, input.houseId)).limit(1);
  if (!house) throw new Error("House not found");
  const rowCapacity = cageRowCapacity(input.cageCount, input.capacityPerCage);
  await db.transaction(async (tx) => {
    const existingSections = await tx.select({ id: cageSections.id, cageCount: cageSections.cageCount, capacityPerCage: cageSections.capacityPerCage }).from(cageSections).where(eq11(cageSections.houseId, input.houseId)).for("update");
    const existingRowCapacity = existingSections.reduce((sum, section2) => sum + cageRowCapacity(section2.cageCount, section2.capacityPerCage), 0);
    const existingOccupancy = existingSections.length ? await tx.select({ occupiedBirds: cycleCageOccupancy.occupiedBirds }).from(cycleCageOccupancy).where(and6(eq11(cycleCageOccupancy.cycleId, input.cycleId), inArray6(cycleCageOccupancy.cageSectionId, existingSections.map((section2) => section2.id)))).for("update") : [];
    const existingCycleBirds = existingOccupancy.reduce((sum, allocation) => sum + allocation.occupiedBirds, 0);
    if (!canAddCycleCageRow({ houseCapacity: house.capacity, assignedBirds: assignment.assignedBirds, existingRowCapacity, existingCycleBirds, cageCount: input.cageCount, birdsPerCage: input.capacityPerCage })) throw new Error("Cage row capacity exceeds the house capacity or birds assigned to this house for the cycle");
    const [section] = await tx.insert(cageSections).values({ houseId: input.houseId, name: input.name, rowName: input.rowName, cageCount: input.cageCount, capacityPerCage: input.capacityPerCage }).$returningId();
    await tx.insert(cycleCageOccupancy).values({ cycleId: input.cycleId, cageSectionId: section.id, occupiedBirds: rowCapacity });
  });
}
async function setCageOccupancy(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select({ farmId: cycles.farmId }).from(cycles).where(eq11(cycles.id, input.cycleId)).limit(1);
  if (!cycle) throw new Error("Cycle not found");
  const [section] = await db.select({ farmId: houses.farmId, houseId: cageSections.houseId, cageCount: cageSections.cageCount, capacityPerCage: cageSections.capacityPerCage }).from(cageSections).innerJoin(houses, eq11(cageSections.houseId, houses.id)).where(eq11(cageSections.id, input.cageSectionId)).limit(1);
  if (!section || section.farmId !== cycle.farmId) throw new Error("Cage section does not belong to this cycle farm");
  await requireCycleHouseAssignment(ownerId, input.cycleId, section.houseId, "manage_housing");
  await db.transaction(async (tx) => {
    const [lockedAssignment] = await tx.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(and6(eq11(cycleHouseAssignments.cycleId, input.cycleId), eq11(cycleHouseAssignments.houseId, section.houseId))).for("update").limit(1);
    requireHouseCageDistribution({ assignedBirds: lockedAssignment?.assignedBirds, houseSectionCapacity: section.cageCount * section.capacityPerCage });
    const existingAllocations = await tx.select({ cageSectionId: cycleCageOccupancy.cageSectionId, occupiedBirds: cycleCageOccupancy.occupiedBirds }).from(cycleCageOccupancy).where(eq11(cycleCageOccupancy.cycleId, input.cycleId)).for("update");
    const sectionCapacity = section.cageCount * section.capacityPerCage;
    const houseSectionIds = new Set((await tx.select({ id: cageSections.id }).from(cageSections).where(eq11(cageSections.houseId, section.houseId))).map((item) => item.id));
    const houseAllocations = existingAllocations.filter((allocation) => houseSectionIds.has(allocation.cageSectionId));
    const { maxAssignable } = allocationLimit({ birdsPlaced: lockedAssignment?.assignedBirds ?? 0, targetSectionId: input.cageSectionId, sectionCapacity, allocations: houseAllocations });
    if (input.occupiedBirds > maxAssignable) throw new Error("Occupied birds exceed this house assignment or the section capacity");
    const [existing] = await tx.select({ id: cycleCageOccupancy.id }).from(cycleCageOccupancy).where(and6(eq11(cycleCageOccupancy.cycleId, input.cycleId), eq11(cycleCageOccupancy.cageSectionId, input.cageSectionId))).for("update").limit(1);
    if (existing) await tx.update(cycleCageOccupancy).set({ occupiedBirds: input.occupiedBirds }).where(eq11(cycleCageOccupancy.id, existing.id));
    else await tx.insert(cycleCageOccupancy).values(input);
  });
}

// server/db/operations.ts
init_schema();
import { and as and7, eq as eq12, sql as sql4 } from "drizzle-orm";
async function addDailyRecord(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleHouseAssignment(ownerId, input.cycleId, input.houseId, "record_operations");
  await db.transaction(async (tx) => {
    const [cycle] = await tx.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq12(cycles.id, input.cycleId)).limit(1);
    if (!cycle) throw new Error("\u0627\u0644\u062F\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    assertCycleAllowsOperationalMutation(cycle.status);
    const startOfDay = new Date(input.recordDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(input.recordDate);
    endOfDay.setHours(23, 59, 59, 999);
    const existingSameDay = await tx.select({ id: dailyRecords.id }).from(dailyRecords).where(and7(
      eq12(dailyRecords.cycleId, input.cycleId),
      eq12(dailyRecords.houseId, input.houseId),
      sql4`${dailyRecords.recordDate} >= ${startOfDay} and ${dailyRecords.recordDate} <= ${endOfDay}`
    )).limit(1);
    if (existingSameDay.length > 0) {
      throw new Error("\u064A\u0648\u062C\u062F \u0633\u062C\u0644 \u062A\u0634\u063A\u064A\u0644\u064A \u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u0641\u0639\u0644 \u0644\u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0628\u0631 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u064A\u0648\u0645");
    }
    const [assignment] = await tx.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(and7(
      eq12(cycleHouseAssignments.cycleId, input.cycleId),
      eq12(cycleHouseAssignments.houseId, input.houseId)
    )).limit(1);
    const [houseLosses] = await tx.select({
      totalLosses: sql4`coalesce(sum(${dailyRecords.mortality} + ${dailyRecords.culls}), 0)`
    }).from(dailyRecords).where(and7(
      eq12(dailyRecords.cycleId, input.cycleId),
      eq12(dailyRecords.houseId, input.houseId)
    ));
    const assignedBirds = assignment?.assignedBirds ?? 0;
    const currentLosses = Number(houseLosses?.totalLosses ?? 0);
    const newLosses = input.mortality + input.culls;
    if (assignedBirds > 0 && currentLosses + newLosses > assignedBirds) {
      throw new Error(`\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0646\u0627\u0641\u0642 \u0648\u0627\u0644\u0627\u0633\u062A\u0628\u0639\u0627\u062F (${currentLosses + newLosses}) \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u062A\u062C\u0627\u0648\u0632 \u0639\u062F\u062F \u0627\u0644\u0637\u064A\u0648\u0631 \u0627\u0644\u0645\u0633\u0643\u0646\u0629 \u0628\u0627\u0644\u0639\u0646\u0628\u0631 (${assignedBirds})`);
    }
    const [settings] = await tx.select({ bagWeightKg: feedInventorySettings.bagWeightKg }).from(feedInventorySettings).where(eq12(feedInventorySettings.farmId, cycle.farmId)).limit(1);
    const bagDelta = dailyFeedIssueBags(input.feedKg, Number(settings?.bagWeightKg ?? 50));
    if (bagDelta < 0) await requireSufficientFeedBalance(tx, cycle.farmId, bagDelta);
    const inserted = await tx.insert(dailyRecords).values(input);
    const recordId = Number(inserted[0]?.insertId);
    if (!recordId) throw new Error("\u062A\u0639\u0630\u0631 \u0631\u0628\u0637 \u0633\u062C\u0644 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0628\u062D\u0631\u0643\u0629 \u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0639\u0644\u0641");
    if (bagDelta < 0) await tx.insert(feedInventoryTransactions).values({
      farmId: cycle.farmId,
      dailyRecordId: recordId,
      movementType: "issue",
      bagDelta: bagDelta.toFixed(4),
      occurredAt: input.recordDate,
      reference: `\u0633\u062C\u0644 \u062A\u0634\u063A\u064A\u0644 #${recordId}`,
      notes: `\u062E\u0635\u0645 \u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0627\u0633\u062A\u0647\u0644\u0627\u0643 ${input.feedKg} \u0643\u062C\u0645 \u0639\u0644\u0641`,
      createdByUserId: ownerId
    });
  });
}
async function requireSufficientFeedBalance(tx, farmId, bagDelta, ignoredDailyRecordId) {
  const [summary] = await tx.select({ balance: sql4`coalesce(sum(${feedInventoryTransactions.bagDelta}), 0)` }).from(feedInventoryTransactions).where(eq12(feedInventoryTransactions.farmId, farmId));
  let availableBags = Number(summary?.balance ?? 0);
  if (ignoredDailyRecordId) {
    const [existingIssue] = await tx.select({ bagDelta: feedInventoryTransactions.bagDelta }).from(feedInventoryTransactions).where(eq12(feedInventoryTransactions.dailyRecordId, ignoredDailyRecordId)).limit(1);
    availableBags -= Number(existingIssue?.bagDelta ?? 0);
  }
  if (availableBags + bagDelta < -1e-5) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0633\u062C\u064A\u0644 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0639\u0644\u0641 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0645\u062A\u0627\u062D \u0641\u064A \u0627\u0644\u0645\u062E\u0632\u0646");
}
async function updateDailyRecord(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [record] = await db.select().from(dailyRecords).where(eq12(dailyRecords.id, input.recordId)).limit(1);
  if (!record) throw new Error("\u0633\u062C\u0644 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  if (record.houseId === null) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0633\u062C\u0644 \u062A\u0634\u063A\u064A\u0644\u064A \u0642\u062F\u064A\u0645 \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0639\u0646\u0628\u0631");
  await requireCycleHouseAssignment(ownerId, record.cycleId, record.houseId, "record_operations");
  await db.transaction(async (tx) => {
    const [cycle] = await tx.select({ farmId: cycles.farmId, status: cycles.status }).from(cycles).where(eq12(cycles.id, record.cycleId)).limit(1);
    if (!cycle) throw new Error("\u0627\u0644\u062F\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    assertCycleAllowsOperationalMutation(cycle.status);
    const [assignment] = await tx.select({ assignedBirds: cycleHouseAssignments.assignedBirds }).from(cycleHouseAssignments).where(and7(
      eq12(cycleHouseAssignments.cycleId, record.cycleId),
      eq12(cycleHouseAssignments.houseId, record.houseId)
    )).limit(1);
    const [houseLosses] = await tx.select({
      totalLosses: sql4`coalesce(sum(case when ${dailyRecords.id} <> ${record.id} then ${dailyRecords.mortality} + ${dailyRecords.culls} else 0 end), 0)`
    }).from(dailyRecords).where(and7(
      eq12(dailyRecords.cycleId, record.cycleId),
      eq12(dailyRecords.houseId, record.houseId)
    ));
    const assignedBirds = assignment?.assignedBirds ?? 0;
    const currentLosses = Number(houseLosses?.totalLosses ?? 0);
    const newLosses = input.mortality + input.culls;
    if (assignedBirds > 0 && currentLosses + newLosses > assignedBirds) {
      throw new Error(`\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0646\u0627\u0641\u0642 \u0648\u0627\u0644\u0627\u0633\u062A\u0628\u0639\u0627\u062F (${currentLosses + newLosses}) \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u062A\u062C\u0627\u0648\u0632 \u0639\u062F\u062F \u0627\u0644\u0637\u064A\u0648\u0631 \u0627\u0644\u0645\u0633\u0643\u0646\u0629 \u0628\u0627\u0644\u0639\u0646\u0628\u0631 (${assignedBirds})`);
    }
    if (!cycle) throw new Error("\u0627\u0644\u062F\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    const [settings] = await tx.select({ bagWeightKg: feedInventorySettings.bagWeightKg }).from(feedInventorySettings).where(eq12(feedInventorySettings.farmId, cycle.farmId)).limit(1);
    const bagDelta = dailyFeedIssueBags(input.feedKg, Number(settings?.bagWeightKg ?? 50));
    if (bagDelta < 0) await requireSufficientFeedBalance(tx, cycle.farmId, bagDelta, record.id);
    await tx.update(dailyRecords).set({ recordDate: input.recordDate, feedKg: input.feedKg, waterLiters: input.waterLiters, mortality: input.mortality, culls: input.culls }).where(eq12(dailyRecords.id, record.id));
    const [existingIssue] = await tx.select({ id: feedInventoryTransactions.id }).from(feedInventoryTransactions).where(eq12(feedInventoryTransactions.dailyRecordId, record.id)).limit(1);
    if (existingIssue && bagDelta === 0) {
      await tx.delete(feedInventoryTransactions).where(eq12(feedInventoryTransactions.id, existingIssue.id));
    } else if (existingIssue) {
      await tx.update(feedInventoryTransactions).set({ bagDelta: bagDelta.toFixed(4), occurredAt: input.recordDate, notes: `\u062E\u0635\u0645 \u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0627\u0633\u062A\u0647\u0644\u0627\u0643 ${input.feedKg} \u0643\u062C\u0645 \u0639\u0644\u0641` }).where(eq12(feedInventoryTransactions.id, existingIssue.id));
    } else if (bagDelta < 0) {
      await tx.insert(feedInventoryTransactions).values({ farmId: cycle.farmId, dailyRecordId: record.id, movementType: "issue", bagDelta: bagDelta.toFixed(4), occurredAt: input.recordDate, reference: `\u0633\u062C\u0644 \u062A\u0634\u063A\u064A\u0644 #${record.id}`, notes: `\u062E\u0635\u0645 \u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0627\u0633\u062A\u0647\u0644\u0627\u0643 ${input.feedKg} \u0643\u062C\u0645 \u0639\u0644\u0641`, createdByUserId: ownerId });
    }
  });
}
async function deleteDailyRecord(ownerId, recordId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [record] = await db.select().from(dailyRecords).where(eq12(dailyRecords.id, recordId)).limit(1);
  if (!record) throw new Error("\u0633\u062C\u0644 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  if (record.houseId === null) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0633\u062C\u0644 \u062A\u0634\u063A\u064A\u0644\u064A \u0642\u062F\u064A\u0645 \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0639\u0646\u0628\u0631");
  await requireCycleHouseAssignment(ownerId, record.cycleId, record.houseId, "record_operations");
  await db.transaction(async (tx) => {
    await tx.delete(feedInventoryTransactions).where(eq12(feedInventoryTransactions.dailyRecordId, record.id));
    await tx.delete(dailyRecords).where(eq12(dailyRecords.id, record.id));
  });
}

// server/db/weights.ts
init_schema();
async function addWeightSample(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleHouseAssignment(ownerId, input.cycleId, input.houseId, "record_weights");
  await db.insert(weightSamples).values(input);
}

// server/db/health.ts
init_schema();
import { eq as eq13 } from "drizzle-orm";

// shared/healthEventLifecycle.ts
function healthEventAuthorizationScopes(event, destinationHouseId) {
  if (!event.houseId) throw new Error("Health record not found or is not linked to a house");
  const destination = destinationHouseId ?? event.houseId;
  return destination === event.houseId ? [{ cycleId: event.cycleId, houseId: event.houseId }] : [{ cycleId: event.cycleId, houseId: event.houseId }, { cycleId: event.cycleId, houseId: destination }];
}
function normalizeHealthEventHouseIds(houseIds) {
  const normalized = Array.from(new Set(houseIds.filter((houseId) => Number.isInteger(houseId) && houseId > 0)));
  if (!normalized.length) throw new Error("\u0627\u062E\u062A\u0631 \u0639\u0646\u0628\u0631\u0627\u064B \u0648\u0627\u062D\u062F\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0623\u0648 \u062C\u0645\u064A\u0639 \u0639\u0646\u0627\u0628\u0631 \u0627\u0644\u062F\u0648\u0631\u0629");
  return normalized;
}
function healthEventUpdatePatch(input) {
  return {
    houseId: input.houseId,
    eventDate: input.eventDate,
    eventType: input.eventType,
    productName: input.productName,
    dosage: input.dosage,
    administrationRoute: input.administrationRoute || null,
    notes: input.notes || null
  };
}
async function executeHealthEventUpdate(input) {
  for (const scope of healthEventAuthorizationScopes(input.event, input.mutation.houseId)) {
    await input.requireHealthAccess(input.ownerId, scope.cycleId, scope.houseId);
  }
  const patch = healthEventUpdatePatch(input.mutation);
  await input.persist(input.event.id, patch);
  return patch;
}
async function executeHealthEventDelete(input) {
  for (const scope of healthEventAuthorizationScopes(input.event)) {
    await input.requireHealthAccess(input.ownerId, scope.cycleId, scope.houseId);
  }
  await input.remove(input.event.id);
}

// server/db/health.ts
async function addHealthEvent(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireCycleHouseAssignment(ownerId, input.cycleId, input.houseId, "manage_health");
  await db.insert(healthEvents).values({ ...input, administrationRoute: input.administrationRoute || null, notes: input.notes || null });
}
async function addHealthEvents(ownerId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const houseIds = normalizeHealthEventHouseIds(input.houseIds);
  await Promise.all(houseIds.map((houseId) => requireCycleHouseAssignment(ownerId, input.cycleId, houseId, "manage_health")));
  await db.transaction(async (tx) => {
    await tx.insert(healthEvents).values(houseIds.map((houseId) => ({
      cycleId: input.cycleId,
      houseId,
      eventDate: input.eventDate,
      eventType: input.eventType,
      productName: input.productName,
      dosage: input.dosage,
      administrationRoute: input.administrationRoute || null,
      notes: input.notes || null
    })));
  });
  return { createdCount: houseIds.length };
}
async function getExistingHealthEvent(healthEventId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [event] = await db.select().from(healthEvents).where(eq13(healthEvents.id, healthEventId)).limit(1);
  if (!event) throw new Error("Health record not found or is not linked to a house");
  return { db, event };
}
async function updateHealthEvent(ownerId, input) {
  const { db, event } = await getExistingHealthEvent(input.healthEventId);
  await executeHealthEventUpdate({
    ownerId,
    event,
    mutation: input,
    requireHealthAccess: async (userId, cycleId, houseId) => {
      await requireCycleHouseAssignment(userId, cycleId, houseId, "manage_health");
    },
    persist: async (healthEventId, patch) => {
      await db.update(healthEvents).set(patch).where(eq13(healthEvents.id, healthEventId));
    }
  });
}
async function deleteHealthEvent(ownerId, healthEventId) {
  const { db, event } = await getExistingHealthEvent(healthEventId);
  await executeHealthEventDelete({
    ownerId,
    event,
    requireHealthAccess: async (userId, cycleId, houseId) => {
      await requireCycleHouseAssignment(userId, cycleId, houseId, "manage_health");
    },
    remove: async (eventId) => {
      await db.delete(healthEvents).where(eq13(healthEvents.id, eventId));
    }
  });
}

// server/db/alerts.ts
init_schema();
import { and as and8, desc as desc3, eq as eq14, inArray as inArray7, sql as sql5 } from "drizzle-orm";

// shared/alertsEngine.ts
function getExpectedWeightGrams(ageDays) {
  if (ageDays <= 1) return 42;
  if (ageDays <= 7) return 42 + (190 - 42) * ((ageDays - 1) / 6);
  if (ageDays <= 14) return 190 + (470 - 190) * ((ageDays - 7) / 7);
  if (ageDays <= 21) return 470 + (950 - 470) * ((ageDays - 14) / 7);
  if (ageDays <= 28) return 950 + (1560 - 950) * ((ageDays - 21) / 7);
  if (ageDays <= 35) return 1560 + (2280 - 1560) * ((ageDays - 28) / 7);
  if (ageDays <= 42) return 2280 + (3020 - 2280) * ((ageDays - 35) / 7);
  return 3020 + (ageDays - 42) * 85;
}
function evaluateMortalityAnomaly(input) {
  const alerts2 = [];
  if (!input.dailyRecords.length || input.birdsPlaced <= 0) return alerts2;
  const sorted = [...input.dailyRecords].sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime());
  const latestRecord = sorted[sorted.length - 1];
  const dailyLoss = latestRecord.mortality + latestRecord.culls;
  const dailyLossPercent = dailyLoss / input.birdsPlaced * 100;
  if (dailyLossPercent >= 1) {
    alerts2.push({
      alertType: "high_mortality",
      severity: "critical",
      title: "\u0627\u0631\u062A\u0641\u0627\u0639 \u062D\u0631\u062C \u0641\u064A \u0646\u0633\u0628\u0629 \u0627\u0644\u0646\u0641\u0648\u0642 \u0627\u0644\u064A\u0648\u0645\u064A",
      message: `\u0633\u062C\u0644 \u0627\u0644\u0639\u0646\u0628\u0631 \u0646\u0641\u0648\u0642\u0627\u064B \u064A\u0648\u0645\u064A\u0627\u064B \u0628\u0646\u0633\u0628\u0629 ${dailyLossPercent.toFixed(2)}% (${dailyLoss} \u0637\u0627\u0626\u0631)\u060C \u0648\u0647\u0648 \u0645\u0627 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u062D\u0631\u062C (1.0%). \u064A\u062C\u0628 \u0627\u0644\u0641\u062D\u0635 \u0627\u0644\u0628\u064A\u0637\u0631\u064A \u0627\u0644\u0641\u0648\u0631\u064A.`,
      metadata: { dailyLoss, dailyLossPercent, recordDate: latestRecord.recordDate }
    });
  } else if (dailyLossPercent >= 0.5) {
    alerts2.push({
      alertType: "high_mortality",
      severity: "warning",
      title: "\u062A\u0646\u0628\u064A\u0647: \u0627\u0631\u062A\u0641\u0627\u0639 \u0641\u064A \u0646\u0633\u0628\u0629 \u0627\u0644\u0646\u0641\u0648\u0642 \u0627\u0644\u064A\u0648\u0645\u064A",
      message: `\u0628\u0644\u063A\u062A \u0646\u0633\u0628\u0629 \u0627\u0644\u0646\u0641\u0648\u0642 \u0627\u0644\u064A\u0648\u0645\u064A ${dailyLossPercent.toFixed(2)}% (${dailyLoss} \u0637\u0627\u0626\u0631)\u060C \u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u062A\u0647\u0648\u064A\u0629 \u0648\u062D\u0631\u0627\u0631\u0629 \u0627\u0644\u0639\u0646\u0628\u0631.`,
      metadata: { dailyLoss, dailyLossPercent, recordDate: latestRecord.recordDate }
    });
  }
  if (sorted.length >= 3) {
    const last3 = sorted.slice(-3);
    const m0 = last3[0].mortality + last3[0].culls;
    const m1 = last3[1].mortality + last3[1].culls;
    const m2 = last3[2].mortality + last3[2].culls;
    if (m2 > m1 && m1 > m0 && m2 >= 15) {
      alerts2.push({
        alertType: "high_mortality",
        severity: "warning",
        title: "\u062A\u0635\u0627\u0639\u062F \u0645\u0633\u062A\u0645\u0631 \u0641\u064A \u0627\u0644\u0646\u0641\u0648\u0642 \u0644\u0640 3 \u0623\u064A\u0627\u0645 \u0645\u062A\u062A\u0627\u0644\u064A\u0629",
        message: `\u062A\u0645 \u0631\u0635\u062F \u0627\u0631\u062A\u0641\u0627\u0639 \u0645\u062A\u062A\u0627\u0644\u064A \u0641\u064A \u0623\u0639\u062F\u0627\u062F \u0627\u0644\u0646\u0641\u0648\u0642 \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0622\u062E\u0631 3 \u0623\u064A\u0627\u0645 (${m0} \u2192 ${m1} \u2192 ${m2} \u0637\u0627\u0626\u0631). \u064A\u0648\u0635\u0649 \u0628\u0625\u062C\u0631\u0627\u0621 \u062A\u0634\u0631\u064A\u062D \u0648\u0641\u062D\u0635 \u0628\u064A\u0637\u0631\u064A \u0627\u0633\u062A\u0628\u0627\u0642\u064A.`,
        metadata: { trend: [m0, m1, m2] }
      });
    }
  }
  return alerts2;
}
function evaluateGrowthAnomaly(input) {
  if (input.cycleAgeDays < 7 || input.averageWeightGrams <= 0) return null;
  const expectedWeight = getExpectedWeightGrams(input.cycleAgeDays);
  const deviationRatio = (input.averageWeightGrams - expectedWeight) / expectedWeight;
  if (deviationRatio <= -0.18) {
    return {
      alertType: "low_weight",
      severity: "critical",
      title: "\u062A\u0623\u062E\u0631 \u062D\u0631\u062C \u0641\u064A \u0645\u0639\u062F\u0644 \u0646\u0645\u0648 \u0627\u0644\u0642\u0637\u064A\u0639",
      message: `\u0645\u062A\u0648\u0633\u0637 \u0648\u0632\u0646 \u0627\u0644\u0637\u0627\u0626\u0631 (${Math.round(input.averageWeightGrams)} \u062C\u0645 \u0641\u064A \u0639\u0645\u0631 ${input.cycleAgeDays} \u064A\u0648\u0645) \u0623\u0642\u0644 \u0628\u0646\u0633\u0628\u0629 ${(Math.abs(deviationRatio) * 100).toFixed(1)}% \u0639\u0646 \u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0642\u064A\u0627\u0633\u064A \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641 (${Math.round(expectedWeight)} \u062C\u0645).`,
      metadata: { actualWeight: input.averageWeightGrams, expectedWeight, deviationRatio }
    };
  }
  if (deviationRatio <= -0.1) {
    return {
      alertType: "low_weight",
      severity: "warning",
      title: "\u062A\u0631\u0627\u062C\u0639 \u0641\u064A \u0645\u062A\u0648\u0633\u0637 \u0648\u0632\u0646 \u0627\u0644\u0642\u0637\u064A\u0639",
      message: `\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u062D\u0627\u0644\u064A (${Math.round(input.averageWeightGrams)} \u062C\u0645) \u064A\u0642\u0644 \u0628\u0646\u0633\u0628\u0629 ${(Math.abs(deviationRatio) * 100).toFixed(1)}% \u0639\u0646 \u0627\u0644\u0645\u0646\u062D\u0646\u0649 \u0627\u0644\u0642\u064A\u0627\u0633\u064A \u0644\u0644\u0633\u0644\u0627\u0644\u0629 (${Math.round(expectedWeight)} \u062C\u0645).`,
      metadata: { actualWeight: input.averageWeightGrams, expectedWeight, deviationRatio }
    };
  }
  return null;
}
function evaluateFcrAnomaly(input) {
  if (input.cycleAgeDays < 21 || input.fcr <= 0) return null;
  if (input.fcr >= 1.75) {
    return {
      alertType: "abnormal_fcr",
      severity: "critical",
      title: "\u0627\u0631\u062A\u0641\u0627\u0639 \u062D\u0631\u062C \u0641\u064A \u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u063A\u0630\u0627\u0626\u064A (FCR)",
      message: `\u0628\u0644\u063A \u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u063A\u0630\u0627\u0626\u064A ${input.fcr.toFixed(2)} \u0641\u064A \u0639\u0645\u0631 ${input.cycleAgeDays} \u064A\u0648\u0645. \u0647\u0646\u0627\u0643 \u0647\u062F\u0631 \u0639\u0644\u0641 \u0645\u062D\u062A\u0645\u0644 \u0623\u0648 \u0645\u0634\u0627\u0643\u0644 \u0641\u064A \u0627\u0644\u0627\u0645\u062A\u0635\u0627\u0635 \u0627\u0644\u0645\u0639\u0648\u064A.`,
      metadata: { fcr: input.fcr, ageDays: input.cycleAgeDays }
    };
  }
  if (input.fcr >= 1.6) {
    return {
      alertType: "abnormal_fcr",
      severity: "warning",
      title: "\u0627\u0631\u062A\u0641\u0627\u0639 \u0646\u0633\u0628\u064A \u0641\u064A \u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 (FCR)",
      message: `\u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u062D\u0627\u0644\u064A ${input.fcr.toFixed(2)} \u0623\u0639\u0644\u0649 \u0645\u0646 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641 \u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F\u064A \u0644\u0644\u062F\u0648\u0631\u0629.`,
      metadata: { fcr: input.fcr, ageDays: input.cycleAgeDays }
    };
  }
  return null;
}
function evaluateFeedStockAnomaly(input) {
  if (input.currentBalanceBags <= 0) {
    return {
      alertType: "low_feed_stock",
      severity: "critical",
      title: "\u0646\u0641\u0627\u062F \u0631\u0635\u064A\u062F \u0627\u0644\u0639\u0644\u0641 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0627\u0644\u0645\u062E\u0632\u0646",
      message: `\u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0641\u0639\u0644\u064A \u0644\u0644\u0639\u0644\u0641 \u0641\u064A \u0627\u0644\u0645\u062E\u0632\u0646 \u062D\u0627\u0644\u064A\u0627\u064B \u0647\u0648 0 \u0634\u0643\u0627\u0631\u0629! \u064A\u062C\u0628 \u062A\u0648\u0631\u064A\u062F \u062F\u0641\u0639\u0629 \u0639\u0644\u0641 \u0641\u0648\u0631\u0627\u064B \u0644\u062A\u062C\u0646\u0628 \u062A\u062C\u0648\u064A\u0639 \u0627\u0644\u0642\u0637\u064A\u0639.`,
      metadata: { currentBalanceBags: input.currentBalanceBags }
    };
  }
  const daysRemaining = input.dailyConsumptionBags > 0 ? input.currentBalanceBags / input.dailyConsumptionBags : 999;
  if (daysRemaining <= 2 || input.currentBalanceBags <= input.reorderPointBags * 0.5) {
    return {
      alertType: "low_feed_stock",
      severity: "critical",
      title: "\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0639\u0644\u0641 \u064A\u0643\u0641\u064A \u0623\u0642\u0644 \u0645\u0646 \u064A\u0648\u0645\u064A\u0646",
      message: `\u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u062D\u0627\u0644\u064A \u0628\u0627\u0644\u0645\u062E\u0632\u0646 (${Math.round(input.currentBalanceBags)} \u0634\u0643\u0627\u0631\u0629) \u064A\u0643\u0641\u064A \u0644\u0646\u062D\u0648 ${daysRemaining.toFixed(1)} \u064A\u0648\u0645 \u0641\u0642\u0637.`,
      metadata: { currentBalanceBags: input.currentBalanceBags, daysRemaining }
    };
  }
  if (input.currentBalanceBags <= input.reorderPointBags || daysRemaining <= 4) {
    return {
      alertType: "low_feed_stock",
      severity: "warning",
      title: "\u062A\u0646\u0628\u064A\u0647: \u0627\u0642\u062A\u0631\u0627\u0628 \u0646\u0642\u0637\u0629 \u0625\u0639\u0627\u062F\u0629 \u0637\u0644\u0628 \u0627\u0644\u0639\u0644\u0641",
      message: `\u0627\u0644\u0645\u062E\u0632\u0646 \u0642\u0627\u0631\u0628 \u0639\u0644\u0649 \u0646\u0642\u0637\u0629 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0637\u0644\u0628 (${Math.round(input.currentBalanceBags)} \u0634\u0643\u0627\u0631\u0629 \u0645\u062A\u0628\u0642\u064A\u0629). \u064A\u0643\u0641\u064A \u0644\u0646\u062D\u0648 ${daysRemaining.toFixed(1)} \u064A\u0648\u0645.`,
      metadata: { currentBalanceBags: input.currentBalanceBags, daysRemaining, reorderPointBags: input.reorderPointBags }
    };
  }
  return null;
}
var STANDARD_EGYPT_VACCINATION_WINDOWS = [
  { day: 7, name: "\u062A\u062D\u0635\u064A\u0646 \u0646\u064A\u0648\u0643\u0627\u0633\u0644 + \u0627\u0644\u062A\u0647\u0627\u0628 \u0634\u0639\u0628 (ND + IB)", route: "\u062A\u0642\u0637\u064A\u0631 \u0628\u0627\u0644\u0639\u064A\u0646 \u0623\u0648 \u0631\u0634" },
  { day: 12, name: "\u062A\u062D\u0635\u064A\u0646 \u0627\u0644\u062C\u0645\u0628\u0648\u0631\u0648 (Gumboro / IBD)", route: "\u0645\u064A\u0627\u0647 \u0627\u0644\u0634\u0631\u0628" },
  { day: 18, name: "\u062C\u0631\u0639\u0629 \u0645\u0646\u0634\u0637\u0629 \u0646\u064A\u0648\u0643\u0627\u0633\u0644 (ND Clone / LaSota)", route: "\u0645\u064A\u0627\u0647 \u0627\u0644\u0634\u0631\u0628 \u0623\u0648 \u0631\u0634" },
  { day: 22, name: "\u062C\u0631\u0639\u0629 \u0645\u0646\u0634\u0637\u0629 \u062C\u0645\u0628\u0648\u0631\u0648 (\u062D\u0633\u0628 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0648\u0628\u0627\u0626\u064A)", route: "\u0645\u064A\u0627\u0647 \u0627\u0644\u0634\u0631\u0628" }
];
function evaluateUpcomingVaccines(input) {
  const alerts2 = [];
  if (input.cycleAgeDays <= 0) return alerts2;
  for (const vaccine of STANDARD_EGYPT_VACCINATION_WINDOWS) {
    const isDueSoon = input.cycleAgeDays >= vaccine.day - 1 && input.cycleAgeDays <= vaccine.day + 1;
    if (!isDueSoon) continue;
    const alreadyAdministered = input.executedHealthEvents.some((event) => {
      const pName = (event.productName || "").toLowerCase();
      const vName = vaccine.name.toLowerCase();
      return event.eventType === "vaccination" && (pName.includes("nd") || pName.includes("\u062C\u0645\u0628\u0648\u0631\u0648") || pName.includes("\u0646\u064A\u0648\u0643\u0627\u0633\u0644") || vName.includes(pName));
    });
    if (!alreadyAdministered) {
      alerts2.push({
        alertType: "vaccine_due",
        severity: input.cycleAgeDays > vaccine.day ? "warning" : "info",
        title: `\u062A\u0630\u0643\u064A\u0631 \u062A\u062D\u0635\u064A\u0646 \u0645\u0633\u062A\u062D\u0642: ${vaccine.name}`,
        message: `\u062D\u0633\u0628 \u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u062A\u0633\u0645\u064A\u0646 \u0627\u0644\u0627\u0633\u062A\u0631\u0634\u0627\u062F\u064A\u060C \u064A\u0633\u062A\u062D\u0642 \u0645\u0648\u0639\u062F ${vaccine.name} \u0639\u0646\u062F \u0639\u0645\u0631 ${vaccine.day} \u064A\u0648\u0645 (${vaccine.route}). \u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0628\u064A\u0637\u0631\u064A.`,
        metadata: { targetAgeDay: vaccine.day, vaccineName: vaccine.name }
      });
    }
  }
  return alerts2;
}
function scanCycleAnomalies(input) {
  const allAlerts = [];
  allAlerts.push(...evaluateMortalityAnomaly({ dailyRecords: input.dailyRecords, birdsPlaced: input.birdsPlaced }));
  if (input.latestWeightGrams && input.latestWeightGrams > 0) {
    const growthAlert = evaluateGrowthAnomaly({ averageWeightGrams: input.latestWeightGrams, cycleAgeDays: input.cycleAgeDays });
    if (growthAlert) allAlerts.push(growthAlert);
  }
  if (input.fcr && input.fcr > 0) {
    const fcrAlert = evaluateFcrAnomaly({ fcr: input.fcr, cycleAgeDays: input.cycleAgeDays });
    if (fcrAlert) allAlerts.push(fcrAlert);
  }
  if (input.currentFeedBalanceBags !== void 0 && input.feedReorderPointBags !== void 0) {
    const stockAlert = evaluateFeedStockAnomaly({
      currentBalanceBags: input.currentFeedBalanceBags,
      reorderPointBags: input.feedReorderPointBags,
      dailyConsumptionBags: input.dailyConsumptionBags ?? 0
    });
    if (stockAlert) allAlerts.push(stockAlert);
  }
  if (input.healthEvents) {
    allAlerts.push(...evaluateUpcomingVaccines({ cycleAgeDays: input.cycleAgeDays, executedHealthEvents: input.healthEvents }));
  }
  return allAlerts;
}

// shared/farmMetrics.ts
function calculateLivability(birdsPlaced, mortality, culls = 0) {
  if (birdsPlaced <= 0) return 0;
  return Math.max(0, (birdsPlaced - mortality - culls) / birdsPlaced);
}
function calculateFcr(totalFeedKg, liveBirds, averageWeightGrams) {
  const liveBiomassKg = liveBirds * (averageWeightGrams / 1e3);
  return liveBiomassKg > 0 ? totalFeedKg / liveBiomassKg : null;
}
function calculateAdg(averageWeightGrams, ageDays, initialWeightGrams = 42) {
  if (ageDays <= 0 || averageWeightGrams <= 0) return 0;
  return Math.max(0, (averageWeightGrams - initialWeightGrams) / ageDays);
}
function calculateFeedPerBird(totalFeedKg, liveBirds) {
  if (liveBirds <= 0) return 0;
  return totalFeedKg / liveBirds;
}
function calculateCostPerBird(totalExpensesPiasters, birdCount) {
  if (birdCount <= 0 || totalExpensesPiasters <= 0) return 0;
  return totalExpensesPiasters / 100 / birdCount;
}
function calculateCostPerKg(totalExpensesPiasters, totalBiomassKg) {
  if (totalBiomassKg <= 0 || totalExpensesPiasters <= 0) return 0;
  return totalExpensesPiasters / 100 / totalBiomassKg;
}
function calculateRoi(revenuePiasters, expensesPiasters) {
  if (expensesPiasters <= 0) return 0;
  return (revenuePiasters - expensesPiasters) / expensesPiasters * 100;
}
function calculateEpef({ birdsPlaced, mortality, averageWeightGrams, fcr, ageDays }) {
  if (birdsPlaced <= 0 || ageDays <= 0 || !fcr || fcr <= 0) return null;
  const livability = (birdsPlaced - mortality) / birdsPlaced;
  return livability * averageWeightGrams * 10 / (fcr * ageDays);
}

// server/db/alerts.ts
async function listAlerts(userId, filter) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filter?.farmId) {
    await requireFarmCapability(userId, filter.farmId, "manage_farms");
    conditions.push(eq14(alerts.farmId, filter.farmId));
  }
  if (filter?.cycleId) {
    conditions.push(eq14(alerts.cycleId, filter.cycleId));
  }
  if (filter?.status) {
    conditions.push(eq14(alerts.status, filter.status));
  } else {
    conditions.push(inArray7(alerts.status, ["active", "acknowledged"]));
  }
  return db.select().from(alerts).where(conditions.length ? and8(...conditions) : void 0).orderBy(desc3(alerts.createdAt)).limit(100);
}
async function acknowledgeAlert(userId, alertId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [alert] = await db.select().from(alerts).where(eq14(alerts.id, alertId)).limit(1);
  if (!alert) throw new Error("Alert not found");
  await requireFarmCapability(userId, alert.farmId, "manage_farms");
  await db.update(alerts).set({
    status: "acknowledged",
    acknowledgedByUserId: userId,
    acknowledgedAt: /* @__PURE__ */ new Date()
  }).where(eq14(alerts.id, alertId));
  return { success: true };
}
async function resolveAlert(userId, alertId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [alert] = await db.select().from(alerts).where(eq14(alerts.id, alertId)).limit(1);
  if (!alert) throw new Error("Alert not found");
  await requireFarmCapability(userId, alert.farmId, "manage_farms");
  await db.update(alerts).set({
    status: "resolved",
    resolvedAt: /* @__PURE__ */ new Date()
  }).where(eq14(alerts.id, alertId));
  return { success: true };
}
async function createAlert(farmId, alertInput, cycleId, houseId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [created] = await db.insert(alerts).values({
    farmId,
    cycleId: cycleId ?? null,
    houseId: houseId ?? null,
    alertType: alertInput.alertType,
    severity: alertInput.severity,
    title: alertInput.title,
    message: alertInput.message,
    metadata: alertInput.metadata ? JSON.stringify(alertInput.metadata) : null,
    status: "active"
  }).$returningId();
  return created;
}
async function scanAndSyncCycleAlerts(userId, farmId, cycleId) {
  const db = await getDb();
  if (!db) return [];
  await requireFarmCapability(userId, farmId, "manage_farms");
  const [cycle] = await db.select().from(cycles).where(eq14(cycles.id, cycleId)).limit(1);
  if (!cycle || cycle.status === "closed") return [];
  const [records, weights, health, [feedSetting], feedTxSummary] = await Promise.all([
    db.select().from(dailyRecords).where(eq14(dailyRecords.cycleId, cycleId)).orderBy(desc3(dailyRecords.recordDate)),
    db.select().from(weightSamples).where(eq14(weightSamples.cycleId, cycleId)).orderBy(desc3(weightSamples.sampleDate)),
    db.select().from(healthEvents).where(eq14(healthEvents.cycleId, cycleId)),
    db.select().from(feedInventorySettings).where(eq14(feedInventorySettings.farmId, farmId)).limit(1),
    db.select({ balance: sql5`coalesce(sum(${feedInventoryTransactions.bagDelta}), 0)` }).from(feedInventoryTransactions).where(eq14(feedInventoryTransactions.farmId, farmId))
  ]);
  const placementDate = new Date(cycle.placementDate);
  const now = /* @__PURE__ */ new Date();
  const cycleAgeDays = Math.max(1, Math.floor((now.getTime() - placementDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1);
  const totalFeedKg = records.reduce((sum, r) => sum + r.feedKg, 0);
  const totalMortality = records.reduce((sum, r) => sum + r.mortality + r.culls, 0);
  const liveBirds = Math.max(0, cycle.birdsPlaced - totalMortality);
  const latestWeightGrams = weights[0]?.averageWeightGrams ?? 0;
  const fcr = calculateFcr(totalFeedKg, liveBirds, latestWeightGrams) ?? void 0;
  const currentFeedBalanceBags = Number(feedTxSummary[0]?.balance ?? 0);
  const feedReorderPointBags = feedSetting?.reorderPointBags ?? 50;
  const bagWeightKg = Number(feedSetting?.bagWeightKg ?? 50);
  const recentRecords = records.slice(0, 3);
  const avgDailyFeedKg = recentRecords.length ? recentRecords.reduce((sum, r) => sum + r.feedKg, 0) / recentRecords.length : 0;
  const dailyConsumptionBags = bagWeightKg > 0 ? avgDailyFeedKg / bagWeightKg : 0;
  const evaluatedAlerts = scanCycleAnomalies({
    birdsPlaced: cycle.birdsPlaced,
    cycleAgeDays,
    dailyRecords: records,
    latestWeightGrams,
    fcr,
    currentFeedBalanceBags,
    feedReorderPointBags,
    dailyConsumptionBags,
    healthEvents: health
  });
  const existingActive = await db.select({ alertType: alerts.alertType, title: alerts.title }).from(alerts).where(and8(eq14(alerts.farmId, farmId), eq14(alerts.cycleId, cycleId), eq14(alerts.status, "active")));
  const existingKeys = new Set(existingActive.map((a) => `${a.alertType}:${a.title}`));
  for (const item of evaluatedAlerts) {
    const key = `${item.alertType}:${item.title}`;
    if (!existingKeys.has(key)) {
      await createAlert(farmId, item, cycleId);
    }
  }
  return evaluatedAlerts;
}

// server/db/companies.ts
init_schema();
import { count, eq as eq15, inArray as inArray8 } from "drizzle-orm";
async function bootstrapCompany(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [company] = await db.insert(companies).values({
    name: input.name,
    legalName: input.legalName || null,
    subscriptionPlan: input.subscriptionPlan ?? "starter",
    maxFarms: input.subscriptionPlan === "enterprise" ? 50 : input.subscriptionPlan === "pro" ? 10 : 3,
    maxUsersPerFarm: 10
  }).$returningId();
  await db.update(users).set({ companyId: company.id, role: "admin" }).where(eq15(users.id, userId));
  await db.update(farms).set({ companyId: company.id }).where(eq15(farms.ownerId, userId));
  return { companyId: company.id };
}
async function getCompany(userId, companyId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  let targetId = companyId;
  if (!targetId) {
    const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq15(users.id, userId)).limit(1);
    targetId = user?.companyId ?? void 0;
  }
  if (!targetId) {
    return null;
  }
  const [company] = await db.select().from(companies).where(eq15(companies.id, targetId)).limit(1);
  if (!company) return null;
  const [farmCountResult] = await db.select({ count: count() }).from(farms).where(eq15(farms.companyId, targetId));
  const [userCountResult] = await db.select({ count: count() }).from(users).where(eq15(users.companyId, targetId));
  return {
    ...company,
    stats: {
      totalFarms: Number(farmCountResult?.count ?? 0),
      totalUsers: Number(userCountResult?.count ?? 0),
      maxFarms: company.maxFarms,
      maxUsersPerFarm: company.maxUsersPerFarm
    }
  };
}
async function updateCompany(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [user] = await db.select().from(users).where(eq15(users.id, userId)).limit(1);
  if (!user || user.companyId !== input.companyId && user.role !== "admin") {
    throw new Error("\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0644\u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u0631\u0643\u0629");
  }
  const patch = {};
  if (input.name !== void 0) patch.name = input.name;
  if (input.legalName !== void 0) patch.legalName = input.legalName;
  if (input.taxId !== void 0) patch.taxId = input.taxId;
  if (input.registrationNumber !== void 0) patch.registrationNumber = input.registrationNumber;
  if (input.phone !== void 0) patch.phone = input.phone;
  if (input.email !== void 0) patch.email = input.email;
  if (input.address !== void 0) patch.address = input.address;
  if (input.governorate !== void 0) patch.governorate = input.governorate;
  await db.update(companies).set(patch).where(eq15(companies.id, input.companyId));
  return { success: true };
}
async function listCompanyFarms(userId, companyId) {
  const db = await getDb();
  if (!db) return [];
  const companyFarms = await db.select().from(farms).where(eq15(farms.companyId, companyId));
  if (!companyFarms.length) return [];
  const farmIds = companyFarms.map((f) => f.id);
  const [allHouses, allCycles] = await Promise.all([
    db.select().from(houses).where(inArray8(houses.farmId, farmIds)),
    db.select().from(cycles).where(inArray8(cycles.farmId, farmIds))
  ]);
  return companyFarms.map((farm) => {
    const farmHouses = allHouses.filter((h) => h.farmId === farm.id);
    const farmCycles = allCycles.filter((c) => c.farmId === farm.id);
    const activeCycle = farmCycles.find((c) => c.status === "active");
    return {
      ...farm,
      housesCount: farmHouses.length,
      totalCapacity: farmHouses.reduce((sum, h) => sum + h.capacity, 0),
      activeCycle: activeCycle ? {
        id: activeCycle.id,
        name: activeCycle.name,
        placementDate: activeCycle.placementDate,
        birdsPlaced: activeCycle.birdsPlaced
      } : null
    };
  });
}
async function listCompanyUsers(userId, companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    lastSignedIn: users.lastSignedIn,
    createdAt: users.createdAt
  }).from(users).where(eq15(users.companyId, companyId));
}

// server/db/reports.ts
init_schema();
import { and as and10, eq as eq16, inArray as inArray9 } from "drizzle-orm";

// shared/multiFarmMetrics.ts
function gradeFarmPerformance(epef, livability) {
  if (epef >= 340 && livability >= 95) return "\u0645\u0645\u062A\u0627\u0632";
  if (epef >= 300 && livability >= 93) return "\u062C\u064A\u062F";
  if (epef >= 260 && livability >= 90) return "\u0645\u062A\u0648\u0633\u0637";
  if (epef >= 220 || livability >= 85) return "\u062A\u0646\u0628\u064A\u0647";
  return "\u062D\u0631\u062C";
}
function computeExecutiveDashboard(input) {
  const farmSummaries = [];
  let aggregateBirdsPlaced = 0;
  let aggregateLiveBirds = 0;
  let aggregateMortality = 0;
  let aggregateFeedKg = 0;
  let aggregateSalesPiasters = 0;
  let aggregateExpensesPiasters = 0;
  let totalWeightedFcr = 0;
  let totalWeightedEpef = 0;
  let activeFarmsCount = 0;
  const now = /* @__PURE__ */ new Date();
  for (const farm of input.farms) {
    const farmCycles = input.cycles.filter((c) => c.farmId === farm.id);
    const activeCycle = farmCycles.find((c) => c.status === "active") ?? farmCycles[0];
    const farmExpenses2 = input.expenses.filter((e) => e.farmId === farm.id);
    const totalFarmExpensesPiasters = farmExpenses2.reduce((sum, e) => sum + e.amountPiasters, 0);
    if (!activeCycle) {
      farmSummaries.push({
        farmId: farm.id,
        farmName: farm.name,
        governorate: farm.governorate,
        hasActiveCycle: false,
        cycleAgeDays: 0,
        birdsPlaced: 0,
        liveBirds: 0,
        mortalityCount: 0,
        livabilityPercent: 100,
        totalFeedKg: 0,
        averageWeightGrams: 0,
        fcr: 0,
        epef: 0,
        totalExpensesEgp: totalFarmExpensesPiasters / 100,
        totalSalesEgp: 0,
        netMarginEgp: -(totalFarmExpensesPiasters / 100),
        statusGrade: "\u0645\u062A\u0648\u0633\u0637"
      });
      continue;
    }
    activeFarmsCount += 1;
    const placementDate = new Date(activeCycle.placementDate);
    const cycleAgeDays = Math.max(1, Math.floor((now.getTime() - placementDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1);
    const cycleRecords = input.dailyRecords.filter((r) => r.cycleId === activeCycle.id);
    const cycleWeights = input.weightSamples.filter((w) => w.cycleId === activeCycle.id).sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime());
    const cycleSales = input.sales.filter((s) => s.cycleId === activeCycle.id && !s.isDeleted);
    const totalFeedKg = cycleRecords.reduce((sum, r) => sum + r.feedKg, 0);
    const mortalityCount = cycleRecords.reduce((sum, r) => sum + r.mortality + r.culls, 0);
    const liveBirds = Math.max(0, activeCycle.birdsPlaced - mortalityCount);
    const livabilityRatio = calculateLivability(activeCycle.birdsPlaced, mortalityCount);
    const livabilityPercent = Number((livabilityRatio * 100).toFixed(2));
    const latestWeightGrams = cycleWeights[0]?.averageWeightGrams ?? 0;
    const fcr = calculateFcr(totalFeedKg, liveBirds, latestWeightGrams) ?? 0;
    const epef = calculateEpef({ birdsPlaced: activeCycle.birdsPlaced, mortality: mortalityCount, averageWeightGrams: latestWeightGrams, fcr, ageDays: cycleAgeDays }) ?? 0;
    const totalSalesPiasters = cycleSales.reduce((sum, s) => sum + s.totalPiasters, 0);
    const totalSalesEgp = totalSalesPiasters / 100;
    const totalExpensesEgp = totalFarmExpensesPiasters / 100;
    const netMarginEgp = totalSalesEgp - totalExpensesEgp;
    const statusGrade = gradeFarmPerformance(epef, livabilityPercent);
    farmSummaries.push({
      farmId: farm.id,
      farmName: farm.name,
      governorate: farm.governorate,
      hasActiveCycle: true,
      cycleId: activeCycle.id,
      cycleName: activeCycle.name,
      cycleAgeDays,
      birdsPlaced: activeCycle.birdsPlaced,
      liveBirds,
      mortalityCount,
      livabilityPercent,
      totalFeedKg,
      averageWeightGrams: latestWeightGrams,
      fcr,
      epef,
      totalExpensesEgp,
      totalSalesEgp,
      netMarginEgp,
      statusGrade
    });
    aggregateBirdsPlaced += activeCycle.birdsPlaced;
    aggregateLiveBirds += liveBirds;
    aggregateMortality += mortalityCount;
    aggregateFeedKg += totalFeedKg;
    aggregateSalesPiasters += totalSalesPiasters;
    aggregateExpensesPiasters += totalFarmExpensesPiasters;
    if (epef > 0) {
      totalWeightedEpef += epef * liveBirds;
    }
    if (fcr > 0) {
      totalWeightedFcr += fcr * liveBirds;
    }
  }
  farmSummaries.sort((a, b) => b.epef - a.epef);
  const averageLivability = aggregateBirdsPlaced > 0 ? (aggregateBirdsPlaced - aggregateMortality) / aggregateBirdsPlaced * 100 : 100;
  const weightedAverageFcr = aggregateLiveBirds > 0 ? totalWeightedFcr / aggregateLiveBirds : 0;
  const weightedAverageEpef = aggregateLiveBirds > 0 ? totalWeightedEpef / aggregateLiveBirds : 0;
  return {
    companyStats: {
      totalFarms: input.farms.length,
      activeFarmsCount,
      totalBirdsPlaced: aggregateBirdsPlaced,
      totalLiveBirds: aggregateLiveBirds,
      totalMortality: aggregateMortality,
      averageLivability: Number(averageLivability.toFixed(2)),
      totalFeedConsumedKg: aggregateFeedKg,
      weightedAverageFcr: Number(weightedAverageFcr.toFixed(2)),
      weightedAverageEpef: Number(weightedAverageEpef.toFixed(1)),
      totalSalesRevenueEgp: aggregateSalesPiasters / 100,
      totalExpensesEgp: aggregateExpensesPiasters / 100,
      estimatedNetProfitEgp: (aggregateSalesPiasters - aggregateExpensesPiasters) / 100
    },
    farmRankings: farmSummaries
  };
}

// shared/reportGenerator.ts
function generateCycleAuditReport(input) {
  const placement = new Date(input.cycle.placementDate);
  const now = /* @__PURE__ */ new Date();
  const ageDays = Math.max(1, Math.floor((now.getTime() - placement.getTime()) / (1e3 * 60 * 60 * 24)) + 1);
  const sortedRecords = [...input.dailyRecords].sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime());
  const sortedWeights = [...input.weightSamples].sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime());
  const totalFeedKg = sortedRecords.reduce((sum, r) => sum + r.feedKg, 0);
  const totalWaterLiters = sortedRecords.reduce((sum, r) => sum + r.waterLiters, 0);
  const totalLosses = sortedRecords.reduce((sum, r) => sum + r.mortality + r.culls, 0);
  const liveBirds = Math.max(0, input.cycle.birdsPlaced - totalLosses);
  const livabilityRatio = calculateLivability(input.cycle.birdsPlaced, totalLosses);
  const livabilityPercent = Number((livabilityRatio * 100).toFixed(2));
  const latestWeightGrams = sortedWeights[0]?.averageWeightGrams ?? 0;
  const fcr = calculateFcr(totalFeedKg, liveBirds, latestWeightGrams) ?? 0;
  const epef = calculateEpef({ birdsPlaced: input.cycle.birdsPlaced, mortality: totalLosses, averageWeightGrams: latestWeightGrams, fcr, ageDays }) ?? 0;
  const adgGrams = calculateAdg(latestWeightGrams, ageDays);
  const feedPerBirdKg = calculateFeedPerBird(totalFeedKg, liveBirds);
  const waterToFeedRatio = totalFeedKg > 0 ? Number((totalWaterLiters / totalFeedKg).toFixed(2)) : 0;
  let feedExpensesPiasters = 0;
  let chickExpensesPiasters = 0;
  let vetExpensesPiasters = 0;
  let otherExpensesPiasters = 0;
  for (const exp of input.expenses) {
    if (exp.category === "feed") feedExpensesPiasters += exp.amountPiasters;
    else if (exp.category === "chicks") chickExpensesPiasters += exp.amountPiasters;
    else if (exp.category === "veterinary" || exp.category === "disinfection") vetExpensesPiasters += exp.amountPiasters;
    else otherExpensesPiasters += exp.amountPiasters;
  }
  const totalExpensesPiasters = feedExpensesPiasters + chickExpensesPiasters + vetExpensesPiasters + otherExpensesPiasters;
  const totalSalesPiasters = input.sales.filter((s) => !s.isDeleted).reduce((sum, s) => sum + s.totalPiasters, 0);
  const totalProducedKg = liveBirds * latestWeightGrams / 1e3;
  const totalSalesEgp = totalSalesPiasters / 100;
  const totalExpensesEgp = totalExpensesPiasters / 100;
  const netProfitEgp = totalSalesEgp - totalExpensesEgp;
  const costPerBirdEgp = calculateCostPerBird(totalExpensesPiasters, liveBirds);
  const costPerKgEgp = calculateCostPerKg(totalExpensesPiasters, totalProducedKg);
  const roiPercent = calculateRoi(totalSalesPiasters, totalExpensesPiasters);
  let runningLoss = 0;
  const dailyLog = sortedRecords.map((r, index2) => {
    const rDate = new Date(r.recordDate);
    const dayNum = Math.max(1, Math.floor((rDate.getTime() - placement.getTime()) / (1e3 * 60 * 60 * 24)) + 1);
    const dayLoss = r.mortality + r.culls;
    runningLoss += dayLoss;
    const matchedWeight = input.weightSamples.find((w) => new Date(w.sampleDate).toISOString().slice(0, 10) === rDate.toISOString().slice(0, 10));
    return {
      dayNumber: dayNum,
      date: rDate.toISOString().slice(0, 10),
      feedKg: r.feedKg,
      waterLiters: r.waterLiters,
      mortality: r.mortality,
      culls: r.culls,
      cumulativeLosses: runningLoss,
      cumulativeLossPercent: Number((runningLoss / input.cycle.birdsPlaced * 100).toFixed(2)),
      averageWeightGrams: matchedWeight?.averageWeightGrams
    };
  });
  return {
    header: {
      companyName: input.companyName,
      farmName: input.farm.name,
      farmGovernorate: input.farm.governorate,
      cycleName: input.cycle.name,
      placementDate: placement.toISOString().slice(0, 10),
      ageDays,
      birdsPlaced: input.cycle.birdsPlaced,
      status: input.cycle.status,
      generatedAt: now.toISOString()
    },
    kpiSummary: {
      liveBirds,
      totalLosses,
      livabilityPercent,
      totalFeedKg,
      feedPerBirdKg,
      averageWeightGrams: latestWeightGrams,
      fcr,
      epef,
      adgGrams,
      totalWaterLiters,
      waterToFeedRatio
    },
    financialSummary: {
      totalSalesEgp,
      totalExpensesEgp,
      feedExpensesEgp: feedExpensesPiasters / 100,
      chickExpensesEgp: chickExpensesPiasters / 100,
      vetExpensesEgp: vetExpensesPiasters / 100,
      otherExpensesEgp: otherExpensesPiasters / 100,
      netProfitEgp,
      costPerBirdEgp,
      costPerKgEgp,
      roiPercent
    },
    dailyLog
  };
}
function formatCycleAuditCsv(data) {
  const lines = [];
  lines.push(`\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0641\u0646\u064A \u0648\u0627\u0644\u0645\u0627\u0644\u064A \u0644\u0644\u062F\u0648\u0631\u0629 - BroilFarm Enterprise ERP`);
  lines.push(`\u0627\u0644\u0645\u0632\u0631\u0639\u0629,${data.header.farmName},\u0627\u0644\u062F\u0648\u0631\u0629,${data.header.cycleName}`);
  lines.push(`\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062A\u0633\u0643\u064A\u0646,${data.header.placementDate},\u0627\u0644\u0639\u062F\u062F \u0627\u0644\u0645\u0633\u0643\u0646,${data.header.birdsPlaced}`);
  lines.push(`\u0627\u0644\u0639\u0645\u0631 \u0627\u0644\u062D\u0627\u0644\u064A,${data.header.ageDays} \u064A\u0648\u0645,\u0627\u0644\u062D\u0627\u0644\u0629,${data.header.status}`);
  lines.push(``);
  lines.push(`--- \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0641\u0646\u064A\u0629 \u0648\u0627\u0644\u0625\u0646\u062A\u0627\u062C\u064A\u0629 ---`);
  lines.push(`\u0627\u0644\u0637\u064A\u0648\u0631 \u0627\u0644\u062D\u064A\u0629,${data.kpiSummary.liveBirds},\u0646\u0633\u0628\u0629 \u0627\u0644\u062D\u064A\u0648\u064A\u0629,${data.kpiSummary.livabilityPercent}%`);
  lines.push(`\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0639\u0644\u0641 (\u0643\u062C\u0645),${data.kpiSummary.totalFeedKg},\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u0648\u0632\u0646 (\u062C\u0645),${data.kpiSummary.averageWeightGrams}`);
  lines.push(`\u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 (FCR),${data.kpiSummary.fcr},\u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u0643\u0641\u0627\u0621\u0629 \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064A (EPEF),${data.kpiSummary.epef}`);
  lines.push(`\u0645\u0639\u062F\u0644 \u0627\u0644\u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 (\u062C\u0645),${data.kpiSummary.adgGrams},\u0646\u0633\u0628\u0629 \u0627\u0644\u0645\u0627\u0621 \u0644\u0644\u0639\u0644\u0641,${data.kpiSummary.waterToFeedRatio}`);
  lines.push(``);
  lines.push(`--- \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 ---`);
  lines.push(`\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A (\u062C.\u0645),${data.financialSummary.totalSalesEgp},\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A (\u062C.\u0645),${data.financialSummary.totalExpensesEgp}`);
  lines.push(`\u0635\u0627\u0641\u064A \u0627\u0644\u0623\u0631\u0628\u0627\u062D (\u062C.\u0645),${data.financialSummary.netProfitEgp},\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0643\u064A\u0644\u0648 (\u062C.\u0645),${data.financialSummary.costPerKgEgp}`);
  lines.push(`\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0637\u0627\u0626\u0631 (\u062C.\u0645),${data.financialSummary.costPerBirdEgp},\u0627\u0644\u0639\u0627\u0626\u062F \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631 ROI,${data.financialSummary.roiPercent}%`);
  lines.push(``);
  lines.push(`--- \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u064A\u0648\u0645\u064A \u0644\u0644\u062A\u0634\u063A\u064A\u0644 ---`);
  lines.push(`\u0627\u0644\u0639\u0645\u0631 (\u064A\u0648\u0645),\u0627\u0644\u062A\u0627\u0631\u064A\u062E,\u0627\u0644\u0639\u0644\u0641 (\u0643\u062C\u0645),\u0627\u0644\u0645\u064A\u0627\u0647 (\u0644\u062A\u0631),\u0627\u0644\u0646\u0627\u0641\u0642,\u0627\u0644\u0641\u0631\u0632,\u062A\u0631\u0627\u0643\u0645\u064A \u0627\u0644\u0641\u0627\u0642\u062F,\u0646\u0633\u0628\u0629 \u0627\u0644\u0641\u0627\u0642\u062F %,\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u0648\u0632\u0646 (\u062C\u0645)`);
  for (const row of data.dailyLog) {
    lines.push(`${row.dayNumber},${row.date},${row.feedKg},${row.waterLiters},${row.mortality},${row.culls},${row.cumulativeLosses},${row.cumulativeLossPercent}%,${row.averageWeightGrams ?? "-"}`);
  }
  return lines.join("\n");
}

// server/db/reports.ts
async function getCycleAuditReport(userId, cycleId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [cycle] = await db.select().from(cycles).where(eq16(cycles.id, cycleId)).limit(1);
  if (!cycle) throw new Error("\u0627\u0644\u062F\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
  const [farm] = await db.select().from(farms).where(eq16(farms.id, cycle.farmId)).limit(1);
  if (!farm) throw new Error("\u0627\u0644\u0645\u0632\u0631\u0639\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
  await requireFarmCapability(userId, farm.id, "manage_farms");
  const [company] = farm.companyId ? await db.select().from(companies).where(eq16(companies.id, farm.companyId)).limit(1) : [null];
  const [daily, weights, expenses, cycleSales] = await Promise.all([
    db.select().from(dailyRecords).where(eq16(dailyRecords.cycleId, cycleId)).orderBy(dailyRecords.recordDate),
    db.select().from(weightSamples).where(eq16(weightSamples.cycleId, cycleId)),
    db.select().from(farmExpenses).where(eq16(farmExpenses.cycleId, cycleId)),
    db.select().from(sales).where(and10(eq16(sales.cycleId, cycleId), eq16(sales.isDeleted, false)))
  ]);
  return generateCycleAuditReport({
    companyName: company?.name,
    farm: { name: farm.name, governorate: farm.governorate },
    cycle: { name: cycle.name, placementDate: cycle.placementDate, birdsPlaced: cycle.birdsPlaced, status: cycle.status },
    dailyRecords: daily,
    weightSamples: weights,
    expenses,
    sales: cycleSales
  });
}
async function getCycleAuditReportCsv(userId, cycleId) {
  const reportData = await getCycleAuditReport(userId, cycleId);
  const csvContent = formatCycleAuditCsv(reportData);
  return `\uFEFF${csvContent}`;
}
async function getCompanyExecutiveDashboard(userId, companyId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq16(users.id, userId)).limit(1);
    targetCompanyId = user?.companyId ?? void 0;
  }
  let accessibleFarms = [];
  if (targetCompanyId) {
    accessibleFarms = await db.select().from(farms).where(eq16(farms.companyId, targetCompanyId));
  }
  if (!accessibleFarms.length) {
    const [owned, memberships] = await Promise.all([
      db.select().from(farms).where(eq16(farms.ownerId, userId)),
      db.select().from(farmMemberships).where(and10(eq16(farmMemberships.userId, userId), eq16(farmMemberships.isActive, true)))
    ]);
    const memberFarmIds = memberships.map((m) => m.farmId);
    const sharedFarms = memberFarmIds.length ? await db.select().from(farms).where(inArray9(farms.id, memberFarmIds)) : [];
    accessibleFarms = [...owned, ...sharedFarms.filter((sf) => !owned.some((o) => o.id === sf.id))];
  }
  if (!accessibleFarms.length) {
    return {
      companyStats: {
        totalFarms: 0,
        activeFarmsCount: 0,
        totalBirdsPlaced: 0,
        totalLiveBirds: 0,
        totalMortality: 0,
        averageLivability: 100,
        totalFeedConsumedKg: 0,
        weightedAverageFcr: 0,
        weightedAverageEpef: 0,
        totalSalesRevenueEgp: 0,
        totalExpensesEgp: 0,
        estimatedNetProfitEgp: 0
      },
      farmRankings: []
    };
  }
  const farmIds = accessibleFarms.map((f) => f.id);
  const [allCycles, allExpenses] = await Promise.all([
    db.select().from(cycles).where(inArray9(cycles.farmId, farmIds)),
    db.select().from(farmExpenses).where(inArray9(farmExpenses.farmId, farmIds))
  ]);
  const cycleIds = allCycles.map((c) => c.id);
  const [allDaily, allWeights, allSales] = await Promise.all([
    cycleIds.length ? db.select().from(dailyRecords).where(inArray9(dailyRecords.cycleId, cycleIds)) : [],
    cycleIds.length ? db.select().from(weightSamples).where(inArray9(weightSamples.cycleId, cycleIds)) : [],
    cycleIds.length ? db.select().from(sales).where(and10(inArray9(sales.cycleId, cycleIds), eq16(sales.isDeleted, false))) : []
  ]);
  return computeExecutiveDashboard({
    farms: accessibleFarms,
    cycles: allCycles,
    dailyRecords: allDaily,
    weightSamples: allWeights,
    expenses: allExpenses,
    sales: allSales
  });
}

// server/db/audit.ts
init_schema();
import { and as and11, desc as desc5, eq as eq17 } from "drizzle-orm";
async function listAuditLogs(userId, filter) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filter?.farmId) {
    await requireFarmCapability(userId, filter.farmId, "view_audit_logs");
    conditions.push(eq17(auditLogs.farmId, filter.farmId));
  }
  if (filter?.cycleId) {
    conditions.push(eq17(auditLogs.cycleId, filter.cycleId));
  }
  if (filter?.entityType) {
    conditions.push(eq17(auditLogs.entityType, filter.entityType));
  }
  if (filter?.action) {
    conditions.push(eq17(auditLogs.action, filter.action));
  }
  return db.select({
    id: auditLogs.id,
    farmId: auditLogs.farmId,
    cycleId: auditLogs.cycleId,
    userId: auditLogs.userId,
    userName: users.name,
    userEmail: users.email,
    entityType: auditLogs.entityType,
    entityId: auditLogs.entityId,
    action: auditLogs.action,
    oldValues: auditLogs.oldValues,
    newValues: auditLogs.newValues,
    details: auditLogs.details,
    createdAt: auditLogs.createdAt
  }).from(auditLogs).leftJoin(users, eq17(auditLogs.userId, users.id)).where(conditions.length ? and11(...conditions) : void 0).orderBy(desc5(auditLogs.createdAt)).limit(filter?.limit ?? 100);
}

// server/db/medicineInventory.ts
init_schema();
import { desc as desc6, eq as eq18 } from "drizzle-orm";
async function listMedicineInventory(userId, farmId) {
  const db = await getDb();
  if (!db) return [];
  await requireFarmCapability(userId, farmId, "manage_health");
  return db.select().from(medicineInventory).where(eq18(medicineInventory.farmId, farmId)).orderBy(desc6(medicineInventory.createdAt));
}
async function addMedicineItem(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "manage_health");
  const [item] = await db.insert(medicineInventory).values({
    farmId: input.farmId,
    productName: input.productName,
    category: input.category ?? "other",
    batchNumber: input.batchNumber || null,
    expiryDate: input.expiryDate ?? null,
    quantity: input.quantity.toFixed(2),
    unit: input.unit ?? "\u0639\u0628\u0648\u0629",
    unitCostPiasters: input.unitCostEgp ? Math.round(input.unitCostEgp * 100) : 0,
    reorderPoint: input.reorderPoint ? input.reorderPoint.toFixed(2) : "5.00",
    notes: input.notes || null,
    createdByUserId: userId
  }).$returningId();
  return item;
}
async function updateMedicineQuantity(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [item] = await db.select().from(medicineInventory).where(eq18(medicineInventory.id, input.itemId)).limit(1);
  if (!item) throw new Error("\u0627\u0644\u0635\u0646\u0641 \u0627\u0644\u062F\u0648\u0627\u0626\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  await requireFarmCapability(userId, item.farmId, "manage_health");
  const currentQty = Number(item.quantity);
  const nextQty = Math.max(0, currentQty + input.quantityDelta);
  await db.update(medicineInventory).set({
    quantity: nextQty.toFixed(2)
  }).where(eq18(medicineInventory.id, input.itemId));
  return { previousQuantity: currentQty, newQuantity: nextQty };
}
async function deleteMedicineItem(userId, itemId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [item] = await db.select().from(medicineInventory).where(eq18(medicineInventory.id, itemId)).limit(1);
  if (!item) throw new Error("\u0627\u0644\u0635\u0646\u0641 \u0627\u0644\u062F\u0648\u0627\u0626\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
  await requireFarmCapability(userId, item.farmId, "manage_health");
  await db.delete(medicineInventory).where(eq18(medicineInventory.id, itemId));
  return { success: true };
}

// server/db/sensors.ts
init_schema();
import { and as and12, desc as desc7, eq as eq19, gte } from "drizzle-orm";

// shared/iotSensors.ts
function getTargetTemperatureRange(ageDays) {
  if (ageDays <= 3) return { min: 31, max: 33, target: 32 };
  if (ageDays <= 7) return { min: 29, max: 31, target: 30 };
  if (ageDays <= 14) return { min: 26.5, max: 28.5, target: 27.5 };
  if (ageDays <= 21) return { min: 24, max: 26, target: 25 };
  if (ageDays <= 28) return { min: 22, max: 24, target: 23 };
  if (ageDays <= 35) return { min: 20, max: 22, target: 21 };
  return { min: 19, max: 21, target: 20 };
}
function evaluateSensorReading(sensorType, value, ageDays = 21) {
  switch (sensorType) {
    case "temperature": {
      const range = getTargetTemperatureRange(ageDays);
      if (value > range.max + 4) {
        return {
          status: "critical",
          message: `\u0625\u062C\u0647\u0627\u062F \u062D\u0631\u0627\u0631\u064A \u0634\u062F\u064A\u062F: \u062F\u0631\u062C\u0629 \u0627\u0644\u062D\u0631\u0627\u0631\u0629 ${value}\xB0C \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0644\u0639\u0645\u0631 (${range.max}\xB0C)`,
          expectedMin: range.min,
          expectedMax: range.max
        };
      }
      if (value < range.min - 3) {
        return {
          status: "critical",
          message: `\u0628\u0631\u0648\u062F\u0629 \u0634\u062F\u064A\u062F\u0629: \u062F\u0631\u062C\u0629 \u0627\u0644\u062D\u0631\u0627\u0631\u0629 ${value}\xB0C \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0639\u0645\u0631 (${range.min}\xB0C)`,
          expectedMin: range.min,
          expectedMax: range.max
        };
      }
      if (value > range.max + 1.5 || value < range.min - 1.5) {
        return {
          status: "warning",
          message: `\u062F\u0631\u062C\u0629 \u0627\u0644\u062D\u0631\u0627\u0631\u0629 (${value}\xB0C) \u062E\u0627\u0631\u062C \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062B\u0627\u0644\u064A (${range.min}-${range.max}\xB0C)`,
          expectedMin: range.min,
          expectedMax: range.max
        };
      }
      return { status: "optimal", message: `\u062F\u0631\u062C\u0629 \u0627\u0644\u062D\u0631\u0627\u0631\u0629 \u0641\u064A \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062B\u0627\u0644\u064A (${value}\xB0C)`, expectedMin: range.min, expectedMax: range.max };
    }
    case "humidity": {
      if (value < 40) {
        return { status: "warning", message: `\u0631\u0637\u0648\u0628\u0629 \u0645\u0646\u062E\u0641\u0636\u0629 (${value}%) \u0642\u062F \u062A\u0633\u0628\u0628 \u062C\u0641\u0627\u0641 \u0627\u0644\u063A\u0634\u0627\u0621 \u0627\u0644\u0645\u062E\u0627\u0637\u064A \u0648\u063A\u0628\u0627\u0631 \u0628\u0627\u0644\u0639\u0646\u0628\u0631`, expectedMin: 50, expectedMax: 70 };
      }
      if (value > 75) {
        return { status: "warning", message: `\u0631\u0637\u0648\u0628\u0629 \u0645\u0631\u062A\u0641\u0639\u0629 (${value}%) \u062A\u0632\u064A\u062F \u0645\u0646 \u0631\u0637\u0648\u0628\u0629 \u0627\u0644\u0641\u0631\u0634\u0629 \u0648\u062A\u0643\u0627\u062B\u0631 \u0627\u0644\u0643\u0648\u0643\u0633\u064A\u062F\u064A\u0627 \u0648\u0627\u0644\u063A\u0627\u0632\u0627\u062A`, expectedMin: 50, expectedMax: 70 };
      }
      return { status: "optimal", message: `\u0627\u0644\u0631\u0637\u0648\u0628\u0629 \u0627\u0644\u0646\u0633\u0628\u064A\u0629 \u0645\u062B\u0627\u0644\u064A\u0629 (${value}%)`, expectedMin: 50, expectedMax: 70 };
    }
    case "ammonia_nh3": {
      if (value >= 25) {
        return {
          status: "critical",
          message: `\u063A\u0627\u0632 \u0627\u0644\u0623\u0645\u0648\u0646\u064A\u0627 \u062D\u0631\u062C (${value} ppm) \u064A\u0633\u0628\u0628 \u062A\u0644\u0641 \u0623\u0647\u062F\u0627\u0628 \u0627\u0644\u062C\u0647\u0627\u0632 \u0627\u0644\u062A\u0646\u0641\u0633\u064A \u0648\u0627\u0644\u0639\u0645\u0649 \u0644\u0644\u0642\u0637\u064A\u0639! \u064A\u062C\u0628 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062A\u0647\u0648\u064A\u0629 \u0641\u0648\u0631\u0627\u064B`,
          expectedMin: 0,
          expectedMax: 20
        };
      }
      if (value >= 18) {
        return {
          status: "warning",
          message: `\u063A\u0627\u0632 \u0627\u0644\u0623\u0645\u0648\u0646\u064A\u0627 \u0645\u0631\u062A\u0641\u0639 (${value} ppm)\u060C \u064A\u064F\u0631\u062C\u0649 \u0632\u064A\u0627\u062F\u0629 \u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u0647\u0648\u064A\u0629 \u0627\u0644\u062F\u0646\u064A\u0627 \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u0631\u0637\u0648\u0628\u0629 \u0627\u0644\u0641\u0631\u0634\u0629`,
          expectedMin: 0,
          expectedMax: 20
        };
      }
      return { status: "optimal", message: `\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0623\u0645\u0648\u0646\u064A\u0627 \u0622\u0645\u0646 (${value} ppm)`, expectedMin: 0, expectedMax: 20 };
    }
    case "co2": {
      if (value >= 3500) {
        return {
          status: "critical",
          message: `\u062A\u0631\u0643\u064A\u0632 \u062B\u0627\u0646\u064A \u0623\u0643\u0633\u064A\u062F \u0627\u0644\u0643\u0631\u0628\u0648\u0646 \u062D\u0631\u062C (${value} ppm) \u0642\u062F \u064A\u0633\u0628\u0628 \u0627\u0644\u0627\u0633\u062A\u0633\u0642\u0627\u0621 (Ascites) \u0648\u0627\u0644\u0627\u062E\u062A\u0646\u0627\u0642!`,
          expectedMin: 400,
          expectedMax: 2500
        };
      }
      if (value >= 2500) {
        return {
          status: "warning",
          message: `\u062A\u0631\u0643\u064A\u0632 \u062B\u0627\u0646\u064A \u0623\u0643\u0633\u064A\u062F \u0627\u0644\u0643\u0631\u0628\u0648\u0646 \u0645\u0631\u062A\u0641\u0639 (${value} ppm)\u060C \u064A\u062A\u0637\u0644\u0628 \u0632\u064A\u0627\u062F\u0629 \u0633\u0631\u0639\u0629 \u0627\u0644\u0634\u0641\u0627\u0637\u0627\u062A`,
          expectedMin: 400,
          expectedMax: 2500
        };
      }
      return { status: "optimal", message: `\u0645\u0633\u062A\u0648\u0649 \u062B\u0627\u0646\u064A \u0623\u0643\u0633\u064A\u062F \u0627\u0644\u0643\u0631\u0628\u0648\u0646 \u0645\u062B\u0627\u0644\u064A (${value} ppm)`, expectedMin: 400, expectedMax: 2500 };
    }
    case "static_pressure": {
      if (value > 45 || value < 10) {
        return { status: "warning", message: `\u0627\u0644\u0636\u063A\u0637 \u0627\u0644\u0627\u0633\u062A\u0627\u062A\u064A\u0643\u064A (${value} Pa) \u062E\u0627\u0631\u062C \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0644\u0644\u062A\u0647\u0648\u064A\u0629 \u0627\u0644\u0633\u0644\u064A\u0645\u0629`, expectedMin: 15, expectedMax: 35 };
      }
      return { status: "optimal", message: `\u0627\u0644\u0636\u063A\u0637 \u0627\u0644\u0627\u0633\u062A\u0627\u062A\u064A\u0643\u064A \u0633\u0644\u064A\u0645 (${value} Pa)`, expectedMin: 15, expectedMax: 35 };
    }
    default:
      return { status: "optimal", message: `\u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0645\u0633\u062A\u0642\u0631\u0629 (${value})` };
  }
}

// server/db/sensors.ts
async function ingestSensorReadings(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await requireFarmCapability(userId, input.farmId, "record_operations", {
    houseId: input.houseId,
    cycleId: null
  });
  const now = /* @__PURE__ */ new Date();
  const inserted = await Promise.all(
    input.readings.map(
      (r) => db.insert(sensorReadings).values({
        farmId: input.farmId,
        houseId: input.houseId,
        sensorType: r.sensorType,
        value: r.value.toFixed(2),
        unit: r.unit,
        deviceId: r.deviceId || null,
        readingTime: r.readingTime || now
      }).$returningId()
    )
  );
  const evaluations = input.readings.map((r) => ({
    sensorType: r.sensorType,
    value: r.value,
    assessment: evaluateSensorReading(r.sensorType, r.value)
  }));
  return { insertedCount: inserted.length, evaluations };
}
async function getLatestHouseReadings(userId, farmId, houseId) {
  const db = await getDb();
  if (!db) return [];
  await requireFarmCapability(userId, farmId, "view_reports", {
    houseId,
    cycleId: null
  });
  const recent = await db.select().from(sensorReadings).where(and12(eq19(sensorReadings.farmId, farmId), eq19(sensorReadings.houseId, houseId))).orderBy(desc7(sensorReadings.readingTime)).limit(50);
  const latestMap = /* @__PURE__ */ new Map();
  recent.forEach((item) => {
    if (!latestMap.has(item.sensorType)) {
      latestMap.set(item.sensorType, item);
    }
  });
  return Array.from(latestMap.values()).map((reading) => ({
    ...reading,
    numericValue: Number(reading.value),
    assessment: evaluateSensorReading(reading.sensorType, Number(reading.value))
  }));
}
async function getHouseTelemetryHistory(userId, input) {
  const db = await getDb();
  if (!db) return [];
  await requireFarmCapability(userId, input.farmId, "view_reports", {
    houseId: input.houseId,
    cycleId: null
  });
  const sinceTime = new Date(Date.now() - (input.hours ?? 24) * 60 * 60 * 1e3);
  const conditions = [
    eq19(sensorReadings.farmId, input.farmId),
    eq19(sensorReadings.houseId, input.houseId),
    gte(sensorReadings.readingTime, sinceTime)
  ];
  if (input.sensorType) {
    conditions.push(eq19(sensorReadings.sensorType, input.sensorType));
  }
  return db.select().from(sensorReadings).where(and12(...conditions)).orderBy(desc7(sensorReadings.readingTime)).limit(500);
}

// server/db/backup.ts
init_schema();
import { inArray as inArray11 } from "drizzle-orm";

// shared/backupEngine.ts
function computeBackupChecksum(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `BF_${Math.abs(hash).toString(16).toUpperCase()}_${str.length}`;
}
function createBackupPayload(input) {
  const data = {
    farms: input.farms,
    houses: input.houses,
    cycles: input.cycles,
    dailyRecords: input.dailyRecords,
    weightSamples: input.weightSamples,
    healthEvents: input.healthEvents,
    expenses: input.expenses,
    sales: input.sales,
    saleWeighBatches: input.saleWeighBatches,
    feedTransactions: input.feedTransactions
  };
  const checksum = computeBackupChecksum(data);
  return {
    version: "1.0",
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    checksum,
    metadata: {
      companyName: input.companyName || "\u0645\u0624\u0633\u0633\u0629 \u062F\u0648\u0627\u062C\u0646 \u062A\u0633\u0645\u064A\u0646",
      totalFarms: input.farms.length,
      totalCycles: input.cycles.length,
      totalDailyRecords: input.dailyRecords.length,
      totalSales: input.sales.length,
      totalExpenses: input.expenses.length
    },
    data
  };
}

// server/db/backup.ts
async function exportCompanyBackup(userId, farmId) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  let farmIds = [];
  if (farmId) {
    await requireFarmCapability(userId, farmId, "view_reports");
    farmIds = [farmId];
  } else {
    const allFarms = await db.select().from(farms);
    for (const f of allFarms) {
      try {
        const access = await resolveFarmAccess(userId, f.id);
        if (access && (access.role === "owner" || access.role === "general_manager" || access.role === "farm_manager")) {
          farmIds.push(f.id);
        }
      } catch {
      }
    }
  }
  if (!farmIds.length) {
    return createBackupPayload({
      farms: [],
      houses: [],
      cycles: [],
      dailyRecords: [],
      weightSamples: [],
      healthEvents: [],
      expenses: [],
      sales: [],
      saleWeighBatches: [],
      feedTransactions: []
    });
  }
  const [
    fetchedFarms,
    fetchedHouses,
    fetchedCycles,
    fetchedExpenses,
    fetchedSales,
    fetchedFeedTx
  ] = await Promise.all([
    db.select().from(farms).where(inArray11(farms.id, farmIds)),
    db.select().from(houses).where(inArray11(houses.farmId, farmIds)),
    db.select().from(cycles).where(inArray11(cycles.farmId, farmIds)),
    db.select().from(farmExpenses).where(inArray11(farmExpenses.farmId, farmIds)),
    db.select().from(sales).where(inArray11(sales.farmId, farmIds)),
    db.select().from(feedInventoryTransactions).where(inArray11(feedInventoryTransactions.farmId, farmIds))
  ]);
  const cycleIds = fetchedCycles.map((c) => c.id);
  const saleIds = fetchedSales.map((s) => s.id);
  const [
    fetchedRecords,
    fetchedWeights,
    fetchedHealth,
    fetchedBatches
  ] = await Promise.all([
    cycleIds.length ? db.select().from(dailyRecords).where(inArray11(dailyRecords.cycleId, cycleIds)) : [],
    cycleIds.length ? db.select().from(weightSamples).where(inArray11(weightSamples.cycleId, cycleIds)) : [],
    cycleIds.length ? db.select().from(healthEvents).where(inArray11(healthEvents.cycleId, cycleIds)) : [],
    saleIds.length ? db.select().from(saleWeighBatches).where(inArray11(saleWeighBatches.saleId, saleIds)) : []
  ]);
  return createBackupPayload({
    farms: fetchedFarms,
    houses: fetchedHouses,
    cycles: fetchedCycles,
    dailyRecords: fetchedRecords,
    weightSamples: fetchedWeights,
    healthEvents: fetchedHealth,
    expenses: fetchedExpenses,
    sales: fetchedSales,
    saleWeighBatches: fetchedBatches,
    feedTransactions: fetchedFeedTx
  });
}

// server/db/localAuth.ts
init_schema();
import { randomBytes as randomBytes3 } from "crypto";
import { eq as eq21 } from "drizzle-orm";

// server/_core/password.ts
import { randomBytes as randomBytes2, scryptSync, timingSafeEqual } from "crypto";
function hashPassword(password) {
  if (!password || password.length < 6) {
    throw new Error("\u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u0643\u0648\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0646 6 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
  }
  const salt = randomBytes2(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}
function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  try {
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user && !sessionUserId.startsWith("local_") && ENV.oAuthServerUrl) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? void 0,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    phone: null,
    companyId: null,
    passwordHash: null,
    isEmailVerified: true,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/db/localAuth.ts
async function registerLocalUser(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.name.trim();
  const [existingUser] = await db.select().from(users).where(eq21(users.email, cleanEmail)).limit(1);
  if (existingUser) {
    throw new Error("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u0641\u0639\u0644\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644");
  }
  let companyId = null;
  if (input.companyName && input.companyName.trim()) {
    const [createdCompany] = await db.insert(companies).values({
      name: input.companyName.trim(),
      subscriptionPlan: "starter"
    }).$returningId();
    companyId = createdCompany.id;
  }
  const passwordHash = hashPassword(input.password);
  const openId = `local_${randomBytes3(12).toString("hex")}`;
  const now = /* @__PURE__ */ new Date();
  const [createdUser] = await db.insert(users).values({
    openId,
    name: cleanName,
    email: cleanEmail,
    phone: input.phone?.trim() || null,
    passwordHash,
    companyId,
    loginMethod: "email",
    role: "user",
    isEmailVerified: true,
    lastSignedIn: now
  }).$returningId();
  const [userRecord] = await db.select().from(users).where(eq21(users.id, createdUser.id)).limit(1);
  const sessionToken = await sdk.createSessionToken(openId, {
    name: cleanName
  });
  return { user: userRecord, sessionToken };
}
async function loginLocalUser(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const cleanEmail = input.email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq21(users.email, cleanEmail)).limit(1);
  if (!user || !user.passwordHash) {
    throw new Error("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629");
  }
  const isMatch = verifyPassword(input.password, user.passwordHash);
  if (!isMatch) {
    throw new Error("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629");
  }
  const now = /* @__PURE__ */ new Date();
  await db.update(users).set({ lastSignedIn: now }).where(eq21(users.id, user.id));
  const sessionToken = await sdk.createSessionToken(user.openId, {
    name: user.name || "User"
  });
  return { user: { ...user, lastSignedIn: now }, sessionToken };
}
async function changeLocalUserPassword(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [user] = await db.select().from(users).where(eq21(users.id, userId)).limit(1);
  if (!user || !user.passwordHash) {
    throw new Error("\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0644\u0627 \u064A\u0645\u0644\u0643 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0645\u0633\u062C\u0644\u0629");
  }
  const isMatch = verifyPassword(input.oldPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error("\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629");
  }
  const newHash = hashPassword(input.newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq21(users.id, userId));
  return { success: true };
}

// shared/profitabilitySimulator.ts
function simulateCycleProfitability(input) {
  const currentAge = Math.max(1, input.currentAgeDays);
  const dailyMortality = input.expectedDailyMortalityRate ?? 1e-3;
  const vetCostPerBird = input.veterinaryCostPerBirdEgp ?? 4.5;
  const projections = [];
  let bestDay = currentAge;
  let highestNetProfit = -Infinity;
  let runningLiveBirds = input.currentLiveBirds;
  for (let age = Math.min(currentAge, 25); age <= 45; age++) {
    const standardCurrent = getExpectedWeightGrams(currentAge);
    const standardAtAge = getExpectedWeightGrams(age);
    const performanceFactor = standardCurrent > 0 ? input.currentAvgWeightGrams / standardCurrent : 1;
    const projectedWeightGrams = Math.round(standardAtAge * Math.max(0.7, Math.min(1.3, performanceFactor)));
    const feedPerBirdKg = Number((projectedWeightGrams / 1e3 * (1.25 + age / 40 * 0.4)).toFixed(3));
    const fcr = Number((feedPerBirdKg / (projectedWeightGrams / 1e3)).toFixed(2));
    if (age > currentAge) {
      runningLiveBirds = Math.round(runningLiveBirds * (1 - dailyMortality));
    }
    const totalBiomassKg = runningLiveBirds * projectedWeightGrams / 1e3;
    const totalFeedKg = runningLiveBirds * feedPerBirdKg;
    const totalChickCost = input.birdsPlaced * input.chickCostPerBirdEgp;
    const totalFeedCost = totalFeedKg * input.feedCostPerKgEgp;
    const totalVetCost = input.birdsPlaced * vetCostPerBird;
    const totalOverhead = age * input.fixedDailyOverheadEgp;
    const totalExpenses = totalChickCost + totalFeedCost + totalVetCost + totalOverhead;
    const grossRevenue = totalBiomassKg * input.targetSellingPricePerKgEgp;
    const netProfit = grossRevenue - totalExpenses;
    const profitPerBird = runningLiveBirds > 0 ? Number((netProfit / runningLiveBirds).toFixed(2)) : 0;
    const profitPerCycleDay = age > 0 ? Number((netProfit / age).toFixed(2)) : 0;
    const roiPercent = totalExpenses > 0 ? Number((netProfit / totalExpenses * 100).toFixed(2)) : 0;
    if (netProfit > highestNetProfit && age >= currentAge) {
      highestNetProfit = netProfit;
      bestDay = age;
    }
    projections.push({
      ageDays: age,
      projectedWeightGrams,
      projectedLiveBirds: runningLiveBirds,
      totalBiomassKg: Math.round(totalBiomassKg),
      feedConsumedPerBirdKg: feedPerBirdKg,
      totalFeedConsumedKg: Math.round(totalFeedKg),
      totalFeedCostEgp: Math.round(totalFeedCost),
      totalChickCostEgp: Math.round(totalChickCost),
      totalVeterinaryCostEgp: Math.round(totalVetCost),
      totalOverheadCostEgp: Math.round(totalOverhead),
      totalExpensesEgp: Math.round(totalExpenses),
      grossRevenueEgp: Math.round(grossRevenue),
      netProfitEgp: Math.round(netProfit),
      profitPerBirdEgp: profitPerBird,
      profitPerCycleDayEgp: profitPerCycleDay,
      roiPercent,
      fcr
    });
  }
  projections.forEach((p) => {
    if (p.ageDays === bestDay) {
      p.isOptimalHarvestDay = true;
    }
  });
  const optimalProj = projections.find((p) => p.ageDays === bestDay) || projections[0];
  return {
    currentStatus: {
      ageDays: currentAge,
      liveBirds: input.currentLiveBirds,
      avgWeightGrams: input.currentAvgWeightGrams,
      estimatedCostToDateEgp: input.birdsPlaced * input.chickCostPerBirdEgp + currentAge * input.fixedDailyOverheadEgp
    },
    optimalHarvest: {
      optimalAgeDays: bestDay,
      optimalWeightGrams: optimalProj.projectedWeightGrams,
      maxNetProfitEgp: optimalProj.netProfitEgp,
      maxProfitPerDayEgp: optimalProj.profitPerCycleDayEgp,
      optimalRoiPercent: optimalProj.roiPercent
    },
    dailyProjections: projections
  };
}

// shared/smartScaleBridge.ts
function parseRawScaleData(rawStream) {
  if (!rawStream || !rawStream.trim()) {
    return {
      isValid: false,
      isStable: false,
      weightKg: 0,
      weightGrams: 0,
      unit: "kg",
      raw: rawStream,
      errorMessage: "\u0642\u0631\u0627\u0621\u0629 \u0641\u0627\u0631\u063A\u0629 \u0645\u0646 \u0627\u0644\u0645\u064A\u0632\u0627\u0646"
    };
  }
  const clean = rawStream.trim();
  const isStable = !clean.toUpperCase().startsWith("US") && !clean.includes("MOTION");
  const match = clean.match(/([+-]?\s*\d+(?:\.\d+)?)\s*(kg|g|lb|كجم)?/i);
  if (!match) {
    return {
      isValid: false,
      isStable,
      weightKg: 0,
      weightGrams: 0,
      unit: "kg",
      raw: rawStream,
      errorMessage: "\u062A\u0639\u0630\u0631 \u0641\u0643 \u062A\u0634\u0641\u064A\u0631 \u0646\u0633\u0642 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u064A\u0632\u0627\u0646"
    };
  }
  const numericPart = match[1].replace(/\s+/g, "");
  const val = parseFloat(numericPart);
  if (isNaN(val) || val < 0) {
    return {
      isValid: false,
      isStable,
      weightKg: 0,
      weightGrams: 0,
      unit: "kg",
      raw: rawStream,
      errorMessage: "\u0642\u064A\u0645\u0629 \u0627\u0644\u0648\u0632\u0646 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629"
    };
  }
  const unitStr = (match[2] || "kg").toLowerCase();
  let weightKg = val;
  let unit = "kg";
  if (unitStr === "g") {
    weightKg = val / 1e3;
    unit = "g";
  } else if (unitStr === "lb") {
    weightKg = val * 0.45359237;
    unit = "lb";
  }
  const weightGrams = Math.round(weightKg * 1e3);
  return {
    isValid: true,
    isStable,
    weightKg: Number(weightKg.toFixed(2)),
    weightGrams,
    unit,
    raw: rawStream
  };
}
function calculateBatchNetMetrics(input) {
  const netKg = Math.max(0, input.grossWeightKg - input.tareWeightKg);
  const netGrams = Math.round(netKg * 1e3);
  const avgBirdWeightGrams = input.birdCount > 0 ? Math.round(netGrams / input.birdCount) : 0;
  const avgCageWeightKg = input.cageCount > 0 ? Number((input.tareWeightKg / input.cageCount).toFixed(2)) : 0;
  return {
    netWeightKg: Number(netKg.toFixed(2)),
    netWeightGrams: netGrams,
    avgBirdWeightGrams,
    avgCageWeightKg
  };
}

// shared/subscriptionPlans.ts
var SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629 (Free)",
    priceMonthlyEgp: 0,
    priceAnnualEgp: 0,
    description: "\u0644\u0635\u063A\u0627\u0631 \u0627\u0644\u0645\u0631\u0628\u064A\u0646 \u0648\u0627\u0644\u0645\u0632\u0627\u0631\u0639 \u0627\u0644\u0641\u0631\u062F\u064A\u0629 \u0644\u0644\u0628\u062F\u0621 \u0641\u064A \u0627\u0644\u0631\u0642\u0645\u0646\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629",
    limits: {
      maxFarms: 1,
      maxHousesPerFarm: 2,
      maxUsersPerFarm: 2,
      maxActiveCycles: 1
    },
    features: ["advanced_reports"]
  },
  starter: {
    id: "starter",
    name: "\u0628\u0627\u0642\u0629 \u0627\u0644\u0628\u062F\u0627\u064A\u0629 (Starter)",
    priceMonthlyEgp: 499,
    priceAnnualEgp: 4990,
    description: "\u0644\u0644\u0645\u0632\u0627\u0631\u0639 \u0627\u0644\u0645\u062A\u0648\u0633\u0637\u0629 \u0627\u0644\u062A\u064A \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u062F\u0642\u064A\u0642\u0629 \u0644\u0644\u0645\u062E\u0627\u0632\u0646 \u0648\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A",
    limits: {
      maxFarms: 2,
      maxHousesPerFarm: 4,
      maxUsersPerFarm: 5,
      maxActiveCycles: 2
    },
    features: ["advanced_reports", "smart_alerts", "medicine_inventory"]
  },
  pro: {
    id: "pro",
    name: "\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u062D\u062A\u0631\u0641\u064A\u0646 (Pro)",
    priceMonthlyEgp: 999,
    priceAnnualEgp: 9990,
    description: "\u0644\u0644\u0645\u0632\u0627\u0631\u0639 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0633\u062A\u0647\u062F\u0641 \u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0643\u0641\u0627\u0621\u0629 \u0627\u0644\u062A\u062D\u0648\u064A\u0644\u064A\u0629 \u0648\u0627\u0644\u0628\u064A\u0639 \u0628\u0627\u0644\u0645\u064A\u0632\u0627\u0646 \u0627\u0644\u0630\u0643\u064A",
    limits: {
      maxFarms: 5,
      maxHousesPerFarm: 10,
      maxUsersPerFarm: 15,
      maxActiveCycles: 5
    },
    features: [
      "advanced_reports",
      "smart_alerts",
      "medicine_inventory",
      "profitability_simulator",
      "smart_scale_bridge",
      "unlimited_exports"
    ]
  },
  business: {
    id: "business",
    name: "\u0628\u0627\u0642\u0629 \u0627\u0644\u0634\u0631\u0643\u0627\u062A (Business)",
    priceMonthlyEgp: 1999,
    priceAnnualEgp: 19990,
    description: "\u0644\u0644\u0634\u0631\u0643\u0627\u062A \u0648\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u0645\u0632\u0627\u0631\u0639 \u0627\u0644\u062A\u064A \u062A\u062A\u0637\u0644\u0628 \u0644\u0648\u062D\u0629 \u0642\u064A\u0627\u062F\u0629 \u062A\u0646\u0641\u064A\u0630\u064A\u0629 \u0645\u0648\u062D\u062F\u0629 \u0648\u0625\u0646\u062A\u0631\u0646\u062A \u0627\u0644\u0623\u0634\u064A\u0627\u0621",
    limits: {
      maxFarms: 15,
      maxHousesPerFarm: 30,
      maxUsersPerFarm: 50,
      maxActiveCycles: 15
    },
    features: [
      "advanced_reports",
      "smart_alerts",
      "medicine_inventory",
      "profitability_simulator",
      "smart_scale_bridge",
      "unlimited_exports",
      "executive_dashboard",
      "iot_sensors",
      "audit_logs"
    ]
  },
  enterprise: {
    id: "enterprise",
    name: "\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0627\u0644\u0643\u0628\u0631\u0649 (Enterprise)",
    priceMonthlyEgp: 4999,
    priceAnnualEgp: 49990,
    description: "\u0644\u0643\u0628\u0631\u0649 \u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u062F\u0648\u0627\u062C\u0646 \u0648\u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0642\u0627\u0628\u0636\u0629 \u0645\u0639 \u0645\u0632\u0627\u0631\u0639 \u0648\u0639\u0646\u0627\u0628\u0631 \u063A\u064A\u0631 \u0645\u062D\u062F\u0648\u062F\u0629 \u0648\u062F\u0639\u0645 \u0645\u062E\u0635\u0635",
    limits: {
      maxFarms: 9999,
      maxHousesPerFarm: 9999,
      maxUsersPerFarm: 9999,
      maxActiveCycles: 9999
    },
    features: [
      "advanced_reports",
      "smart_alerts",
      "medicine_inventory",
      "profitability_simulator",
      "smart_scale_bridge",
      "unlimited_exports",
      "executive_dashboard",
      "iot_sensors",
      "audit_logs"
    ]
  }
};
function checkResourceLimit(plan, resourceType, currentCount) {
  const activePlan = plan ? SUBSCRIPTION_PLANS[plan] : SUBSCRIPTION_PLANS.free;
  let limit = 1;
  switch (resourceType) {
    case "farms":
      limit = activePlan.limits.maxFarms;
      break;
    case "houses":
      limit = activePlan.limits.maxHousesPerFarm;
      break;
    case "users":
      limit = activePlan.limits.maxUsersPerFarm;
      break;
    case "cycles":
      limit = activePlan.limits.maxActiveCycles;
      break;
  }
  const isAllowed = currentCount < limit;
  return {
    isAllowed,
    limit,
    current: currentCount,
    message: isAllowed ? void 0 : `\u062A\u0645 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (${limit}) \u0641\u064A \u0628\u0627\u0642\u062A\u0643 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 (${activePlan.name}). \u064A\u064F\u0631\u062C\u0649 \u0627\u0644\u062A\u0631\u0642\u064A\u0629 \u0644\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0632\u064A\u062F.`
  };
}

// server/weather.ts
init_schema();
import { and as and13, eq as eq22 } from "drizzle-orm";

// shared/weather.ts
function cycleDayFromDate(placementDate, weatherDate) {
  const start = Date.UTC(placementDate.getUTCFullYear(), placementDate.getUTCMonth(), placementDate.getUTCDate());
  const target = Date.parse(`${weatherDate}T00:00:00Z`);
  return Math.max(0, Math.floor((target - start) / 864e5) + 1);
}

// server/weather.ts
function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
async function fetchDailyWeather(latitude, longitude, weatherDate) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const isPast = weatherDate < today;
  const base = isPast ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "auto",
    start_date: weatherDate,
    end_date: weatherDate,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max",
    hourly: "relative_humidity_2m"
  });
  if (!isPast) params.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code");
  const response = await fetch(`${base}?${params.toString()}`);
  if (!response.ok) throw new Error("Weather provider did not return a usable response");
  const data = await response.json();
  const humidityValues = data.hourly?.relative_humidity_2m?.filter((value) => typeof value === "number") ?? [];
  const averageHumidity = humidityValues.length ? Math.round(humidityValues.reduce((sum, value) => sum + value, 0) / humidityValues.length) : null;
  const current = data.current;
  const high = numberOrNull(data.daily?.temperature_2m_max?.[0]);
  const low = numberOrNull(data.daily?.temperature_2m_min?.[0]);
  const code = numberOrNull(current?.weather_code) ?? numberOrNull(data.daily?.weather_code?.[0]);
  if (high === null || low === null || code === null) throw new Error("Weather provider returned incomplete daily data");
  return {
    weatherCode: code,
    currentTemperature: numberOrNull(current?.temperature_2m),
    temperatureHigh: high,
    temperatureLow: low,
    humidity: numberOrNull(current?.relative_humidity_2m) ?? averageHumidity,
    windSpeed: numberOrNull(current?.wind_speed_10m) ?? numberOrNull(data.daily?.wind_speed_10m_max?.[0]),
    apparentTemperature: numberOrNull(current?.apparent_temperature)
  };
}
async function getCycleDayWeather(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const weatherDay = /* @__PURE__ */ new Date(`${input.weatherDate}T00:00:00.000Z`);
  const [cycleFarm] = await db.select({ farmId: cycles.farmId, placementDate: cycles.placementDate, latitude: farms.latitude, longitude: farms.longitude, name: farms.name }).from(cycles).innerJoin(farms, eq22(cycles.farmId, farms.id)).where(eq22(cycles.id, input.cycleId)).limit(1);
  if (!cycleFarm) throw new Error("Cycle not found");
  const [farm] = await db.select({ ownerId: farms.ownerId }).from(farms).where(eq22(farms.id, cycleFarm.farmId)).limit(1);
  if (!farm || farm.ownerId !== userId) {
    const { farmMemberships: farmMemberships3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [membership] = await db.select({ id: farmMemberships3.id }).from(farmMemberships3).where(and13(eq22(farmMemberships3.userId, userId), eq22(farmMemberships3.farmId, cycleFarm.farmId), eq22(farmMemberships3.isActive, true))).limit(1);
    if (!membership) throw new Error("You do not have access to this farm weather");
  }
  if (!cycleFarm.latitude || !cycleFarm.longitude) return { state: "location_required", farmName: cycleFarm.name };
  const [cached] = await db.select().from(farmWeatherDays).where(and13(eq22(farmWeatherDays.farmId, cycleFarm.farmId), eq22(farmWeatherDays.weatherDate, weatherDay))).limit(1);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const shouldRefresh = input.weatherDate >= today;
  let weather;
  if (cached && !shouldRefresh) {
    weather = { weatherCode: cached.weatherCode, currentTemperature: cached.currentTemperature === null ? null : Number(cached.currentTemperature), temperatureHigh: Number(cached.temperatureHigh), temperatureLow: Number(cached.temperatureLow), humidity: cached.humidity, windSpeed: cached.windSpeed === null ? null : Number(cached.windSpeed), apparentTemperature: cached.apparentTemperature === null ? null : Number(cached.apparentTemperature) };
  } else {
    weather = await fetchDailyWeather(Number(cycleFarm.latitude), Number(cycleFarm.longitude), input.weatherDate);
    const values = { farmId: cycleFarm.farmId, weatherDate: weatherDay, weatherCode: weather.weatherCode, currentTemperature: weather.currentTemperature?.toFixed(1) ?? null, temperatureHigh: weather.temperatureHigh.toFixed(1), temperatureLow: weather.temperatureLow.toFixed(1), humidity: weather.humidity, windSpeed: weather.windSpeed?.toFixed(1) ?? null, apparentTemperature: weather.apparentTemperature?.toFixed(1) ?? null, source: "open-meteo" };
    if (cached) await db.update(farmWeatherDays).set({ ...values, syncedAt: /* @__PURE__ */ new Date() }).where(eq22(farmWeatherDays.id, cached.id));
    else await db.insert(farmWeatherDays).values(values);
  }
  return { state: "ready", weatherDate: input.weatherDate, cycleDay: cycleDayFromDate(cycleFarm.placementDate, input.weatherDate), farmName: cycleFarm.name, ...weather };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure.input(
      z2.object({
        name: z2.string().trim().min(2).max(180),
        email: z2.string().trim().email(),
        password: z2.string().min(6).max(100),
        companyName: z2.string().trim().max(180).optional(),
        phone: z2.string().trim().max(40).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { user, sessionToken } = await registerLocalUser(input);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: 30 * 24 * 60 * 60 * 1e3
      });
      return { success: true, user };
    }),
    login: publicProcedure.input(
      z2.object({
        email: z2.string().trim().email(),
        password: z2.string().min(1)
      })
    ).mutation(async ({ ctx, input }) => {
      const { user, sessionToken } = await loginLocalUser(input);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: 30 * 24 * 60 * 60 * 1e3
      });
      return { success: true, user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true };
    }),
    changePassword: protectedProcedure.input(
      z2.object({
        oldPassword: z2.string().min(1),
        newPassword: z2.string().min(6).max(100)
      })
    ).mutation(({ ctx, input }) => changeLocalUserPassword(ctx.user.id, input))
  }),
  workspace: router({
    get: protectedProcedure.query(({ ctx }) => getWorkspace(ctx.user.id)),
    bootstrap: protectedProcedure.input(z2.object({
      farmName: z2.string().trim().min(2).max(180),
      governorate: z2.string().trim().max(100).optional(),
      location: z2.string().trim().max(500).optional(),
      latitude: z2.number().min(-90).max(90).optional(),
      longitude: z2.number().min(-180).max(180).optional(),
      locationSource: z2.enum(["manual", "device"]).optional(),
      cycleName: z2.string().trim().min(2).max(180),
      placementDate: z2.coerce.date(),
      birdsPlaced: z2.number().int().positive().max(1e6)
    })).mutation(({ ctx, input }) => bootstrapFarm(ctx.user.id, input)),
    createFarm: protectedProcedure.input(z2.object({
      name: z2.string().trim().min(2).max(180),
      governorate: z2.string().trim().max(100).optional(),
      location: z2.string().trim().max(500).optional(),
      latitude: z2.number().min(-90).max(90).optional(),
      longitude: z2.number().min(-180).max(180).optional(),
      locationSource: z2.enum(["manual", "device"]).optional()
    })).mutation(({ ctx, input }) => createFarm(ctx.user.id, input)),
    updateFarmLocation: protectedProcedure.input(z2.object({
      farmId: z2.number().int().positive(),
      location: z2.string().trim().max(500).optional(),
      latitude: z2.number().min(-90).max(90),
      longitude: z2.number().min(-180).max(180),
      locationSource: z2.enum(["manual", "device"])
    })).mutation(({ ctx, input }) => updateFarmLocation(ctx.user.id, input)),
    updateFarm: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), name: z2.string().trim().min(2).max(180), governorate: z2.string().trim().max(100).optional(), location: z2.string().trim().max(500).optional() })).mutation(({ ctx, input }) => updateFarm(ctx.user.id, input)),
    getCascadeDeletionImpact: protectedProcedure.input(z2.object({ kind: z2.enum(["farm", "cycle", "house"]), id: z2.number().int().positive() })).query(({ ctx, input }) => getCascadeDeletionImpact(ctx.user.id, input)),
    deleteFarm: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteFarm(ctx.user.id, input.farmId)),
    createCycle: protectedProcedure.input(z2.object({
      farmId: z2.number().int().positive(),
      name: z2.string().trim().min(2).max(180),
      placementDate: z2.coerce.date(),
      birdsPlaced: z2.number().int().positive().max(1e6)
    })).mutation(({ ctx, input }) => createCycle(ctx.user.id, input)),
    updateCycle: protectedProcedure.input(z2.object({ cycleId: z2.number().int().positive(), name: z2.string().trim().min(2).max(180), placementDate: z2.coerce.date(), birdsPlaced: z2.number().int().positive().max(1e6) })).mutation(({ ctx, input }) => updateCycle(ctx.user.id, input)),
    deleteCycle: protectedProcedure.input(z2.object({ cycleId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteCycle(ctx.user.id, input.cycleId)),
    addDailyRecord: protectedProcedure.input(z2.object({
      cycleId: z2.number().int().positive(),
      houseId: z2.number().int().positive(),
      recordDate: z2.coerce.date(),
      feedKg: z2.number().int().min(0),
      waterLiters: z2.number().int().min(0),
      mortality: z2.number().int().min(0),
      culls: z2.number().int().min(0)
    })).mutation(({ ctx, input }) => addDailyRecord(ctx.user.id, input)),
    updateDailyRecord: protectedProcedure.input(z2.object({
      recordId: z2.number().int().positive(),
      recordDate: z2.coerce.date(),
      feedKg: z2.number().int().min(0),
      waterLiters: z2.number().int().min(0),
      mortality: z2.number().int().min(0),
      culls: z2.number().int().min(0)
    })).mutation(({ ctx, input }) => updateDailyRecord(ctx.user.id, input)),
    deleteDailyRecord: protectedProcedure.input(z2.object({ recordId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteDailyRecord(ctx.user.id, input.recordId)),
    addWeightSample: protectedProcedure.input(z2.object({
      cycleId: z2.number().int().positive(),
      houseId: z2.number().int().positive(),
      sampleDate: z2.coerce.date(),
      averageWeightGrams: z2.number().int().positive()
    })).mutation(({ ctx, input }) => addWeightSample(ctx.user.id, input)),
    addHealthEvent: protectedProcedure.input(z2.object({
      cycleId: z2.number().int().positive(),
      houseId: z2.number().int().positive(),
      eventDate: z2.coerce.date(),
      eventType: z2.enum(["medication", "vaccination"]),
      productName: z2.string().trim().min(2).max(180),
      dosage: z2.string().trim().min(1).max(180),
      administrationRoute: z2.string().trim().max(120).optional(),
      notes: z2.string().trim().max(1e3).optional()
    })).mutation(({ ctx, input }) => addHealthEvent(ctx.user.id, input)),
    addHealthEvents: protectedProcedure.input(z2.object({
      cycleId: z2.number().int().positive(),
      houseIds: z2.array(z2.number().int().positive()).min(1).max(500),
      eventDate: z2.coerce.date(),
      eventType: z2.enum(["medication", "vaccination"]),
      productName: z2.string().trim().min(2).max(180),
      dosage: z2.string().trim().min(1).max(180),
      administrationRoute: z2.string().trim().max(120).optional(),
      notes: z2.string().trim().max(1e3).optional()
    })).mutation(({ ctx, input }) => addHealthEvents(ctx.user.id, input)),
    updateHealthEvent: protectedProcedure.input(z2.object({
      healthEventId: z2.number().int().positive(),
      houseId: z2.number().int().positive(),
      eventDate: z2.coerce.date(),
      eventType: z2.enum(["medication", "vaccination"]),
      productName: z2.string().trim().min(2).max(180),
      dosage: z2.string().trim().min(1).max(180),
      administrationRoute: z2.string().trim().max(120).optional(),
      notes: z2.string().trim().max(1e3).optional()
    })).mutation(({ ctx, input }) => updateHealthEvent(ctx.user.id, input)),
    deleteHealthEvent: protectedProcedure.input(z2.object({ healthEventId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteHealthEvent(ctx.user.id, input.healthEventId)),
    createHouse: protectedProcedure.input(z2.object({
      farmId: z2.number().int().positive(),
      name: z2.string().trim().min(2).max(180),
      capacity: z2.number().int().min(0).max(1e6)
    })).mutation(({ ctx, input }) => createHouse(ctx.user.id, input)),
    updateHouse: protectedProcedure.input(z2.object({ houseId: z2.number().int().positive(), name: z2.string().trim().min(2).max(180), capacity: z2.number().int().min(0).max(1e6) })).mutation(({ ctx, input }) => updateHouse(ctx.user.id, input)),
    deleteHouse: protectedProcedure.input(z2.object({ houseId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteHouse(ctx.user.id, input.houseId)),
    createCageSection: protectedProcedure.input(z2.object({
      cycleId: z2.number().int().positive(),
      houseId: z2.number().int().positive(),
      name: z2.string().trim().min(2).max(180),
      rowName: z2.string().trim().min(1).max(100),
      cageCount: z2.number().int().positive().max(1e5),
      capacityPerCage: z2.number().int().positive().max(1e3)
    })).mutation(({ ctx, input }) => createCageSection(ctx.user.id, input)),
    setCageOccupancy: protectedProcedure.input(z2.object({
      cycleId: z2.number().int().positive(),
      cageSectionId: z2.number().int().positive(),
      occupiedBirds: z2.number().int().min(0).max(1e6)
    })).mutation(({ ctx, input }) => setCageOccupancy(ctx.user.id, input)),
    setCycleHouseAssignment: protectedProcedure.input(z2.object({
      cycleId: z2.number().int().positive(),
      houseId: z2.number().int().positive(),
      assignedBirds: z2.number().int().min(0).max(1e6)
    })).mutation(({ ctx, input }) => setCycleHouseAssignment(ctx.user.id, input)),
    updateFeedInventorySettings: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), bagWeightKg: z2.number().int().min(1).max(200), reorderPointBags: z2.number().int().min(0).max(1e6) })).mutation(({ ctx, input }) => updateFeedInventorySettings(ctx.user.id, input)),
    addFeedInventoryTransaction: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), movementType: z2.enum(["opening", "receipt", "issue", "adjustment"]), bagDelta: z2.number().int().min(-1e6).max(1e6).refine((value) => value !== 0, "\u064A\u062C\u0628 \u0625\u062F\u062E\u0627\u0644 \u0639\u062F\u062F \u0634\u0643\u0627\u064A\u0631 \u063A\u064A\u0631 \u0635\u0641\u0631\u064A"), occurredAt: z2.coerce.date(), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => addFeedInventoryTransaction(ctx.user.id, input)),
    addFarmExpense: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), cycleId: z2.number().int().positive().optional(), category: z2.enum(expenseCategories), amountEgp: z2.number().positive().max(1e7), expenseDate: z2.coerce.date(), supplier: z2.string().trim().max(180).optional(), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => addFarmExpense(ctx.user.id, input)),
    updateFarmExpense: protectedProcedure.input(z2.object({ expenseId: z2.number().int().positive(), cycleId: z2.number().int().positive().optional(), category: z2.enum(expenseCategories), amountEgp: z2.number().positive().max(1e7), expenseDate: z2.coerce.date(), supplier: z2.string().trim().max(180).optional(), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => updateFarmExpense(ctx.user.id, input)),
    approveExpense: protectedProcedure.input(z2.object({ expenseId: z2.number().int().positive() })).mutation(({ ctx, input }) => approveExpense(ctx.user.id, input.expenseId)),
    rejectExpense: protectedProcedure.input(z2.object({ expenseId: z2.number().int().positive(), reason: z2.string().trim().min(2).max(500) })).mutation(({ ctx, input }) => rejectExpense(ctx.user.id, input)),
    markExpensePaid: protectedProcedure.input(z2.object({ expenseId: z2.number().int().positive() })).mutation(({ ctx, input }) => markExpensePaid(ctx.user.id, input.expenseId)),
    createWorker: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), name: z2.string().trim().min(2).max(180), jobTitle: z2.string().trim().max(140).optional(), phone: z2.string().trim().max(40).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => createWorker(ctx.user.id, input)),
    updateWorker: protectedProcedure.input(z2.object({ workerId: z2.number().int().positive(), name: z2.string().trim().min(2).max(180), jobTitle: z2.string().trim().max(140).optional(), phone: z2.string().trim().max(40).optional(), notes: z2.string().trim().max(1e3).optional(), isActive: z2.boolean() })).mutation(({ ctx, input }) => updateWorker(ctx.user.id, input)),
    addWorkerAccountEntry: protectedProcedure.input(z2.object({ workerId: z2.number().int().positive(), entryType: z2.enum(workerAccountEntryTypes), amountEgp: z2.number().min(-1e7).max(1e7).refine((value) => value !== 0, "\u064A\u062C\u0628 \u0625\u062F\u062E\u0627\u0644 \u0645\u0628\u0644\u063A \u063A\u064A\u0631 \u0635\u0641\u0631\u064A"), occurredAt: z2.coerce.date(), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => addWorkerAccountEntry(ctx.user.id, input)),
    updateWorkerAccountEntry: protectedProcedure.input(z2.object({ entryId: z2.number().int().positive(), entryType: z2.enum(workerAccountEntryTypes), amountEgp: z2.number().min(-1e7).max(1e7).refine((value) => value !== 0, "\u064A\u062C\u0628 \u0625\u062F\u062E\u0627\u0644 \u0645\u0628\u0644\u063A \u063A\u064A\u0631 \u0635\u0641\u0631\u064A"), occurredAt: z2.coerce.date(), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => updateWorkerAccountEntry(ctx.user.id, input)),
    deleteWorkerAccountEntry: protectedProcedure.input(z2.object({ entryId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteWorkerAccountEntry(ctx.user.id, input.entryId)),
    createTrader: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), name: z2.string().trim().min(2).max(180), phone: z2.string().trim().max(40).optional(), companyName: z2.string().trim().max(180).optional(), address: z2.string().trim().max(300).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => createTrader(ctx.user.id, input)),
    createTraderWithSimpleSale: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), cycleId: z2.number().int().positive(), name: z2.string().trim().min(2).max(180), phone: z2.string().trim().max(40).optional(), pricePerKgEgp: z2.number().positive().max(1e5), notes: z2.string().trim().max(1e3).optional(), saleDate: z2.coerce.date() })).mutation(({ ctx, input }) => createTraderWithSimpleSale(ctx.user.id, input)),
    updateTrader: protectedProcedure.input(z2.object({ traderId: z2.number().int().positive(), name: z2.string().trim().min(2).max(180), phone: z2.string().trim().max(40).optional(), companyName: z2.string().trim().max(180).optional(), address: z2.string().trim().max(300).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => updateTrader(ctx.user.id, input)),
    deleteTrader: protectedProcedure.input(z2.object({ traderId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteTrader(ctx.user.id, input.traderId)),
    createSale: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), cycleId: z2.number().int().positive(), traderId: z2.number().int().positive(), saleDate: z2.coerce.date(), grossWeightKg: z2.number().positive().max(1e6), loadedCageCount: z2.number().int().positive().max(1e5), tareWeightKg: z2.number().positive().max(1e6), tareCageCount: z2.number().int().positive().max(1e5), pricePerKgEgp: z2.number().positive().max(1e5), initialPaidEgp: z2.number().min(0).max(1e9).optional(), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => createSale(ctx.user.id, input)),
    startTraderLoading: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), cycleId: z2.number().int().positive(), traderId: z2.number().int().positive(), saleDate: z2.coerce.date(), plannedCageCount: z2.number().int().min(0).max(1e5), batchCageCount: z2.number().int().positive().max(1e5), weighingMode: z2.enum(["fixed", "variable", "direct"]).optional(), birdsPerCage: z2.number().int().min(0).max(1e4).optional(), tareWeightKg: z2.number().min(0).max(1e6), tareCageCount: z2.number().int().min(0).max(1e5), pricePerKgEgp: z2.number().positive().max(1e5), discountEgp: z2.number().min(0).max(1e9).optional(), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => startTraderLoading(ctx.user.id, input)),
    addSaleTareBatch: protectedProcedure.input(z2.object({ saleId: z2.number().int().positive(), cageCount: z2.number().int().positive().max(1e5), tareWeightKg: z2.number().min(0).max(1e6), weighedAt: z2.coerce.date(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => addSaleTareBatch(ctx.user.id, input)),
    fillSaleTareBatch: protectedProcedure.input(z2.object({ batchId: z2.number().int().positive(), grossWeightKg: z2.number().positive().max(1e6), weighedAt: z2.coerce.date(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => fillSaleTareBatch(ctx.user.id, input)),
    updateSaleTareBatch: protectedProcedure.input(z2.object({ batchId: z2.number().int().positive(), cageCount: z2.number().int().positive().max(1e5), tareWeightKg: z2.number().min(0).max(1e6), weighedAt: z2.coerce.date(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => updateSaleTareBatch(ctx.user.id, input)),
    addSaleWeighBatch: protectedProcedure.input(z2.object({ saleId: z2.number().int().positive(), cageCount: z2.number().int().min(0).max(1e5).optional(), grossWeightKg: z2.number().positive().max(1e6), tareWeightKg: z2.number().min(0).max(1e6).optional(), weighedAt: z2.coerce.date(), notes: z2.string().trim().max(1e3).optional(), allowOverage: z2.boolean().optional() })).mutation(({ ctx, input }) => addSaleWeighBatch(ctx.user.id, input)),
    updateSaleWeighBatch: protectedProcedure.input(z2.object({ batchId: z2.number().int().positive(), cageCount: z2.number().int().min(0).max(1e5).optional(), grossWeightKg: z2.number().positive().max(1e6), tareWeightKg: z2.number().min(0).max(1e6).optional(), weighedAt: z2.coerce.date(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => updateSaleWeighBatch(ctx.user.id, input)),
    updateSaleDetails: protectedProcedure.input(z2.object({ saleId: z2.number().int().positive(), pricePerKgEgp: z2.number().positive().max(1e5), discountEgp: z2.number().min(0).max(1e9), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => updateSaleDetails(ctx.user.id, input)),
    deleteSaleWeighBatch: protectedProcedure.input(z2.object({ batchId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteSaleWeighBatch(ctx.user.id, input.batchId)),
    reorderSaleWeighBatches: protectedProcedure.input(z2.object({ saleId: z2.number().int().positive(), batchIds: z2.array(z2.number().int().positive()).min(1).max(1e4) })).mutation(({ ctx, input }) => reorderSaleWeighBatches(ctx.user.id, input)),
    calculateSaleTotal: protectedProcedure.input(z2.object({ saleId: z2.number().int().positive() })).mutation(({ ctx, input }) => calculateSaleTotal(ctx.user.id, input.saleId)),
    completeSale: protectedProcedure.input(z2.object({ saleId: z2.number().int().positive() })).mutation(({ ctx, input }) => completeSale(ctx.user.id, input.saleId)),
    reopenSale: protectedProcedure.input(z2.object({ saleId: z2.number().int().positive() })).mutation(({ ctx, input }) => reopenSale(ctx.user.id, input.saleId)),
    deleteSale: protectedProcedure.input(z2.object({ saleId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteSale(ctx.user.id, input.saleId)),
    addSalePayment: protectedProcedure.input(z2.object({ saleId: z2.number().int().positive(), amountEgp: z2.number().positive().max(1e9), paidAt: z2.coerce.date(), paymentMethod: z2.enum(["cash", "transfer", "credit", "other"]).optional(), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => addSalePayment(ctx.user.id, input)),
    updateSalePayment: protectedProcedure.input(z2.object({ paymentId: z2.number().int().positive(), amountEgp: z2.number().positive().max(1e9), paidAt: z2.coerce.date(), paymentMethod: z2.enum(["cash", "transfer", "credit", "other"]).optional(), reference: z2.string().trim().max(160).optional(), notes: z2.string().trim().max(1e3).optional() })).mutation(({ ctx, input }) => updateSalePayment(ctx.user.id, input)),
    deleteSalePayment: protectedProcedure.input(z2.object({ paymentId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteSalePayment(ctx.user.id, input.paymentId)),
    closeCycle: protectedProcedure.input(z2.object({ cycleId: z2.number().int().positive() })).mutation(({ ctx, input }) => closeCycle(ctx.user.id, input.cycleId)),
    finalizeCycleSalesAndClose: protectedProcedure.input(z2.object({ cycleId: z2.number().int().positive() })).mutation(({ ctx, input }) => finalizeCycleSalesAndClose(ctx.user.id, input.cycleId)),
    invitations: protectedProcedure.query(({ ctx }) => listInvitations(ctx.user.id)),
    createInvitation: protectedProcedure.input(z2.object({
      farmId: z2.number().int().positive(),
      houseId: z2.number().int().positive().optional(),
      cycleId: z2.number().int().positive().optional(),
      role: z2.enum(farmRoles),
      maxUses: z2.number().int().positive().max(100),
      expiresAt: z2.coerce.date().optional(),
      notes: z2.string().trim().max(500).optional()
    })).mutation(({ ctx, input }) => createInvitation(ctx.user.id, input)),
    revokeInvitation: protectedProcedure.input(z2.object({ invitationId: z2.number().int().positive() })).mutation(({ ctx, input }) => revokeInvitation(ctx.user.id, input.invitationId)),
    regenerateInvitation: protectedProcedure.input(z2.object({ invitationId: z2.number().int().positive() })).mutation(({ ctx, input }) => regenerateInvitation(ctx.user.id, input.invitationId)),
    redeemInvitation: protectedProcedure.input(z2.object({ code: z2.string().trim().min(8).max(64) })).mutation(({ ctx, input }) => redeemInvitation(ctx.user.id, input.code))
  }),
  alerts: router({
    list: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive().optional(), cycleId: z2.number().int().positive().optional(), status: z2.enum(["active", "acknowledged", "resolved", "dismissed"]).optional() }).optional()).query(({ ctx, input }) => listAlerts(ctx.user.id, input)),
    acknowledge: protectedProcedure.input(z2.object({ alertId: z2.number().int().positive() })).mutation(({ ctx, input }) => acknowledgeAlert(ctx.user.id, input.alertId)),
    resolve: protectedProcedure.input(z2.object({ alertId: z2.number().int().positive() })).mutation(({ ctx, input }) => resolveAlert(ctx.user.id, input.alertId)),
    scan: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), cycleId: z2.number().int().positive() })).mutation(({ ctx, input }) => scanAndSyncCycleAlerts(ctx.user.id, input.farmId, input.cycleId))
  }),
  companies: router({
    get: protectedProcedure.input(z2.object({ companyId: z2.number().int().positive().optional() }).optional()).query(({ ctx, input }) => getCompany(ctx.user.id, input?.companyId)),
    bootstrap: protectedProcedure.input(z2.object({ name: z2.string().trim().min(2).max(255), legalName: z2.string().trim().max(255).optional(), subscriptionPlan: z2.enum(["free", "starter", "pro", "business", "enterprise"]).optional() })).mutation(({ ctx, input }) => bootstrapCompany(ctx.user.id, input)),
    update: protectedProcedure.input(z2.object({
      companyId: z2.number().int().positive(),
      name: z2.string().trim().min(2).max(255).optional(),
      legalName: z2.string().trim().max(255).optional(),
      taxId: z2.string().trim().max(100).optional(),
      registrationNumber: z2.string().trim().max(100).optional(),
      phone: z2.string().trim().max(40).optional(),
      email: z2.string().trim().email().optional(),
      address: z2.string().trim().max(500).optional(),
      governorate: z2.string().trim().max(100).optional()
    })).mutation(({ ctx, input }) => updateCompany(ctx.user.id, input)),
    listFarms: protectedProcedure.input(z2.object({ companyId: z2.number().int().positive() })).query(({ ctx, input }) => listCompanyFarms(ctx.user.id, input.companyId)),
    listUsers: protectedProcedure.input(z2.object({ companyId: z2.number().int().positive() })).query(({ ctx, input }) => listCompanyUsers(ctx.user.id, input.companyId))
  }),
  reports: router({
    cycleAudit: protectedProcedure.input(z2.object({ cycleId: z2.number().int().positive() })).query(({ ctx, input }) => getCycleAuditReport(ctx.user.id, input.cycleId)),
    cycleAuditCsv: protectedProcedure.input(z2.object({ cycleId: z2.number().int().positive() })).query(({ ctx, input }) => getCycleAuditReportCsv(ctx.user.id, input.cycleId)),
    executiveDashboard: protectedProcedure.input(z2.object({ companyId: z2.number().int().positive().optional() }).optional()).query(({ ctx, input }) => getCompanyExecutiveDashboard(ctx.user.id, input?.companyId))
  }),
  medicineInventory: router({
    list: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive() })).query(({ ctx, input }) => listMedicineInventory(ctx.user.id, input.farmId)),
    add: protectedProcedure.input(
      z2.object({
        farmId: z2.number().int().positive(),
        productName: z2.string().trim().min(2).max(255),
        category: z2.enum(["vaccine", "antibiotic", "vitamin", "disinfectant", "supplement", "other"]).optional(),
        batchNumber: z2.string().trim().max(100).optional(),
        expiryDate: z2.coerce.date().optional(),
        quantity: z2.number().min(0),
        unit: z2.string().trim().max(50).optional(),
        unitCostEgp: z2.number().min(0).optional(),
        reorderPoint: z2.number().min(0).optional(),
        notes: z2.string().trim().max(1e3).optional()
      })
    ).mutation(({ ctx, input }) => addMedicineItem(ctx.user.id, input)),
    adjust: protectedProcedure.input(
      z2.object({
        itemId: z2.number().int().positive(),
        quantityDelta: z2.number(),
        reason: z2.string().trim().max(500).optional()
      })
    ).mutation(({ ctx, input }) => updateMedicineQuantity(ctx.user.id, input)),
    delete: protectedProcedure.input(z2.object({ itemId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteMedicineItem(ctx.user.id, input.itemId))
  }),
  auditLogs: router({
    list: protectedProcedure.input(
      z2.object({
        farmId: z2.number().int().positive().optional(),
        cycleId: z2.number().int().positive().optional(),
        entityType: z2.string().optional(),
        action: z2.string().optional(),
        limit: z2.number().int().positive().max(500).optional()
      }).optional()
    ).query(({ ctx, input }) => listAuditLogs(ctx.user.id, input))
  }),
  sensors: router({
    ingest: protectedProcedure.input(
      z2.object({
        farmId: z2.number().int().positive(),
        houseId: z2.number().int().positive(),
        readings: z2.array(
          z2.object({
            sensorType: z2.enum([
              "temperature",
              "humidity",
              "ammonia_nh3",
              "co2",
              "static_pressure",
              "water_flow",
              "light_lux"
            ]),
            value: z2.number(),
            unit: z2.string().trim().min(1).max(30),
            deviceId: z2.string().trim().max(100).optional(),
            readingTime: z2.coerce.date().optional()
          })
        ).min(1)
      })
    ).mutation(({ ctx, input }) => ingestSensorReadings(ctx.user.id, input)),
    getLatest: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive(), houseId: z2.number().int().positive() })).query(({ ctx, input }) => getLatestHouseReadings(ctx.user.id, input.farmId, input.houseId)),
    getHistory: protectedProcedure.input(
      z2.object({
        farmId: z2.number().int().positive(),
        houseId: z2.number().int().positive(),
        sensorType: z2.enum([
          "temperature",
          "humidity",
          "ammonia_nh3",
          "co2",
          "static_pressure",
          "water_flow",
          "light_lux"
        ]).optional(),
        hours: z2.number().int().positive().max(720).optional()
      })
    ).query(({ ctx, input }) => getHouseTelemetryHistory(ctx.user.id, input))
  }),
  simulator: router({
    simulate: protectedProcedure.input(
      z2.object({
        birdsPlaced: z2.number().int().positive(),
        currentAgeDays: z2.number().int().positive(),
        currentLiveBirds: z2.number().int().positive(),
        currentAvgWeightGrams: z2.number().int().positive(),
        feedCostPerKgEgp: z2.number().positive(),
        chickCostPerBirdEgp: z2.number().positive(),
        veterinaryCostPerBirdEgp: z2.number().positive().optional(),
        fixedDailyOverheadEgp: z2.number().min(0),
        targetSellingPricePerKgEgp: z2.number().positive(),
        expectedDailyMortalityRate: z2.number().min(0).max(0.1).optional()
      })
    ).query(({ input }) => simulateCycleProfitability(input))
  }),
  smartScale: router({
    parse: protectedProcedure.input(z2.object({ rawStream: z2.string() })).query(({ input }) => parseRawScaleData(input.rawStream)),
    computeMetrics: protectedProcedure.input(
      z2.object({
        grossWeightKg: z2.number().min(0),
        tareWeightKg: z2.number().min(0),
        cageCount: z2.number().int().min(0),
        birdCount: z2.number().int().min(0)
      })
    ).query(({ input }) => calculateBatchNetMetrics(input))
  }),
  backup: router({
    export: protectedProcedure.input(z2.object({ farmId: z2.number().int().positive().optional() }).optional()).query(({ ctx, input }) => exportCompanyBackup(ctx.user.id, input?.farmId))
  }),
  subscription: router({
    plans: publicProcedure.query(() => SUBSCRIPTION_PLANS),
    checkLimit: protectedProcedure.input(
      z2.object({
        resourceType: z2.enum(["farms", "houses", "users", "cycles"]),
        currentCount: z2.number().int().min(0)
      })
    ).query(async ({ ctx, input }) => {
      const company = ctx.user.companyId ? await getCompany(ctx.user.id, ctx.user.companyId) : null;
      const plan = company?.subscriptionPlan || "free";
      return checkResourceLimit(plan, input.resourceType, input.currentCount);
    })
  }),
  weather: router({
    forCycleDay: protectedProcedure.input(z2.object({ cycleId: z2.number().int().positive(), weatherDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(({ ctx, input }) => getCycleDayWeather(ctx.user.id, input))
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/api.ts
async function handler(req, res) {
  try {
    if (res.setHeader) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-trpc-source");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    const rawUrl = req.url || "/";
    const parsedUrl = new URL(rawUrl, "http://localhost");
    if (parsedUrl.pathname === "/api/health" || parsedUrl.pathname === "/health") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
      return;
    }
    let path = "";
    if (req.query?.trpc) {
      path = Array.isArray(req.query.trpc) ? req.query.trpc.join("/") : req.query.trpc;
    } else if (req.query?.path) {
      path = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    } else {
      path = parsedUrl.pathname.replace(/^\/api\/trpc\/?/, "").replace(/^\/trpc\/?/, "").replace(/^\/api\/?/, "");
    }
    return await nodeHTTPRequestHandler({
      req,
      res,
      router: appRouter,
      createContext,
      path,
      onError: ({ error, path: errPath }) => {
        console.error(`[tRPC Error on ${errPath}]:`, error);
      }
    });
  } catch (fatalError) {
    console.error("[Fatal Serverless Function Error Caught]:", fatalError);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify([
          {
            error: {
              json: {
                message: fatalError?.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0633\u062D\u0627\u0628\u064A",
                code: -32603,
                data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 }
              }
            }
          }
        ])
      );
    }
  }
}
export {
  handler as default
};
