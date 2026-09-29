# Backlog — MVP (Fase 1)

Legenda de status: ⬜ a fazer · 🟨 em andamento · ✅ concluído

Referências: [arquitetura](../architeture/overview.md) · [rotas](../context/routes.md) ·
[schema](../domains/schema.md) · [perfis](../domains/usuarios-e-perfis.md) ·
[métricas](../domains/metricas.md)

| #   | Feature                             | Depende de | Status |
| --- | ----------------------------------- | ---------- | ------ |
| F0  | Fundação do projeto                 | —          | ✅     |
| F1  | Banco + seed                        | F0         | ✅     |
| F2  | Autenticação e perfis               | F1         | ✅     |
| F3  | Layout e filtro de período          | F2         | ⬜     |
| F4  | Visão geral (KPIs)                  | F3         | ⬜     |
| F5  | Vendas                              | F3         | ⬜     |
| F6  | Compras                             | F3         | ⬜     |
| F7  | Acessos                             | F3         | ⬜     |
| F8  | API REST de métricas                | F4–F7      | ⬜     |
| F9  | Gestão de usuários (admin) + perfil | F2, F3     | ⬜     |

## Critérios de aceite

### F0 — Fundação

- Next.js (App Router) + TS strict, MUI com tema claro e escuro, Vitest + Testing Library, ESLint, Prettier.
- `yarn build`, `yarn lint` e `yarn test:run` passam sem erros.

### F1 — Banco + seed ([plano](./f1-banco-seed.md))

- Schema Drizzle com todas as tabelas de [schema](../domains/schema.md), com migrations.
- `yarn db:seed` gera cerca de 12 meses de dados de forma determinística e cria o admin a partir de variáveis de ambiente.
- Testes: o seed é reprodutível; as constraints (CHECK, UNIQUE) funcionam.

### F2 — Autenticação e perfis ([plano](./f2-auth.md))

- Login com e-mail e senha; argon2id; rate limit (e-mail+IP e por IP); mensagem de erro genérica;
  tempo de resposta constante (hash fictício para e-mail inexistente).
- `requireUser` / `requireRole`; o `src/proxy.ts` faz a checagem otimista das rotas.
- Um usuário bloqueado ou com `session_version` desatualizado recebe 401.
- Testes: login válido/inválido, bloqueado, viewer em rota admin (403).

### F3 — Layout e filtro

- Menu lateral conforme o perfil, barra superior com usuário e logout, alternância de tema.
- Filtro de período na URL, validado por Zod; o padrão é 30 dias.
- Responsivo (menu em drawer no mobile).

### F4 — Visão geral

- Cards de KPI com a variação vs. período anterior, seguindo [métricas](../domains/metricas.md).
- Testes: fórmulas, divisão por zero, cálculo do período anterior.

### F5 / F6 / F7 — Vendas, Compras, Acessos

- Gráficos com MUI X Charts, conforme [métricas](../domains/metricas.md).
- Estados de carregamento, vazio e erro; granularidade automática.
- Testes das agregações SQL com a base de teste.

### F8 — API REST de métricas

- Endpoints de [rotas](../context/routes.md) com validação Zod, 400/401/403 padronizados.

### F9 — Gestão de usuários + perfil

- Admin: listar (busca e filtro), criar, editar, bloquear/desbloquear e redefinir senha de viewers.
- Todas as regras de [perfis](../domains/usuarios-e-perfis.md) aplicadas no service, com auditoria.
- Todo usuário: editar o próprio nome e trocar a senha (exige a senha atual; derruba as outras sessões).
- Formulários em RHF + Zod; confirmação antes de bloquear.
- Testes: cada regra de negócio (bloquear a si mesmo, editar admin, e-mail duplicado).

## Fase 2 (fora do MVP)

- CRUD de produtos, pedidos e compras
- Promoção de viewer a admin
- Exportação CSV dos gráficos
- Metas de vendas e alertas
- Rate limit persistente (fora da memória)
