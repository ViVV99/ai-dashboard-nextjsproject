# F9 — Gestão de usuários + perfil: plano de implementação

> **Para agentes:** execute com superpowers:executing-plans (TDD em cada passo).

**Objetivo:** admin lista, cria, edita, bloqueia/desbloqueia e redefine a senha de viewers, com
auditoria; todo usuário edita o próprio nome e troca a senha; admin vê o log de auditoria.
**Arquitetura:** schemas Zod em `src/schemas/users.ts` (client + server). Services puros
(`db`, `actor` e `hash` por parâmetro) em `src/server/services/{users,profile,audit}`, testados com
`:memory:`; regras violadas lançam `UserRuleError` (404/409/422). Fachadas com `requireRole('admin')`
/ `requireUser()`. UI: Server Actions + RHF/Zod; REST em `src/app/api/{users,me}` reusa os services.
**Stack:** Drizzle (transações), `@node-rs/argon2`, Auth.js (`signIn` para renovar a sessão),
RHF + Zod 4, MUI (Dialog, Table, Pagination).
**Spec:** [perfis e regras](../domains/usuarios-e-perfis.md) · [rotas](../context/routes.md) ·
[backlog F9](./backlog.md) · [autenticação](../architeture/autenticacao.md) · [schema](../domains/schema.md)

## Restrições globais

- Admin só gerencia **viewers**: alvo admin ⇒ 422 `admin_target`; alvo = o próprio ator ⇒ 422
  `self_action` (checado antes). Alvo inexistente ⇒ 404 `not_found`. E-mail duplicado ⇒ 409
  `email_taken` (também se a UNIQUE do banco disparar numa corrida).
- E-mail: trim + minúsculas (`normalizeEmail`). Nome: trim, 2–100. Senha: 8–128, letra e número.
- Bloquear, redefinir senha e trocar a própria senha incrementam `session_version` (+1).
  Desbloquear não. Na troca própria a sessão atual é **renovada** com `signIn` (nova senha) e só as
  outras caem; nunca aceitar `sessionVersion` vinda do cliente (`update()` do Auth.js).
- Toda ação do admin grava `audit_logs` **na mesma transação**: `user.create`, `user.update`
  (metadata `{ changed: ['name','email'] }`), `user.block`, `user.unblock`, `user.reset_password`.
  Metadata nunca leva senha nem hash. Ações sobre o próprio perfil não são administrativas.
- Troca de senha exige a senha atual (argon2 verify) ⇒ errada: 422 `wrong_password`.
- Lista: busca `q` em nome/e-mail (LIKE com `%`/`_` escapados), filtro `status`, 20 por página,
  ordem `name` asc, `id` asc. Nunca expõe `password_hash` nem `session_version`.
- REST: corpo JSON validado por Zod (400 com `details`), erros pelo `toErrorResponse` da F8,
  que passa a chamar `unstable_rethrow` e a mapear `UserRuleError`; `details.field` com o caminho
  completo (`a.b`).

## Review Focus

1. Viewer chamando action/rota de admin ⇒ 403, sem efeito no banco.
2. Bloquear derruba o login e as sessões do viewer (401 no próximo request).
3. Troca própria: a sessão atual continua válida; outra sessão do mesmo usuário cai.
4. Falha no meio (ex.: e-mail duplicado) não deixa auditoria sem a mudança, nem o contrário.
5. Busca com `%` ou `_` não vira curinga.

---

### Task 1: Schemas, tipos e erros

**Files:** Create `src/schemas/users.ts`, `src/types/users.ts`, `src/server/services/users/errors.ts` + tests
**Produces:** `passwordSchema`, `createUserSchema {name,email,password}`, `updateUserSchema
{name,email}`, `resetPasswordSchema {password}`, `profileNameSchema {name}`, `changePasswordSchema
{currentPassword,newPassword,confirmPassword}` (confirm igual), `userListQuerySchema {q,status,page}`;
`UserSummary {id,name,email,role,status,createdAt}`, `UserListPage {items,total,page,pageSize}`,
`AuditEntry {id,action,actorName,targetName,metadata,createdAt}`;
`UserRuleError(code)` com `status` (`not_found` 404, `email_taken` 409, `admin_target`/`self_action`/`wrong_password` 422)

