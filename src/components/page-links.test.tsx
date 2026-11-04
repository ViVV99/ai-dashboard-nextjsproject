import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageLinks } from './page-links';

describe('PageLinks', () => {
  it('links preservam os outros parâmetros e omitem page=1', () => {
    render(<PageLinks page={2} pages={3} pathname="/x" params={{ q: 'ana', status: 'active' }} />);

    expect(screen.getByRole('link', { name: 'Ir para a página 3' })).toHaveAttribute(
      'href',
      '/x?q=ana&status=active&page=3',
    );
    expect(screen.getByRole('link', { name: 'Ir para a página 1' })).toHaveAttribute(
      'href',
      '/x?q=ana&status=active',
    );
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument();
  });

  it('uma página só: nada', () => {
    const { container } = render(<PageLinks page={1} pages={1} pathname="/x" params={{}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
