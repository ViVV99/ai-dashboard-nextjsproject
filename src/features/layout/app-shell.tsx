'use client';

import MenuIcon from '@mui/icons-material/Menu';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState, type ReactNode } from 'react';
import type { Role } from '@/types/domain';
import { NavList } from './nav-list';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const DRAWER_WIDTH = 248;

export type ShellUser = { name: string; email: string; role: Role };

function Brand() {
  return (
    <Toolbar sx={{ gap: 1.25 }}>
      <StorefrontOutlined color="primary" />
      <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700 }}>
        AI Dashboard
      </Typography>
    </Toolbar>
  );
}

function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  return (
    <>
      <Brand />
      <NavList role={role} onNavigate={onNavigate} />
    </>
  );
}

const paperSx = { width: DRAWER_WIDTH, boxSizing: 'border-box' } as const;

/** Casca do dashboard: menu lateral (gaveta no mobile), barra superior e conteúdo. */
export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, width: DRAWER_WIDTH, flexShrink: 0 }}
        slotProps={{ paper: { sx: paperSx } }}
      >
        <Sidebar role={user.role} />
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={close}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ paper: { sx: paperSx } }}
      >
        <Sidebar role={user.role} onNavigate={close} />
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton
              aria-label="Abrir menu"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <ThemeToggle />
              <UserMenu name={user.name} role={user.role} />
            </Stack>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
