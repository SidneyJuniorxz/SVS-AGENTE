import { createPerformanceMetric } from "../db";

interface PerformanceData {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
}

export async function analyzePerformance(siteUrl: string, data: PerformanceData) {
  // Calcular score baseado nas métricas
  let score = 100;
  
  // LCP (Largest Contentful Paint) - ideal < 2.5s
  if (data.lcp) {
    if (data.lcp > 4000) score -= 30;
    else if (data.lcp > 2500) score -= 15;
  }
  
  // FID (First Input Delay) - ideal < 100ms
  if (data.fid) {
    if (data.fid > 300) score -= 30;
    else if (data.fid > 100) score -= 15;
  }
  
  // CLS (Cumulative Layout Shift) - ideal < 0.1
  if (data.cls) {
    if (data.cls > 250) score -= 30; // > 0.25
    else if (data.cls > 100) score -= 15; // > 0.1
  }
  
  // TTFB (Time to First Byte) - ideal < 600ms
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
    score,
  });
  
  return {
    score,
    metrics: {
      lcp: data.lcp,
      fid: data.fid,
      cls: data.cls,
      ttfb: data.ttfb,
    },
  };
}
