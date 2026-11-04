import { metricsHandler } from '@/server/api/metrics-handler';
import { loadSales } from '@/server/services/metrics';

/** GET /api/metrics/sales?from=YYYY-MM-DD&to=YYYY-MM-DD — ver .ai/context/routes.md. */
export const GET = metricsHandler(loadSales);
