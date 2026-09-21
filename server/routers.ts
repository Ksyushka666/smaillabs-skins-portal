import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import crypto from "node:crypto";
import { z } from "zod";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "./db";
import {
  minecraftAccounts,
  moderationActions,
  skinAssets,
  skinLoadoutAccessories,
  skinLoadouts,
  skinReports,
  skinTags,
  users,
} from "../drizzle/schema";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Требуются права администратора" });
  }
  return next({ ctx });
});

const accountInput = z.object({
  uuid: z.string().regex(/^[0-9a-f]{32}$|^[0-9a-f-]{36}$/i),
  username: z.string().min(1).max(16),
  source: z.enum(["mojang", "namemc", "tlauncher", "manual"]).default("manual"),
  skinUrl: z.string().url().optional(),
  model: z.enum(["classic", "slim"]).default("classic"),
});

const assetInput = z.object({
  type: z.enum(["skin", "cape", "accessory"]),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  sourceUrl: z.string().url().refine(value => value.startsWith("https://"), "Требуется HTTPS URL").optional(),
  dataUrl: z.string().optional(),
  model: z.enum(["classic", "slim"]).optional(),
  tags: z.array(z.string().min(1).max(48)).max(20).default([]),
});

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not configured" });
  return db;
}

export function normalizeUuid(value: string) {
  const compact = value.replaceAll("-", "").toLowerCase();
  if (compact.length !== 32 || !/^[0-9a-f]+$/.test(compact)) throw new TRPCError({ code: "BAD_REQUEST", message: "Неверный Minecraft UUID" });
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

async function saveDataUrl(userId: number, dataUrl: string) {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Поддерживаются только PNG data URL" });
  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "PNG должен быть не больше 5 МБ" });
  const key = `minecraft/${userId}/${Date.now()}-${crypto.randomUUID()}.png`;
  return storagePut(key, buffer, "image/png");
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  minecraft: router({
    lookup: publicProcedure.input(z.object({ username: z.string().min(1).max(16) })).query(async ({ input }) => {
      const profileResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(input.username)}`);
      if (!profileResponse.ok) return null;
      const profile = await profileResponse.json() as { id: string; name: string };
      const sessionResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}`);
      if (!sessionResponse.ok) return { uuid: normalizeUuid(profile.id), username: profile.name, source: "mojang" as const, skinUrl: null, model: "classic" as const };
      const session = await sessionResponse.json() as { properties?: Array<{ name: string; value: string }> };
      const textureProperty = session.properties?.find(property => property.name === "textures");
      let skinUrl: string | null = null;
      let model: "classic" | "slim" = "classic";
      if (textureProperty) {
        try {
          const decoded = JSON.parse(Buffer.from(textureProperty.value, "base64").toString("utf8")) as { textures?: { SKIN?: { url?: string; metadata?: { model?: string } } } };
          skinUrl = decoded.textures?.SKIN?.url ?? null;
          model = decoded.textures?.SKIN?.metadata?.model === "slim" ? "slim" : "classic";
        } catch {
          // Invalid texture properties are ignored; the profile remains usable.
        }
      }
      return { uuid: normalizeUuid(profile.id), username: profile.name, source: "mojang" as const, skinUrl, model };
    }),
    profile: publicProcedure.input(z.object({ uuid: z.string() })).query(async ({ input }) => {
      const db = await requireDb();
      const normalized = normalizeUuid(input.uuid);
      const account = (await db.select().from(minecraftAccounts).where(eq(minecraftAccounts.uuid, normalized)).limit(1))[0];
      if (!account) return null;
      const loadout = (await db.select().from(skinLoadouts).where(eq(skinLoadouts.minecraftAccountId, account.id)).limit(1))[0];
      const skin = loadout?.skinAssetId ? (await db.select().from(skinAssets).where(and(eq(skinAssets.id, loadout.skinAssetId), eq(skinAssets.status, "published"))).limit(1))[0] : undefined;
      const cape = loadout?.capeAssetId ? (await db.select().from(skinAssets).where(and(eq(skinAssets.id, loadout.capeAssetId), eq(skinAssets.status, "published"))).limit(1))[0] : undefined;
      const accessories = loadout ? await db.select({ asset: skinAssets }).from(skinLoadoutAccessories).innerJoin(skinAssets, eq(skinAssets.id, skinLoadoutAccessories.assetId)).where(and(eq(skinLoadoutAccessories.loadoutId, loadout.id), eq(skinAssets.status, "published"))) : [];
      return {
        minecraftUuid: account.uuid,
        minecraftName: account.username,
        source: account.source,
        skin: skin ? { id: skin.id, url: skin.previewUrl ?? skin.sourceUrl, model: skin.model, hash: skin.hash } : { url: account.skinUrl, model: account.model, hash: account.skinHash },
        cape: cape ? { id: cape.id, url: cape.previewUrl ?? cape.sourceUrl } : null,
        accessories: accessories.map(item => ({ id: item.asset.id, url: item.asset.previewUrl ?? item.asset.sourceUrl, metadata: item.asset.metadata })),
      };
    }),
    link: protectedProcedure.input(accountInput).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const normalized = normalizeUuid(input.uuid);
      const existing = (await db.select().from(minecraftAccounts).where(eq(minecraftAccounts.uuid, normalized)).limit(1))[0];
      if (existing && existing.userId !== ctx.user.id) throw new TRPCError({ code: "CONFLICT", message: "Этот Minecraft-аккаунт уже привязан" });
      if (existing) {
        await db.update(minecraftAccounts).set({ username: input.username, source: input.source, skinUrl: input.skinUrl, model: input.model, lastSyncedAt: new Date() }).where(eq(minecraftAccounts.id, existing.id));
        return { ...existing, ...input, uuid: normalized };
      }
      const result = await db.insert(minecraftAccounts).values({ userId: ctx.user.id, uuid: normalized, username: input.username, source: input.source, skinUrl: input.skinUrl, model: input.model, lastSyncedAt: new Date() });
      return { id: Number(result[0].insertId), ...input, uuid: normalized };
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      return db.select().from(minecraftAccounts).where(eq(minecraftAccounts.userId, ctx.user.id));
    }),
  }),

  skins: router({
    catalog: publicProcedure.input(z.object({ type: z.enum(["skin", "cape", "accessory"]).optional(), limit: z.number().int().min(1).max(50).default(24) }).default({ limit: 24 })).query(async ({ input }) => {
      const db = await requireDb();
      const conditions = [eq(skinAssets.status, "published"), eq(skinAssets.isPublic, true)];
      if (input.type) conditions.push(eq(skinAssets.type, input.type));
      return db.select().from(skinAssets).where(and(...conditions)).orderBy(desc(skinAssets.createdAt)).limit(input.limit);
    }),
    create: protectedProcedure.input(assetInput).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      let storageKey: string | undefined;
      let previewUrl = input.sourceUrl;
      if (input.dataUrl) {
        const stored = await saveDataUrl(ctx.user.id, input.dataUrl);
        storageKey = stored.key;
        previewUrl = stored.url;
      }
      if (!storageKey && !input.sourceUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Нужен PNG-файл или HTTPS URL" });
      const result = await db.insert(skinAssets).values({ ownerUserId: ctx.user.id, type: input.type, name: input.name, description: input.description, sourceUrl: input.sourceUrl, storageKey, previewUrl, model: input.model, status: "pending", isPublic: false });
      const assetId = Number(result[0].insertId);
      for (const tag of input.tags) await db.insert(skinTags).values({ assetId, tag });
      return { id: assetId, status: "pending", previewUrl };
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int(), name: z.string().min(1).max(120).optional(), description: z.string().max(2000).optional(), priceCoins: z.number().int().min(0).max(1000000).optional(), isPublic: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.update(skinAssets).set({ name: input.name, description: input.description, priceCoins: input.priceCoins, isPublic: input.isPublic, updatedAt: new Date() }).where(and(eq(skinAssets.id, input.id), eq(skinAssets.ownerUserId, ctx.user.id)));
      return { updated: result[0].affectedRows > 0 };
    }),
    archive: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.update(skinAssets).set({ status: "archived", isPublic: false, updatedAt: new Date() }).where(and(eq(skinAssets.id, input.id), eq(skinAssets.ownerUserId, ctx.user.id)));
      return { archived: result[0].affectedRows > 0 };
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      return db.select().from(skinAssets).where(eq(skinAssets.ownerUserId, ctx.user.id)).orderBy(desc(skinAssets.createdAt));
    }),
  }),

  loadout: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      const loadout = (await db.select().from(skinLoadouts).where(eq(skinLoadouts.userId, ctx.user.id)).limit(1))[0];
      return loadout ?? null;
    }),
    set: protectedProcedure.input(z.object({ minecraftAccountId: z.number().int().optional(), skinAssetId: z.number().int().nullable(), capeAssetId: z.number().int().nullable(), accessoryAssetIds: z.array(z.number().int()).max(20).default([]) })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const published = input.accessoryAssetIds.length || input.skinAssetId || input.capeAssetId ? await db.select({ id: skinAssets.id }).from(skinAssets).where(and(inArray(skinAssets.id, [input.skinAssetId, input.capeAssetId, ...input.accessoryAssetIds].filter((id): id is number => typeof id === "number")), eq(skinAssets.status, "published"))) : [];
      const publishedIds = new Set(published.map(asset => asset.id));
      for (const id of [input.skinAssetId, input.capeAssetId, ...input.accessoryAssetIds]) if (typeof id === "number" && !publishedIds.has(id)) throw new TRPCError({ code: "BAD_REQUEST", message: "Можно экипировать только опубликованные ассеты" });
      const existing = (await db.select().from(skinLoadouts).where(eq(skinLoadouts.userId, ctx.user.id)).limit(1))[0];
      let loadoutId: number;
      if (existing) {
        await db.update(skinLoadouts).set({ minecraftAccountId: input.minecraftAccountId, skinAssetId: input.skinAssetId, capeAssetId: input.capeAssetId, updatedAt: new Date() }).where(eq(skinLoadouts.id, existing.id));
        loadoutId = existing.id;
        await db.delete(skinLoadoutAccessories).where(eq(skinLoadoutAccessories.loadoutId, loadoutId));
      } else {
        const inserted = await db.insert(skinLoadouts).values({ userId: ctx.user.id, minecraftAccountId: input.minecraftAccountId, skinAssetId: input.skinAssetId, capeAssetId: input.capeAssetId });
        loadoutId = Number(inserted[0].insertId);
      }
      for (let sortOrder = 0; sortOrder < input.accessoryAssetIds.length; sortOrder++) {
        const assetId = input.accessoryAssetIds[sortOrder];
        await db.insert(skinLoadoutAccessories).values({ loadoutId, assetId, sortOrder });
      }
      return { loadoutId, ...input };
    }),
  }),

  moderation: router({
    queue: adminProcedure.query(async () => {
      const db = await requireDb();
      return db.select().from(skinAssets).where(eq(skinAssets.status, "pending")).orderBy(skinAssets.createdAt);
    }),
    review: adminProcedure.input(z.object({ assetId: z.number().int(), decision: z.enum(["approved", "rejected", "hidden"]), note: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const nextStatus = input.decision === "approved" ? "published" : input.decision === "rejected" ? "rejected" : "archived";
      await db.update(skinAssets).set({ status: nextStatus, isPublic: input.decision === "approved", updatedAt: new Date() }).where(eq(skinAssets.id, input.assetId));
      await db.insert(moderationActions).values({ assetId: input.assetId, moderatorUserId: ctx.user.id, decision: input.decision, note: input.note });
      return { ok: true };
    }),
    report: protectedProcedure.input(z.object({ assetId: z.number().int(), reason: z.string().min(1).max(120), details: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(skinReports).values({ assetId: input.assetId, reporterUserId: ctx.user.id, reason: input.reason, details: input.details });
      return { id: Number(result[0].insertId) };
    }),
  }),
});

export type AppRouter = typeof appRouter;
