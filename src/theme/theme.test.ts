import { describe, expect, it } from 'vitest';
import { theme } from './theme';

describe('theme', () => {
  it('define as cores primárias dos esquemas claro e escuro', () => {
    expect(theme.colorSchemes.light?.palette.primary.main).toBe('#2563eb');
    expect(theme.colorSchemes.dark?.palette.primary.main).toBe('#60a5fa');
  });

  it('alterna o esquema escuro por classe CSS', () => {
    const [selector] = Object.keys(theme.applyStyles('dark', { color: 'white' }));

    expect(selector).toMatch(/\.dark/);
  });

  it('usa a fonte carregada pelo next/font', () => {
    expect(theme.typography.fontFamily).toContain('var(--font-roboto)');
  });
});
