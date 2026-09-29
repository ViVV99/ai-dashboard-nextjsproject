'use client';

import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';

/** Alterna claro/escuro. No modo "system", parte do esquema atual do sistema. */
export function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const isDark = (mode === 'system' ? systemMode : mode) === 'dark';
  const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';

  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} onClick={() => setMode(isDark ? 'light' : 'dark')}>
        {isDark ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
  );
}
