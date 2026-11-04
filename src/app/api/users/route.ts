import { createUserSchema, userListQuerySchema } from '@/schemas/users';
import { jsonResponse } from '@/server/api/responses';
import { apiRoute, parseQuery, readBody } from '@/server/api/route-helpers';
import { createUser, loadUsers } from '@/server/services/users';

/** GET /api/users?q=&status=&page= — lista paginada (admin). */
export const GET = apiRoute('admin', async (request) =>
  jsonResponse(await loadUsers(parseQuery(new URL(request.url).searchParams, userListQuerySchema))),
);

/** POST /api/users — cria viewer (admin). */
export const POST = apiRoute('admin', async (request) =>
  jsonResponse(await createUser(await readBody(request, createUserSchema)), 201),
);
