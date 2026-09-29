import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OverviewPage from './page';

describe('OverviewPage', () => {
  it('renderiza o título da visão geral', async () => {
    render(await OverviewPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument();
  });
});
