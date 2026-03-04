/**
 * Configuração centralizada do agente
 * Todas as variáveis de ambiente são lidas aqui
 */

export const config = {
  // Site alvo para monitoramento
  targetSiteUrl: process.env.TARGET_SITE_URL || "https://svs-solucoes.surge.sh",
  
  // GitHub
  githubRepoOwner: process.env.GITHUB_REPO_OWNER || "SidneyJuniorxz",
  githubRepoName: process.env.GITHUB_REPO_NAME || "SITE-SVS",
  githubToken: process.env.GITHUB_TOKEN || "",
  
  // Banco de dados
  databaseUrl: process.env.DATABASE_URL || "",
  
  // Autenticação
  jwtSecret: process.env.JWT_SECRET || "dev-secret-key",
  
  // OAuth Manus
  viteAppId: process.env.VITE_APP_ID || "",
  oauthServerUrl: process.env.OAUTH_SERVER_URL || "https://api.manus.im",
  viteOauthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL || "https://manus.im/login",
  
  // APIs Manus
  builtInForgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || "",
  builtInForgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || "https://api.manus.im",
  viteFrontendForgeApiKey: process.env.VITE_FRONTEND_FORGE_API_KEY || "",
  viteFrontendForgeApiUrl: process.env.VITE_FRONTEND_FORGE_API_URL || "https://api.manus.im",
  
  // Owner
  ownerOpenId: process.env.OWNER_OPEN_ID || "",
  ownerName: process.env.OWNER_NAME || "Admin",
  
  // Analytics
  viteAnalyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT || "",
  viteAnalyticsWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID || "",
  
  // Ambiente
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  
  // Configurações de monitoramento
  uptimeCheckInterval: parseInt(process.env.UPTIME_CHECK_INTERVAL || "300000", 10), // 5 minutos
  seoAnalysisInterval: parseInt(process.env.SEO_ANALYSIS_INTERVAL || "86400000", 10), // 24 horas
  performanceCheckInterval: parseInt(process.env.PERFORMANCE_CHECK_INTERVAL || "3600000", 10), // 1 hora
};

/**
 * Validar configurações críticas
 * Apenas DATABASE_URL e TARGET_SITE_URL são obrigatórios
 */
export function validateConfig(): string[] {
  const errors: string[] = [];
  
  // DATABASE_URL é obrigatório em produção
  if (!config.databaseUrl && process.env.NODE_ENV === "production") {
    errors.push("DATABASE_URL é obrigatório em produção");
  }
  
  // TARGET_SITE_URL é sempre obrigatório
  if (!config.targetSiteUrl) {
    errors.push("TARGET_SITE_URL é obrigatório");
  }
  
  // Todas as outras variáveis são opcionais
  // OAuth, Manus APIs, e outras funcionalidades são opcionais
  
  return errors;
}

/**
 * Log de configuração (sem expor secrets)
 */
export function logConfig(): void {
  console.log("[Config] Configurações carregadas:");
  console.log(`  - Target Site: ${config.targetSiteUrl}`);
  console.log(`  - GitHub Repo: ${config.githubRepoOwner}/${config.githubRepoName}`);
  console.log(`  - Ambiente: ${config.nodeEnv}`);
  console.log(`  - Porta: ${config.port}`);
  console.log(`  - Uptime Check: a cada ${config.uptimeCheckInterval / 1000}s`);
  console.log(`  - SEO Analysis: a cada ${config.seoAnalysisInterval / 1000}s`);
  console.log(`  - Performance Check: a cada ${config.performanceCheckInterval / 1000}s`);
  
  if (!config.githubToken) {
    console.warn("[Config] AVISO: GITHUB_TOKEN nao configurado - analise de codigo desabilitada");
  }
  if (!config.builtInForgeApiKey) {
    console.warn("[Config] AVISO: BUILT_IN_FORGE_API_KEY nao configurado - LLM desabilitado");
  }
  if (!config.viteAppId) {
    console.warn("[Config] AVISO: VITE_APP_ID nao configurado - OAuth desabilitado");
  }
}
