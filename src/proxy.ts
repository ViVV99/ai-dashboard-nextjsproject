import { NextResponse } from 'next/server';
import { auth } from '@/server/auth/config';
import { routeDecision } from '@/server/auth/routing';

// Checagem otimista (só JWT). Autorização real: requireUser/requireRole.
export default auth((request) => {
  const role = request.auth?.user?.role;
  const decision = routeDecision(request.nextUrl.pathname, role ? { role } : null);
  if (decision.type === 'redirect') {
    return NextResponse.redirect(new URL(decision.to, request.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
