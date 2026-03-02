// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var uptimeChecks = mysqlTable("uptime_checks", {
  id: int("id").autoincrement().primaryKey(),
  siteUrl: varchar("site_url", { length: 255 }).notNull(),
  statusCode: int("status_code"),
  responseTime: int("response_time"),
  // em ms
  isOnline: int("is_online").notNull().default(1),
  errorMessage: text("error_message"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  siteUrl: varchar("site_url", { length: 255 }).notNull(),
  lcp: int("lcp"),
  // Largest Contentful Paint em ms
  fid: int("fid"),
  // First Input Delay em ms
  cls: int("cls"),
  // Cumulative Layout Shift (x1000)
  ttfb: int("ttfb"),
  // Time to First Byte em ms
  score: int("score"),
  // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var seoAnalysis = mysqlTable("seo_analysis", {
  id: int("id").autoincrement().primaryKey(),
  siteUrl: varchar("site_url", { length: 255 }).notNull(),
  score: int("score"),
  // 0-100
  hasMetaDescription: int("has_meta_description").notNull().default(0),
  hasOpenGraph: int("has_open_graph").notNull().default(0),
  hasSchemaOrg: int("has_schema_org").notNull().default(0),
  hasSitemap: int("has_sitemap").notNull().default(0),
  hasRobotsTxt: int("has_robots_txt").notNull().default(0),
  issues: text("issues"),
  // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var codeSuggestions = mysqlTable("code_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  repositoryUrl: varchar("repository_url", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 255 }).notNull(),
  suggestion: text("suggestion").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  // performance, security, accessibility, etc
  status: mysqlEnum("status", ["pending", "reviewed", "implemented", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var chatbotConversations = mysqlTable("chatbot_conversations", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitor_id", { length: 100 }).notNull(),
  visitorEmail: varchar("visitor_email", { length: 320 }),
  visitorName: varchar("visitor_name", { length: 255 }),
  messages: text("messages"),
  // JSON array
  status: mysqlEnum("status", ["active", "closed", "transferred"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var agentConfig = mysqlTable("agent_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createUptimeCheck(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(uptimeChecks).values(data);
}
async function getLatestUptimeChecks(siteUrl, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(uptimeChecks).where(eq(uptimeChecks.siteUrl, siteUrl)).orderBy(desc(uptimeChecks.createdAt)).limit(limit);
}
async function createPerformanceMetric(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(performanceMetrics).values(data);
}
async function getLatestPerformanceMetrics(siteUrl, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(performanceMetrics).where(eq(performanceMetrics.siteUrl, siteUrl)).orderBy(desc(performanceMetrics.createdAt)).limit(limit);
}
async function createSeoAnalysis(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(seoAnalysis).values(data);
}
async function getLatestSeoAnalysis(siteUrl) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(seoAnalysis).where(eq(seoAnalysis.siteUrl, siteUrl)).orderBy(desc(seoAnalysis.createdAt)).limit(1);
  return result[0];
}
async function createCodeSuggestion(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(codeSuggestions).values(data);
}
async function getCodeSuggestions(repositoryUrl, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(codeSuggestions.repositoryUrl, repositoryUrl)];
  if (status) {
    conditions.push(eq(codeSuggestions.status, status));
  }
  return db.select().from(codeSuggestions).where(eq(codeSuggestions.repositoryUrl, repositoryUrl)).orderBy(desc(codeSuggestions.createdAt));
}
async function createChatbotConversation(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(chatbotConversations).values(data);
}
async function getChatbotConversation(visitorId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(chatbotConversations).where(eq(chatbotConversations.visitorId, visitorId)).orderBy(desc(chatbotConversations.updatedAt)).limit(1);
  return result[0];
}
async function updateChatbotConversation(visitorId, messages, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { messages: JSON.stringify(messages), updatedAt: /* @__PURE__ */ new Date() };
  if (status) updateData.status = status;
  return db.update(chatbotConversations).set(updateData).where(eq(chatbotConversations.visitorId, visitorId));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/monitoring.ts
import { z as z2 } from "zod";

// server/services/uptime.ts
async function checkUptime(siteUrl) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    const response = await fetch(siteUrl, {
      method: "HEAD",
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    await createUptimeCheck({
      siteUrl,
      statusCode: response.status,
      responseTime,
      isOnline: response.ok ? 1 : 0,
      errorMessage: null
    });
    return {
      isOnline: response.ok,
      statusCode: response.status,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await createUptimeCheck({
      siteUrl,
      statusCode: null,
      responseTime,
      isOnline: 0,
      errorMessage
    });
    return {
      isOnline: false,
      statusCode: null,
      responseTime,
      error: errorMessage
    };
  }
}

// server/services/performance.ts
async function analyzePerformance(siteUrl, data) {
  let score = 100;
  if (data.lcp) {
    if (data.lcp > 4e3) score -= 30;
    else if (data.lcp > 2500) score -= 15;
  }
  if (data.fid) {
    if (data.fid > 300) score -= 30;
    else if (data.fid > 100) score -= 15;
  }
  if (data.cls) {
    if (data.cls > 250) score -= 30;
    else if (data.cls > 100) score -= 15;
  }
  if (data.ttfb) {
    if (data.ttfb > 1800) score -= 20;
    else if (data.ttfb > 600) score -= 10;
  }
  score = Math.max(0, Math.min(100, score));
  await createPerformanceMetric({
    siteUrl,
    lcp: data.lcp || null,
    fid: data.fid || null,
    cls: data.cls || null,
    ttfb: data.ttfb || null,
    score
  });
  return {
    score,
    metrics: {
      lcp: data.lcp,
      fid: data.fid,
      cls: data.cls,
      ttfb: data.ttfb
    }
  };
}

// server/services/seo.ts
async function analyzeSeo(siteUrl) {
  const issues = [];
  let score = 100;
  try {
    const htmlResponse = await fetch(siteUrl);
    const html = await htmlResponse.text();
    const hasMetaDescription = html.includes("meta") && html.includes("description");
    const hasOpenGraph = html.includes("og:");
    const hasSchemaOrg = html.includes("schema.org") || html.includes("@context");
    if (!hasMetaDescription) {
      issues.push({
        type: "meta_description",
        message: "Meta description n\xE3o encontrada",
        severity: "high"
      });
      score -= 20;
    }
    if (!hasOpenGraph) {
      issues.push({
        type: "open_graph",
        message: "Tags Open Graph n\xE3o encontradas",
        severity: "medium"
      });
      score -= 10;
    }
    if (!hasSchemaOrg) {
      issues.push({
        type: "schema_org",
        message: "Schema.org markup n\xE3o encontrado",
        severity: "medium"
      });
      score -= 10;
    }
    try {
      const sitemapUrl = new URL("/sitemap.xml", siteUrl).toString();
      const sitemapResponse = await fetch(sitemapUrl);
      if (!sitemapResponse.ok) {
        issues.push({
          type: "sitemap",
          message: "sitemap.xml n\xE3o encontrado",
          severity: "medium"
        });
        score -= 15;
      }
    } catch {
      issues.push({
        type: "sitemap",
        message: "Erro ao verificar sitemap.xml",
        severity: "low"
      });
      score -= 5;
    }
    try {
      const robotsUrl = new URL("/robots.txt", siteUrl).toString();
      const robotsResponse = await fetch(robotsUrl);
      if (!robotsResponse.ok) {
        issues.push({
          type: "robots",
          message: "robots.txt n\xE3o encontrado",
          severity: "low"
        });
        score -= 5;
      }
    } catch {
      issues.push({
        type: "robots",
        message: "Erro ao verificar robots.txt",
        severity: "low"
      });
      score -= 3;
    }
    score = Math.max(0, Math.min(100, score));
    await createSeoAnalysis({
      siteUrl,
      score,
      hasMetaDescription: hasMetaDescription ? 1 : 0,
      hasOpenGraph: hasOpenGraph ? 1 : 0,
      hasSchemaOrg: hasSchemaOrg ? 1 : 0,
      hasSitemap: 1,
      hasRobotsTxt: 1,
      issues: JSON.stringify(issues)
    });
    return {
      score,
      issues,
      checks: {
        hasMetaDescription,
        hasOpenGraph,
        hasSchemaOrg
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    issues.push({
      type: "error",
      message: `Erro ao analisar SEO: ${errorMessage}`,
      severity: "high"
    });
    score = Math.max(0, score - 30);
    await createSeoAnalysis({
      siteUrl,
      score,
      hasMetaDescription: 0,
      hasOpenGraph: 0,
      hasSchemaOrg: 0,
      hasSitemap: 0,
      hasRobotsTxt: 0,
      issues: JSON.stringify(issues)
    });
    return { score, issues };
  }
}

// server/routers/monitoring.ts
var monitoringRouter = router({
  checkUptime: publicProcedure.input(z2.object({ siteUrl: z2.string().url() })).mutation(async ({ input }) => {
    return await checkUptime(input.siteUrl);
  }),
  getUptimeHistory: publicProcedure.input(z2.object({ siteUrl: z2.string().url(), limit: z2.number().default(100) })).query(async ({ input }) => {
    return await getLatestUptimeChecks(input.siteUrl, input.limit);
  }),
  analyzePerformance: publicProcedure.input(z2.object({
    siteUrl: z2.string().url(),
    lcp: z2.number().optional(),
    fid: z2.number().optional(),
    cls: z2.number().optional(),
    ttfb: z2.number().optional()
  })).mutation(async ({ input }) => {
    const { siteUrl, ...metrics } = input;
    return await analyzePerformance(siteUrl, metrics);
  }),
  getPerformanceHistory: publicProcedure.input(z2.object({ siteUrl: z2.string().url(), limit: z2.number().default(100) })).query(async ({ input }) => {
    return await getLatestPerformanceMetrics(input.siteUrl, input.limit);
  }),
  analyzeSeo: publicProcedure.input(z2.object({ siteUrl: z2.string().url() })).mutation(async ({ input }) => {
    return await analyzeSeo(input.siteUrl);
  }),
  getSeoAnalysis: publicProcedure.input(z2.object({ siteUrl: z2.string().url() })).query(async ({ input }) => {
    return await getLatestSeoAnalysis(input.siteUrl);
  })
});

// server/routers/chatbot.ts
import { z as z3 } from "zod";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/routers/chatbot.ts
import { nanoid } from "nanoid";
var chatbotRouter = router({
  startConversation: publicProcedure.input(z3.object({
    visitorId: z3.string().optional(),
    visitorEmail: z3.string().email().optional(),
    visitorName: z3.string().optional()
  })).mutation(async ({ input }) => {
    const visitorId = input.visitorId || nanoid();
    await createChatbotConversation({
      visitorId,
      visitorEmail: input.visitorEmail || null,
      visitorName: input.visitorName || null,
      messages: JSON.stringify([]),
      status: "active"
    });
    return { visitorId };
  }),
  sendMessage: publicProcedure.input(z3.object({
    visitorId: z3.string(),
    message: z3.string()
  })).mutation(async ({ input }) => {
    const conversation = await getChatbotConversation(input.visitorId);
    let messages = [];
    if (conversation && conversation.messages) {
      try {
        messages = JSON.parse(conversation.messages);
      } catch {
        messages = [];
      }
    }
    messages.push({
      role: "user",
      content: input.message,
      timestamp: /* @__PURE__ */ new Date()
    });
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful customer support assistant for SVS Solu\xE7\xF5es, a technology solutions company. Be professional, friendly, and helpful. Respond in Portuguese."
          },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        ]
      });
      const assistantMessage = response.choices?.[0]?.message?.content || "Desculpe, n\xE3o consegui processar sua mensagem.";
      messages.push({
        role: "assistant",
        content: assistantMessage,
        timestamp: /* @__PURE__ */ new Date()
      });
      await updateChatbotConversation(input.visitorId, messages);
      return {
        visitorId: input.visitorId,
        response: assistantMessage,
        messageCount: messages.length
      };
    } catch (error) {
      console.error("Error generating chatbot response:", error);
      const errorMessage = "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.";
      messages.push({
        role: "assistant",
        content: errorMessage,
        timestamp: /* @__PURE__ */ new Date()
      });
      await updateChatbotConversation(input.visitorId, messages);
      return {
        visitorId: input.visitorId,
        response: errorMessage,
        messageCount: messages.length,
        error: true
      };
    }
  }),
  getConversation: publicProcedure.input(z3.object({ visitorId: z3.string() })).query(async ({ input }) => {
    const conversation = await getChatbotConversation(input.visitorId);
    if (!conversation) {
      return null;
    }
    let messages = [];
    try {
      if (conversation.messages) {
        messages = JSON.parse(conversation.messages);
      }
    } catch {
      messages = [];
    }
    return {
      visitorId: conversation.visitorId || input.visitorId,
      visitorName: conversation.visitorName || void 0,
      visitorEmail: conversation.visitorEmail || void 0,
      messages,
      status: conversation.status,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };
  })
});

// server/routers/github.ts
import { z as z4 } from "zod";

// server/services/github.ts
async function getGitHubRepositoryFiles(owner, repo, token, path3 = "") {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path3}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      content: item.type === "file" ? item.content : void 0
    }));
  } catch (error) {
    console.error("Error fetching GitHub files:", error);
    throw error;
  }
}
async function getGitHubFileContent(owner, repo, token, path3) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path3}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3.raw"
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching GitHub file content:", error);
    throw error;
  }
}
async function createGitHubBranch(owner, repo, token, branchName, baseBranch = "main") {
  try {
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );
    if (!refResponse.ok) {
      return { success: false, message: "Failed to get base branch SHA" };
    }
    const refData = await refResponse.json();
    const sha = refData.object.sha;
    const createResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha
        })
      }
    );
    if (!createResponse.ok) {
      return { success: false, message: "Failed to create branch" };
    }
    return { success: true, message: `Branch ${branchName} created successfully` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message };
  }
}
async function createGitHubPullRequest(owner, repo, token, title, body, head, base = "main") {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          title,
          body,
          head,
          base
        })
      }
    );
    if (!response.ok) {
      return { success: false, message: "Failed to create pull request" };
    }
    const data = await response.json();
    return {
      success: true,
      prUrl: data.html_url,
      message: "Pull request created successfully"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message };
  }
}

