import { createUptimeCheck } from "../db";

export async function checkUptime(siteUrl: string) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(siteUrl, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    await createUptimeCheck({
      siteUrl,
      statusCode: response.status,
      responseTime,
      isOnline: response.ok ? 1 : 0,
      errorMessage: null,
    });

    return {
      isOnline: response.ok,
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await createUptimeCheck({
      siteUrl,
      statusCode: null,
      responseTime,
      isOnline: 0,
      errorMessage,
    });

    return {
      isOnline: false,
      statusCode: null,
      responseTime,
      error: errorMessage,
    };
  }
}
