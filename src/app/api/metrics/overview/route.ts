import { metricsHandler } from '@/server/api/metrics-handler';
import { loadOverview } from '@/server/services/metrics';

/** GET /api/metrics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD — ver .ai/context/routes.md. */
export const GET = metricsHandler(loadOverview);
