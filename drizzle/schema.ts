import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Monitoramento de Uptime
export const uptimeChecks = mysqlTable("uptime_checks", {
  id: int("id").autoincrement().primaryKey(),
  siteUrl: varchar("site_url", { length: 255 }).notNull(),
  statusCode: int("status_code"),
  responseTime: int("response_time"), // em ms
  isOnline: int("is_online").notNull().default(1),
  errorMessage: text("error_message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UptimeCheck = typeof uptimeChecks.$inferSelect;
export type InsertUptimeCheck = typeof uptimeChecks.$inferInsert;

// Análise de Performance
export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  siteUrl: varchar("site_url", { length: 255 }).notNull(),
  lcp: int("lcp"), // Largest Contentful Paint em ms
  fid: int("fid"), // First Input Delay em ms
  cls: int("cls"), // Cumulative Layout Shift (x1000)
  ttfb: int("ttfb"), // Time to First Byte em ms
  score: int("score"), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

// Análise de SEO
export const seoAnalysis = mysqlTable("seo_analysis", {
  id: int("id").autoincrement().primaryKey(),
  siteUrl: varchar("site_url", { length: 255 }).notNull(),
  score: int("score"), // 0-100
  hasMetaDescription: int("has_meta_description").notNull().default(0),
  hasOpenGraph: int("has_open_graph").notNull().default(0),
  hasSchemaOrg: int("has_schema_org").notNull().default(0),
  hasSitemap: int("has_sitemap").notNull().default(0),
  hasRobotsTxt: int("has_robots_txt").notNull().default(0),
  issues: text("issues"), // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeoAnalysis = typeof seoAnalysis.$inferSelect;
export type InsertSeoAnalysis = typeof seoAnalysis.$inferInsert;

// Sugestões de Código
export const codeSuggestions = mysqlTable("code_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  repositoryUrl: varchar("repository_url", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 255 }).notNull(),
  suggestion: text("suggestion").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // performance, security, accessibility, etc
  status: mysqlEnum("status", ["pending", "reviewed", "implemented", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodeSuggestion = typeof codeSuggestions.$inferSelect;
export type InsertCodeSuggestion = typeof codeSuggestions.$inferInsert;

// Conversas do Chatbot
export const chatbotConversations = mysqlTable("chatbot_conversations", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitor_id", { length: 100 }).notNull(),
  visitorEmail: varchar("visitor_email", { length: 320 }),
  visitorName: varchar("visitor_name", { length: 255 }),
  messages: text("messages"), // JSON array
  status: mysqlEnum("status", ["active", "closed", "transferred"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = typeof chatbotConversations.$inferInsert;

// Configurações do Agente
export const agentConfig = mysqlTable("agent_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentConfig = typeof agentConfig.$inferSelect;
export type InsertAgentConfig = typeof agentConfig.$inferInsert;