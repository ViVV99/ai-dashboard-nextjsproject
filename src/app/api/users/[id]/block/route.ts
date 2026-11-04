import { jsonResponse } from '@/server/api/responses';
import { apiRoute } from '@/server/api/route-helpers';
import { blockUser } from '@/server/services/users';
import { userId, type UserRouteContext } from '../params';

/** POST /api/users/:id/block (admin). */
export const POST = apiRoute('admin', async (_request, ctx: UserRouteContext) =>
  jsonResponse(await blockUser(await userId(ctx))),
);
