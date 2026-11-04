import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UsersLoading from './loading';

describe('UsersLoading', () => {
  it('é anunciado como status e reserva a tabela', () => {
    render(<UsersLoading />);

    const status = screen.getByRole('status', { name: 'Carregando usuários' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(within(status).getByTestId('table-skeleton')).toBeInTheDocument();
  });
});
