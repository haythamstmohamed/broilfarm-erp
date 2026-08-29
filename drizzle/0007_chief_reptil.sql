CREATE TABLE `feedInventorySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`bagWeightKg` int NOT NULL DEFAULT 50,
	`reorderPointBags` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedInventorySettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `feed_inventory_settings_farm_unique` UNIQUE(`farmId`)
);
--> statement-breakpoint
CREATE TABLE `feedInventoryTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`movementType` enum('opening','receipt','issue','adjustment') NOT NULL,
	`bagDelta` int NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`reference` varchar(160),
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedInventoryTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `feed_inventory_transactions_farm_date_idx` ON `feedInventoryTransactions` (`farmId`,`occurredAt`);