import { metricsHandler } from '@/server/api/metrics-handler';
import { loadPurchases } from '@/server/services/metrics';

/** GET /api/metrics/purchases?from=YYYY-MM-DD&to=YYYY-MM-DD — ver .ai/context/routes.md. */
export const GET = metricsHandler(loadPurchases);
