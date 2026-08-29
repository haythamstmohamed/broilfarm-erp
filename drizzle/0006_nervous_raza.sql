CREATE TABLE `cycleHouseAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`houseId` int NOT NULL,
	`assignedBirds` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cycleHouseAssignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `cycle_house_assignment_unique` UNIQUE(`cycleId`,`houseId`)
);
--> statement-breakpoint
ALTER TABLE `dailyRecords` ADD `houseId` int;--> statement-breakpoint
ALTER TABLE `healthEvents` ADD `houseId` int;--> statement-breakpoint
ALTER TABLE `weightSamples` ADD `houseId` int;--> statement-breakpoint
CREATE INDEX `assignments_cycle_idx` ON `cycleHouseAssignments` (`cycleId`);--> statement-breakpoint
CREATE INDEX `assignments_house_idx` ON `cycleHouseAssignments` (`houseId`);--> statement-breakpoint
CREATE INDEX `records_house_date_idx` ON `dailyRecords` (`houseId`,`recordDate`);--> statement-breakpoint
CREATE INDEX `health_house_date_idx` ON `healthEvents` (`houseId`,`eventDate`);--> statement-breakpoint
CREATE INDEX `weights_house_date_idx` ON `weightSamples` (`houseId`,`sampleDate`);