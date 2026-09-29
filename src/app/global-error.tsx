'use client';

import { useEffect } from 'react';
import type { ErrorBoundaryProps } from '@/components/error-panel';

type ContentProps = Pick<ErrorBoundaryProps, 'error' | 'retry'>;

// Substitui o layout raiz quando ele falha: sem tema MUI nem fontes, só estilos inline.
export function GlobalErrorContent({ error, retry }: ContentProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ maxWidth: 560, margin: '96px auto', padding: '0 16px', lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 24 }}>Algo deu errado</h1>
      <p>
        Não foi possível carregar o AI Dashboard. Tente novamente em instantes.
        {error.digest && ` Código: ${error.digest}`}
      </p>
      <button type="button" onClick={() => retry()} style={{ padding: '8px 16px' }}>
        Tentar novamente
      </button>
    </main>
  );
}

export default function GlobalError({ error, retry }: ErrorBoundaryProps) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', colorScheme: 'light dark' }}>
        <title>Erro · AI Dashboard</title>
        <GlobalErrorContent error={error} retry={retry} />
      </body>
    </html>
  );
}
