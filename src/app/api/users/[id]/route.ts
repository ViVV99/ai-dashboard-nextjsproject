import { updateUserSchema } from '@/schemas/users';
import { jsonResponse } from '@/server/api/responses';
import { apiRoute, readBody } from '@/server/api/route-helpers';
import { updateUser } from '@/server/services/users';
import { userId, type UserRouteContext } from './params';

/** PATCH /api/users/:id — edita nome e e-mail de viewer (admin). */
export const PATCH = apiRoute('admin', async (request, ctx: UserRouteContext) =>
  jsonResponse(await updateUser(await userId(ctx), await readBody(request, updateUserSchema))),
);
