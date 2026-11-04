import { profileNameSchema } from '@/schemas/users';
import { jsonResponse } from '@/server/api/responses';
import { apiRoute, readBody } from '@/server/api/route-helpers';
import { updateProfile } from '@/server/services/profile';

/** PATCH /api/me — atualiza o próprio nome. */
export const PATCH = apiRoute('user', async (request) =>
  jsonResponse(await updateProfile(await readBody(request, profileNameSchema))),
);
