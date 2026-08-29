import { boolean, date, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

// ────────────────────────────────────────────────────────────────
// Company / Organization — Foundation for Multi-Tenancy
// ────────────────────────────────────────────────────────────────
export const companies = mysqlTable("companies", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => [index("users_company_idx").on(table.companyId), index("users_email_idx").on(table.email)]);

export const farms = mysqlTable("farms", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("farms_owner_idx").on(table.ownerId)]);

export const houses = mysqlTable("houses", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  capacity: int("capacity").default(0).notNull(),
  status: mysqlEnum("status", ["empty", "preparing", "active", "cleaning", "maintenance"]).default("empty").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("houses_farm_idx").on(table.farmId)]);

export const cycles = mysqlTable("cycles", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  houseId: int("houseId"),
  name: varchar("name", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["draft", "upcoming", "active", "closed"]).default("upcoming").notNull(),
  placementDate: timestamp("placementDate").notNull(),
  birdsPlaced: int("birdsPlaced").notNull(),
  targetMarketWeight: int("targetMarketWeight"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("cycles_farm_idx").on(table.farmId), index("cycles_house_idx").on(table.houseId)]);

export const cycleHouseAssignments = mysqlTable("cycleHouseAssignments", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  houseId: int("houseId").notNull(),
  assignedBirds: int("assignedBirds").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("cycle_house_assignment_unique").on(table.cycleId, table.houseId), index("assignments_cycle_idx").on(table.cycleId), index("assignments_house_idx").on(table.houseId)]);

export const cageSections = mysqlTable("cageSections", {
  id: int("id").autoincrement().primaryKey(),
  houseId: int("houseId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  rowName: varchar("rowName", { length: 100 }).notNull(),
  cageCount: int("cageCount").notNull(),
  capacityPerCage: int("capacityPerCage").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("cages_house_idx").on(table.houseId)]);

export const dailyRecords = mysqlTable("dailyRecords", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("records_cycle_date_idx").on(table.cycleId, table.recordDate), index("records_house_date_idx").on(table.houseId, table.recordDate)]);

export const healthEvents = mysqlTable("healthEvents", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  houseId: int("houseId"),
  eventDate: timestamp("eventDate").notNull(),
  eventType: mysqlEnum("eventType", ["medication", "vaccination"]).notNull(),
  productName: varchar("productName", { length: 180 }).notNull(),
  dosage: varchar("dosage", { length: 180 }).notNull(),
  administrationRoute: varchar("administrationRoute", { length: 120 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("health_cycle_date_idx").on(table.cycleId, table.eventDate), index("health_house_date_idx").on(table.houseId, table.eventDate)]);

export const weightSamples = mysqlTable("weightSamples", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  houseId: int("houseId"),
  sampleDate: timestamp("sampleDate").notNull(),
  averageWeightGrams: int("averageWeightGrams").notNull(),
  sampleSize: int("sampleSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("weights_cycle_date_idx").on(table.cycleId, table.sampleDate), index("weights_house_date_idx").on(table.houseId, table.sampleDate)]);

export const cycleCageOccupancy = mysqlTable("cycleCageOccupancy", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  cageSectionId: int("cageSectionId").notNull(),
  occupiedBirds: int("occupiedBirds").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("occupancy_cycle_section_unique").on(table.cycleId, table.cageSectionId)]);

export const farmMemberships = mysqlTable("farmMemberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  farmId: int("farmId").notNull(),
  role: mysqlEnum("role", ["general_manager", "farm_manager", "veterinarian", "engineer", "supervisor", "accountant", "worker", "viewer"]).notNull(),
  houseId: int("houseId"),
  cycleId: int("cycleId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("memberships_user_idx").on(table.userId), index("memberships_farm_idx").on(table.farmId), uniqueIndex("membership_user_farm_unique").on(table.userId, table.farmId)]);

export const invitationCodes = mysqlTable("invitationCodes", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("invitation_code_hash_unique").on(table.codeHash), index("invitations_farm_idx").on(table.farmId), index("invitations_status_idx").on(table.status)]);

export const farmWeatherDays = mysqlTable("farmWeatherDays", {
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
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("weather_farm_date_unique").on(table.farmId, table.weatherDate), index("weather_farm_date_idx").on(table.farmId, table.weatherDate)]);

export const feedInventorySettings = mysqlTable("feedInventorySettings", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  bagWeightKg: int("bagWeightKg").default(50).notNull(),
  reorderPointBags: int("reorderPointBags").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("feed_inventory_settings_farm_unique").on(table.farmId)]);

export const feedInventoryTransactions = mysqlTable("feedInventoryTransactions", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  dailyRecordId: int("dailyRecordId"),
  movementType: mysqlEnum("movementType", ["opening", "receipt", "issue", "adjustment"]).notNull(),
  bagDelta: decimal("bagDelta", { precision: 12, scale: 4 }).notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  reference: varchar("reference", { length: 160 }),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("feed_inventory_transactions_farm_date_idx").on(table.farmId, table.occurredAt), uniqueIndex("feed_inventory_transactions_daily_record_unique").on(table.dailyRecordId)]);

export const farmExpenses = mysqlTable("farmExpenses", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("expenses_farm_date_idx").on(table.farmId, table.expenseDate), index("expenses_cycle_date_idx").on(table.cycleId, table.expenseDate), index("expenses_status_idx").on(table.approvalStatus)]);

