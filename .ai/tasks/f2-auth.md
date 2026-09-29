# F2 — Autenticação e perfis: plano de implementação

> **Para agentes:** execute com superpowers:executing-plans (TDD em cada passo).

**Objetivo:** login com e-mail e senha, sessão JWT revogável e guards `requireUser`/`requireRole`.
**Arquitetura:** regras puras e testáveis em `src/server/auth/*` (rate limit, credenciais, sessão,
guards) recebem o banco por parâmetro; o Auth.js (`config.ts`) e o `src/proxy.ts` são só fiação.
**Stack:** next-auth 5.0.0-beta.32 (Credentials, JWT), @node-rs/argon2, react-hook-form 7,
@hookform/resolvers 5, zod 4.
**Spec:** [ADR 0002](../decisions/0002-auth-e-perfis.md) · [perfis](../domains/usuarios-e-perfis.md) ·
[rotas](../context/routes.md) · [backlog F2](./backlog.md)

## Restrições globais

- Sem `any`/`enum`; `Role` e `UserStatus` vêm de `src/types/domain.ts`.
- Mensagem de login sempre genérica: **"E-mail ou senha inválidos."**; rate limit:
  **"Muitas tentativas. Tente novamente em alguns minutos."**
- Rate limit: 5 tentativas por e-mail+IP e 20 por IP, janela de 15 min (em memória).
- Sessão: JWT em cookie httpOnly, `sameSite=lax`, `maxAge` de 8 h; claims `sub`, `role`, `sessionVersion`.
- 401 = sem sessão/versão divergente/bloqueado; 403 = sem permissão. Corpo `{ error: { code, message } }`.
- Nunca logar senha, hash ou token. Função ≤ 40 linhas; testes colocalizados.

## Review Focus

1. E-mail com maiúsculas/espaços no login encontra o usuário (normalização igual à do seed).
2. Senha gigante (> 128 chars) é rejeitada pelo Zod antes do argon2 (evita DoS).
3. Rate limit não cresce sem limite: chaves expiradas são removidas.
4. Token com `sessionVersion` antigo após bloqueio/reset → 401 mesmo com JWT válido.
5. `/login` com sessão válida redireciona para `/`; `/_next`, favicon e `/api/auth` passam direto pelo proxy.

---

### Task 1: Rate limiter em memória

**Files:** Create `src/server/auth/rate-limit.ts` · Test `rate-limit.test.ts`
**Produces:** `createRateLimiter({ limit, windowMs, now? }): RateLimiter` com
`hit(key): { allowed: boolean; retryAfterMs: number }`, `reset(key)`, `size(): number`.

- [ ] Testes RED: `permite até limit hits na janela`; `bloqueia o hit limit+1`;
      `libera após windowMs` (relógio injetado); `reset limpa a chave`;
      `remove chaves expiradas ao ultrapassar 1000 entradas` (`size()` cai)
- [ ] Implementar janela fixa com `Map<string, { count; resetAt }>`; → PASS; commit `feat(auth): rate limiter`

### Task 2: Verificação de credenciais

**Files:** Create `src/schemas/auth.ts`, `src/server/auth/credentials.ts`, `src/types/auth.ts` ·
Modify `src/server/db/seed/seed.ts` (usar `normalizeEmail` compartilhado) · Test `src/schemas/auth.test.ts`, `credentials.test.ts`
**Consumes:** Task 1. **Produces:**

- `normalizeEmail(email: string): string` e `loginSchema` (`email` z.email trim+lowercase; `password` 1–128) em `src/schemas/auth.ts`
- `type SessionUser = { id: number; name: string; email: string; role: Role; sessionVersion: number }` em `src/types/auth.ts`
- `type LoginResult = { ok: true; user: SessionUser } | { ok: false; reason: 'invalid' | 'rate_limited' }`
- `createCredentialsVerifier(db, limiters?): (input: LoginInput, ip: string) => Promise<LoginResult>`

- [ ] Testes RED (banco `:memory:` migrado + usuários inseridos com `hash`):
      `login válido retorna o usuário sem hash`; `senha errada → invalid`; `e-mail inexistente → invalid`
      e chama `verify` com hash fictício (spy); `usuário bloqueado com senha certa → invalid`;
      `" Admin@Exemplo.com "` encontra `admin@exemplo.com`; `6ª tentativa no mesmo e-mail+IP → rate_limited`
      (mesmo com senha certa); `21ª tentativa do IP com e-mails variados → rate_limited`;
      `sucesso zera o contador de e-mail+IP`; schema: `senha com 129 chars é rejeitada`
