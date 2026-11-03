import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SeriesLegend } from './series-legend';

describe('SeriesLegend', () => {
  it('lista um item por série, na ordem, com o rótulo em texto', () => {
    render(
      <SeriesLegend
        series={[
          { id: 'a', label: 'Acessos', color: 'red' },
          { id: 'b', label: 'Visitantes', color: 'blue' },
        ]}
      />,
    );

    const legend = screen.getByRole('list', { name: 'Legenda' });
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Acessos', 'Visitantes']);
  });
});
