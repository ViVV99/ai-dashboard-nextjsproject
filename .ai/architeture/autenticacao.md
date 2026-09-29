# Autenticação e autorização (F2)

Decisão: [ADR 0002](../decisions/0002-auth-e-perfis.md) · Regras: [perfis](../domains/usuarios-e-perfis.md) ·
Plano: [F2](../tasks/f2-auth.md)

## Módulos

| Arquivo                          | Responsabilidade                                                    |
| -------------------------------- | ------------------------------------------------------------------- |
| `src/schemas/auth.ts`            | `loginSchema` (senha 1–128) e `normalizeEmail` (usado pelo seed)    |
| `src/server/auth/rate-limit.ts`  | Janela fixa em memória; varre chaves expiradas acima de 1000        |
| `src/server/auth/credentials.ts` | Verifica e-mail/senha, rate limit e hash fictício (tempo constante) |
| `src/server/auth/session.ts`     | `loadSessionUser`: revalida usuário e `session_version` por PK      |
| `src/server/auth/guards.ts`      | `assertUser` (401) e `assertRole` (403), funções puras              |
| `src/server/auth/errors.ts`      | `AuthError` e `authErrorResponse` (`{ error: { code, message } }`)  |
| `src/server/auth/routing.ts`     | `routeDecision`: regra pura de redirects do proxy                   |
| `src/server/auth/config.ts`      | Auth.js (Credentials + JWT) — só fiação                             |
| `src/server/auth/index.ts`       | `requireUser`, `requireRole`, `requirePageUser`                     |
| `src/server/db/index.ts`         | `getDb()`: conexão única por processo                               |
| `src/proxy.ts`                   | Checagem otimista de rotas (usa `auth` como wrapper)                |
| `src/features/auth/*`            | Formulário de login (RHF + Zod), actions, `safeCallbackUrl`         |

## Fluxo do login

1. O `LoginForm` valida com `loginSchema` e chama `loginAction(input, callbackUrl)`.
2. A action chama `signIn('credentials')`, que roda o `authorize` do provider.
3. O `authorize` aplica o rate limit (IP e e-mail+IP), busca o usuário e roda o argon2
   (contra um hash fictício se o e-mail não existe). Qualquer falha vira a mesma mensagem.
4. Em sucesso, o JWT recebe `sub`, `role` e `sessionVersion`, e o usuário é redirecionado
   para o `callbackUrl` (só caminhos internos, ver `safeCallbackUrl`).

## Revogação da sessão

- O callback `jwt` revalida o token no banco **a cada leitura de sessão** (1 consulta por PK).
  Se o usuário foi bloqueado ou o `session_version` mudou, retorna `null` e o Auth.js
  remove o cookie. Assim, no proxy, o usuário cai para `/login` sem loop de redirects.
- `requireUser`/`requireRole` revalidam de novo (defesa em profundidade). Use-os em todo
  service, action e route handler. Em Server Components, use `requirePageUser`.
- Em route handlers: `catch (e) { if (e instanceof AuthError) return authErrorResponse(e) }`.

## Variáveis de ambiente

| Variável          | Uso                                                            |
| ----------------- | -------------------------------------------------------------- |
| `AUTH_SECRET`     | Segredo do JWT. Obrigatório. `openssl rand -base64 32`         |
| `AUTH_TRUST_HOST` | `true` fora da Vercel. Exige proxy reverso confiável na frente |
| `DATABASE_URL`    | Mesmo banco do seed (padrão `./data/app.db`)                   |

## Limitações conhecidas

- O rate limit fica em memória: exige **instância única** e zera a cada restart.
- O IP vem do 1º valor de `x-forwarded-for`, que o cliente pode forjar se não houver um
  proxy reverso que reescreva o cabeçalho. O limite por e-mail+IP continua valendo.
- A sessão dura 8 h (`maxAge`), sem renovação por atividade.
