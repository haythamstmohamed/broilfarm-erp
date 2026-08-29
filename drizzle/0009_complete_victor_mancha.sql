CREATE TABLE `salePayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleId` int NOT NULL,
	`farmId` int NOT NULL,
	`amountPiasters` int NOT NULL,
	`paidAt` timestamp NOT NULL,
	`reference` varchar(160),
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salePayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`cycleId` int NOT NULL,
	`traderId` int NOT NULL,
	`saleDate` timestamp NOT NULL,
	`grossWeightGrams` int NOT NULL,
	`loadedCageCount` int NOT NULL,
	`tareWeightGrams` int NOT NULL,
	`tareCageCount` int NOT NULL,
	`netWeightGrams` int NOT NULL,
	`pricePerKgPiasters` int NOT NULL,
	`totalPiasters` int NOT NULL,
	`reference` varchar(160),
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `traders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`phone` varchar(40),
	`address` varchar(300),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `traders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sale_payments_sale_idx` ON `salePayments` (`saleId`,`paidAt`);--> statement-breakpoint
CREATE INDEX `sale_payments_farm_idx` ON `salePayments` (`farmId`,`paidAt`);--> statement-breakpoint
CREATE INDEX `sales_farm_date_idx` ON `sales` (`farmId`,`saleDate`);--> statement-breakpoint
CREATE INDEX `sales_cycle_date_idx` ON `sales` (`cycleId`,`saleDate`);--> statement-breakpoint
CREATE INDEX `sales_trader_idx` ON `sales` (`traderId`);--> statement-breakpoint
CREATE INDEX `traders_farm_idx` ON `traders` (`farmId`);