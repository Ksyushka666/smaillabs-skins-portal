CREATE TABLE `minecraft_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`username` varchar(16) NOT NULL,
	`source` enum('mojang','namemc','tlauncher','manual') NOT NULL DEFAULT 'manual',
	`skinUrl` text,
	`skinHash` varchar(64),
	`model` enum('classic','slim') NOT NULL DEFAULT 'classic',
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `minecraft_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `minecraft_accounts_uuid_idx` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `skin_moderation_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`moderatorUserId` int NOT NULL,
	`decision` enum('approved','rejected','hidden') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skin_moderation_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skin_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`type` enum('skin','cape','accessory') NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`sourceUrl` text,
	`storageKey` varchar(255),
	`previewUrl` text,
	`hash` varchar(64),
	`model` enum('classic','slim'),
	`status` enum('draft','pending','published','rejected','archived') NOT NULL DEFAULT 'pending',
	`isPublic` boolean NOT NULL DEFAULT false,
	`priceCoins` int NOT NULL DEFAULT 0,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skin_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skin_loadout_accessories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loadoutId` int NOT NULL,
	`assetId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `skin_loadout_accessories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skin_loadouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`minecraftAccountId` int,
	`skinAssetId` int,
	`capeAssetId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skin_loadouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `skin_loadouts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `skin_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assetId` int NOT NULL,
	`priceCoins` int NOT NULL,
	`status` enum('completed','refunded','cancelled') NOT NULL DEFAULT 'completed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skin_purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `skin_purchases_user_asset_idx` UNIQUE(`userId`,`assetId`)
);
--> statement-breakpoint
CREATE TABLE `skin_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`reporterUserId` int NOT NULL,
	`reason` varchar(120) NOT NULL,
	`details` text,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skin_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skin_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`tag` varchar(48) NOT NULL,
	CONSTRAINT `skin_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `skin_tags_asset_tag_idx` UNIQUE(`assetId`,`tag`)
);
--> statement-breakpoint
ALTER TABLE `minecraft_accounts` ADD CONSTRAINT `minecraft_accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_moderation_actions` ADD CONSTRAINT `skin_moderation_actions_assetId_skin_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `skin_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_moderation_actions` ADD CONSTRAINT `skin_moderation_actions_moderatorUserId_users_id_fk` FOREIGN KEY (`moderatorUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_assets` ADD CONSTRAINT `skin_assets_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_loadout_accessories` ADD CONSTRAINT `skin_loadout_accessories_loadoutId_skin_loadouts_id_fk` FOREIGN KEY (`loadoutId`) REFERENCES `skin_loadouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_loadout_accessories` ADD CONSTRAINT `skin_loadout_accessories_assetId_skin_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `skin_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_loadouts` ADD CONSTRAINT `skin_loadouts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_loadouts` ADD CONSTRAINT `skin_loadouts_minecraftAccountId_minecraft_accounts_id_fk` FOREIGN KEY (`minecraftAccountId`) REFERENCES `minecraft_accounts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_loadouts` ADD CONSTRAINT `skin_loadouts_skinAssetId_skin_assets_id_fk` FOREIGN KEY (`skinAssetId`) REFERENCES `skin_assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_loadouts` ADD CONSTRAINT `skin_loadouts_capeAssetId_skin_assets_id_fk` FOREIGN KEY (`capeAssetId`) REFERENCES `skin_assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_purchases` ADD CONSTRAINT `skin_purchases_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_purchases` ADD CONSTRAINT `skin_purchases_assetId_skin_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `skin_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_reports` ADD CONSTRAINT `skin_reports_assetId_skin_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `skin_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_reports` ADD CONSTRAINT `skin_reports_reporterUserId_users_id_fk` FOREIGN KEY (`reporterUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_reports` ADD CONSTRAINT `skin_reports_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skin_tags` ADD CONSTRAINT `skin_tags_assetId_skin_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `skin_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `minecraft_accounts_user_idx` ON `minecraft_accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `skin_assets_catalog_idx` ON `skin_assets` (`status`,`type`,`isPublic`);--> statement-breakpoint
CREATE INDEX `skin_assets_owner_idx` ON `skin_assets` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `skin_loadout_accessories_loadout_idx` ON `skin_loadout_accessories` (`loadoutId`);