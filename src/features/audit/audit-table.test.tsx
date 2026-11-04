import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AuditEntry } from '@/types/users';
import { AuditTable } from './audit-table';

const entry = (over: Partial<AuditEntry>): AuditEntry => ({
  id: 1,
  action: 'user.block',
  actorName: 'Admin',
  targetName: 'Bia',
  metadata: null,
  createdAt: '2026-09-03T15:05:00.000Z',
  ...over,
});

describe('AuditTable', () => {
  it('data no fuso da loja, ação em português, quem fez e em quem', () => {
    render(<AuditTable entries={[entry({})]} />);

    const row = screen.getByRole('row', { name: /Bloqueou/ });
    expect(row).toHaveTextContent('03/09/2026 12:05');
    expect(row).toHaveTextContent('Admin');
    expect(row).toHaveTextContent('Bia');
  });

  it('edição lista os campos alterados', () => {
    render(
      <AuditTable
        entries={[entry({ action: 'user.update', metadata: { changed: ['name', 'email'] } })]}
      />,
    );

    expect(screen.getByRole('row', { name: /Editou/ })).toHaveTextContent('Nome, e-mail');
  });

  it('sem registros mostra o estado vazio', () => {
    render(<AuditTable entries={[]} />);

    expect(screen.getByText('Nenhuma ação administrativa registrada ainda.')).toBeInTheDocument();
  });
});
