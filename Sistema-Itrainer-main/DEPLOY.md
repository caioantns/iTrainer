# Deploy iTrainer no Coolify (Hostinger VPS)

## Pre-requisitos

- VPS Hostinger com Coolify instalado.
- Repo Git acessivel (GitHub publico ou SSH key).
- Docker funcionando no VPS (Coolify cuida).

## Visao geral

Stack: backend Node + Postgres + frontend Vite (servido como static pelo Express na mesma porta).

```
Coolify
├── Resource 1: Postgres 16
└── Resource 2: Application (Dockerfile)
    └── Volume: backend/uploads (persistencia fotos)
```

## 1. Postgres no Coolify

1. **New Resource > Database > Postgres 16**.
2. Username: `itrainer_user`, Database: `itrainer`, senha forte.
3. **Internal URL** (anotar): `postgres://itrainer_user:<senha>@<id-interno>:5432/itrainer`.
4. **Not public**: deixar acesso apenas interno.

> Extensao `pgcrypto` e habilitada automaticamente pelo Postgres 16 + migration 005.

## 2. Application

1. **New Resource > Application > Public Repository** (ou Private + Deploy Key).
2. **Repository**: URL do GitHub do `Sistema-Itrainer`.
3. **Branch**: `main` (ou branch deploy).
4. **Build Pack**: `Dockerfile`.
5. **Dockerfile location**: `/Dockerfile`.
6. **Ports Exposes**: `3010`.
7. **Ports Mappings**: `3010:3010`.

### Persistent Storage (uploads)

Em **Storages** da application, adicionar:

- **Mount Path no container**: `/app/backend/uploads`
- **Type**: Volume (persistente)

Sem isso, fotos somem em cada redeploy.

### Environment Variables

Em **Environment Variables**:

```
NODE_ENV=production
PORT=3010
DATABASE_URL=postgres://itrainer_user:<senha>@<postgres-id>:5432/itrainer
JWT_SECRET=<gerar: openssl rand -base64 48>
JWT_EXPIRES_IN=15m
JWT_ISSUER=itrainer-api
JWT_AUDIENCE=itrainer-app
REFRESH_TOKEN_TTL_DAYS=30
CORS_ORIGIN=https://<host-publico>
APP_BASE_URL=https://<host-publico>
```

#### Pagamento (Asaas) — opcional p/ teste

```
ASAAS_API_KEY=<chave-sandbox-ou-prod>
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=<openssl rand -base64 32>
```

#### Email (SMTP) — opcional, password reset usa console se vazio

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<segredo>
SMTP_FROM=iTrainer <no-reply@seu-dominio.com>
```

## 3. Dominio / HTTPS sem comprar dominio

Em **Domains** da application:

1. Pegar IP publico VPS: `203.0.113.45`.
2. Configurar dominio: `app-203-0-113-45.sslip.io` (sslip.io resolve `<ip-com-tracos>` -> `<ip>`).
3. Coolify gera Let's Encrypt automatico.

Apos deploy: `https://app-203-0-113-45.sslip.io`.

**Atualizar `CORS_ORIGIN` e `APP_BASE_URL`** com esse mesmo URL.

## 4. Deploy

1. **Save** > **Deploy**.
2. Acompanhar logs ate ver:
   ```
   Aplicando migration: 001_schema.sql
   OK: 001_schema.sql
   ...
   iTrainer API rodando em http://localhost:3010
   ```
3. Migrations rodam automaticamente via `npm run start:prod` (`migrate.js && index.js`).

## 5. Smoke test

```bash
curl https://app-<ip>.sslip.io/api/status
# { "api": "ok", "db": { "ok": true }, "timestamp": "..." }
```

Abrir `https://app-<ip>.sslip.io` no browser. Cadastrar cliente teste, login, criar plano (como profissional), etc.

## 6. Asaas webhook (apos deploy ativo)

1. Painel Asaas > Integracoes > Webhooks.
2. URL: `https://<host>/api/webhooks/asaas`.
3. Header custom: `asaas-access-token: <ASAAS_WEBHOOK_TOKEN>`.
4. Eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`.

## 7. Operacao continua

### Rotacionar JWT_SECRET
```
openssl rand -base64 48
```
Atualizar env, redeploy. Todos tokens invalidam, usuarios relogam.

### Logs
- **Application logs** Coolify: stdout/stderr live.
- Erros aparecem como `[API error] METHOD /path mensagem`.
- Audit log no DB: `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50;`.

### Backup
- Postgres: Coolify tem snapshots automaticos. Configurar retencao em Database > Settings.
- Uploads: snapshot do volume.

### Migracoes futuras
- Adicionar `008_xxx.sql` em `backend/migrations/`.
- Commit + push. Coolify redeploy. Migrate roda incrementalmente (tabela `schema_migrations` tracking).

## Troubleshooting

### Migration falha
- Logs mostram nome do arquivo + linha.
- Acessar container via Coolify Terminal:
  ```
  cd /app/backend && node src/migrate.js
  ```

### DB connection refused
- `DATABASE_URL` deve usar nome interno do Postgres no Coolify (algo como `postgres-xyz123`), nao `localhost`.

### CORS bloqueando
- `CORS_ORIGIN` precisa coincidir exatamente com URL publico (com `https://`).
- CSV se varios dominios: `CORS_ORIGIN=https://app.com,https://www.app.com`.

### CSP bloqueando recursos
- Inspect Network: `Refused to load X because CSP`.
- Adicionar origem em `backend/src/index.js` (`scriptSrc`, `imgSrc` etc).

### Foto upload 413 / sumiu apos redeploy
- 413: arquivo > 2 MB. Reduzir client-side antes do upload.
- Sumiu: volume nao montado. Conferir Storages > Mount em `/app/backend/uploads`.

### Refresh token nao funciona
- Cookie precisa `Secure=true` (prod) + HTTPS ativo.
- Sem HTTPS, cookie nao envia. Confirmar Let's Encrypt OK.

### Rate limit muito agressivo
- `backend/src/index.js`: ajustar `globalLimiter.max` e `authLimiter.max`.

## Checklist final pre-deploy

- [ ] `JWT_SECRET` gerado e configurado (>= 32 chars)
- [ ] `DATABASE_URL` apontando p/ Postgres interno do Coolify
- [ ] `CORS_ORIGIN` = `APP_BASE_URL` = URL publico final
- [ ] Volume `/app/backend/uploads` montado
- [ ] (Opcional) Asaas API key + webhook token
- [ ] (Opcional) SMTP configurado p/ password reset funcionar
- [ ] Push do codigo p/ GitHub branch deploy

## Smoke local (opcional, antes de subir)

```bash
docker build -t itrainer-test .
docker run --rm -p 3010:3010 \
  -e JWT_SECRET="test-32-chars-min-secret-1234567890" \
  -e DATABASE_URL="postgres://user:pass@host.docker.internal:5432/itrainer" \
  -e CORS_ORIGIN="http://localhost:3000" \
  itrainer-test
```

Acessar `http://localhost:3010/api/status` — deve responder `ok`.
