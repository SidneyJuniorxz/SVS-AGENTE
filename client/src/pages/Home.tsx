import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowRight, BarChart3, MessageSquare, Zap } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SVS Agent
          </div>
          <Button onClick={() => navigate("/dashboard")}>
            Ir para Dashboard
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Agente de Gerenciamento Inteligente
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Monitore seu site em tempo real, analise performance e SEO, receba sugestões de código e interaja com visitantes através de um chatbot inteligente.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            Acessar Dashboard <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Monitoramento de Uptime</h3>
            <p className="text-sm text-slate-600">Verifique se seu site está online 24/7 com histórico detalhado</p>
          </div>

          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-purple-300 transition-colors">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Análise de Performance</h3>
            <p className="text-sm text-slate-600">Core Web Vitals, tempo de resposta e otimizações</p>
          </div>

          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-green-300 transition-colors">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Análise de SEO</h3>
            <p className="text-sm text-slate-600">Meta tags, Schema.org, Open Graph e mais</p>
          </div>

          <div className="p-6 bg-white rounded-lg border border-slate-200 hover:border-orange-300 transition-colors">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Chatbot Inteligente</h3>
            <p className="text-sm text-slate-600">Engage com visitantes usando IA</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-12 mb-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Recursos Principais</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">✅ Monitoramento Contínuo</h3>
              <p className="text-slate-600 mb-4">Verificações automáticas a cada 5 minutos com histórico completo</p>
              
              <h3 className="font-semibold text-slate-900 mb-3">📊 Métricas Detalhadas</h3>
              <p className="text-slate-600 mb-4">LCP, FID, CLS, TTFB e scores de performance</p>
              
              <h3 className="font-semibold text-slate-900 mb-3">🔗 Integração GitHub</h3>
              <p className="text-slate-600">Análise automática de código com sugestões de melhoria</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">💬 Chatbot 24/7</h3>
              <p className="text-slate-600 mb-4">Widget integrável ao seu site com IA conversacional</p>
              
              <h3 className="font-semibold text-slate-900 mb-3">📈 Dashboard Responsivo</h3>
              <p className="text-slate-600 mb-4">Visualize todas as métricas em um único lugar</p>
              
              <h3 className="font-semibold text-slate-900 mb-3">🤖 Análise com LLM</h3>
              <p className="text-slate-600">Sugestões inteligentes baseadas em IA</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Comece a Monitorar Agora</h2>
          <p className="text-lg mb-8 opacity-90">Acesse o dashboard para visualizar todas as métricas do seu site</p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            Acessar Dashboard <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-600">
          <p>SVS Soluções - Agente de Gerenciamento © 2026</p>
        </div>
      </footer>
    </div>
  );
}
