import { AuthError } from '../auth/errors';

// Respostas JSON da API REST. Formato de erro em .ai/context/routes.md ("API REST").

export type ApiErrorCode = 'invalid_request' | 'unauthorized' | 'forbidden' | 'internal_error';

export type ErrorDetail = { field: string; message: string };

// Dados por sessão: nada pode ficar em cache compartilhado (proxy/CDN) nem no navegador.
const HEADERS = { 'Cache-Control': 'no-store' };

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: HEADERS });
}

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ErrorDetail[],
): Response {
  return jsonResponse({ error: { code, message, ...(details && { details }) } }, status);
}

/** AuthError → 401/403; qualquer outro erro → 500 genérico (o detalhe fica só no log). */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof AuthError) return errorResponse(error.status, error.code, error.message);
  console.error('[api] erro inesperado', error);
  return errorResponse(500, 'internal_error', 'Erro interno. Tente novamente mais tarde.');
}
