import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RootError from '@/app/error';
import DashboardError from '@/app/(dashboard)/error';
import { GlobalErrorContent } from '@/app/global-error';
import { ErrorPanel } from './error-panel';

const error = Object.assign(new Error('detalhe interno'), { digest: 'abc123' });

describe('ErrorPanel', () => {
  it('mostra mensagem genérica, o código do erro e permite tentar de novo', async () => {
    const retry = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorPanel error={error} retry={retry} />);

    expect(screen.queryByText(/detalhe interno/)).not.toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(retry).toHaveBeenCalled();
  });
});

describe('telas de erro das rotas', () => {
  it.each([
    ['dashboard', DashboardError],
    ['raiz (cobre falhas no layout do dashboard)', RootError],
  ])('%s usa o painel em pt-BR', (_, Boundary) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Boundary error={error} retry={vi.fn()} reset={vi.fn()} />);

    expect(screen.getByText('Não foi possível carregar esta página')).toBeInTheDocument();
  });

  it('global-error (layout raiz) funciona sem o tema e sem vazar detalhes', async () => {
    const retry = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<GlobalErrorContent error={error} retry={retry} />);

    expect(screen.getByRole('heading', { name: 'Algo deu errado' })).toBeInTheDocument();
    expect(screen.queryByText(/detalhe interno/)).not.toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(retry).toHaveBeenCalled();
  });
});
