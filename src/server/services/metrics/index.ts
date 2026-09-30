import type { OverviewMetrics, SalesMetrics } from '@/types/metrics';
import type { Period } from '@/types/period';
import { requireUser } from '../../auth';
import { getDb } from '../../db';
import { getOverviewMetrics } from './overview';
import { getSalesMetrics } from './sales';

// Fachada dos services de métricas: autoriza (defesa em profundidade) e usa o banco da
// aplicação. Páginas e a API REST (F8) chamam estas funções, nunca as consultas direto.

export async function loadOverview(period: Period): Promise<OverviewMetrics> {
  await requireUser();
  return getOverviewMetrics(getDb(), period);
}

export async function loadSales(period: Period): Promise<SalesMetrics> {
  await requireUser();
  return getSalesMetrics(getDb(), period);
}
