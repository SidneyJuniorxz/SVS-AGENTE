import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, TrendingUp, Code, MessageSquare } from "lucide-react";

const SITE_URL = "https://svs-solucoes.surge.sh";

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<"overview" | "uptime" | "performance" | "seo" | "code" | "chatbot">("overview");
  
  // Monitoramento
  const checkUptimeMutation = trpc.monitoring.checkUptime.useMutation();
  const uptimeHistoryQuery = trpc.monitoring.getUptimeHistory.useQuery({ siteUrl: SITE_URL, limit: 10 });
  const performanceHistoryQuery = trpc.monitoring.getPerformanceHistory.useQuery({ siteUrl: SITE_URL, limit: 10 });
  const seoAnalysisQuery = trpc.monitoring.getSeoAnalysis.useQuery({ siteUrl: SITE_URL });
  
  useEffect(() => {
    // Executar verificação inicial de uptime
    checkUptimeMutation.mutate({ siteUrl: SITE_URL });
  }, []);
  
  const latestUptime = uptimeHistoryQuery.data?.[0];
  const latestPerformance = performanceHistoryQuery.data?.[0];
  const seoData = seoAnalysisQuery.data;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">SVS Soluções - Agente de Gerenciamento</h1>
          <p className="text-slate-600">Monitoramento em tempo real do site e análises automáticas</p>
        </div>
        
        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Visão Geral", icon: "📊" },
            { id: "uptime", label: "Uptime", icon: "✅" },
            { id: "performance", label: "Performance", icon: "⚡" },
            { id: "seo", label: "SEO", icon: "🔍" },
            { id: "code", label: "Código", icon: "💻" },
            { id: "chatbot", label: "Chatbot", icon: "💬" },
          ].map(tab => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? "default" : "outline"}
              onClick={() => setSelectedTab(tab.id as any)}
              className="whitespace-nowrap"
            >
              {tab.icon} {tab.label}
            </Button>
          ))}
        </div>
        
        {/* Content */}
        {selectedTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status do Site</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    {latestUptime?.isOnline ? (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-lg font-bold text-green-600">Online</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{latestUptime.responseTime}ms</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="text-lg font-bold text-red-600">Offline</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Verificando...</p>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkUptimeMutation.mutate({ siteUrl: SITE_URL })}
                    disabled={checkUptimeMutation.isPending}
                  >
                    Verificar
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Performance Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{latestPerformance?.score || "—"}</div>
                <p className="text-xs text-slate-500 mt-1">Score de 0-100</p>
              </CardContent>
            </Card>
            
            {/* SEO Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">SEO Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{seoData?.score || "—"}</div>
                <p className="text-xs text-slate-500 mt-1">Score de 0-100</p>
              </CardContent>
            </Card>
            
            {/* Last Check */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Última Verificação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono">
                  {latestUptime?.createdAt
                    ? new Date(latestUptime.createdAt).toLocaleTimeString("pt-BR")
                    : "—"}
                </div>
                <p className="text-xs text-slate-500 mt-1">Há poucos minutos</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Uptime Tab */}
        {selectedTab === "uptime" && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Uptime</CardTitle>
              <CardDescription>Últimas 10 verificações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uptimeHistoryQuery.data?.map((check, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {check.isOnline ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {check.isOnline ? "Online" : "Offline"} - {check.responseTime}ms
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(check.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={check.isOnline ? "default" : "destructive"}>
                      {check.statusCode}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Performance Tab */}
        {selectedTab === "performance" && (
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
              <CardDescription>Core Web Vitals e tempo de resposta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {performanceHistoryQuery.data?.slice(0, 1).map((metric, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">LCP (Largest Contentful Paint)</p>
                      <p className="text-2xl font-bold">{metric.lcp || "—"}ms</p>
                      <p className="text-xs text-slate-500">Ideal: &lt; 2500ms</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">FID (First Input Delay)</p>
                      <p className="text-2xl font-bold">{metric.fid || "—"}ms</p>
                      <p className="text-xs text-slate-500">Ideal: &lt; 100ms</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">CLS (Cumulative Layout Shift)</p>
                      <p className="text-2xl font-bold">{metric.cls ? (metric.cls / 1000).toFixed(3) : "—"}</p>
                      <p className="text-xs text-slate-500">Ideal: &lt; 0.1</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">TTFB (Time to First Byte)</p>
                      <p className="text-2xl font-bold">{metric.ttfb || "—"}ms</p>
                      <p className="text-xs text-slate-500">Ideal: &lt; 600ms</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* SEO Tab */}
        {selectedTab === "seo" && (
          <Card>
            <CardHeader>
              <CardTitle>Análise de SEO</CardTitle>
              <CardDescription>Meta tags, Schema.org e configurações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span>Meta Description</span>
                  <Badge variant={seoData?.hasMetaDescription ? "default" : "destructive"}>
                    {seoData?.hasMetaDescription ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span>Open Graph Tags</span>
                  <Badge variant={seoData?.hasOpenGraph ? "default" : "destructive"}>
                    {seoData?.hasOpenGraph ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span>Schema.org Markup</span>
                  <Badge variant={seoData?.hasSchemaOrg ? "default" : "destructive"}>
                    {seoData?.hasSchemaOrg ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span>Sitemap.xml</span>
                  <Badge variant={seoData?.hasSitemap ? "default" : "destructive"}>
                    {seoData?.hasSitemap ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span>Robots.txt</span>
                  <Badge variant={seoData?.hasRobotsTxt ? "default" : "destructive"}>
                    {seoData?.hasRobotsTxt ? "✓" : "✗"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Code Tab */}
        {selectedTab === "code" && (
          <Card>
            <CardHeader>
              <CardTitle>Sugestões de Código</CardTitle>
              <CardDescription>Análise automática do repositório GitHub</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-4">
                Conecte seu repositório GitHub para receber sugestões automáticas de melhorias.
              </p>
              <Button>Conectar GitHub</Button>
            </CardContent>
          </Card>
        )}
        
        {/* Chatbot Tab */}
        {selectedTab === "chatbot" && (
          <Card>
            <CardHeader>
              <CardTitle>Widget de Chatbot</CardTitle>
              <CardDescription>Integre o chatbot ao seu site</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-4">
                Copie o código abaixo e cole no seu site para ativar o chatbot:
              </p>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{`<script src="https://svs-agent.manus.space/chatbot-widget.js"></script>
<script>
  SVSChatbot.init({
    apiUrl: 'https://svs-agent.manus.space/api/trpc',
    position: 'bottom-right'
  });
</script>`}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
