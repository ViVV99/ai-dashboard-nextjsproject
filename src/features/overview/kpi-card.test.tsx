import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Kpi } from '@/types/metrics';
import { KpiCard } from './kpi-card';
import { KpiGrid } from './kpi-grid';

const base: Kpi = {
  id: 'revenue',
  label: 'Receita',
  format: 'currency',
  value: 12345670,
  previous: 10000000,
  variation: 0.2345,
};

const card = (kpi: Kpi) => {
  render(<KpiCard kpi={kpi} />);
  return within(screen.getByRole('article', { name: kpi.label }));
};

const plain = (text: string | null) => (text ?? '').replace(/ /g, ' ');

describe('KpiCard', () => {
  it('mostra rótulo e valor formatado conforme o tipo', () => {
    expect(plain(card(base).getByTestId('kpi-value').textContent)).toBe('R$ 123.456,70');
  });

  it.each([
    [{ format: 'integer', value: 1234567 } as const, '1.234.567'],
    [{ format: 'percent', value: 0.0487 } as const, '4,9%'],
    [{ format: 'currency', value: null } as const, '—'],
  ])('formato %o → %s', (overrides, expected) => {
    expect(plain(card({ ...base, ...overrides }).getByTestId('kpi-value').textContent)).toBe(
      expected,
    );
  });

  it('alta: sinal, seta e texto de comparação (não só cor)', () => {
    const view = card(base);

    expect(view.getByText('+23,5%')).toBeInTheDocument();
    expect(view.getByTestId('ArrowUpwardIcon')).toBeInTheDocument();
    expect(view.getByText('vs. período anterior')).toBeInTheDocument();
  });

  it('queda: sinal negativo e seta para baixo', () => {
    const view = card({ ...base, variation: -0.1 });

    expect(view.getByText('-10,0%')).toBeInTheDocument();
    expect(view.getByTestId('ArrowDownwardIcon')).toBeInTheDocument();
  });

  it('sem base de comparação → "—" com explicação', () => {
    const view = card({ ...base, variation: null });

    expect(view.getByText('sem base de comparação')).toBeInTheDocument();
    expect(view.queryByTestId('ArrowUpwardIcon')).not.toBeInTheDocument();
  });

  it('mostra a observação do KPI quando existe', () => {
    const view = card({ ...base, hint: 'Aproximação: pedidos ÷ visitantes.' });

    expect(view.getByText('Aproximação: pedidos ÷ visitantes.')).toBeInTheDocument();
  });
});

describe('KpiGrid', () => {
  it('renderiza um card por KPI, na ordem recebida', () => {
    render(
      <KpiGrid
        kpis={[base, { ...base, id: 'orders', label: 'Pedidos', format: 'integer', value: 10 }]}
      />,
    );

    expect(screen.getAllByRole('article').map((item) => item.getAttribute('aria-label'))).toEqual([
      'Receita',
      'Pedidos',
    ]);
  });
});
