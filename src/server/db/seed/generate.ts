import type { OrderStatus, TrafficSource } from '../../../types/domain';
import type {
  categories,
  customers,
  orderItems,
  orders,
  pageViews,
  products,
  purchases,
} from '../schema';
import { lastDays, localToUtcIso, randomTimestamp, seasonality, type LocalDay } from './calendar';
import { CATALOG, CITIES, FIRST_NAMES, LAST_NAMES, STATIC_PAGES, SUPPLIERS } from './catalog';
import type { Random } from './random';

// Geradores puros: recebem o PRNG e devolvem linhas com ids explícitos, sem tocar no banco.

export type Dataset = {
  categories: (typeof categories.$inferSelect)[];
  products: (typeof products.$inferSelect)[];
  customers: (typeof customers.$inferSelect)[];
  orders: (typeof orders.$inferSelect)[];
  orderItems: (typeof orderItems.$inferSelect)[];
  purchases: (typeof purchases.$inferSelect)[];
  pageViews: (typeof pageViews.$inferSelect)[];
};

export type DatasetOptions = { endDay: LocalDay; days: number };

const CUSTOMER_COUNT = 400;
const BASE_ORDERS_PER_DAY = 25;
const BASE_SESSIONS_PER_DAY = 450;
const RESTOCK_EVERY_DAYS = 7;

const ORDER_STATUS_WEIGHTS: readonly (readonly [OrderStatus, number])[] = [
  ['paid', 90],
  ['canceled', 6],
  ['refunded', 4],
];

const SOURCE_WEIGHTS: readonly (readonly [TrafficSource, number])[] = [
  ['organic', 40],
  ['direct', 25],
  ['social', 15],
  ['ads', 12],
  ['email', 8],
];

/** Varia `base` em ±20% e aplica a sazonalidade do dia. */
function dailyVolume(random: Random, base: number, factor: number): number {
  return Math.max(1, Math.round(base * factor * (0.8 + random.next() * 0.4)));
}

function generateCatalog(random: Random, createdAt: string) {
  const categoryRows: Dataset['categories'] = [];
  const productRows: Dataset['products'] = [];

  for (const [categoryName, items] of Object.entries(CATALOG)) {
    const categoryId = categoryRows.length + 1;
    categoryRows.push({ id: categoryId, name: categoryName });
    for (const item of items) {
      const id = productRows.length + 1;
      productRows.push({
        id,
        categoryId,
        name: item.name,
        sku: `SKU-${String(id).padStart(4, '0')}`,
        priceCents: item.priceCents,
        costCents: Math.round(item.priceCents * (0.5 + random.next() * 0.2)),
        createdAt,
      });
    }
  }
  return { categories: categoryRows, products: productRows };
}

const toAscii = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '');

function generateCustomers(random: Random, createdAt: string): Dataset['customers'] {
  return Array.from({ length: CUSTOMER_COUNT }, (_, index) => {
    const first = random.pick(FIRST_NAMES);
    const last = random.pick(LAST_NAMES);
    const id = index + 1;
    const email = toAscii(`${first}.${last}${id}@exemplo.com`).toLowerCase();
    return { id, name: `${first} ${last}`, email, city: random.pick(CITIES), createdAt };
  });
}

function generateOrderItems(random: Random, orderId: number, catalog: Dataset['products']) {
  const count = random.weighted([
    [1, 60],
    [2, 30],
    [3, 10],
  ] as const);
  const chosen = new Set<Dataset['products'][number]>();
  while (chosen.size < count) chosen.add(random.pick(catalog));

  return [...chosen].map((product) => ({
    orderId,
    productId: product.id,
    quantity: random.weighted([
      [1, 75],
      [2, 20],
      [3, 5],
    ] as const),
    unitPriceCents: product.priceCents,
  }));
}

function generateSales(
  random: Random,
  days: LocalDay[],
  data: Pick<Dataset, 'products' | 'customers'>,
) {
  const orderRows: Dataset['orders'] = [];
  const itemRows: Dataset['orderItems'] = [];

  days.forEach((day, dayIndex) => {
    const count = dailyVolume(random, BASE_ORDERS_PER_DAY, seasonality(day, dayIndex, days.length));
    for (let n = 0; n < count; n++) {
      const id = orderRows.length + 1;
      const items = generateOrderItems(random, id, data.products).map((item, i) => ({
        ...item,
        id: itemRows.length + i + 1,
      }));
      itemRows.push(...items);
      orderRows.push({
        id,
        customerId: random.pick(data.customers).id,
        status: random.weighted(ORDER_STATUS_WEIGHTS),
        totalCents: items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0),
        createdAt: randomTimestamp(random, day),
      });
    }
  });
  return { orders: orderRows, orderItems: itemRows };
}

function generatePurchases(random: Random, days: LocalDay[], catalog: Dataset['products']) {
  const rows: Dataset['purchases'] = [];
  days.forEach((day, dayIndex) => {
    if (dayIndex % RESTOCK_EVERY_DAYS !== 0) return;
    for (const product of catalog) {
      if (!random.chance(0.6)) continue;
      rows.push({
        id: rows.length + 1,
        productId: product.id,
        supplier: random.pick(SUPPLIERS),
        quantity: random.int(20, 80),
        unitCostCents: Math.round(product.costCents * (0.95 + random.next() * 0.1)),
        createdAt: localToUtcIso(day, random.int(8 * 60, 18 * 60)),
      });
    }
  });
  return rows;
}

function generateSessionViews(random: Random, day: LocalDay, catalog: Dataset['products']) {
  const source = random.weighted(SOURCE_WEIGHTS);
  const sessionId = random.hex(16);
  return Array.from({ length: random.int(1, 4) }, () => {
    const product = random.chance(0.5) ? random.pick(catalog) : null;
    return {
      path: product ? `/produtos/${product.id}` : random.pick(STATIC_PAGES),
      productId: product ? product.id : null,
      source,
      sessionId,
      createdAt: randomTimestamp(random, day),
    };
  });
}

function generatePageViews(random: Random, days: LocalDay[], catalog: Dataset['products']) {
  const rows: Dataset['pageViews'] = [];
  days.forEach((day, dayIndex) => {
    const sessions = dailyVolume(
      random,
      BASE_SESSIONS_PER_DAY,
      seasonality(day, dayIndex, days.length),
    );
    for (let n = 0; n < sessions; n++) {
      for (const view of generateSessionViews(random, day, catalog)) {
        rows.push({ id: rows.length + 1, ...view });
      }
    }
  });
  return rows;
}

export function generateDataset(random: Random, options: DatasetOptions): Dataset {
  const days = lastDays(options.endDay, options.days);
  const createdAt = localToUtcIso(days[0] ?? options.endDay, 0);
  const catalog = generateCatalog(random, createdAt);
  const customerRows = generateCustomers(random, createdAt);
  const sales = generateSales(random, days, { ...catalog, customers: customerRows });

  return {
    ...catalog,
    customers: customerRows,
    ...sales,
    purchases: generatePurchases(random, days, catalog.products),
    pageViews: generatePageViews(random, days, catalog.products),
  };
}
