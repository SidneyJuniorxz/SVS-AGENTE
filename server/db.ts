import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, uptimeChecks, InsertUptimeCheck, performanceMetrics, InsertPerformanceMetric, seoAnalysis, InsertSeoAnalysis, codeSuggestions, InsertCodeSuggestion, chatbotConversations, InsertChatbotConversation, agentConfig, InsertAgentConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Uptime Checks
export async function createUptimeCheck(data: InsertUptimeCheck) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(uptimeChecks).values(data);
}

export async function getLatestUptimeChecks(siteUrl: string, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(uptimeChecks).where(eq(uptimeChecks.siteUrl, siteUrl)).orderBy(desc(uptimeChecks.createdAt)).limit(limit);
}

// Performance Metrics
export async function createPerformanceMetric(data: InsertPerformanceMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(performanceMetrics).values(data);
}

export async function getLatestPerformanceMetrics(siteUrl: string, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(performanceMetrics).where(eq(performanceMetrics.siteUrl, siteUrl)).orderBy(desc(performanceMetrics.createdAt)).limit(limit);
}

// SEO Analysis
export async function createSeoAnalysis(data: InsertSeoAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(seoAnalysis).values(data);
}

export async function getLatestSeoAnalysis(siteUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(seoAnalysis).where(eq(seoAnalysis.siteUrl, siteUrl)).orderBy(desc(seoAnalysis.createdAt)).limit(1);
  return result[0];
}

// Code Suggestions
export async function createCodeSuggestion(data: InsertCodeSuggestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(codeSuggestions).values(data);
}

export async function getCodeSuggestions(repositoryUrl: string, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(codeSuggestions.repositoryUrl, repositoryUrl)];
  if (status) {
    conditions.push(eq(codeSuggestions.status, status as any));
  }
  return db.select().from(codeSuggestions).where(eq(codeSuggestions.repositoryUrl, repositoryUrl)).orderBy(desc(codeSuggestions.createdAt));
}

// Chatbot Conversations
export async function createChatbotConversation(data: InsertChatbotConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(chatbotConversations).values(data);
}

export async function getChatbotConversation(visitorId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(chatbotConversations).where(eq(chatbotConversations.visitorId, visitorId)).orderBy(desc(chatbotConversations.updatedAt)).limit(1);
  return result[0];
}

export async function updateChatbotConversation(visitorId: string, messages: any[], status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { messages: JSON.stringify(messages), updatedAt: new Date() };
  if (status) updateData.status = status;
  return db.update(chatbotConversations).set(updateData).where(eq(chatbotConversations.visitorId, visitorId));
}

// Agent Config
export async function getAgentConfig(key: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(agentConfig).where(eq(agentConfig.key, key)).limit(1);
  return result[0]?.value;
}

export async function setAgentConfig(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(agentConfig).values({ key, value }).onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
}
