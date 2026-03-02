# ⚙️ Guia de Configuração - SVS Agent

Como configurar o SVS Agent para monitorar diferentes sites.

## 🎯 Visão Geral

O SVS Agent é totalmente configurável via variáveis de ambiente. Você pode:

- Monitorar qualquer site
- Integrar com qualquer repositório GitHub
- Usar qualquer banco de dados MySQL/TiDB
- Personalizar intervalos de verificação

## 🔧 Configuração Básica

### Para Monitorar um Site

```bash
# Arquivo .env
TARGET_SITE_URL=https://seu-site.com
```

### Para Integrar com GitHub

```bash
# Arquivo .env
GITHUB_REPO_OWNER=seu-usuario
GITHUB_REPO_NAME=seu-repositorio
GITHUB_TOKEN=seu-token-github
```

### Banco de Dados

```bash
# Arquivo .env
DATABASE_URL=mysql://username:password@host:port/database
```

## 📋 Variáveis de Ambiente Completas

### Site Alvo

```bash
# URL do site que será monitorado
TARGET_SITE_URL=https://seu-site.com

# Intervalos de monitoramento (em milissegundos)
UPTIME_CHECK_INTERVAL=300000          # 5 minutos
SEO_ANALYSIS_INTERVAL=86400000        # 24 horas
PERFORMANCE_CHECK_INTERVAL=3600000    # 1 hora
```

### GitHub

```bash
# Informações do repositório
GITHUB_REPO_OWNER=seu-usuario
GITHUB_REPO_NAME=seu-repositorio

# Token de acesso (com permissões: repo, read:user)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Banco de Dados

```bash
# Conexão MySQL/TiDB
DATABASE_URL=mysql://username:password@host:port/database?sslMode=verify_identity
```

### Autenticação

```bash
# Secret para JWT
JWT_SECRET=sua-chave-secreta-muito-segura

# Manus OAuth
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
```

### APIs Manus

```bash
# Server-side API
BUILT_IN_FORGE_API_KEY=sua-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im

# Frontend API
VITE_FRONTEND_FORGE_API_KEY=sua-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### Informações do Proprietário

```bash
# Open ID do proprietário
OWNER_OPEN_ID=seu-open-id

# Nome do proprietário
OWNER_NAME=Seu Nome
```

### Analytics (Opcional)

```bash
# Endpoint de analytics
VITE_ANALYTICS_ENDPOINT=seu-endpoint

# ID do website
VITE_ANALYTICS_WEBSITE_ID=seu-website-id
```

### Ambiente

```bash
# Ambiente de execução
NODE_ENV=production  # ou development

# Porta do servidor
PORT=3000
```

## 🌍 Exemplos de Configuração

### Exemplo 1: Site Simples (Sem GitHub)

```bash
# .env
TARGET_SITE_URL=https://meu-site.com
DATABASE_URL=mysql://user:pass@localhost/svs_agent
JWT_SECRET=minha-chave-secreta-super-segura
NODE_ENV=development
PORT=3000
```

### Exemplo 2: Site com GitHub Integration

```bash
# .env
TARGET_SITE_URL=https://meu-site.com
GITHUB_REPO_OWNER=meu-usuario
GITHUB_REPO_NAME=meu-repositorio
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=mysql://user:pass@tidb.cloud/svs_agent
JWT_SECRET=minha-chave-secreta-super-segura
NODE_ENV=production
PORT=3000
```

### Exemplo 3: Com Manus OAuth e LLM

```bash
# .env
TARGET_SITE_URL=https://meu-site.com
GITHUB_REPO_OWNER=meu-usuario
GITHUB_REPO_NAME=meu-repositorio
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

DATABASE_URL=mysql://user:pass@tidb.cloud/svs_agent
JWT_SECRET=minha-chave-secreta-super-segura

VITE_APP_ID=meu-app-id
BUILT_IN_FORGE_API_KEY=minha-api-key
VITE_FRONTEND_FORGE_API_KEY=minha-frontend-api-key

OWNER_OPEN_ID=meu-open-id
OWNER_NAME=Meu Nome

NODE_ENV=production
PORT=3000
```

## 🔄 Alterando Configurações em Produção

### No Render

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Selecione seu serviço `svs-agente`
3. Vá para "Environment"
4. Modifique as variáveis necessárias
5. Clique em "Save"
6. Render fará redeploy automaticamente

