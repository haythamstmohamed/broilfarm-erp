ALTER TABLE `sales` ADD `isDeleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `deletedAt` timestamp;