CREATE TABLE `saleActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleId` int NOT NULL,
	`farmId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`action` enum('sale_started','sale_updated','sale_completed','batch_added','batch_updated','batch_deleted','batches_reordered','payment_added','sale_deleted') NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saleActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `saleWeighBatches` MODIFY COLUMN `cageCount` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `salePayments` ADD `paymentMethod` enum('cash','transfer','credit','other') DEFAULT 'cash' NOT NULL;--> statement-breakpoint
ALTER TABLE `saleWeighBatches` ADD `birdCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `saleWeighBatches` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `saleWeighBatches` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `sales` ADD `weighingMode` enum('fixed','variable','direct') DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `birdsPerCage` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `discountPiasters` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `traders` ADD `companyName` varchar(180);--> statement-breakpoint
CREATE INDEX `sale_activities_sale_date_idx` ON `saleActivities` (`saleId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `sale_activities_farm_date_idx` ON `saleActivities` (`farmId`,`createdAt`);