- [ ] Implementar: checa limites antes de consultar o banco; hash fictício gerado uma vez (lazy)
- [ ] → PASS; commit `feat(auth): verificação de credenciais`

### Task 3: Validação de sessão e guards

**Files:** Create `src/server/auth/errors.ts`, `src/server/auth/session.ts`, `src/server/auth/guards.ts` ·
Test `session.test.ts`, `guards.test.ts`, `errors.test.ts`
**Consumes:** Task 2 (`SessionUser`). **Produces:**

- `type SessionClaims = { userId: number; sessionVersion: number }`
- `class AuthError extends Error { status: 401 | 403; code: 'unauthorized' | 'forbidden' }`
- `loadSessionUser(db, claims: SessionClaims | null): Promise<SessionUser | null>` (1 consulta por PK)
- `assertUser(user: SessionUser | null): SessionUser` (401) · `assertRole(user, role: Role): SessionUser` (403)
- `authErrorResponse(error: AuthError): Response` (JSON `{ error: { code, message } }`)

- [ ] Testes RED: `claims null → null`; `versão divergente → null`; `bloqueado → null`;
      `usuário inexistente → null`; `ativo com versão igual → SessionUser`;
      `assertUser(null)` lança 401; `viewer em assertRole('admin')` lança 403; `admin passa`;
      `authErrorResponse` devolve status e corpo padronizados
- [ ] Implementar; → PASS; commit `feat(auth): sessão revogável e guards`

### Task 4: Auth.js, banco singleton, proxy e `requireUser`/`requireRole`

**Files:** Create `src/server/db/index.ts`, `src/server/auth/config.ts`, `src/server/auth/index.ts`,
`src/server/auth/routing.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`,
`src/proxy.ts` · Modify `.env.example`, `package.json` · Test `routing.test.ts`
**Consumes:** Tasks 2–3. **Produces:**

- `getDb(): AppDatabase` (lazy, cache em `globalThis` para HMR; lê `DATABASE_URL`)
- `{ handlers, auth, signIn, signOut }` do NextAuth; `authorize` usa o verifier e o IP de
  `x-forwarded-for` (1º valor) ou `'unknown'`; `rate_limited` lança `CredentialsSignin` com `code = 'rate_limited'`
- `requireUser(): Promise<SessionUser>` e `requireRole(role: Role): Promise<SessionUser>` em `index.ts`
- `routeDecision(pathname, claims: { role: Role } | null): { type: 'next' } | { type: 'redirect'; to: string }`

- [ ] Testes RED de `routeDecision`: `anônimo em / → /login?callbackUrl=%2F`; `anônimo em /login → next`;
      `logado em /login → /`; `viewer em /admin/usuarios → /`; `admin em /admin/usuarios → next`;
      `/api/* → next` (handlers respondem 401/403 JSON)
- [ ] Implementar; `proxy.ts` usa `auth` como wrapper e matcher que exclui `_next`, `favicon.ico`, `api/auth`
- [ ] `.env.example`: `AUTH_SECRET=` (gerar com `openssl rand -base64 32`) e `AUTH_TRUST_HOST=true`
- [ ] `yarn typecheck && yarn test:run` → verde; commit `feat(auth): Auth.js, proxy e guards`

### Task 5: Página de login e logout

**Files:** Create `src/app/(auth)/login/page.tsx`, `src/features/auth/login-form.tsx`,
`src/features/auth/actions.ts` · Modify `src/app/page.tsx` (nome do usuário + botão Sair, provisório até a F3) ·
Test `login-form.test.tsx`
**Produces:** `loginAction(input: LoginInput): Promise<{ error: string } | undefined>` (redireciona em sucesso);
`logoutAction(): Promise<void>`.

- [ ] Testes RED (Testing Library, action mockada): `mostra erros de validação sem chamar a action`;
      `envia e-mail e senha normalizados`; `exibe o erro genérico retornado`; `desabilita o botão enquanto envia`
- [ ] Implementar com RHF + `zodResolver(loginSchema)`, MUI `TextField`, `autoComplete` corretos
- [ ] Verificação manual (skill `run`): login admin, viewer, bloqueado, 6 erros seguidos, logout
- [ ] Commit `feat(auth): página de login e logout`

### Task 6: Documentação e verificação final

**Files:** Modify `.ai/context/routes.md`, `.ai/architeture/overview.md`, `.ai/tasks/backlog.md`, `.ai/README.md`

- [ ] Rotas implementadas, variáveis `AUTH_*`, limitação do rate limit (instância única, XFF confiável só atrás de proxy)
- [ ] `yarn lint`, `yarn typecheck`, `yarn test:run`, `yarn build` → verdes
- [ ] Revisão final do branch por revisor independente; commit `docs: F2`
