CREATE TABLE `farmExpenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`cycleId` int,
	`category` enum('chicks','feed','health','labor','utilities','maintenance','transport','equipment','other') NOT NULL,
	`amountPiasters` int NOT NULL,
	`expenseDate` timestamp NOT NULL,
	`supplier` varchar(180),
	`reference` varchar(160),
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farmExpenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `expenses_farm_date_idx` ON `farmExpenses` (`farmId`,`expenseDate`);--> statement-breakpoint
CREATE INDEX `expenses_cycle_date_idx` ON `farmExpenses` (`cycleId`,`expenseDate`);