// server/services/codeSuggestions.ts
async function generateCodeSuggestions(repositoryUrl, fileContent, filePath) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a code review expert. Analyze the provided code and suggest improvements for performance, security, accessibility, and best practices. 
          
          Respond with a JSON array of suggestions. Each suggestion should have:
          - suggestion: string (the improvement suggestion)
          - severity: "low" | "medium" | "high"
          - category: string (e.g., "performance", "security", "accessibility", "best-practices")
          
          Only include meaningful suggestions. If the code is well-written, return an empty array.`
        },
        {
          role: "user",
          content: `Please review this code from ${filePath}:

\`\`\`
${fileContent}
\`\`\``
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "code_suggestions",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                suggestion: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                category: { type: "string" }
              },
              required: ["suggestion", "severity", "category"],
              additionalProperties: false
            }
          }
        }
      }
    });
    let suggestions = [];
    try {
      const content = response.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        suggestions = JSON.parse(content);
      }
    } catch {
      console.warn("Failed to parse LLM response as JSON");
    }
    for (const suggestion of suggestions) {
      await createCodeSuggestion({
        repositoryUrl,
        filePath,
        suggestion: suggestion.suggestion,
        severity: suggestion.severity,
        category: suggestion.category
      });
    }
    return suggestions;
  } catch (error) {
    console.error("Error generating code suggestions:", error);
    return [];
  }
}
async function analyzeRepositoryFiles(repositoryUrl, files) {
  const suggestions = [];
  const relevantFiles = files.filter(
    (f) => /\.(html|css|js|jsx|ts|tsx)$/.test(f.path)
  );
  for (const file of relevantFiles.slice(0, 5)) {
    const fileSuggestions = await generateCodeSuggestions(
      repositoryUrl,
      file.content,
      file.path
    );
    suggestions.push(...fileSuggestions);
  }
  return suggestions;
}

