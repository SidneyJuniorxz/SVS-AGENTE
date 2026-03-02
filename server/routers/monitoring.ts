import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { checkUptime } from "../services/uptime";
import { analyzePerformance } from "../services/performance";
import { analyzeSeo } from "../services/seo";
import { getLatestUptimeChecks, getLatestPerformanceMetrics, getLatestSeoAnalysis } from "../db";

export const monitoringRouter = router({
  checkUptime: publicProcedure
    .input(z.object({ siteUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      return await checkUptime(input.siteUrl);
    }),

  getUptimeHistory: publicProcedure
    .input(z.object({ siteUrl: z.string().url(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return await getLatestUptimeChecks(input.siteUrl, input.limit);
    }),

  analyzePerformance: publicProcedure
    .input(z.object({
      siteUrl: z.string().url(),
      lcp: z.number().optional(),
      fid: z.number().optional(),
      cls: z.number().optional(),
      ttfb: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { siteUrl, ...metrics } = input;
      return await analyzePerformance(siteUrl, metrics);
    }),

  getPerformanceHistory: publicProcedure
    .input(z.object({ siteUrl: z.string().url(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return await getLatestPerformanceMetrics(input.siteUrl, input.limit);
    }),

  analyzeSeo: publicProcedure
    .input(z.object({ siteUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      return await analyzeSeo(input.siteUrl);
    }),

  getSeoAnalysis: publicProcedure
    .input(z.object({ siteUrl: z.string().url() }))
    .query(async ({ input }) => {
      return await getLatestSeoAnalysis(input.siteUrl);
    }),
});
