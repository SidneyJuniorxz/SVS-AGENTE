import { createSeoAnalysis } from "../db";

interface SeoIssue {
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export async function analyzeSeo(siteUrl: string) {
  const issues: SeoIssue[] = [];
  let score = 100;
  
  try {
    // Verificar meta tags
    const htmlResponse = await fetch(siteUrl);
    const html = await htmlResponse.text();
    
    const hasMetaDescription = html.includes("meta") && html.includes("description");
    const hasOpenGraph = html.includes("og:");
    const hasSchemaOrg = html.includes("schema.org") || html.includes("@context");
    
    if (!hasMetaDescription) {
      issues.push({
        type: "meta_description",
        message: "Meta description não encontrada",
        severity: "high",
      });
      score -= 20;
    }
    
    if (!hasOpenGraph) {
      issues.push({
        type: "open_graph",
        message: "Tags Open Graph não encontradas",
        severity: "medium",
      });
      score -= 10;
    }
    
    if (!hasSchemaOrg) {
      issues.push({
        type: "schema_org",
        message: "Schema.org markup não encontrado",
        severity: "medium",
      });
      score -= 10;
    }
    
    // Verificar sitemap.xml
    try {
      const sitemapUrl = new URL("/sitemap.xml", siteUrl).toString();
      const sitemapResponse = await fetch(sitemapUrl);
      if (!sitemapResponse.ok) {
        issues.push({
          type: "sitemap",
          message: "sitemap.xml não encontrado",
          severity: "medium",
        });
        score -= 15;
      }
    } catch {
      issues.push({
        type: "sitemap",
        message: "Erro ao verificar sitemap.xml",
        severity: "low",
      });
      score -= 5;
    }
    
    // Verificar robots.txt
    try {
      const robotsUrl = new URL("/robots.txt", siteUrl).toString();
      const robotsResponse = await fetch(robotsUrl);
      if (!robotsResponse.ok) {
        issues.push({
          type: "robots",
          message: "robots.txt não encontrado",
          severity: "low",
        });
        score -= 5;
      }
    } catch {
      issues.push({
        type: "robots",
        message: "Erro ao verificar robots.txt",
        severity: "low",
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
      issues: JSON.stringify(issues),
    });
    
    return {
      score,
      issues,
      checks: {
        hasMetaDescription,
        hasOpenGraph,
        hasSchemaOrg,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    issues.push({
      type: "error",
      message: `Erro ao analisar SEO: ${errorMessage}`,
      severity: "high",
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
      issues: JSON.stringify(issues),
    });
    
    return { score, issues };
  }
}
