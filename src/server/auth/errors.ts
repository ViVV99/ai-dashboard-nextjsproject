// Erros de autenticação/autorização e sua resposta HTTP padronizada
// (ver .ai/domains/usuarios-e-perfis.md, "Respostas HTTP").

export type AuthErrorCode = 'unauthorized' | 'forbidden';

const DETAILS = {
  unauthorized: { status: 401, message: 'Sessão inválida ou expirada.' },
  forbidden: { status: 403, message: 'Você não tem permissão para esta ação.' },
} as const satisfies Record<AuthErrorCode, { status: number; message: string }>;

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: 401 | 403;

  constructor(code: AuthErrorCode) {
    super(DETAILS[code].message);
    this.name = 'AuthError';
    this.code = code;
    this.status = DETAILS[code].status;
  }
}

export function authErrorResponse(error: AuthError): Response {
  return Response.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}
