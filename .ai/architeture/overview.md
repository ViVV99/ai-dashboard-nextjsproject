# Visão geral da arquitetura

Aplicação **Next.js (App Router)** full-stack: UI, API REST e acesso ao banco no
mesmo projeto. Banco **SQLite** local via **Drizzle ORM + better-sqlite3**.

Decisões de stack: [0001](../decisions/0001-stack.md) ·
Auth: [0002](../decisions/0002-auth-e-perfis.md)

## Camadas

```
Browser (MUI + MUI X Charts)
   │
   ├── Server Components ──────────┐   leitura de métricas direto do service
   ├── Server Actions (mutations) ─┤   gestão de usuários, perfil
   └── Route Handlers /api/* ──────┤   API REST (JSON)
                                   ▼
                        src/server/services/*   regras de negócio + autorização
                                   ▼
                        src/server/db/*         Drizzle (schema, queries)
                                   ▼
                              SQLite (arquivo)
```

- **Server Components** chamam os _services_ diretamente (sem HTTP interno).
- **Route Handlers** expõem as mesmas funções como REST para consumo externo.
- **Autorização** é checada no `src/proxy.ts` (checagem otimista + redirect) **e** em
  cada service/action/handler (defesa em profundidade). O proxy sozinho não basta.
  No Next 16, `middleware.ts` foi renomeado para `proxy.ts` e roda em Node.js.

## Estrutura de pastas

```
src/
  app/
    (auth)/login/            página de login
    (dashboard)/             layout com sidebar + topbar
      page.tsx               visão geral (KPIs)
      vendas/  compras/  acessos/
      perfil/                edição do próprio perfil
      admin/usuarios/        gestão de usuários (admin)
    api/
      auth/[...nextauth]/
      metrics/{overview,sales,purchases,access}/
      users/
  components/                componentes de UI reutilizáveis
  features/                  módulos por feature (charts, forms, hooks)
  server/
    db/                      schema.ts, client.ts, seed/ (geradores puros), cli/ (migrate, seed)
    services/                metrics, users, audit
    auth/                    config Auth.js, guards (requireRole)
  schemas/                   schemas Zod compartilhados (client + server)
  types/                     tipos de domínio (domain.ts: fonte única dos valores permitidos)
  lib/                       utilitários (datas, formatação)
*.test.ts(x)                 testes colocalizados em src/ (único local lido pelo Vitest)
drizzle/                     migrations SQL geradas pelo drizzle-kit (versionadas)
```

## Fluxo de dados das métricas

1. O filtro de período fica na URL (`?from=YYYY-MM-DD&to=YYYY-MM-DD`).
2. A página (Server Component) lê `searchParams`, valida com Zod e chama o service.
3. O service agrega no SQLite (`GROUP BY` por dia/semana/mês) e retorna séries.
4. Os gráficos (Client Components) só recebem dados prontos por props.

## Segurança (resumo)

- Senhas com hash **argon2id**; nunca retornadas pela API.
- Sessão em cookie `httpOnly`, `secure`, `sameSite=lax`.
- Validação Zod em toda entrada (query, body, form).
- Rate limit no login; mensagens de erro genéricas.
- Queries sempre parametrizadas (Drizzle); sem SQL concatenado.
- Ações administrativas registradas em `audit_logs`.
