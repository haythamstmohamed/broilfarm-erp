CREATE TABLE `farmWeatherDays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`weatherDate` date NOT NULL,
	`weatherCode` int NOT NULL,
	`currentTemperature` decimal(5,1),
	`temperatureHigh` decimal(5,1) NOT NULL,
	`temperatureLow` decimal(5,1) NOT NULL,
	`humidity` int,
	`windSpeed` decimal(5,1),
	`apparentTemperature` decimal(5,1),
	`source` varchar(40) NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `farmWeatherDays_id` PRIMARY KEY(`id`),
	CONSTRAINT `weather_farm_date_unique` UNIQUE(`farmId`,`weatherDate`)
);
--> statement-breakpoint
ALTER TABLE `farms` ADD `latitude` decimal(9,6);--> statement-breakpoint
ALTER TABLE `farms` ADD `longitude` decimal(9,6);--> statement-breakpoint
ALTER TABLE `farms` ADD `locationSource` enum('manual','device') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
CREATE INDEX `weather_farm_date_idx` ON `farmWeatherDays` (`farmId`,`weatherDate`);