- [ ] RED → GREEN; commit `feat(users): schemas, tipos e erros de regra`

### Task 2: Services de usuários e auditoria

**Files:** Create `src/server/services/users/{users,audit}.ts` + tests · `src/server/services/users/index.ts` (fachada) + test
**Produces:** `listUsers(db, query)`, `createViewer(db, actor, input, hash)`, `updateViewer(db, actor, id, input)`,
`setViewerStatus(db, actor, id, status)`, `resetViewerPassword(db, actor, id, password, hash)`,
`listAudit(db, page)`; fachada `loadUsers`, `createUser`, `updateUser`, `blockUser`, `unblockUser`,
`resetUserPassword`, `loadAudit` (todas `requireRole('admin')`, hash argon2)

- [ ] RED: cada regra (404/409/422, admin alvo, a si mesmo), `session_version`, auditoria na
      transação (Focus 4), busca escapada (Focus 5), paginação; fachada 403 sem tocar o banco (Focus 1)
- [ ] Implementar; commit `feat(users): services de usuários e auditoria`

### Task 3: Service de perfil

**Files:** Create `src/server/services/profile/{profile,index}.ts` + tests
**Produces:** `updateOwnName(db, user, input)`, `changeOwnPassword(db, user, input, verify, hash)`;
fachada `updateProfile`, `changePassword` (`requireUser`)

- [ ] RED: nome; senha atual errada 422 sem mudança; troca incrementa `session_version` e a
      sessão antiga deixa de validar (`loadSessionUser`) (Focus 2/3 no nível do service)
- [ ] Implementar; commit `feat(profile): service de perfil`

### Task 4: API REST de usuários e perfil

**Files:** Modify `src/server/api/responses.ts` (+ test) · Create `src/server/api/json-handler.ts` + test,
`src/app/api/users/**/route.ts`, `src/app/api/me/**/route.ts` + `routes.test.ts`

- [ ] RED: `unstable_rethrow`, `UserRuleError` → status, corpo inválido/JSON quebrado → 400, cada
      rota chama o service certo; `/api/me/password` renova a sessão (Focus 3)
- [ ] Implementar; commit `feat(api): rotas de usuários e perfil`

### Task 5: Tela de usuários (admin)

**Files:** Create `src/features/users/*` (actions, users-table, user-form-dialog, confirm-dialog,
reset-password-dialog, filters) + tests · Modify `src/app/(dashboard)/admin/usuarios/page.tsx` (+ loading)

- [ ] RED: tabela com status e ações só para viewers; filtros na URL; formulários RHF+Zod com erro
      do servidor no campo (409 no e-mail); confirmação antes de bloquear; actions revalidam
- [ ] Implementar; navegador (claro/escuro/mobile); commit `feat(users): tela de gestão de usuários`

### Task 6: Perfil e auditoria (telas)

**Files:** Create `src/features/profile/*`, `src/features/audit/*` + tests · Modify
`src/app/(dashboard)/perfil/page.tsx`, `src/app/(dashboard)/admin/auditoria/page.tsx`

- [ ] RED: nome atualiza a casca; troca de senha com confirmação e erro na senha atual; auditoria
      paginada com ator, alvo, ação em pt-BR e campos alterados
- [ ] Implementar; navegador (inclui Focus 2 e 3 com duas sessões); commit `feat(profile): telas de perfil e auditoria`

### Task 7: Docs e entrega

- [ ] `routes.md`, `usuarios-e-perfis.md` (implementação), `backlog.md` (F9 ✅), `overview.md`,
      `autenticacao.md`, `README.md`; lint, typecheck, test:run, build; commit `docs: F9`; push
