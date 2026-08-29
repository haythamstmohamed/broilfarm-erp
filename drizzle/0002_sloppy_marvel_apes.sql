CREATE TABLE `cycleCageOccupancy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`cageSectionId` int NOT NULL,
	`occupiedBirds` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cycleCageOccupancy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `occupancy_cycle_section_idx` ON `cycleCageOccupancy` (`cycleId`,`cageSectionId`);