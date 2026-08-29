CREATE TABLE `farmMemberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmId` int NOT NULL,
	`role` enum('farm_manager','veterinarian','engineer','worker') NOT NULL,
	`houseId` int,
	`cycleId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farmMemberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_user_farm_unique` UNIQUE(`userId`,`farmId`)
);
--> statement-breakpoint
CREATE TABLE `invitationCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`houseId` int,
	`cycleId` int,
	`createdByUserId` int NOT NULL,
	`codeHash` varchar(64) NOT NULL,
	`codePrefix` varchar(22) NOT NULL,
	`role` enum('farm_manager','veterinarian','engineer','worker') NOT NULL,
	`maxUses` int NOT NULL DEFAULT 1,
	`usedCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`status` enum('active','revoked','expired','used') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitationCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitation_code_hash_unique` UNIQUE(`codeHash`)
);
--> statement-breakpoint
CREATE INDEX `memberships_user_idx` ON `farmMemberships` (`userId`);--> statement-breakpoint
CREATE INDEX `memberships_farm_idx` ON `farmMemberships` (`farmId`);--> statement-breakpoint
CREATE INDEX `invitations_farm_idx` ON `invitationCodes` (`farmId`);--> statement-breakpoint
CREATE INDEX `invitations_status_idx` ON `invitationCodes` (`status`);