# 0001 — Stack técnica

- **Status:** Aceita
- **Data:** 2026-09-28

## Contexto

Dashboard de loja com gráficos, autenticação com perfis e banco local SQLite.
Requisitos do projeto: Next.js, TypeScript, MUI, Vitest, RHF + Zod.

## Decisões

| Tema             | Escolha                          | Alternativas consideradas   |
| ---------------- | -------------------------------- | --------------------------- |
| Framework        | Next.js (App Router)             | — (definido no projeto)     |
| UI               | MUI                              | — (definido no projeto)     |
| Gráficos         | **MUI X Charts**                 | Recharts                    |
| Acesso ao banco  | **Drizzle ORM + better-sqlite3** | Prisma, SQL puro            |
| Auth             | **Auth.js v5 (Credentials)**     | Lucia, sessão própria       |
| Hash de senha    | **argon2id** (`@node-rs/argon2`) | bcrypt                      |
| Formulários      | React Hook Form + Zod            | — (definido no projeto)     |
| Testes           | Vitest + Testing Library         | — (definido no projeto)     |
| Origem dos dados | **Seed fictício** (~12 meses)    | CRUD manual, importação CSV |

## Motivos

- **MUI X Charts:** integra nativamente com o tema MUI (cores, dark mode,
  tipografia) sem estilização manual.
- **Drizzle:** tipado a partir do schema em TS, próximo do SQL (bom para
  agregações do dashboard), migrations simples, leve. Prisma é mais pesado e
  abstrai demais as queries de agregação.
- **Seed fictício:** permite desenvolver e demonstrar os gráficos sem depender
  de cadastro; CRUD de produtos/vendas fica para a Fase 2.

## Consequências

- `better-sqlite3` é síncrono e nativo: roda só no runtime Node.js (não Edge).
  Node.js já é o padrão; `export const runtime = 'nodejs'` em handlers que acessam
  o banco é opcional, usado só de forma defensiva/explícita.
- O `src/proxy.ts` (antigo `middleware.ts`, renomeado no Next 16) faz apenas
  checagem otimista da sessão. A doc do Next diz que o proxy não deve ser usado
  como solução completa de autorização, por isso a checagem de "usuário bloqueado"
  é feita nos services (ver [0002](./0002-auth-e-perfis.md)).
- **Auth.js v5 ainda está em beta** (`next-auth@5.0.0-beta.32` em 2026-09-28,
  com peer `next ^16`). Risco aceito: fixar a versão exata e revisar o changelog
  a cada atualização.
