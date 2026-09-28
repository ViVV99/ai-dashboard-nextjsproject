# Modelo de dados (SQLite)

Schema definido em `src/server/db/schema.ts` (Drizzle). Valores monetários são
armazenados em **centavos (INTEGER)** para evitar erros de ponto flutuante.
Datas são armazenadas em **ISO 8601 UTC (TEXT)**.

Regras de usuários: [usuários e perfis](./usuarios-e-perfis.md) ·
Métricas derivadas: [métricas](./metricas.md)

## Tabelas

### users

| Coluna                  | Tipo        | Notas                                 |
| ----------------------- | ----------- | ------------------------------------- |
| id                      | INTEGER PK  |                                       |
| name                    | TEXT        | 2–100 chars                           |
| email                   | TEXT UNIQUE | normalizado em minúsculas             |
| password_hash           | TEXT        | argon2id; nunca exposto               |
| role                    | TEXT        | `'admin' \| 'viewer'` (CHECK)         |
| status                  | TEXT        | `'active' \| 'blocked'` (CHECK)       |
| session_version         | INTEGER     | incrementado ao bloquear/trocar senha |
| created_at / updated_at | TEXT        |                                       |

### audit_logs

| Coluna     | Tipo             | Notas                                                   |
| ---------- | ---------------- | ------------------------------------------------------- |
| id         | INTEGER PK       |                                                         |
| actor_id   | INTEGER FK users | quem executou                                           |
| action     | TEXT             | ex.: `user.block`, `user.update`, `user.reset_password` |
| target_id  | INTEGER FK users | alvo (nullable)                                         |
| metadata   | TEXT (JSON)      | campos alterados, sem dados sensíveis                   |
| created_at | TEXT             |                                                         |

### categories

`id`, `name` (UNIQUE)

### products

`id`, `category_id` FK, `name`, `sku` UNIQUE, `price_cents`, `cost_cents`, `created_at`

### customers

`id`, `name`, `email`, `city`, `created_at`

### orders (vendas)

`id`, `customer_id` FK, `status` (`'paid' \| 'canceled' \| 'refunded'`), `total_cents`, `created_at`

### order_items

`id`, `order_id` FK, `product_id` FK, `quantity`, `unit_price_cents`

### purchases (compras de fornecedor / reposição)

`id`, `product_id` FK, `supplier`, `quantity`, `unit_cost_cents`, `created_at`

### page_views (acessos)

| Coluna     | Tipo       | Notas                                                   |
| ---------- | ---------- | ------------------------------------------------------- |
| id         | INTEGER PK |                                                         |
| path       | TEXT       | ex.: `/produtos/123`                                    |
| product_id | INTEGER FK | nullable; preenchido em páginas de produto              |
| source     | TEXT       | `'direct' \| 'organic' \| 'social' \| 'ads' \| 'email'` |
| session_id | TEXT       | visitante anônimo (para contar visitantes únicos)       |
| created_at | TEXT       |                                                         |

## Índices

- `orders(created_at)`, `order_items(order_id)`, `order_items(product_id)`
- `purchases(created_at)`, `page_views(created_at)`, `page_views(source)`
- `users(email)` UNIQUE

Os valores permitidos nos CHECK vêm de `src/types/domain.ts` (fonte única para tipos,
banco e Zod). Mudou um valor? Rode `yarn db:generate` para criar a migration.

## Migrations

- Schema: `src/server/db/schema.ts` · migrations geradas em `drizzle/` (versionadas).
- `yarn db:generate` cria a migration a partir do schema; `yarn db:migrate` aplica.
- `createDatabase` liga `foreign_keys` (desligado por padrão no SQLite) e WAL em arquivo.

## Seed (`yarn db:seed`)

- **Apaga e recria** todos os dados numa única transação: ou tudo entra, ou nada muda.
  Bloqueado com `NODE_ENV=production`. Variáveis em `.env.example`.
- Determinístico: mesma `SEED_RANDOM_SEED` + `SEED_END_DATE` ⇒ mesmos dados (PRNG mulberry32).
  Só os hashes de senha variam (salt aleatório).
- Volume para 365 dias: 6 categorias, 25 produtos, 400 clientes, ~10,5 mil pedidos,
  ~16 mil itens, ~780 compras, ~474 mil acessos (~13 s, ~60 MB).
- Sazonalidade: fim de semana ×1,3; novembro/dezembro ×1,5; crescimento de 0,85 a 1,15.
  Pedidos: 90% pagos, 6% cancelados, 4% reembolsados. Custo = 50–70% do preço.
- Usuários com ids fixos: admin (id 1) a partir de `SEED_ADMIN_*`; com `SEED_VIEWER_PASSWORD`,
  3 viewers de demonstração (`viewer1..3@exemplo.com`, o 3º bloqueado).
- Horários gerados no dia local de São Paulo e gravados em UTC.
