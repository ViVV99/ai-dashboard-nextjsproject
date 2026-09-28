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

## Seed

- Cerca de 12 meses de dados com sazonalidade (fins de semana e fim de ano mais fortes).
- 1 admin inicial (credenciais via variáveis de ambiente, nunca hardcoded) e alguns viewers.
- O seed é determinístico (seed fixa de PRNG) para os testes serem reprodutíveis.
