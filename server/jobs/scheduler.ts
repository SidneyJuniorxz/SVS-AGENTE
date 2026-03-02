import { checkUptime } from "../services/uptime";
import { analyzeSeo } from "../services/seo";
import { config } from "../config";

export async function startScheduler() {
  console.log("[Scheduler] Starting monitoring jobs...");
  
  // Verificar uptime
  setInterval(async () => {
    try {
      console.log("[Scheduler] Running uptime check...");
      await checkUptime(config.targetSiteUrl);
    } catch (error) {
      console.error("[Scheduler] Uptime check failed:", error);
    }
  }, config.uptimeCheckInterval);
  
  // Analisar SEO
  setInterval(async () => {
    try {
      console.log("[Scheduler] Running SEO analysis...");
      await analyzeSeo(config.targetSiteUrl);
    } catch (error) {
      console.error("[Scheduler] SEO analysis failed:", error);
    }
  }, config.seoAnalysisInterval);
  
  // Executar verificação inicial de uptime
  try {
    console.log("[Scheduler] Running initial uptime check...");
    await checkUptime(config.targetSiteUrl);
  } catch (error) {
    console.error("[Scheduler] Initial uptime check failed:", error);
  }
  
  // Executar análise inicial de SEO
  try {
    console.log("[Scheduler] Running initial SEO analysis...");
    await analyzeSeo(config.targetSiteUrl);
  } catch (error) {
    console.error("[Scheduler] Initial SEO analysis failed:", error);
  }
}
