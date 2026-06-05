# Security — iTrainer

Auditoria realizada em 2026-05. Mudanças desta sessão e backlog.

## Modelo de ameaça

- Aplicação web pública, BR. Usuários: clientes (alunos) e profissionais (personal trainers).
- Dados sensíveis: emails, telefones, fotos, histórico saúde (restrições), pagamentos Pix.
- LGPD aplicável.

## Controles implementados

### Autenticação
- **Bcrypt** 12 rounds (`bcryptjs`)
- **JWT access** assinado HS256, 15 min, claims `iss=itrainer-api`, `aud=itrainer-app`
- **JWT_SECRET** fail-fast em prod: precisa estar setado e ≥ 32 chars
- **Refresh token** opaco (256-bit random), hash SHA-256 em DB, TTL 30d
- **Refresh rotation**: cada `/refresh` invalida o anterior e emite novo
- **Refresh reuse detection**: se token revogado é reapresentado, toda família é revogada (detecta theft)
- **httpOnly cookie** `itrainer_rt`, `SameSite=Strict`, `Secure` em prod, path `/api`
- **Logout** revoga refresh server-side + limpa cookie

### Autorização
- Middleware `authMiddleware` valida JWT em todas rotas privadas
- IDOR fixes: rotas críticas derivam IDs de `req.user` (JWT), nunca aceitam IDs sensíveis do body
  - `POST /agendamentos`: `cliente_id` vem do JWT
  - `POST /avaliacoes`: `cliente_id` vem do JWT, exige `tipo=cliente`
  - `POST /chat/.../mensagens`: `remetente_id` vem do JWT
  - `GET /agendamentos`: filtra por `req.user.id` automaticamente
  - `PATCH /agendamentos/:id/status`: valida membership antes
  - Chat: valida membership em `agendamento.cliente_id` ou `profissional_id`

### Anti-abuso
- Rate limit global: 120 req/min/IP
- Rate limit auth (`/login`, `/cadastro`, `/refresh`): 10 req/15 min/IP
- `trust proxy: 1` para X-Forwarded-For correto atrás de Coolify/Nginx

### Hardening HTTP
- **helmet**: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy strict-origin-when-cross-origin
- **CSP em prod** com directives: `default-src 'self'`, `script-src 'self'`, `img-src 'self' data: unsplash dicebear`, `frame-ancestors 'none'`, `object-src 'none'`
- **CORS** whitelist (CSV via `CORS_ORIGIN`), bloqueia origens não listadas, `credentials: true` para cookies
- **x-powered-by** desabilitado
- **JSON limit** 3 MB (acomoda foto base64; rate-limit mitiga abuse)

### Upload de fotos
- **MIME whitelist** server-side: data URL `image/(png|jpe?g|webp|gif)`, OU HTTPS URL apenas
- **SVG bloqueado** (vetor XSS via `<svg><script>`)
- Tamanho: 2 MB hard limit server, 1.5 MB no frontend antes de upload

### Banco de dados
- **Postgres** com queries 100% parametrizadas (`$1`, `$2`); 0 concatenação de input
- **Foreign keys** com `ON DELETE CASCADE` consistente
- **CHECK constraints** em status/notas/datas
- **UNIQUE** em emails (clientes, profissionais), avaliações (cliente_id, profissional_id), refresh `token_hash`
- **Migrations rastreadas** via tabela `schema_migrations` (idempotente)

### Outras
- **Sem `dangerouslySetInnerHTML`**, sem `eval`, sem `new Function`
- **Sem credentials em logs** (greps confirmados)
- **Error handler global**: stack só em dev; prod retorna `{ error }` genérico
- **Open redirect**: Login só aceita `/path` interno (`/^\/[^/]/`)
- **Webhook Asaas** autenticado por shared token comparado contra `ASAAS_WEBHOOK_TOKEN`
- **Transações pg** com `withTransaction` (BEGIN/COMMIT/ROLLBACK automático)

### Frontend
- **Access token em memória** (variável JS, não localStorage) → fora do alcance de XSS direto
- **Refresh em httpOnly cookie** → indisponível para JS, imune a XSS
- **Refresh automático** em 401 com fila para chamadas concorrentes (não duplica refresh)
- **Logout async** chama `/logout` server-side antes de limpar estado

## Boas práticas operacionais

### Antes de prod
1. Gerar JWT_SECRET forte:
   ```bash
   openssl rand -base64 48
   ```
2. Setar env vars no Coolify:
   - `NODE_ENV=production`
   - `JWT_SECRET=<48 chars+>`
   - `CORS_ORIGIN=https://seu-dominio.tld`
   - `DATABASE_URL=postgres://...`
   - `ASAAS_WEBHOOK_TOKEN=<32 chars+>`
3. Verificar HTTPS ativo (Coolify + Let's Encrypt ou sslip.io)
4. Rodar migrations: automático via `start:prod`

### Operação contínua
- Rotacionar `JWT_SECRET` periodicamente (todos tokens emitidos invalidam — usuários logam de novo)
- Monitor logs `[API error]` para padrões anômalos
- Backup do Postgres (Coolify tem snapshot automático)
- Atualizar deps: `npm audit` no backend (hoje 0 vulns) e CRA (51 vulns dev-only, vide backlog)

## Backlog / aceitos como risco

| ID | Item | Risco | Decisão |
|----|------|-------|---------|
| ~~B1~~ | ~~CRA 51 vulns~~ | **RESOLVIDO**: migrado p/ Vite 7. 0 vulns. |
| B2 | Email enumeration via `/cadastro` 409 | Permite confirmar se email já está cadastrado | Aceito; mitigação (resposta genérica) prejudica UX |
| ~~B3~~ | ~~Sem password reset~~ | **RESOLVIDO**: `/forgot-password` + `/reset-password` c/ token SHA-256 + Nodemailer + fallback console em dev. Revoga refresh tokens após reset. |
| B4 | Sem 2FA | Defesa em profundidade | Backlog |
| B5 | Sem account lockout após N falhas | Rate limit IP atenua; lockout por usuário evita lockout por IP compartilhado | Backlog (TOTP/email seria base) |
| ~~B6~~ | ~~Foto base64 inline~~ | **RESOLVIDO**: upload via multer 2.x p/ `/uploads/fotos/`. Validação magic bytes server-side (anti-extension spoof + anti-SVG XSS). DB armazena só path. |
| ~~B7~~ | ~~Sem audit log~~ | **RESOLVIDO**: tabela `audit_log` JSONB. Instrumentado: login (success/fail), cadastro, logout, agendamento criado/status, pagamento criado, webhook Asaas, upload foto, password reset solicitado/concluído. |
| B8 | Webhook Asaas só shared token (sem HMAC) | Asaas não oferece HMAC; secret rotativo é mitigação | Aceito |
| B9 | CSRF token (não necessário enquanto JWT em header, cookie é SameSite=Strict) | Strict cobre uso atual; se mover access p/ cookie precisará | Aceito |
| B10 | Refresh token único device (logout em um device desloga todos da família) | Múltiplas sessões precisariam de famílias separadas por device | Aceito; aceitável p/ MVP |

## Como reportar vulnerabilidade

Privado: `security@iTrainer.com` (configurar SMTP/redirect quando prod).
