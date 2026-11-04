import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuditPage from './page';

const m = vi.hoisted(() => ({ requirePageRole: vi.fn(), loadAudit: vi.fn() }));
vi.mock('@/server/auth', () => ({ requirePageRole: m.requirePageRole }));
vi.mock('@/server/services/users', () => ({ loadAudit: m.loadAudit }));

type Page = (props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) => Promise<ReactElement>;
const renderPage = async (params: Record<string, string | string[]> = {}) =>
  render(await (AuditPage as Page)({ searchParams: Promise.resolve(params) }));

beforeEach(() => {
  vi.clearAllMocks();
  m.loadAudit.mockResolvedValue({ items: [], total: 45, page: 2, pageSize: 20 });
});

describe('página de auditoria', () => {
  it('exige admin, carrega a página da URL e pagina', async () => {
    await renderPage({ page: '2' });

    expect(m.requirePageRole).toHaveBeenCalledWith('admin');
    expect(m.loadAudit).toHaveBeenCalledWith(2);
    expect(screen.getByRole('heading', { level: 1, name: 'Auditoria' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para a página 3' })).toHaveAttribute(
      'href',
      '/admin/auditoria?page=3',
    );
  });

  it('página inválida volta para a 1', async () => {
    await renderPage({ page: 'x' });

    expect(m.loadAudit).toHaveBeenCalledWith(1);
  });
});