export const medicineInventory = mysqlTable("medicineInventory", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["vaccine", "antibiotic", "vitamin", "disinfectant", "supplement", "other"]).default("other").notNull(),
  batchNumber: varchar("batchNumber", { length: 100 }),
  expiryDate: date("expiryDate"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("0.00").notNull(),
  unit: varchar("unit", { length: 50 }).default("عبوة").notNull(),
  unitCostPiasters: int("unitCostPiasters").default(0).notNull(),
  reorderPoint: decimal("reorderPoint", { precision: 10, scale: 2 }).default("5.00").notNull(),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("medicine_inventory_farm_idx").on(table.farmId)]);

export const workers = mysqlTable("workers", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  jobTitle: varchar("jobTitle", { length: 140 }),
  phone: varchar("phone", { length: 40 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("workers_farm_active_idx").on(table.farmId, table.isActive)]);

export const workerAccountEntries = mysqlTable("workerAccountEntries", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("worker_account_entries_worker_date_idx").on(table.workerId, table.occurredAt), index("worker_account_entries_farm_date_idx").on(table.farmId, table.occurredAt)]);

export const traders = mysqlTable("traders", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  companyName: varchar("companyName", { length: 180 }),
  address: varchar("address", { length: 300 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("traders_farm_idx").on(table.farmId)]);

export const sales = mysqlTable("sales", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("sales_farm_date_idx").on(table.farmId, table.saleDate),
  index("sales_cycle_date_idx").on(table.cycleId, table.saleDate),
  index("sales_trader_idx").on(table.traderId),
  index("sales_is_deleted_idx").on(table.isDeleted),
]);

export const saleWeighBatches = mysqlTable("saleWeighBatches", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("sale_batch_sequence_unique").on(table.saleId, table.sequence), index("sale_batches_sale_date_idx").on(table.saleId, table.weighedAt)]);

export const salePayments = mysqlTable("salePayments", {
  id: int("id").autoincrement().primaryKey(),
  saleId: int("saleId").notNull(),
  farmId: int("farmId").notNull(),
  amountPiasters: int("amountPiasters").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "transfer", "credit", "other"]).default("cash").notNull(),
  paidAt: timestamp("paidAt").notNull(),
  reference: varchar("reference", { length: 160 }),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("sale_payments_sale_idx").on(table.saleId, table.paidAt), index("sale_payments_farm_idx").on(table.farmId, table.paidAt)]);

export const saleActivities = mysqlTable("saleActivities", {
  id: int("id").autoincrement().primaryKey(),
  saleId: int("saleId").notNull(),
  farmId: int("farmId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  action: mysqlEnum("action", ["sale_started", "sale_updated", "sale_completed", "batch_added", "batch_updated", "batch_deleted", "batches_reordered", "payment_added", "sale_deleted"]).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("sale_activities_sale_date_idx").on(table.saleId, table.createdAt), index("sale_activities_farm_date_idx").on(table.farmId, table.createdAt)]);

// ────────────────────────────────────────────────────────────────
// Audit Logs — Comprehensive enterprise-grade system activity trail
// ────────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("auditLogs", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("audit_logs_company_idx").on(table.companyId),
  index("audit_logs_farm_idx").on(table.farmId),
  index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  index("audit_logs_user_date_idx").on(table.userId, table.createdAt),
]);

// ────────────────────────────────────────────────────────────────
// Smart Alerts & Notifications
// ────────────────────────────────────────────────────────────────
export const alerts = mysqlTable("alerts", {
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
    "system_notification",
  ]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("warning").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["active", "acknowledged", "resolved", "dismissed"]).default("active").notNull(),
  acknowledgedByUserId: int("acknowledgedByUserId"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("alerts_farm_status_idx").on(table.farmId, table.status),
  index("alerts_cycle_idx").on(table.cycleId),
  index("alerts_created_idx").on(table.createdAt),
]);

export const sensorReadings = mysqlTable("sensorReadings", {
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
    "light_lux",
  ]).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 30 }).notNull(),
  deviceId: varchar("deviceId", { length: 100 }),
  readingTime: timestamp("readingTime").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("sensor_readings_house_time_idx").on(table.houseId, table.readingTime),
  index("sensor_readings_farm_sensor_idx").on(table.farmId, table.sensorType),
]);

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Farm = typeof farms.$inferSelect;
export type Cycle = typeof cycles.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = typeof sensorReadings.$inferInsert;

