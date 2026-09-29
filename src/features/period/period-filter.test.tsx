import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PeriodFilter } from './period-filter';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/vendas',
  useSearchParams: () => new URLSearchParams('aba=top'),
}));

const period = { from: '2026-08-31', to: '2026-09-29' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-29T15:00:00Z'));
  push.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PeriodFilter', () => {
  it('marca o preset que corresponde ao período atual', () => {
    render(<PeriodFilter period={period} invalid={false} />);

    expect(screen.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('preset navega para a rota atual com from/to, preservando outros parâmetros', async () => {
    render(<PeriodFilter period={period} invalid={false} />);

    await userEvent.setup().click(screen.getByRole('button', { name: '7 dias' }));

    expect(push).toHaveBeenCalledWith('/vendas?aba=top&from=2026-09-23&to=2026-09-29');
  });

  it('intervalo personalizado válido navega ao aplicar', async () => {
    render(<PeriodFilter period={period} invalid={false} />);

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-01-31' } });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(push).toHaveBeenCalledWith('/vendas?aba=top&from=2026-01-01&to=2026-01-31');
  });

  it('data final antes da inicial mostra erro e não navega', async () => {
    render(<PeriodFilter period={period} invalid={false} />);

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-02-10' } });
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-02-01' } });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(
      await screen.findByText('A data final deve ser igual ou posterior à inicial.'),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('avisa quando o período da URL era inválido', () => {
    render(<PeriodFilter period={period} invalid />);

    expect(screen.getByRole('alert')).toHaveTextContent(/período informado é inválido/i);
  });
});
