import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RevenueChart } from './revenue-chart';

const plain = (text: string | null) => (text ?? '').replace(/\u00a0/g, ' ');

describe('RevenueChart', () => {
  it('descreve a granularidade e lista os buckets formatados na tabela', async () => {
    render(
      <RevenueChart
        granularity="week"
        data={[
          { bucket: '2026-08-31', revenueCents: 1234_56, orders: 3 },
          { bucket: '2026-09-07', revenueCents: 0, orders: 0 },
        ]}
      />,
    );
    await userEvent.click(screen.getByText('Ver dados em tabela'));

    const region = screen.getByRole('region', { name: 'Receita ao longo do tempo' });
    expect(region).toHaveAccessibleDescription('Receita de pedidos pagos por semana.');
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'sem. 31/08R$ 1.234,563',
      'sem. 07/09R$ 0,000',
    ]);
  });

  it('sem vendas mostra o estado vazio', () => {
    render(
      <RevenueChart
        granularity="day"
        data={[{ bucket: '2026-09-01', revenueCents: 0, orders: 0 }]}
      />,
    );

    expect(screen.getByText('Nenhuma venda paga no período.')).toBeInTheDocument();
  });
});
