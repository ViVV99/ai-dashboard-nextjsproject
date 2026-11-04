import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TrafficChart } from './traffic-chart';

const plain = (text: string | null) => (text ?? '').replace(/ /g, ' ');

describe('TrafficChart', () => {
  it('nomeia as duas séries na legenda', () => {
    render(
      <TrafficChart granularity="day" data={[{ bucket: '2026-09-01', views: 3, visitors: 2 }]} />,
    );

    const legend = screen.getByRole('list', { name: 'Legenda' });
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Acessos', 'Visitantes únicos']);
  });

  it('descreve a granularidade e lista acessos e visitantes por bucket', async () => {
    render(
      <TrafficChart
        granularity="week"
        data={[
          { bucket: '2026-08-31', views: 1234, visitors: 456 },
          { bucket: '2026-09-07', views: 0, visitors: 0 },
        ]}
      />,
    );
    await userEvent.click(screen.getByText('Ver dados em tabela'));

    const region = screen.getByRole('region', { name: 'Acessos e visitantes' });
    expect(region).toHaveAccessibleDescription('Acessos e visitantes únicos por semana.');
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'SemanaAcessosVisitantes únicos',
      'sem. 31/081.234456',
      'sem. 07/0900',
    ]);
  });

  it('sem acessos mostra o estado vazio', () => {
    render(
      <TrafficChart granularity="day" data={[{ bucket: '2026-09-01', views: 0, visitors: 0 }]} />,
    );

    expect(screen.getByText('Nenhum acesso no período.')).toBeInTheDocument();
  });
});
