ALTER TABLE `feedInventoryTransactions` MODIFY COLUMN `bagDelta` decimal(12,4) NOT NULL;--> statement-breakpoint
ALTER TABLE `feedInventoryTransactions` ADD `dailyRecordId` int;--> statement-breakpoint
ALTER TABLE `feedInventoryTransactions` ADD CONSTRAINT `feed_inventory_transactions_daily_record_unique` UNIQUE(`dailyRecordId`);