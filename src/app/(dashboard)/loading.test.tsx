import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardLoading from './loading';

describe('DashboardLoading', () => {
  // Regressão: aria-label em div genérica não é anunciado; o papel status é.
  it('é anunciado como status de carregamento', () => {
    render(<DashboardLoading />);

    expect(screen.getByRole('status', { name: 'Carregando' })).toHaveAttribute('aria-busy', 'true');
  });
});
