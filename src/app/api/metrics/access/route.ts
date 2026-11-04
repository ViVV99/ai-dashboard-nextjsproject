import { metricsHandler } from '@/server/api/metrics-handler';
import { loadAccess } from '@/server/services/metrics';

/** GET /api/metrics/access?from=YYYY-MM-DD&to=YYYY-MM-DD — ver .ai/context/routes.md. */
export const GET = metricsHandler(loadAccess);