// server/routers/github.ts
var githubRouter = router({
  getRepositoryFiles: publicProcedure.input(z4.object({
    owner: z4.string(),
    repo: z4.string(),
    token: z4.string(),
    path: z4.string().optional()
  })).query(async ({ input }) => {
    return await getGitHubRepositoryFiles(input.owner, input.repo, input.token, input.path);
  }),
  getFileContent: publicProcedure.input(z4.object({
    owner: z4.string(),
    repo: z4.string(),
    token: z4.string(),
    path: z4.string()
  })).query(async ({ input }) => {
    return await getFileContent(input.owner, input.repo, input.token, input.path);
  }),
  analyzeRepository: publicProcedure.input(z4.object({
    owner: z4.string(),
    repo: z4.string(),
    token: z4.string()
  })).mutation(async ({ input }) => {
    const repositoryUrl = `https://github.com/${input.owner}/${input.repo}`;
    try {
      const files = await getGitHubRepositoryFiles(input.owner, input.repo, input.token);
      const relevantFiles = files.filter(
        (f) => f.type === "file" && /\.(html|css|js|jsx|ts|tsx)$/.test(f.path)
      );
      const filesWithContent = await Promise.all(
        relevantFiles.slice(0, 5).map(async (file) => {
          try {
            const content = await getFileContent(input.owner, input.repo, input.token, file.path);
            return { path: file.path, content };
          } catch {
            return null;
          }
        })
      );
      const validFiles = filesWithContent.filter((f) => f !== null);
      const suggestions = await analyzeRepositoryFiles(repositoryUrl, validFiles);
      return {
        success: true,
        filesAnalyzed: validFiles.length,
        suggestionsGenerated: suggestions.length,
        suggestions
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message
      };
    }
  }),
  getCodeSuggestions: publicProcedure.input(z4.object({
    owner: z4.string(),
    repo: z4.string(),
    status: z4.string().optional()
  })).query(async ({ input }) => {
    const repositoryUrl = `https://github.com/${input.owner}/${input.repo}`;
    return await getCodeSuggestions(repositoryUrl, input.status);
  }),
  createBranch: publicProcedure.input(z4.object({
    owner: z4.string(),
    repo: z4.string(),
    token: z4.string(),
    branchName: z4.string(),
    baseBranch: z4.string().optional()
  })).mutation(async ({ input }) => {
    return await createGitHubBranch(
      input.owner,
      input.repo,
      input.token,
      input.branchName,
      input.baseBranch
    );
  }),
  createPullRequest: publicProcedure.input(z4.object({
    owner: z4.string(),
    repo: z4.string(),
    token: z4.string(),
    title: z4.string(),
    body: z4.string(),
    head: z4.string(),
    base: z4.string().optional()
  })).mutation(async ({ input }) => {
    return await createGitHubPullRequest(
      input.owner,
      input.repo,
      input.token,
      input.title,
      input.body,
      input.head,
      input.base
    );
  })
});
async function getFileContent(owner, repo, token, path3) {
  return await getGitHubFileContent(owner, repo, token, path3);
}

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  monitoring: monitoringRouter,
  chatbot: chatbotRouter,
  github: githubRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/jobs/scheduler.ts
var SITE_URL = "https://svs-solucoes.surge.sh";
async function startScheduler() {
  console.log("[Scheduler] Starting monitoring jobs...");
  setInterval(async () => {
    try {
      console.log("[Scheduler] Running uptime check...");
      await checkUptime(SITE_URL);
    } catch (error) {
      console.error("[Scheduler] Uptime check failed:", error);
    }
  }, 5 * 60 * 1e3);
  setInterval(async () => {
    try {
      console.log("[Scheduler] Running SEO analysis...");
      await analyzeSeo(SITE_URL);
    } catch (error) {
      console.error("[Scheduler] SEO analysis failed:", error);
    }
  }, 24 * 60 * 60 * 1e3);
  try {
    console.log("[Scheduler] Running initial uptime check...");
    await checkUptime(SITE_URL);
  } catch (error) {
    console.error("[Scheduler] Initial uptime check failed:", error);
  }
  try {
    console.log("[Scheduler] Running initial SEO analysis...");
    await analyzeSeo(SITE_URL);
  } catch (error) {
    console.error("[Scheduler] Initial SEO analysis failed:", error);
  }
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startScheduler().catch(console.error);
  });
}
startServer().catch(console.error);
