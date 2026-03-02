# 🤖 SVS Agent - Agente de Gerenciamento Inteligente

Um agente de gerenciamento completo e reutilizável para monitoramento de sites, análise de performance/SEO, sugestões de código e chatbot inteligente.

## ✨ Funcionalidades

- **📊 Monitoramento de Uptime**: Verificações automáticas a cada 5 minutos
- **⚡ Análise de Performance**: Core Web Vitals (LCP, FID, CLS, TTFB)
- **🔍 Análise de SEO**: Meta tags, Schema.org, Open Graph, sitemap.xml, robots.txt
- **💡 Sugestões de Código**: Análise automática com LLM baseada no repositório GitHub
- **💬 Chatbot Inteligente**: Widget JavaScript para engajamento com visitantes
- **📈 Dashboard Web**: Interface responsiva para visualizar todas as métricas

## 🚀 Quick Start

### 1. Clonar o Repositório

```bash
git clone https://github.com/SidneyJuniorxz/SVS-AGENTE.git
cd SVS-AGENTE
```

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
# Editar .env com seus valores
```

### 4. Executar em Desenvolvimento

```bash
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

## 📋 Variáveis de Ambiente

### Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `TARGET_SITE_URL` | URL do site a monitorar | `https://svs-solucoes.surge.sh` |
| `DATABASE_URL` | Conexão com banco de dados | `mysql://user:pass@host/db` |
| `GITHUB_TOKEN` | Token de acesso GitHub | `ghp_xxxx...` |

### Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `GITHUB_REPO_OWNER` | Owner do repositório GitHub | `SidneyJuniorxz` |
| `GITHUB_REPO_NAME` | Nome do repositório GitHub | `SITE-SVS` |
| `UPTIME_CHECK_INTERVAL` | Intervalo de uptime (ms) | `300000` (5 min) |
| `SEO_ANALYSIS_INTERVAL` | Intervalo de SEO (ms) | `86400000` (24h) |
| `PERFORMANCE_CHECK_INTERVAL` | Intervalo de performance (ms) | `3600000` (1h) |

Veja `.env.example` para a lista completa.

## 🌐 Dashboard

Acesse o dashboard em `http://localhost:3000/dashboard`

### Abas Disponíveis

1. **Visão Geral**: Status geral e métricas principais
2. **Uptime**: Histórico de disponibilidade
3. **Performance**: Core Web Vitals
4. **SEO**: Análise de meta tags
5. **Código**: Sugestões de melhoria
6. **Chatbot**: Gerenciamento do chatbot

## 💬 Widget de Chatbot

Integre o chatbot ao seu site adicionando:

```html
<script src="https://seu-dominio.com/chatbot-widget.js"></script>
<script>
  SVSChatbot.init({
    apiUrl: 'https://seu-dominio.com/api/trpc',
    position: 'bottom-right',
    theme: 'light'
  });
</script>
```

## 🐳 Deploy no Render

### Opção 1: Deploy Automático (Recomendado)

