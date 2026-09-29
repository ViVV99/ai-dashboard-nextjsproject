// Mensagens de login propositalmente genéricas: não revelam se o e-mail existe
// nem se o usuário está bloqueado (ADR 0002).
export const LOGIN_ERROR_MESSAGE = 'E-mail ou senha inválidos.';
export const RATE_LIMIT_MESSAGE = 'Muitas tentativas. Tente novamente em alguns minutos.';
// Falha de configuração do servidor (ex.: AUTH_SECRET ausente); detalhes só no log.
export const LOGIN_UNAVAILABLE_MESSAGE =
  'Não foi possível entrar agora. Tente novamente mais tarde.';
