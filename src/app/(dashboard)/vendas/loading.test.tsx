import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SalesLoading from './loading';

describe('SalesLoading', () => {
  it('é anunciado como status e reserva o espaço dos três gráficos', () => {
    render(<SalesLoading />);

    const status = screen.getByRole('status', { name: 'Carregando vendas' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(within(status).getAllByTestId('chart-skeleton')).toHaveLength(3);
  });
});
