import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PurchasesSummary } from './purchases-summary';

const plain = (text: string | null) => (text ?? '').replace(/ /g, ' ');
const value = (name: string) => plain(screen.getByRole('article', { name }).textContent);

describe('PurchasesSummary', () => {
  it('mostra compras, receita, CMV e margem bruta do período', () => {
    render(
      <PurchasesSummary
        summary={{
          purchaseCents: 161_00,
          revenueCents: 200_00,
          cogsCents: 50_00,
          grossMargin: 0.75,
        }}
      />,
    );

    expect(value('Custo de compras')).toContain('R$ 161,00');
    expect(value('Receita')).toContain('R$ 200,00');
    expect(value('CMV')).toContain('R$ 50,00');
    expect(value('Margem bruta')).toContain('75,0%');
  });

  it('sem receita a margem aparece como "—"', () => {
    render(
      <PurchasesSummary
        summary={{ purchaseCents: 10_00, revenueCents: 0, cogsCents: 0, grossMargin: null }}
      />,
    );

    expect(value('Margem bruta')).toContain('—');
  });
});
