import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PurchasesLoading from './loading';

describe('PurchasesLoading', () => {
  it('é anunciado como status e reserva o resumo e os dois gráficos', () => {
    render(<PurchasesLoading />);

    const status = screen.getByRole('status', { name: 'Carregando compras' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(within(status).getAllByTestId('stat-skeleton')).toHaveLength(4);
    expect(within(status).getAllByTestId('chart-skeleton')).toHaveLength(2);
  });
});
