import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryChart } from './category-chart';

const plain = (text: string | null) => (text ?? '').replace(/\u00a0/g, ' ');

describe('CategoryChart', () => {
  it('legenda com nome, receita e participação de cada categoria', () => {
    render(
      <CategoryChart
        data={[
          { categoryId: 1, name: 'Eletrônicos', revenueCents: 150_00 },
          { categoryId: 2, name: 'Casa', revenueCents: 50_00 },
        ]}
      />,
    );

    const legend = screen.getByRole('list', { name: 'Legenda' });
    const items = within(legend)
      .getAllByRole('listitem')
      .map((item) => plain(item.textContent));
    expect(items).toEqual(['EletrônicosR$ 150,0075,0%', 'CasaR$ 50,0025,0%']);
  });

  it('sem vendas mostra o estado vazio', () => {
    render(<CategoryChart data={[]} />);

    expect(screen.getByText('Nenhuma venda no período.')).toBeInTheDocument();
  });
});
