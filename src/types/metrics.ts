import type { Period } from './period';

// Métricas da visão geral. Fórmulas em .ai/domains/metricas.md.

export type KpiId =
  'revenue' | 'orders' | 'averageTicket' | 'pageViews' | 'visitors' | 'conversion';

/** `currency` em centavos; `percent` como razão (0,05 = 5%). */
export type KpiFormat = 'currency' | 'integer' | 'percent';

export type Kpi = {
  id: KpiId;
  label: string;
  format: KpiFormat;
  /** `null` quando a razão não existe (denominador 0). */
  value: number | null;
  previous: number | null;
  /** Variação vs. período anterior (0,2 = +20%); `null` quando não há base. */
  variation: number | null;
  hint?: string;
};

export type OverviewMetrics = {
  period: Period;
  previousPeriod: Period;
  kpis: Kpi[];
  /** Há pedido pago ou acesso no período atual. */
  hasData: boolean;
};
