import { parseId } from '@/server/api/route-helpers';

/** Contexto das rotas `/api/users/[id]/*`. */
export type UserRouteContext = { params: Promise<{ id: string }> };

export const userId = async ({ params }: UserRouteContext) => parseId((await params).id);