1. Faça fork deste repositório para sua conta GitHub
2. Acesse [render.com](https://render.com)
3. Clique em "New +" → "Web Service"
4. Selecione seu repositório
5. Configure:
   - **Name**: `svs-agente`
   - **Runtime**: `Docker`
   - **Build Command**: `pnpm install && pnpm db:push && pnpm build`
   - **Start Command**: `node dist/index.js`
6. Adicione as variáveis de ambiente (veja `.env.example`)
7. Clique em "Create Web Service"

### Opção 2: Deploy Manual com render.yaml

1. Faça push do código para GitHub
2. Acesse [render.com](https://render.com)
3. Clique em "New +" → "Web Service"
4. Selecione seu repositório
5. Render detectará automaticamente o `render.yaml`
6. Revise as configurações e clique em "Create"

### Opção 3: Deploy via CLI

```bash
# Instalar Render CLI
npm install -g @render-com/cli

# Fazer login
render login

# Deploy
render deploy --repo https://github.com/seu-usuario/SVS-AGENTE
```

## 🔧 Configuração para Outros Sites

O agente é totalmente configurável para monitorar qualquer site:

```bash
# Exemplo: Monitorar outro site
TARGET_SITE_URL=https://seu-site.com \
GITHUB_REPO_OWNER=seu-usuario \
GITHUB_REPO_NAME=seu-repositorio \
GITHUB_TOKEN=seu-token \
pnpm dev
```

## 📊 API Endpoints

### Monitoramento

```bash
# Verificar uptime
POST /api/trpc/monitoring.checkUptime
{ "siteUrl": "https://seu-site.com" }

# Histórico de uptime
GET /api/trpc/monitoring.getUptimeHistory
{ "siteUrl": "https://seu-site.com", "limit": 100 }

# Analisar performance
POST /api/trpc/monitoring.analyzePerformance
{ "siteUrl": "https://seu-site.com", "lcp": 2500, "fid": 100, "cls": 0.1, "ttfb": 600 }

# Analisar SEO
POST /api/trpc/monitoring.analyzeSeo
{ "siteUrl": "https://seu-site.com" }
```

### GitHub

```bash
# Analisar repositório
POST /api/trpc/github.analyzeRepository
{ "owner": "usuario", "repo": "repositorio", "token": "seu-token" }

# Obter sugestões de código
GET /api/trpc/github.getCodeSuggestions
{ "owner": "usuario", "repo": "repositorio" }
```

### Chatbot

```bash
# Iniciar conversa
POST /api/trpc/chatbot.startConversation
{ "visitorId": "visitor_123", "visitorEmail": "user@example.com", "visitorName": "João" }

# Enviar mensagem
POST /api/trpc/chatbot.sendMessage
{ "visitorId": "visitor_123", "message": "Olá!" }

# Obter conversa
GET /api/trpc/chatbot.getConversation
{ "visitorId": "visitor_123" }
```

## 🗄️ Banco de Dados

Tabelas criadas automaticamente:

- `uptime_checks`: Histórico de verificações
- `performance_metrics`: Métricas de performance
- `seo_analysis`: Análises de SEO
- `code_suggestions`: Sugestões de código
- `chatbot_conversations`: Conversas com visitantes
- `agent_config`: Configurações do agente

## 🔐 Segurança

- Tokens sensíveis nunca são expostos no frontend
- Todas as requisições são autenticadas via tRPC
- Banco de dados é isolado por variável de ambiente
- Suporte a HTTPS em produção

## 📝 Desenvolvimento

### Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (Dashboard, Home)
│   │   ├── components/    # Componentes UI
│   │   └── lib/           # Utilitários
│   └── public/            # Assets estáticos
├── server/                # Backend Express + tRPC
│   ├── routers/           # Endpoints tRPC
│   ├── services/          # Lógica de negócio
│   ├── jobs/              # Tarefas agendadas
│   └── _core/             # Configuração central
├── drizzle/               # Schema do banco de dados
└── Dockerfile             # Configuração Docker
```

### Scripts

```bash
# Desenvolvimento
pnpm dev              # Iniciar servidor de desenvolvimento

# Build
pnpm build            # Build para produção

# Testes
pnpm test             # Executar testes

# Verificação
pnpm check            # Verificar tipos TypeScript

# Banco de dados
pnpm db:push          # Aplicar migrações

# Formatação
pnpm format           # Formatar código
```

## 🐛 Troubleshooting

### Erro: "DATABASE_URL é obrigatório"

Certifique-se de que a variável `DATABASE_URL` está configurada no `.env`

### Erro: "GITHUB_TOKEN inválido"

Verifique se o token GitHub tem as permissões corretas:
- `repo` (acesso completo ao repositório)
- `read:user` (ler informações do usuário)

### Chatbot não funciona

1. Verifique se a API está rodando em `http://localhost:3000`
2. Confirme se o `chatbot-widget.js` está sendo carregado
3. Abra o console do navegador para ver erros

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas:

1. Abra uma [Issue](https://github.com/SidneyJuniorxz/SVS-AGENTE/issues)
2. Verifique a [Documentação](https://github.com/SidneyJuniorxz/SVS-AGENTE/wiki)
3. Entre em contato com a equipe SVS Soluções

## 🎯 Roadmap

- [ ] Alertas por email/SMS
- [ ] Gráficos históricos de performance
- [ ] Integração com Slack/Discord
- [ ] Suporte a múltiplos sites
- [ ] Dashboard customizável
- [ ] Relatórios automáticos

---

**Versão**: 1.0.0  
**Status**: ✅ Pronto para Produção  
**Última Atualização**: 2026-03-01
