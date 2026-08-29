CREATE TABLE `saleWeighBatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleId` int NOT NULL,
	`sequence` int NOT NULL,
	`cageCount` int NOT NULL,
	`grossWeightGrams` int NOT NULL,
	`tareWeightGrams` int NOT NULL,
	`netWeightGrams` int NOT NULL,
	`totalPiasters` int NOT NULL,
	`weighedAt` timestamp NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saleWeighBatches_id` PRIMARY KEY(`id`),
	CONSTRAINT `sale_batch_sequence_unique` UNIQUE(`saleId`,`sequence`)
);
--> statement-breakpoint
ALTER TABLE `sales` ADD `plannedCageCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `batchCageCount` int DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `status` enum('open','closed') DEFAULT 'open' NOT NULL;--> statement-breakpoint
CREATE INDEX `sale_batches_sale_date_idx` ON `saleWeighBatches` (`saleId`,`weighedAt`);