import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AccessLoading from './loading';

describe('AccessLoading', () => {
  it('é anunciado como status e reserva o espaço dos três gráficos', () => {
    render(<AccessLoading />);

    const status = screen.getByRole('status', { name: 'Carregando acessos' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(within(status).getAllByTestId('chart-skeleton')).toHaveLength(3);
  });
});
