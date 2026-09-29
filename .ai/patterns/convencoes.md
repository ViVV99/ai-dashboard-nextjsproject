# Convenções de código

Complementa as convenções críticas do `CLAUDE.md`.

## TypeScript

- `strict: true`. Sem `any`: use `unknown` + narrowing.
- Sem `enum`: use union types (`type Role = 'admin' | 'viewer'`).
- Tipos de domínio ficam em `src/types/`. Tipos derivados de schema Zod usam `z.infer`.
- Tipos de linha do banco usam `typeof table.$inferSelect` (Drizzle), só dentro de `src/server/`.

## Next.js

- Server Components por padrão; `'use client'` só onde houver interação ou gráfico.
- Dados buscados no servidor e passados por props aos gráficos.
- Mutações simples via Server Actions; toda action valida a entrada com Zod e chama `requireUser`/`requireRole`.
- Node.js é o runtime padrão (inclusive no `src/proxy.ts`); não usar Edge com o banco.
- Proxy (`src/proxy.ts`) só faz checagem otimista; autorização real fica nos services.
- `loading.tsx` e `error.tsx` em cada segmento do dashboard.

## Formulários

- Sempre React Hook Form + `zodResolver`; nunca `useState` por campo.
- O schema Zod fica em `src/schemas/` e é reusado no client e no server.

## UI / UX

- Tema MUI centralizado (`src/theme/`) com modo claro e escuro.
- Todo gráfico tem estados de carregamento (skeleton), vazio e erro.
- Valores formatados com `Intl.NumberFormat('pt-BR')` (BRL, %).
- Acessibilidade: labels nos inputs, contraste AA, gráficos com título e descrição.

## Testes (Vitest)

- Services e regras de negócio: testes com SQLite `:memory:` migrado
  (`createDatabase(':memory:')` + `migrateDatabase`) e seed fixa.
- Vitest tem dois projetos: `node` (`src/server/**`) e `dom` (jsdom, o resto).
- Constraints do banco são testadas com SQL cru (`db.$client`), fora da camada tipada.
- Componentes: Testing Library (comportamento, não implementação).
- Todo bug fix vem com um teste de regressão.
- Testes ficam colocalizados em `src/` (`*.test.ts(x)`); é o único local lido pelo Vitest.
- Testar o contrato do projeto, não detalhes internos de libs (ex.: seletores gerados pelo MUI).

## Limites

- Função ≤ 40 linhas · componente ≤ 200 linhas · arquivo ≤ 500 linhas.

## MUI + App Router

- O tema (`src/theme/theme.ts`) é um módulo `'use client'`: objetos com funções não podem
  ser passados de Server para Client Components.
- Esquemas claro e escuro via variáveis CSS (`colorSchemeSelector: 'class'`) com
  `InitColorSchemeScript` no layout raiz, para evitar flash de tema.
- `AppRouterCacheProvider` vem de `@mui/material-nextjs/v16-appRouter`.
- O tema declara `CssThemeVariables { enabled: true }` (module augmentation) para tipar
  `theme.vars` e `theme.colorSchemes`.

## Commits feitos por agentes

- Hook do Claude Code (`.claude/settings.json` → `.claude/hooks/pre-commit-check.sh`) roda
  `yarn lint` e `yarn test:run` antes de qualquer `git commit`; se falharem, o commit é bloqueado.
- Vale só para commits feitos pelo agente, não para `git commit` no terminal.
