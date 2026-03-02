# 🚀 Guia de Deploy - SVS Agent

Instruções passo a passo para fazer deploy do SVS Agent no Render (plano gratuito).

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Render](https://render.com)
- Banco de dados MySQL/TiDB (você pode usar o TiDB Cloud gratuito)
- Token de acesso pessoal do GitHub

## 🔑 Passo 1: Preparar Credenciais

### 1.1 Gerar Token GitHub

1. Acesse [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Clique em "Generate new token"
3. Preencha:
   - **Note**: `SVS Agent Deploy`
   - **Expiration**: Sem expiração ou 90 dias
   - **Scopes**: Selecione `repo` e `read:user`
4. Clique em "Generate token"
5. **Copie o token** (você não verá novamente)

### 1.2 Preparar Banco de Dados

#### Opção A: TiDB Cloud (Recomendado - Gratuito)

1. Acesse [TiDB Cloud](https://tidbcloud.com)
2. Crie uma conta gratuita
3. Crie um novo cluster (plano Free)
4. Obtenha a string de conexão:
   - Formato: `mysql://username:password@host:4000/database?sslMode=verify_identity`

#### Opção B: PlanetScale (Alternativa - Gratuito)

1. Acesse [PlanetScale](https://planetscale.com)
2. Crie uma conta
3. Crie um novo banco de dados
4. Obtenha a string de conexão MySQL

#### Opção C: Render Database (Pago)

1. No Render, crie um novo MySQL database
2. Copie a string de conexão

### 1.3 Obter Credenciais Manus (Opcional)

Se quiser usar OAuth e LLM do Manus:

1. Acesse [Manus Dashboard](https://manus.im)
2. Crie uma nova aplicação
3. Copie:
   - `VITE_APP_ID`
   - `BUILT_IN_FORGE_API_KEY`
   - `VITE_FRONTEND_FORGE_API_KEY`

## 🌐 Passo 2: Deploy no Render

### 2.1 Conectar Repositório

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em "New +" → "Web Service"
3. Selecione "Deploy an existing repository"
4. Conecte sua conta GitHub
5. Selecione o repositório `SVS-AGENTE`

### 2.2 Configurar Serviço

1. Preencha os campos:
   - **Name**: `svs-agente`
   - **Runtime**: `Docker`
   - **Region**: Selecione a mais próxima (ex: São Paulo)
   - **Plan**: `Free`

2. Clique em "Advanced" e configure:
   - **Build Command**: `pnpm install && pnpm db:push && pnpm build`
   - **Start Command**: `node dist/index.js`

### 2.3 Adicionar Variáveis de Ambiente

Clique em "Environment" e adicione:

#### Obrigatórias

| Chave | Valor | Exemplo |
|-------|-------|---------|
| `NODE_ENV` | `production` | - |
| `TARGET_SITE_URL` | URL do site | `https://svs-solucoes.surge.sh` |
| `DATABASE_URL` | String de conexão MySQL | `mysql://user:pass@host/db` |
| `GITHUB_TOKEN` | Token GitHub | `ghp_xxxx...` |
| `JWT_SECRET` | Chave secreta | Gere com: `openssl rand -hex 32` |

#### GitHub (Obrigatórias se usar análise de código)

| Chave | Valor |
|-------|-------|
| `GITHUB_REPO_OWNER` | `SidneyJuniorxz` |
| `GITHUB_REPO_NAME` | `SITE-SVS` |

#### Manus (Opcionais - para OAuth e LLM)

| Chave | Valor |
|-------|-------|
| `VITE_APP_ID` | Seu App ID |
| `BUILT_IN_FORGE_API_KEY` | Sua API Key |
| `VITE_FRONTEND_FORGE_API_KEY` | Sua Frontend API Key |
| `OWNER_OPEN_ID` | Seu Open ID |

#### Intervalos de Monitoramento (Opcionais)

| Chave | Valor Padrão | Descrição |
|-------|--------------|-----------|
| `UPTIME_CHECK_INTERVAL` | `300000` | 5 minutos |
| `SEO_ANALYSIS_INTERVAL` | `86400000` | 24 horas |
| `PERFORMANCE_CHECK_INTERVAL` | `3600000` | 1 hora |

### 2.4 Deploy

1. Clique em "Create Web Service"
2. Aguarde o build completar (pode levar 5-10 minutos)
3. Quando terminar, você verá a URL do seu serviço

## ✅ Passo 3: Verificar Deploy

1. Acesse a URL fornecida pelo Render
2. Você deve ver a página inicial do SVS Agent
3. Clique em "Ir para Dashboard"
4. Verifique se as métricas estão sendo coletadas

### Troubleshooting

Se o deploy falhar:

1. Clique em "Logs" para ver erros
2. Verifique se todas as variáveis de ambiente estão corretas
3. Confirme se o banco de dados está acessível
4. Tente fazer redeploy: clique em "Manual Deploy"

## 🔄 Passo 4: Configurar para Outro Site

Para monitorar um site diferente:

1. No Render Dashboard, clique no seu serviço
2. Vá para "Environment"
3. Modifique:
   - `TARGET_SITE_URL`: URL do novo site
   - `GITHUB_REPO_OWNER`: Owner do novo repositório
   - `GITHUB_REPO_NAME`: Nome do novo repositório
   - `GITHUB_TOKEN`: Token com acesso ao novo repositório
4. Clique em "Save"
5. Render fará redeploy automaticamente

## 📊 Passo 5: Integrar Chatbot

Para adicionar o chatbot ao seu site:

1. Obtenha a URL do seu serviço Render (ex: `https://svs-agente.onrender.com`)
2. Adicione ao seu site:

```html
<script src="https://svs-agente.onrender.com/chatbot-widget.js"></script>
<script>
  SVSChatbot.init({
    apiUrl: 'https://svs-agente.onrender.com/api/trpc',
    position: 'bottom-right'
  });
</script>
```

## 🔐 Passo 6: Segurança

### Recomendações

1. **Mude o JWT_SECRET**: Gere um novo valor seguro
2. **Restrinja o acesso**: Configure firewall se necessário
3. **Monitore logs**: Verifique regularmente os logs do Render
4. **Atualize dependências**: Execute `pnpm update` periodicamente
5. **Faça backup do banco**: Configure backups automáticos

### Variáveis Sensíveis

Nunca commite `.env` no Git. Use apenas variáveis de ambiente do Render.

## 📈 Passo 7: Monitoramento

### Verificar Status

1. Acesse o Render Dashboard
2. Clique no seu serviço
3. Verifique:
   - **Status**: Deve estar "Live"
   - **CPU/Memory**: Deve estar baixo (plano free é limitado)
   - **Logs**: Procure por erros

### Alertas

Configure alertas no Render:

1. Vá para "Settings" → "Notifications"
2. Adicione seu email
3. Selecione eventos para notificação

## 🆘 Troubleshooting

### Erro: "Build failed"

```
Solution: Verifique o arquivo Dockerfile e render.yaml
```

### Erro: "Database connection failed"

```
Solution: Confirme se DATABASE_URL está correto e o banco está acessível
```

### Erro: "Out of memory"

```
Solution: Plano free tem 512MB. Considere upgrade ou otimizar código
```

### Chatbot não funciona

```
Solution: Verifique se a URL do widget está correta e CORS está habilitado
```

## 🎯 Próximos Passos

1. **Configurar Alertas**: Receba notificações de downtime
2. **Personalizar Dashboard**: Customize cores e layout
3. **Integrar com Slack**: Envie relatórios para Slack
4. **Monitorar Múltiplos Sites**: Deploy várias instâncias
5. **Backup Automático**: Configure backup do banco de dados

## 📞 Suporte

- Documentação: [README.md](./README.md)
- Issues: [GitHub Issues](https://github.com/SidneyJuniorxz/SVS-AGENTE/issues)
- Email: suporte@svs.local

---

**Última Atualização**: 2026-03-01
