import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ProductRank } from '@/types/metrics';
import { TopProductsChart } from './top-products-chart';

const fone: ProductRank = { productId: 1, name: 'Fone', revenueCents: 180_00, quantity: 2 };
const caneca: ProductRank = { productId: 2, name: 'Caneca', revenueCents: 50_00, quantity: 5 };

const firstProduct = () =>
  within(screen.getByRole('table', { name: 'Top 10 produtos' })).getAllByRole('row')[1];

describe('TopProductsChart', () => {
  it('começa por receita e alterna para quantidade', async () => {
    render(<TopProductsChart byRevenue={[fone, caneca]} byQuantity={[caneca, fone]} />);
    await userEvent.click(screen.getByText('Ver dados em tabela'));

    expect(screen.getByRole('button', { name: 'Receita' })).toHaveAttribute('aria-pressed', 'true');
    expect(firstProduct()).toHaveTextContent('Fone');

    await userEvent.click(screen.getByRole('button', { name: 'Quantidade' }));

    expect(screen.getByRole('button', { name: 'Quantidade' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(firstProduct()).toHaveTextContent('Caneca');
    expect(firstProduct()).toHaveTextContent('5');
  });

  it('sem vendas mostra o estado vazio', () => {
    render(<TopProductsChart byRevenue={[]} byQuantity={[]} />);

    expect(screen.getByText('Nenhum produto vendido no período.')).toBeInTheDocument();
  });
});
