import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { loginSchema } from '@/schemas/auth';
import { getDb } from '../db';
import { createCredentialsVerifier } from './credentials';

/** Código exposto na URL/erro quando o rate limit do login é atingido. */
export class RateLimitedSignin extends CredentialsSignin {
  override code = 'rate_limited';
}

// Singleton: os contadores do rate limit vivem na memória deste processo.
let verifier: ReturnType<typeof createCredentialsVerifier> | undefined;
const getVerifier = () => (verifier ??= createCredentialsVerifier(getDb()));

/** IP do cliente. Só é confiável atrás de um proxy reverso que reescreve o cabeçalho. */
const clientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const result = await getVerifier()(parsed.data, clientIp(request));
        if (result.ok) return { ...result.user, id: String(result.user.id) };
        if (result.reason === 'rate_limited') throw new RateLimitedSignin();
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub && token.role && token.sessionVersion !== undefined) {
        session.user = {
          ...session.user,
          id: token.sub,
          role: token.role,
          sessionVersion: token.sessionVersion,
        };
      }
      return session;
    },
  },
});
