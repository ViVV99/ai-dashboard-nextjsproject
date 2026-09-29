import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DashboardError from './error';

describe('DashboardError', () => {
  it('mostra mensagem genérica, o código do erro e permite tentar de novo', async () => {
    const retry = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('detalhe interno'), { digest: 'abc123' });
    render(<DashboardError error={error} retry={retry} reset={vi.fn()} />);

    expect(screen.queryByText(/detalhe interno/)).not.toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(retry).toHaveBeenCalled();
  });
});
