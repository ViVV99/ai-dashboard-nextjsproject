import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ChartCard } from './chart-card';

const table = { columns: ['Dia', 'Receita'], rows: [['01/09', 'R$ 10,00']] };

describe('ChartCard', () => {
  it('é uma região nomeada pelo título, com descrição', () => {
    render(
      <ChartCard title="Receita" description="Por dia." table={table}>
        <svg data-testid="grafico" />
      </ChartCard>,
    );

    const region = screen.getByRole('region', { name: 'Receita' });
    expect(region).toHaveAccessibleDescription('Por dia.');
    expect(within(region).getByTestId('grafico')).toBeInTheDocument();
  });

  it('oferece os dados em tabela', async () => {
    render(
      <ChartCard title="Receita" description="Por dia." table={table}>
        <svg />
      </ChartCard>,
    );

    await userEvent.click(screen.getByText('Ver dados em tabela'));

    const grid = screen.getByRole('table', { name: 'Receita' });
    expect(within(grid).getByRole('columnheader', { name: 'Dia' })).toBeInTheDocument();
    expect(within(grid).getByRole('cell', { name: 'R$ 10,00' })).toBeInTheDocument();
  });

  it('vazio: mostra a mensagem no lugar do gráfico e da tabela', () => {
    render(
      <ChartCard title="Receita" description="Por dia." table={table} empty="Sem vendas.">
        <svg data-testid="grafico" />
      </ChartCard>,
    );

    expect(screen.getByText('Sem vendas.')).toBeInTheDocument();
    expect(screen.queryByTestId('grafico')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver dados em tabela')).not.toBeInTheDocument();
  });
});
