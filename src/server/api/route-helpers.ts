import type { z } from 'zod';
import { requireRole, requireUser } from '../auth';
import { UserRuleError } from '../services/users/errors';
import { InvalidRequestError, toErrorResponse, zodDetails } from './responses';

// Fiação comum dos Route Handlers da API REST (F9). Ver .ai/context/routes.md.

export type Guard = 'admin' | 'user';

/**
 * Autentica **antes** de validar a entrada (sem sessão → 401; viewer em rota admin → 403,
 * mesmo com corpo inválido) e converte qualquer erro na resposta padronizada.
 * A fachada chamada pelo handler revalida a sessão (defesa em profundidade).
 */
export function apiRoute<Ctx>(
  guard: Guard,
  handle: (request: Request, ctx: Ctx) => Promise<Response>,
) {
  return async (request: Request, ctx: Ctx): Promise<Response> => {
    try {
      await (guard === 'admin' ? requireRole('admin') : requireUser());
      return await handle(request, ctx);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/** Corpo JSON validado pelo schema; JSON quebrado ou inválido → InvalidRequestError (400). */
export async function readBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new InvalidRequestError([{ field: '_root', message: 'Envie um corpo JSON válido.' }]);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new InvalidRequestError(zodDetails(parsed.error));
  return parsed.data;
}

/** Query validada pelo schema; parâmetro repetido é inválido (não escolhemos um valor). */
export function parseQuery<S extends z.ZodType>(params: URLSearchParams, schema: S): z.output<S> {
  const repeated = [...new Set(params.keys())].filter((key) => params.getAll(key).length > 1);
  if (repeated.length > 0) {
    throw new InvalidRequestError(
      repeated.map((field) => ({ field, message: 'Informe um único valor.' })),
    );
  }
  const parsed = schema.safeParse(Object.fromEntries(params));
  if (!parsed.success) throw new InvalidRequestError(zodDetails(parsed.error));
  return parsed.data;
}

/** `:id` da rota; qualquer coisa que não seja inteiro positivo não existe (404). */
export function parseId(raw: string): number {
  if (!/^[1-9]\d*$/.test(raw)) throw new UserRuleError('not_found');
  const id = Number(raw);
  if (!Number.isSafeInteger(id)) throw new UserRuleError('not_found');
  return id;
}
