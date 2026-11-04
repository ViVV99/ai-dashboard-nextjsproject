# F8 — API REST de métricas: plano de implementação

> **Para agentes:** execute com superpowers:executing-plans (TDD em cada passo).

**Objetivo:** expor as métricas das F4–F7 em `GET /api/metrics/{overview,sales,purchases,access}`
com validação Zod e erros 400/401/403/500 padronizados.
**Arquitetura:** os Route Handlers só montam a resposta. Um handler genérico em `src/server/api/`
autentica, valida `from`/`to` com o `periodSchema` (o mesmo das páginas) e chama a fachada
(`loadOverview`, `loadSales`, `loadPurchases`, `loadAccess`), que revalida a sessão (defesa em
profundidade). Respostas de erro num único módulo, reusado pela F9.
**Stack:** Route Handlers do Next 16 (`route.ts`, Web `Request`/`Response`), Zod 4.
**Spec:** [rotas › API REST](../context/routes.md#api-rest) · [respostas HTTP](../domains/usuarios-e-perfis.md#respostas-http) ·
[backlog F8](./backlog.md) · [métricas](../domains/metricas.md)

## Restrições globais

- Erro: `{ "error": { "code": string, "message": string } }`; 400 acrescenta
  `details: { field, message }[]` (mensagens do `periodSchema`, em pt-BR).
- Códigos: `invalid_request` (400), `unauthorized` (401), `forbidden` (403), `internal_error` (500).
- Ordem: autenticação **antes** da validação (sem sessão → 401, mesmo com query inválida).
- Período: `from` e `to` ausentes ⇒ padrão de 30 dias (igual às páginas); só um deles, data
  inválida, `from > to`, mais de 366 dias ou parâmetro repetido ⇒ 400.
- Sucesso: 200 com o objeto do service como está (`OverviewMetrics`, `SalesMetrics`, …).
- `Cache-Control: no-store` em toda resposta (dados de sessão; nada em cache compartilhado).
- 500 nunca expõe a mensagem do erro original; o erro vai para o log do servidor.

## Review Focus

1. Sem sessão com query inválida responde 401, não 400.
2. `?from=2026-01-01&from=2026-02-01&to=…` (parâmetro repetido) responde 400, não usa um deles.
3. Erro inesperado no service vira 500 genérico, sem a mensagem interna no corpo.
4. O proxy não redireciona `/api/metrics/*` para o login (a API responde JSON 401).
5. Cada rota chama a fachada certa (overview ≠ sales …).

---

### Task 1: Respostas e handler de métricas

**Files:** Create `src/server/api/responses.ts`, `src/server/api/metrics-handler.ts` + tests
**Produces:**

- `type ApiErrorCode = 'invalid_request' | 'unauthorized' | 'forbidden' | 'internal_error'`
- `jsonResponse(body: unknown, status = 200): Response` (com `Cache-Control: no-store`)
- `errorResponse(status, code, message, details?): Response`
- `toErrorResponse(error: unknown): Response` — `AuthError` → 401/403; resto → 500 genérico + log
- `parsePeriodQuery(params: URLSearchParams): { ok: true; period } | { ok: false; details }`
- `metricsHandler<T>(load: (period: Period) => Promise<T>): (request: Request) => Promise<Response>`

- [ ] Testes RED: formatos de erro e `no-store`; Review Focus 1–3; padrão sem query; 400 para
      só `from`, data inválida, `from > to`, 367 dias, repetido; 200 repassa o período ao `load`
- [ ] Implementar; commit `feat(api): respostas padronizadas e handler de métricas`

### Task 2: Rotas de métricas

**Files:** Create `src/app/api/metrics/{overview,sales,purchases,access}/route.ts` · Test
`src/app/api/metrics/routes.test.ts` (ambiente node) · Modify `src/server/auth/routing.test.ts`

- [ ] Testes RED: cada rota repassa o período à fachada certa (Review Focus 5); `routeDecision`
      para `/api/metrics/sales` sem sessão é `next` (Review Focus 4)
- [ ] Implementar; verificação com `curl` no dev server (401 sem cookie; 200 e 400 com sessão);
      commit `feat(api): rotas GET de métricas`

### Task 3: Docs e entrega

- [ ] `routes.md` (status, formato de erro com `details`, padrão sem query), `backlog.md` (F8 ✅),
      `overview.md`, `README.md`
- [ ] `yarn lint`, `yarn typecheck`, `yarn test:run`, `yarn build`; commit `docs: F8`; push
