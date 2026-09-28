// Fonte única dos valores de domínio: usados nos tipos, nas constraints CHECK do
// banco e nos schemas Zod. Ver .ai/domains/schema.md.

export const ROLES = ['admin', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['active', 'blocked'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ORDER_STATUSES = ['paid', 'canceled', 'refunded'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TRAFFIC_SOURCES = ['direct', 'organic', 'social', 'ads', 'email'] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];
