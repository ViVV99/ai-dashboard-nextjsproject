'use client';

import { createTheme } from '@mui/material/styles';

// Tipa `theme.vars` e `theme.colorSchemes`, já que o tema usa variáveis CSS.
declare module '@mui/material/styles' {
  interface CssThemeVariables {
    enabled: true;
  }
}

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#2563eb' },
        secondary: { main: '#7c3aed' },
        background: { default: '#f5f7fb', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#60a5fa' },
        secondary: { main: '#a78bfa' },
        background: { default: '#0b1120', paper: '#111827' },
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-roboto), system-ui, sans-serif',
  },
  shape: { borderRadius: 10 },
});
