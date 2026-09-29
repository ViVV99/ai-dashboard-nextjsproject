/** `openssl rand -base64 32` gera 44 caracteres; abaixo de 32 o segredo é fraco. */
export const MIN_SECRET_LENGTH = 32;

/**
 * Valida as variáveis do Auth.js na subida do servidor. Sem isso, um AUTH_SECRET
 * ausente só aparece no login como redirect para /api/auth/* (page not found).
 * A mensagem nunca inclui o valor do segredo.
 */
export function assertAuthEnv(env: Record<string, string | undefined>): void {
  const secret = env.AUTH_SECRET?.trim() ?? '';
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `AUTH_SECRET ausente ou com menos de ${MIN_SECRET_LENGTH} caracteres. ` +
        'Gere um com `openssl rand -base64 32`, defina no .env e reinicie o servidor.',
    );
  }
}
