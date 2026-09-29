import { sql, type SQL } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { ORDER_STATUSES, ROLES, TRAFFIC_SOURCES, USER_STATUSES } from '../../types/domain';

// Modelo documentado em .ai/domains/schema.md. Dinheiro em centavos; datas em ISO 8601 UTC.

const nowIso = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
const createdAt = () => text('created_at').notNull().default(nowIso);

/** CHECK (coluna IN (...)) a partir das constantes de domínio (valores fixos, não input). */
function oneOf(column: AnySQLiteColumn, values: readonly string[]): SQL {
  const list = values.map((value) => `'${value}'`).join(', ');
  return sql`${column} IN (${sql.raw(list)})`;
}

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ROLES }).notNull(),
    status: text('status', { enum: USER_STATUSES }).notNull().default('active'),
    sessionVersion: integer('session_version').notNull().default(1),
    createdAt: createdAt(),
    updatedAt: text('updated_at').notNull().default(nowIso),
  },
  (t) => [
    check('users_role_check', oneOf(t.role, ROLES)),
    check('users_status_check', oneOf(t.status, USER_STATUSES)),
    check('users_name_length_check', sql`length(${t.name}) BETWEEN 2 AND 100`),
  ],
);

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    actorId: integer('actor_id')
      .notNull()
      .references(() => users.id),
    action: text('action').notNull(),
    targetId: integer('target_id').references(() => users.id),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index('audit_logs_created_at_idx').on(t.createdAt)],
);

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const products = sqliteTable(
  'products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    name: text('name').notNull(),
    sku: text('sku').notNull().unique(),
    priceCents: integer('price_cents').notNull(),
    costCents: integer('cost_cents').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check('products_price_check', sql`${t.priceCents} >= 0`),
    check('products_cost_check', sql`${t.costCents} >= 0`),
  ],
);

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  city: text('city').notNull(),
  createdAt: createdAt(),
});

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customers.id),
    status: text('status', { enum: ORDER_STATUSES }).notNull(),
    totalCents: integer('total_cents').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    check('orders_status_check', oneOf(t.status, ORDER_STATUSES)),
    check('orders_total_check', sql`${t.totalCents} >= 0`),
    index('orders_created_at_idx').on(t.createdAt),
  ],
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
  },
  (t) => [
    check('order_items_quantity_check', sql`${t.quantity} > 0`),
    check('order_items_price_check', sql`${t.unitPriceCents} >= 0`),
    index('order_items_order_id_idx').on(t.orderId),
    index('order_items_product_id_idx').on(t.productId),
  ],
);

export const purchases = sqliteTable(
  'purchases',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    supplier: text('supplier').notNull(),
    quantity: integer('quantity').notNull(),
    unitCostCents: integer('unit_cost_cents').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    check('purchases_quantity_check', sql`${t.quantity} > 0`),
    check('purchases_cost_check', sql`${t.unitCostCents} >= 0`),
    index('purchases_created_at_idx').on(t.createdAt),
  ],
);

export const pageViews = sqliteTable(
  'page_views',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    path: text('path').notNull(),
    productId: integer('product_id').references(() => products.id),
    source: text('source', { enum: TRAFFIC_SOURCES }).notNull(),
    sessionId: text('session_id').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    check('page_views_source_check', oneOf(t.source, TRAFFIC_SOURCES)),
    index('page_views_created_at_idx').on(t.createdAt),
    index('page_views_source_idx').on(t.source),
  ],
);
