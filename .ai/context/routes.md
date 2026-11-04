# Rotas e endpoints

Status: páginas implementadas na F3 (casca + filtro; conteúdo nas F4–F9), `/api/auth/*` e a
API de métricas (F8); a API de usuários e perfil está **planejada** (F9).
Atualizar ao implementar. Autenticação: [detalhes](../architeture/autenticacao.md)
Permissões: [usuários e perfis](../domains/usuarios-e-perfis.md)

## Páginas

| Rota               | Acesso        | Descrição                                    |
| ------------------ | ------------- | -------------------------------------------- |
| `/login`           | público       | Login (RHF + Zod); logado → redireciona `/`  |
| `/`                | viewer, admin | Visão geral (KPIs)                           |
| `/vendas`          | viewer, admin | Gráficos de vendas                           |
| `/compras`         | viewer, admin | Gráficos de compras e margem                 |
| `/acessos`         | viewer, admin | Gráficos de acessos                          |
| `/perfil`          | viewer, admin | Editar o próprio nome e senha                |
| `/admin/usuarios`  | admin         | Lista, criação, edição e bloqueio de viewers |
| `/admin/auditoria` | admin         | Log de ações administrativas                 |

Páginas de métricas (`/`, `/vendas`, `/compras`, `/acessos`) aceitam `?from=YYYY-MM-DD&to=YYYY-MM-DD`
(padrão: últimos 30 dias). Período inválido na página → usa o padrão e mostra um aviso
(`resolvePeriod` em `src/schemas/period.ts`). Páginas `/admin/*` usam `requirePageRole('admin')`:
viewer é redirecionado para `/`.

## API REST

Todas retornam JSON com `Cache-Control: no-store`. Erros usam o formato
`{ "error": { "code": string, "message": string, "details"?: { field, message }[] } }`
(`details` só no 400). Códigos: `invalid_request` (400), `unauthorized` (401), `forbidden` (403),
`internal_error` (500, sem detalhes internos). Helpers em `src/server/api/responses.ts`.

### Auth

| Método | Rota                      | Descrição                                   |
| ------ | ------------------------- | ------------------------------------------- |
| *      | `/api/auth/[...nextauth]` | Handlers do Auth.js (login, logout, sessão) |

### Métricas (viewer, admin)

| Método | Rota                     | Query        | Retorno                                        |
| ------ | ------------------------ | ------------ | ---------------------------------------------- |
| GET    | `/api/metrics/overview`  | `from`, `to` | KPIs + variação                                |
| GET    | `/api/metrics/sales`     | `from`, `to` | séries de receita, top produtos, por categoria |
| GET    | `/api/metrics/purchases` | `from`, `to` | série de custo, margem                         |
| GET    | `/api/metrics/access`    | `from`, `to` | séries de acessos, top páginas, por origem     |

Implementação (F8): `src/app/api/metrics/*/route.ts` → `metricsHandler` (`src/server/api/`) →
fachada `src/server/services/metrics`. O corpo de sucesso é o objeto do service
(`OverviewMetrics`, `SalesMetrics`, `PurchasesMetrics`, `AccessMetrics` em `src/types/metrics.ts`).

- Autenticação **antes** da validação: sem sessão → **401**, mesmo com query inválida.
- `from`/`to` validados pelo `periodSchema` das páginas. Sem nenhum dos dois → últimos 30 dias.
  Só um deles, data inválida, `from > to`, mais de 366 dias ou parâmetro repetido → **400**.
- Exemplo: `GET /api/metrics/sales?from=2026-09-01&to=2026-09-30` (cookie de sessão do Auth.js).

### Usuários (admin)

| Método | Rota                            | Descrição                            |
| ------ | ------------------------------- | ------------------------------------ |
| GET    | `/api/users?q=&status=&page=`   | Lista paginada (sem `password_hash`) |
| POST   | `/api/users`                    | Cria viewer                          |
| PATCH  | `/api/users/:id`                | Edita nome/e-mail de viewer          |
| POST   | `/api/users/:id/block`          | Bloqueia viewer                      |
| POST   | `/api/users/:id/unblock`        | Desbloqueia viewer                   |
| POST   | `/api/users/:id/reset-password` | Redefine senha                       |

### Perfil (viewer, admin)

| Método | Rota               | Descrição                           |
| ------ | ------------------ | ----------------------------------- |
| PATCH  | `/api/me`          | Atualiza o próprio nome             |
| POST   | `/api/me/password` | Troca a senha (exige a senha atual) |

> Na UI, as mutações usam **Server Actions** que chamam os mesmos services. As rotas
> REST existem para consumo externo e compartilham os mesmos schemas Zod.
