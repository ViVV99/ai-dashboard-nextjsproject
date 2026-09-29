'use client';

import Logout from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { logoutAction } from '@/features/auth/actions';
import type { Role } from '@/types/domain';

const ROLE_LABELS: Record<Role, string> = { admin: 'Administrador', viewer: 'Leitor' };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

type UserMenuProps = { name: string; role: Role };

export function UserMenu({ name, role }: UserMenuProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: 'primary.main' }}>
        {initials(name)}
      </Avatar>
      <Box sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {ROLE_LABELS[role]}
        </Typography>
      </Box>
      <form action={logoutAction}>
        <Button type="submit" size="small" color="inherit" startIcon={<Logout fontSize="small" />}>
          Sair
        </Button>
      </form>
    </Stack>
  );
}
