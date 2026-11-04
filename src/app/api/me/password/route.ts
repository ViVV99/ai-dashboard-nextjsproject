import { changePasswordSchema } from '@/schemas/users';
import { jsonResponse } from '@/server/api/responses';
import { apiRoute, readBody } from '@/server/api/route-helpers';
import { changePassword } from '@/server/services/profile';

/**
 * POST /api/me/password — troca a própria senha (exige a atual). As outras sessões caem;
 * a atual recebe cookie novo. `renewed: false` → o cliente precisa entrar de novo.
 */
export const POST = apiRoute('user', async (request) =>
  jsonResponse(await changePassword(await readBody(request, changePasswordSchema))),
);