### Localmente

1. Edite o arquivo `.env`
2. Reinicie o servidor:

```bash
pnpm dev
```

## ⏱️ Personalizando Intervalos de Monitoramento

### Uptime Check

```bash
# Verificar a cada 1 minuto (60000ms)
UPTIME_CHECK_INTERVAL=60000

# Verificar a cada 10 minutos (600000ms)
UPTIME_CHECK_INTERVAL=600000

# Verificar a cada 30 minutos (1800000ms)
UPTIME_CHECK_INTERVAL=1800000
```

### SEO Analysis

```bash
# Analisar a cada 6 horas (21600000ms)
SEO_ANALYSIS_INTERVAL=21600000

# Analisar a cada 12 horas (43200000ms)
SEO_ANALYSIS_INTERVAL=43200000

# Analisar a cada 24 horas (86400000ms) - Padrão
SEO_ANALYSIS_INTERVAL=86400000
```

### Performance Check

```bash
# Verificar a cada 15 minutos (900000ms)
PERFORMANCE_CHECK_INTERVAL=900000

# Verificar a cada 30 minutos (1800000ms)
PERFORMANCE_CHECK_INTERVAL=1800000

# Verificar a cada 1 hora (3600000ms) - Padrão
PERFORMANCE_CHECK_INTERVAL=3600000
```

## 🔐 Segurança

### Gerar JWT_SECRET Seguro

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Gerar GitHub Token

1. Acesse [GitHub Settings](https://github.com/settings/tokens)
2. Clique em "Generate new token"
3. Selecione scopes:
   - `repo` (acesso completo ao repositório)
   - `read:user` (ler informações do usuário)
4. Copie o token

### Proteger Variáveis Sensíveis

**Nunca faça commit de `.env`:**

```bash
# .gitignore
.env
.env.local
.env.*.local
```

Use apenas variáveis de ambiente do Render em produção.

## 🧪 Testando Configuração

### Verificar se Tudo Está Funcionando

```bash
# Iniciar servidor
pnpm dev

# Em outro terminal, testar endpoints
curl http://localhost:3000/api/trpc/monitoring.checkUptime \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"siteUrl":"https://seu-site.com"}'
```

### Verificar Logs

```bash
# Ver logs em tempo real
tail -f ~/.local/share/svs-agent/logs.txt

# Ou via Render Dashboard
# Clique no seu serviço → Logs
```

## 🆘 Troubleshooting

### Erro: "Invalid DATABASE_URL"

```
Solução: Verifique o formato da string de conexão
Formato correto: mysql://user:password@host:port/database
```

### Erro: "GITHUB_TOKEN inválido"

```
Solução: Regenere o token com as permissões corretas
Acesse: https://github.com/settings/tokens
```

### Erro: "TARGET_SITE_URL não é acessível"

```
Solução: Verifique se o site está online
Teste: curl https://seu-site.com
```

### Agente não está monitorando

```
Solução: Verifique os logs
Procure por: "[Scheduler] Running uptime check..."
```

## 📊 Monitorando Múltiplos Sites

Para monitorar múltiplos sites, você tem duas opções:

### Opção 1: Múltiplas Instâncias

Deploy várias instâncias do agente, cada uma com um `TARGET_SITE_URL` diferente:

```bash
# Instância 1
TARGET_SITE_URL=https://site1.com
DATABASE_URL=mysql://...

# Instância 2
TARGET_SITE_URL=https://site2.com
DATABASE_URL=mysql://...
```

### Opção 2: Banco de Dados Compartilhado

Use o mesmo banco de dados para todas as instâncias:

```bash
# Todas as instâncias
DATABASE_URL=mysql://user:pass@shared-host/svs_agent
```

## 🎯 Próximos Passos

1. **Configurar Alertas**: Receba notificações de downtime
2. **Personalizar Dashboard**: Customize cores e layout
3. **Integrar com Slack**: Envie relatórios para Slack
4. **Backup Automático**: Configure backup do banco de dados
5. **Monitorar Performance**: Ajuste intervalos conforme necessário

## 📞 Suporte

- Documentação: [README.md](./README.md)
- Deploy: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- Issues: [GitHub Issues](https://github.com/SidneyJuniorxz/SVS-AGENTE/issues)

---

**Última Atualização**: 2026-03-01
