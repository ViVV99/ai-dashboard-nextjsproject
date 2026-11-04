import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SourcesChart } from './sources-chart';

const plain = (text: string | null) => (text ?? '').replace(/ /g, ' ');

describe('SourcesChart', () => {
  it('tabela traz a origem em português, os acessos e a participação', async () => {
    render(
      <SourcesChart
        data={[
          { source: 'organic', views: 750 },
          { source: 'email', views: 250 },
          { source: 'direct', views: 0 },
        ]}
      />,
    );
    await userEvent.click(screen.getByText('Ver dados em tabela'));

    expect(screen.getByRole('region', { name: 'Acessos por origem' })).toBeInTheDocument();
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'OrigemAcessosParticipação',
      'Busca orgânica75075,0%',
      'E-mail25025,0%',
      'Direto00,0%',
    ]);
  });

  it('sem acessos mostra o estado vazio', () => {
    render(<SourcesChart data={[{ source: 'direct', views: 0 }]} />);

    expect(screen.getByText('Nenhum acesso no período.')).toBeInTheDocument();
  });
});
