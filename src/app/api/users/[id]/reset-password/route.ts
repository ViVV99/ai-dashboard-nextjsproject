import { resetPasswordSchema } from '@/schemas/users';
import { jsonResponse } from '@/server/api/responses';
import { apiRoute, readBody } from '@/server/api/route-helpers';
import { resetUserPassword } from '@/server/services/users';
import { userId, type UserRouteContext } from '../params';

/** POST /api/users/:id/reset-password — define a nova senha do viewer (admin). */
export const POST = apiRoute('admin', async (request, ctx: UserRouteContext) => {
  const id = await userId(ctx);
  const { password } = await readBody(request, resetPasswordSchema);
  return jsonResponse(await resetUserPassword(id, password));
});
