CREATE TABLE `workerAccountEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`workerId` int NOT NULL,
	`entryType` enum('salary_credit','advance','withdrawal','adjustment') NOT NULL,
	`amountPiasters` int NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`reference` varchar(160),
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workerAccountEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`jobTitle` varchar(140),
	`phone` varchar(40),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `worker_account_entries_worker_date_idx` ON `workerAccountEntries` (`workerId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `worker_account_entries_farm_date_idx` ON `workerAccountEntries` (`farmId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `workers_farm_active_idx` ON `workers` (`farmId`,`isActive`);