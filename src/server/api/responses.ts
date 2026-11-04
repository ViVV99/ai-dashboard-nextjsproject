import { unstable_rethrow } from 'next/navigation';
import type { ZodError } from 'zod';
import { AuthError } from '../auth/errors';
import { UserRuleError, type UserRuleCode } from '../services/users/errors';

// Respostas JSON da API REST. Formato de erro em .ai/context/routes.md ("API REST").

export type ApiErrorCode =
  'invalid_request' | 'unauthorized' | 'forbidden' | 'internal_error' | UserRuleCode;

export type ErrorDetail = { field: string; message: string };

/** Entrada inválida (query, corpo ou parâmetro de rota) → 400 com `details`. */
export class InvalidRequestError extends Error {
  readonly details: ErrorDetail[];

  constructor(details: ErrorDetail[]) {
    super('Parâmetros inválidos.');
    this.name = 'InvalidRequestError';
    this.details = details;
  }
}

/** Issues do Zod como `details`: caminho completo (`a.b`); erro do objeto todo → `_root`. */
export function zodDetails(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join('.') || '_root',
    message: issue.message,
  }));
}

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

/**
 * Erros conhecidos → status próprio; qualquer outro → 500 genérico (o detalhe fica só no log).
 * O controle de fluxo do Next (redirect, notFound) é relançado, nunca vira 500.
 */
export function toErrorResponse(error: unknown): Response {
  unstable_rethrow(error);
  if (error instanceof AuthError || error instanceof UserRuleError) {
    return errorResponse(error.status, error.code, error.message);
  }
  if (error instanceof InvalidRequestError) {
    return errorResponse(400, 'invalid_request', error.message, error.details);
  }
  console.error('[api] erro inesperado', error);
  return errorResponse(500, 'internal_error', 'Erro interno. Tente novamente mais tarde.');
}
