import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getDb } from '../db';
import { authorizeCredentials, jwtCallback, SESSION_MAX_AGE_S, sessionCallback } from './callbacks';
import { createCredentialsVerifier } from './credentials';

export { RateLimitedSignin } from './callbacks';

// Singleton: os contadores do rate limit vivem na memória deste processo.
let verifier: ReturnType<typeof createCredentialsVerifier> | undefined;
const getVerifier = () => (verifier ??= createCredentialsVerifier(getDb()));

// Proxies confiáveis à frente da app (o próprio `next start` conta como 1).
const trustedHops = Number(process.env.AUTH_TRUSTED_PROXY_HOPS) || 1;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_S },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials, request) =>
        authorizeCredentials(credentials, request, getVerifier(), trustedHops),
    }),
  ],
  callbacks: {
    jwt: (params) => jwtCallback(getDb(), params),
    session: sessionCallback,
  },
});
