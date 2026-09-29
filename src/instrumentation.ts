// Roda uma vez na subida do servidor (não no `next build`): falha cedo com
// mensagem clara em vez de erros confusos no primeiro login.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { assertAuthEnv } = await import('./server/auth/env');
  assertAuthEnv(process.env);
}
