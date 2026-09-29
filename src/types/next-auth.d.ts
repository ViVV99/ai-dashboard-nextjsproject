import type { Role } from './domain';

// Claims extras da sessão (ADR 0002): perfil e versão da sessão para revogação.
declare module 'next-auth' {
  interface User {
    role: Role;
    sessionVersion: number;
  }

  interface Session {
    user: { id: string; name: string; email: string; role: Role; sessionVersion: number };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: Role;
    sessionVersion?: number;
  }
}
