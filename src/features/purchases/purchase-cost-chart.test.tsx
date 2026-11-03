import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PurchasesPoint } from '@/types/metrics';
import { PurchaseCostChart } from './purchase-cost-chart';

const plain = (text: string | null) => (text ?? '').replace(/ /g, ' ');
const point = (bucket: string, purchaseCents: number): PurchasesPoint => ({
  bucket,
  purchaseCents,
  revenueCents: 0,
  cogsCents: 0,
});

describe('PurchaseCostChart', () => {
  it('descreve a granularidade e lista o custo por bucket na tabela', async () => {
    render(
      <PurchaseCostChart
        granularity="month"
        data={[point('2026-08-01', 1234_56), point('2026-09-01', 0)]}
      />,
    );
    await userEvent.click(screen.getByText('Ver dados em tabela'));

    const region = screen.getByRole('region', { name: 'Custo de compras' });
    expect(region).toHaveAccessibleDescription('Custo das compras de reposição por mês.');
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'MêsCusto',
      'ago/26R$ 1.234,56',
      'set/26R$ 0,00',
    ]);
  });

  it('sem compras mostra o estado vazio', () => {
    render(<PurchaseCostChart granularity="day" data={[point('2026-09-01', 0)]} />);

    expect(screen.getByText('Nenhuma compra no período.')).toBeInTheDocument();
  });
});
