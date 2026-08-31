-- =================================================================
-- BroilFarm ERP Enterprise Database Schema (MySQL 8.0+ / MariaDB)
-- =================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Companies table
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `legalName` VARCHAR(255),
  `registrationNumber` VARCHAR(100),
  `taxId` VARCHAR(100),
  `phone` VARCHAR(40),
  `email` VARCHAR(320),
  `address` TEXT,
  `governorate` VARCHAR(100),
  `status` ENUM('active', 'suspended', 'trial') NOT NULL DEFAULT 'trial',
  `subscriptionPlan` ENUM('free', 'starter', 'pro', 'business', 'enterprise') NOT NULL DEFAULT 'free',
  `maxFarms` INT NOT NULL DEFAULT 1,
  `maxUsersPerFarm` INT NOT NULL DEFAULT 5,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openId` VARCHAR(64) NOT NULL UNIQUE,
  `companyId` INT,
  `name` TEXT,
  `email` VARCHAR(320),
  `phone` VARCHAR(40),
  `passwordHash` VARCHAR(255),
  `isEmailVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  `loginMethod` VARCHAR(64),
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `users_company_idx` (`companyId`),
  INDEX `users_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Farms table
CREATE TABLE IF NOT EXISTS `farms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT,
  `ownerId` INT NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `governorate` VARCHAR(100),
  `location` TEXT,
  `latitude` DECIMAL(9, 6),
  `longitude` DECIMAL(9, 6),
  `locationSource` ENUM('manual', 'device') NOT NULL DEFAULT 'manual',
  `status` ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `farms_owner_idx` (`ownerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Houses table
CREATE TABLE IF NOT EXISTS `houses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 0,
  `status` ENUM('empty', 'preparing', 'active', 'cleaning', 'maintenance') NOT NULL DEFAULT 'empty',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `houses_farm_idx` (`farmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Cycles table
CREATE TABLE IF NOT EXISTS `cycles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `houseId` INT,
  `name` VARCHAR(180) NOT NULL,
  `status` ENUM('draft', 'upcoming', 'active', 'closed') NOT NULL DEFAULT 'upcoming',
  `placementDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `birdsPlaced` INT NOT NULL,
  `targetMarketWeight` INT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `cycles_farm_idx` (`farmId`),
  INDEX `cycles_house_idx` (`houseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Cycle House Assignments
CREATE TABLE IF NOT EXISTS `cycleHouseAssignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cycleId` INT NOT NULL,
  `houseId` INT NOT NULL,
  `assignedBirds` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `cycle_house_assignment_unique` (`cycleId`, `houseId`),
  INDEX `assignments_cycle_idx` (`cycleId`),
  INDEX `assignments_house_idx` (`houseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Cage Sections
CREATE TABLE IF NOT EXISTS `cageSections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `houseId` INT NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `rowName` VARCHAR(100) NOT NULL,
  `cageCount` INT NOT NULL,
  `capacityPerCage` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `cages_house_idx` (`houseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Daily Records
CREATE TABLE IF NOT EXISTS `dailyRecords` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cycleId` INT NOT NULL,
  `houseId` INT,
  `cageSectionId` INT,
  `recordDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `feedKg` INT NOT NULL DEFAULT 0,
  `waterLiters` INT NOT NULL DEFAULT 0,
  `mortality` INT NOT NULL DEFAULT 0,
  `culls` INT NOT NULL DEFAULT 0,
  `notes` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `records_cycle_date_idx` (`cycleId`, `recordDate`),
  INDEX `records_house_date_idx` (`houseId`, `recordDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Health Events
CREATE TABLE IF NOT EXISTS `healthEvents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cycleId` INT NOT NULL,
  `houseId` INT,
  `eventDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `eventType` ENUM('medication', 'vaccination') NOT NULL,
  `productName` VARCHAR(180) NOT NULL,
  `dosage` VARCHAR(180) NOT NULL,
  `administrationRoute` VARCHAR(120),
  `notes` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `health_cycle_date_idx` (`cycleId`, `eventDate`),
  INDEX `health_house_date_idx` (`houseId`, `eventDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Weight Samples
CREATE TABLE IF NOT EXISTS `weightSamples` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cycleId` INT NOT NULL,
  `houseId` INT,
  `sampleDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `averageWeightGrams` INT NOT NULL,
  `sampleSize` INT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `weights_cycle_date_idx` (`cycleId`, `sampleDate`),
  INDEX `weights_house_date_idx` (`houseId`, `sampleDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Cycle Cage Occupancy
CREATE TABLE IF NOT EXISTS `cycleCageOccupancy` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cycleId` INT NOT NULL,
  `cageSectionId` INT NOT NULL,
  `occupiedBirds` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `occupancy_cycle_section_unique` (`cycleId`, `cageSectionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Farm Memberships
CREATE TABLE IF NOT EXISTS `farmMemberships` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `farmId` INT NOT NULL,
  `role` ENUM('general_manager', 'farm_manager', 'veterinarian', 'engineer', 'supervisor', 'accountant', 'worker', 'viewer') NOT NULL,
  `houseId` INT,
  `cycleId` INT,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `membership_user_farm_unique` (`userId`, `farmId`),
  INDEX `memberships_user_idx` (`userId`),
  INDEX `memberships_farm_idx` (`farmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Invitation Codes
CREATE TABLE IF NOT EXISTS `invitationCodes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `houseId` INT,
  `cycleId` INT,
  `createdByUserId` INT NOT NULL,
  `codeHash` VARCHAR(64) NOT NULL UNIQUE,
  `codePrefix` VARCHAR(22) NOT NULL,
  `role` ENUM('general_manager', 'farm_manager', 'veterinarian', 'engineer', 'supervisor', 'accountant', 'worker', 'viewer') NOT NULL,
  `maxUses` INT NOT NULL DEFAULT 1,
  `usedCount` INT NOT NULL DEFAULT 0,
  `expiresAt` TIMESTAMP NULL,
  `status` ENUM('active', 'revoked', 'expired', 'used') NOT NULL DEFAULT 'active',
  `notes` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `invitation_code_hash_unique` (`codeHash`),
  INDEX `invitations_farm_idx` (`farmId`),
  INDEX `invitations_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Feed Inventory Settings
CREATE TABLE IF NOT EXISTS `feedInventorySettings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL UNIQUE,
  `bagWeightKg` INT NOT NULL DEFAULT 50,
  `reorderPointBags` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `feed_inventory_settings_farm_unique` (`farmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Feed Inventory Transactions
CREATE TABLE IF NOT EXISTS `feedInventoryTransactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `dailyRecordId` INT UNIQUE,
  `movementType` ENUM('opening', 'receipt', 'issue', 'adjustment') NOT NULL,
  `bagDelta` DECIMAL(12, 4) NOT NULL,
  `occurredAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reference` VARCHAR(160),
  `notes` TEXT,
  `createdByUserId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `feed_inventory_transactions_farm_date_idx` (`farmId`, `occurredAt`),
  UNIQUE KEY `feed_inventory_transactions_daily_record_unique` (`dailyRecordId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Farm Expenses
CREATE TABLE IF NOT EXISTS `farmExpenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `cycleId` INT,
  `category` ENUM('chicks', 'feed', 'health', 'labor', 'utilities', 'maintenance', 'transport', 'equipment', 'other') NOT NULL,
  `amountPiasters` INT NOT NULL,
  `expenseDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `supplier` VARCHAR(180),
  `reference` VARCHAR(160),
  `notes` TEXT,
  `approvalStatus` ENUM('pending', 'approved', 'rejected', 'paid') NOT NULL DEFAULT 'approved',
  `approvedByUserId` INT,
  `approvedAt` TIMESTAMP NULL,
  `rejectionReason` TEXT,
  `createdByUserId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `expenses_farm_date_idx` (`farmId`, `expenseDate`),
  INDEX `expenses_cycle_date_idx` (`cycleId`, `expenseDate`),
  INDEX `expenses_status_idx` (`approvalStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Medicine Inventory
CREATE TABLE IF NOT EXISTS `medicineInventory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `productName` VARCHAR(255) NOT NULL,
  `category` ENUM('vaccine', 'antibiotic', 'vitamin', 'disinfectant', 'supplement', 'other') NOT NULL DEFAULT 'other',
  `batchNumber` VARCHAR(100),
  `expiryDate` DATE NULL,
  `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'عبوة',
  `unitCostPiasters` INT NOT NULL DEFAULT 0,
  `reorderPoint` DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  `notes` TEXT,
  `createdByUserId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `medicine_inventory_farm_idx` (`farmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Workers
CREATE TABLE IF NOT EXISTS `workers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `jobTitle` VARCHAR(140),
  `phone` VARCHAR(40),
  `notes` TEXT,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdByUserId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `workers_farm_active_idx` (`farmId`, `isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Worker Account Entries
CREATE TABLE IF NOT EXISTS `workerAccountEntries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `workerId` INT NOT NULL,
  `entryType` ENUM('salary_credit', 'advance', 'withdrawal', 'adjustment') NOT NULL,
  `amountPiasters` INT NOT NULL,
  `occurredAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reference` VARCHAR(160),
  `notes` TEXT,
  `createdByUserId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `worker_account_entries_worker_date_idx` (`workerId`, `occurredAt`),
  INDEX `worker_account_entries_farm_date_idx` (`farmId`, `occurredAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Traders
CREATE TABLE IF NOT EXISTS `traders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `phone` VARCHAR(40),
  `companyName` VARCHAR(180),
  `address` VARCHAR(300),
  `notes` TEXT,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `traders_farm_idx` (`farmId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Sales
CREATE TABLE IF NOT EXISTS `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `cycleId` INT NOT NULL,
  `traderId` INT NOT NULL,
  `saleDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `grossWeightGrams` INT NOT NULL,
  `loadedCageCount` INT NOT NULL,
  `plannedCageCount` INT NOT NULL DEFAULT 0,
  `batchCageCount` INT NOT NULL DEFAULT 5,
  `weighingMode` ENUM('fixed', 'variable', 'direct') NOT NULL DEFAULT 'fixed',
  `birdsPerCage` INT NOT NULL DEFAULT 0,
  `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  `tareWeightGrams` INT NOT NULL,
  `tareCageCount` INT NOT NULL,
  `netWeightGrams` INT NOT NULL,
  `pricePerKgPiasters` INT NOT NULL,
  `totalPiasters` INT NOT NULL,
  `discountPiasters` INT NOT NULL DEFAULT 0,
  `isDeleted` BOOLEAN NOT NULL DEFAULT FALSE,
  `deletedAt` TIMESTAMP NULL,
  `reference` VARCHAR(160),
  `notes` TEXT,
  `createdByUserId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `sales_farm_date_idx` (`farmId`, `saleDate`),
  INDEX `sales_cycle_date_idx` (`cycleId`, `saleDate`),
  INDEX `sales_trader_idx` (`traderId`),
  INDEX `sales_is_deleted_idx` (`isDeleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Sale Weigh Batches
CREATE TABLE IF NOT EXISTS `saleWeighBatches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `saleId` INT NOT NULL,
  `sequence` INT NOT NULL,
  `weighingStage` ENUM('tare_pending', 'filled') NOT NULL DEFAULT 'filled',
  `cageCount` INT NOT NULL DEFAULT 0,
  `birdCount` INT NOT NULL DEFAULT 0,
  `grossWeightGrams` INT NOT NULL,
  `tareWeightGrams` INT NOT NULL,
  `netWeightGrams` INT NOT NULL,
  `totalPiasters` INT NOT NULL,
  `weighedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT,
  `createdByUserId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `sale_batch_sequence_unique` (`saleId`, `sequence`),
  INDEX `sale_batches_sale_date_idx` (`saleId`, `weighedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Sale Payments
CREATE TABLE IF NOT EXISTS `salePayments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `saleId` INT NOT NULL,
  `farmId` INT NOT NULL,
  `amountPiasters` INT NOT NULL,
  `paymentMethod` ENUM('cash', 'transfer', 'credit', 'other') NOT NULL DEFAULT 'cash',
  `paidAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reference` VARCHAR(160),
  `notes` TEXT,
  `createdByUserId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `sale_payments_sale_idx` (`saleId`, `paidAt`),
  INDEX `sale_payments_farm_idx` (`farmId`, `paidAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Sale Activities
CREATE TABLE IF NOT EXISTS `saleActivities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `saleId` INT NOT NULL,
  `farmId` INT NOT NULL,
  `actorUserId` INT NOT NULL,
  `action` ENUM('sale_started', 'sale_updated', 'sale_completed', 'batch_added', 'batch_updated', 'batch_deleted', 'batches_reordered', 'payment_added', 'sale_deleted') NOT NULL,
  `details` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `sale_activities_sale_date_idx` (`saleId`, `createdAt`),
  INDEX `sale_activities_farm_date_idx` (`farmId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Audit Logs
CREATE TABLE IF NOT EXISTS `auditLogs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT,
  `farmId` INT,
  `cycleId` INT,
  `userId` INT NOT NULL,
  `entityType` VARCHAR(64) NOT NULL,
  `entityId` INT NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `oldValues` TEXT,
  `newValues` TEXT,
  `details` TEXT,
  `ipAddress` VARCHAR(45),
  `userAgent` VARCHAR(255),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `audit_logs_company_idx` (`companyId`),
  INDEX `audit_logs_farm_idx` (`farmId`),
  INDEX `audit_logs_entity_idx` (`entityType`, `entityId`),
  INDEX `audit_logs_user_date_idx` (`userId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Alerts
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT,
  `farmId` INT NOT NULL,
  `cycleId` INT,
  `houseId` INT,
  `alertType` ENUM('high_mortality', 'low_weight', 'abnormal_fcr', 'low_feed_stock', 'vaccine_due', 'water_consumption_anomaly', 'missing_daily_record', 'system_notification') NOT NULL,
  `severity` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'warning',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('active', 'acknowledged', 'resolved', 'dismissed') NOT NULL DEFAULT 'active',
  `acknowledgedByUserId` INT,
  `acknowledgedAt` TIMESTAMP NULL,
  `resolvedAt` TIMESTAMP NULL,
  `metadata` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `alerts_farm_status_idx` (`farmId`, `status`),
  INDEX `alerts_cycle_idx` (`cycleId`),
  INDEX `alerts_created_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. Sensor Readings
CREATE TABLE IF NOT EXISTS `sensorReadings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmId` INT NOT NULL,
  `houseId` INT NOT NULL,
  `sensorType` ENUM('temperature', 'humidity', 'ammonia_nh3', 'co2', 'static_pressure', 'water_flow', 'light_lux') NOT NULL,
  `value` DECIMAL(10, 2) NOT NULL,
  `unit` VARCHAR(30) NOT NULL,
  `deviceId` VARCHAR(100),
  `readingTime` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `sensor_readings_house_time_idx` (`houseId`, `readingTime`),
  INDEX `sensor_readings_farm_sensor_idx` (`farmId`, `sensorType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Incremental column migrations for pre-existing tables
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyId` INT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `passwordHash` VARCHAR(255) NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phone` VARCHAR(40) NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `isEmailVerified` BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `loginMethod` VARCHAR(64) NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user';
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `farms` ADD COLUMN IF NOT EXISTS `companyId` INT NULL;

ALTER TABLE `farmExpenses` ADD COLUMN IF NOT EXISTS `approvalStatus` ENUM('pending', 'approved', 'rejected', 'paid') NOT NULL DEFAULT 'approved';
ALTER TABLE `farmExpenses` ADD COLUMN IF NOT EXISTS `approvedByUserId` INT NULL;
ALTER TABLE `farmExpenses` ADD COLUMN IF NOT EXISTS `approvedAt` TIMESTAMP NULL;
ALTER TABLE `farmExpenses` ADD COLUMN IF NOT EXISTS `rejectionReason` TEXT NULL;

ALTER TABLE `sales` ADD COLUMN IF NOT EXISTS `isDeleted` BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE `sales` ADD COLUMN IF NOT EXISTS `deletedAt` TIMESTAMP NULL;

SET FOREIGN_KEY_CHECKS = 1;
