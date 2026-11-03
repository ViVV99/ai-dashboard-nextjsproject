import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PurchasesPoint } from '@/types/metrics';
import { RevenueCogsChart } from './revenue-cogs-chart';

const plain = (text: string | null) => (text ?? '').replace(/ /g, ' ');
const point = (bucket: string, revenueCents: number, cogsCents: number): PurchasesPoint => ({
  bucket,
  purchaseCents: 0,
  revenueCents,
  cogsCents,
});

describe('RevenueCogsChart', () => {
  it('nomeia as duas séries na legenda', () => {
    render(<RevenueCogsChart granularity="day" data={[point('2026-09-01', 100_00, 60_00)]} />);

    const legend = screen.getByRole('list', { name: 'Legenda' });
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Receita', 'CMV']);
  });

  it('tabela traz receita, CMV e margem por bucket ("—" sem receita)', async () => {
    render(
      <RevenueCogsChart
        granularity="week"
        data={[point('2026-08-31', 100_00, 60_00), point('2026-09-07', 0, 0)]}
      />,
    );
    await userEvent.click(screen.getByText('Ver dados em tabela'));

    const region = screen.getByRole('region', { name: 'Receita × CMV' });
    expect(region).toHaveAccessibleDescription(
      'Receita e custo das mercadorias vendidas (pedidos pagos) por semana.',
    );
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'SemanaReceitaCMVMargem',
      'sem. 31/08R$ 100,00R$ 60,0040,0%',
      'sem. 07/09R$ 0,00R$ 0,00—',
    ]);
  });

  it('sem vendas mostra o estado vazio', () => {
    render(<RevenueCogsChart granularity="day" data={[point('2026-09-01', 0, 0)]} />);

    expect(screen.getByText('Nenhuma venda paga no período.')).toBeInTheDocument();
  });
});
