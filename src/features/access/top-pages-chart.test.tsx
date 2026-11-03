import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TopPagesChart } from './top-pages-chart';

describe('TopPagesChart', () => {
  it('tabela traz o rótulo, o caminho e os acessos de cada página', async () => {
    render(
      <TopPagesChart
        data={[
          { path: '/produtos/7', label: 'Caneca', views: 1500 },
          { path: '/', label: '/', views: 30 },
        ]}
      />,
    );
    await userEvent.click(screen.getByText('Ver dados em tabela'));

    expect(screen.getByRole('region', { name: 'Páginas mais vistas' })).toBeInTheDocument();
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows.map((row) => row.textContent)).toEqual([
      'PáginaCaminhoAcessos',
      'Caneca/produtos/71.500',
      '//30',
    ]);
  });

  it('sem acessos mostra o estado vazio', () => {
    render(<TopPagesChart data={[]} />);

    expect(screen.getByText('Nenhum acesso no período.')).toBeInTheDocument();
  });
});
