// Violações das regras de usuários (.ai/domains/usuarios-e-perfis.md) e seu status HTTP.

export type UserRuleCode =
  | 'not_found'
  | 'email_taken'
  | 'admin_target'
  | 'self_action'
  | 'wrong_password'
  | 'too_many_attempts';

const DETAILS = {
  not_found: { status: 404, message: 'Usuário não encontrado.' },
  email_taken: { status: 409, message: 'Este e-mail já está cadastrado.' },
  admin_target: { status: 422, message: 'Administradores não podem ser alterados por aqui.' },
  self_action: { status: 422, message: 'Você não pode fazer isso com a sua própria conta.' },
  wrong_password: { status: 422, message: 'A senha atual não confere.' },
  too_many_attempts: {
    status: 429,
    message: 'Muitas tentativas. Tente novamente em alguns minutos.',
  },
} as const satisfies Record<UserRuleCode, { status: number; message: string }>;

export class UserRuleError extends Error {
  readonly code: UserRuleCode;
  readonly status: 404 | 409 | 422 | 429;

  constructor(code: UserRuleCode) {
    super(DETAILS[code].message);
    this.name = 'UserRuleError';
    this.code = code;
    this.status = DETAILS[code].status;
  }
}
