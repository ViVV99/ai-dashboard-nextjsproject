import type { OverviewMetrics } from '@/types/metrics';
import type { Period } from '@/types/period';
import { requireUser } from '../../auth';
import { getDb } from '../../db';
import { getOverviewMetrics } from './overview';

// Fachada dos services de métricas: autoriza (defesa em profundidade) e usa o banco da
// aplicação. Páginas e a API REST (F8) chamam estas funções, nunca as consultas direto.

export async function loadOverview(period: Period): Promise<OverviewMetrics> {
  await requireUser();
  return getOverviewMetrics(getDb(), period);
}
