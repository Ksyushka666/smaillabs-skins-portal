import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const minecraftAccounts = mysqlTable(
  "minecraft_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    uuid: varchar("uuid", { length: 36 }).notNull(),
    username: varchar("username", { length: 16 }).notNull(),
    source: mysqlEnum("source", ["mojang", "namemc", "tlauncher", "manual"]).default("manual").notNull(),
    skinUrl: text("skinUrl"),
    skinHash: varchar("skinHash", { length: 64 }),
    model: mysqlEnum("model", ["classic", "slim"]).default("classic").notNull(),
    lastSyncedAt: timestamp("lastSyncedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    uuidIdx: uniqueIndex("minecraft_accounts_uuid_idx").on(table.uuid),
    userIdx: index("minecraft_accounts_user_idx").on(table.userId),
  })
);

export type MinecraftAccount = typeof minecraftAccounts.$inferSelect;

export const skinAssets = mysqlTable(
  "skin_assets",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerUserId: int("ownerUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["skin", "cape", "accessory"]).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    sourceUrl: text("sourceUrl"),
    storageKey: varchar("storageKey", { length: 255 }),
    previewUrl: text("previewUrl"),
    hash: varchar("hash", { length: 64 }),
    model: mysqlEnum("model", ["classic", "slim"]),
    status: mysqlEnum("status", ["draft", "pending", "published", "rejected", "archived"]).default("pending").notNull(),
    isPublic: boolean("isPublic").default(false).notNull(),
    priceCoins: int("priceCoins").default(0).notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    catalogIdx: index("skin_assets_catalog_idx").on(table.status, table.type, table.isPublic),
    ownerIdx: index("skin_assets_owner_idx").on(table.ownerUserId),
  })
);

export type SkinAsset = typeof skinAssets.$inferSelect;
export type InsertSkinAsset = typeof skinAssets.$inferInsert;

export const skinLoadouts = mysqlTable("skin_loadouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  minecraftAccountId: int("minecraftAccountId").references(() => minecraftAccounts.id, { onDelete: "set null" }),
  skinAssetId: int("skinAssetId").references(() => skinAssets.id, { onDelete: "set null" }),
  capeAssetId: int("capeAssetId").references(() => skinAssets.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const skinLoadoutAccessories = mysqlTable(
  "skin_loadout_accessories",
  {
    id: int("id").autoincrement().primaryKey(),
    loadoutId: int("loadoutId").notNull().references(() => skinLoadouts.id, { onDelete: "cascade" }),
    assetId: int("assetId").notNull().references(() => skinAssets.id, { onDelete: "cascade" }),
    sortOrder: int("sortOrder").default(0).notNull(),
  },
  table => ({
    loadoutIdx: index("skin_loadout_accessories_loadout_idx").on(table.loadoutId),
  })
);

export const skinTags = mysqlTable(
  "skin_tags",
  {
    id: int("id").autoincrement().primaryKey(),
    assetId: int("assetId").notNull().references(() => skinAssets.id, { onDelete: "cascade" }),
    tag: varchar("tag", { length: 48 }).notNull(),
  },
  table => ({
    assetTagIdx: uniqueIndex("skin_tags_asset_tag_idx").on(table.assetId, table.tag),
  })
);

export const skinPurchases = mysqlTable(
  "skin_purchases",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    assetId: int("assetId").notNull().references(() => skinAssets.id, { onDelete: "cascade" }),
    priceCoins: int("priceCoins").notNull(),
    status: mysqlEnum("status", ["completed", "refunded", "cancelled"]).default("completed").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    purchaseIdx: uniqueIndex("skin_purchases_user_asset_idx").on(table.userId, table.assetId),
  })
);

export const skinReports = mysqlTable("skin_reports", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull().references(() => skinAssets.id, { onDelete: "cascade" }),
  reporterUserId: int("reporterUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: varchar("reason", { length: 120 }).notNull(),
  details: text("details"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const moderationActions = mysqlTable("skin_moderation_actions", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull().references(() => skinAssets.id, { onDelete: "cascade" }),
  moderatorUserId: int("moderatorUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
  decision: mysqlEnum("decision", ["approved", "rejected", "hidden"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
