CREATE TABLE `cageSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`houseId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`rowName` varchar(100) NOT NULL,
	`cageCount` int NOT NULL,
	`capacityPerCage` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cageSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`houseId` int,
	`name` varchar(180) NOT NULL,
	`status` enum('draft','upcoming','active','closed') NOT NULL DEFAULT 'upcoming',
	`placementDate` timestamp NOT NULL,
	`birdsPlaced` int NOT NULL,
	`targetMarketWeight` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`cageSectionId` int,
	`recordDate` timestamp NOT NULL,
	`feedKg` int NOT NULL DEFAULT 0,
	`waterLiters` int NOT NULL DEFAULT 0,
	`mortality` int NOT NULL DEFAULT 0,
	`culls` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`governorate` varchar(100),
	`location` text,
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `healthEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`eventDate` timestamp NOT NULL,
	`eventType` enum('medication','vaccination') NOT NULL,
	`productName` varchar(180) NOT NULL,
	`dosage` varchar(180) NOT NULL,
	`administrationRoute` varchar(120),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `healthEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `houses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`capacity` int NOT NULL DEFAULT 0,
	`status` enum('empty','preparing','active','cleaning','maintenance') NOT NULL DEFAULT 'empty',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `houses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weightSamples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`sampleDate` timestamp NOT NULL,
	`averageWeightGrams` int NOT NULL,
	`sampleSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weightSamples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `cages_house_idx` ON `cageSections` (`houseId`);--> statement-breakpoint
CREATE INDEX `cycles_farm_idx` ON `cycles` (`farmId`);--> statement-breakpoint
CREATE INDEX `cycles_house_idx` ON `cycles` (`houseId`);--> statement-breakpoint
CREATE INDEX `records_cycle_date_idx` ON `dailyRecords` (`cycleId`,`recordDate`);--> statement-breakpoint
CREATE INDEX `farms_owner_idx` ON `farms` (`ownerId`);--> statement-breakpoint
CREATE INDEX `health_cycle_date_idx` ON `healthEvents` (`cycleId`,`eventDate`);--> statement-breakpoint
CREATE INDEX `houses_farm_idx` ON `houses` (`farmId`);--> statement-breakpoint
CREATE INDEX `weights_cycle_date_idx` ON `weightSamples` (`cycleId`,`sampleDate`);