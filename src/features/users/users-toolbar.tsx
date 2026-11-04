'use client';

import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { UserListQuery } from '@/schemas/users';

const STATUS_OPTIONS: { value: UserListQuery['status']; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'blocked', label: 'Bloqueados' },
];

type UsersToolbarProps = Pick<UserListQuery, 'q' | 'status'> & { onCreate: () => void };

/** Busca e filtro de status na URL (sempre voltando à página 1) e o botão de criar. */
export function UsersToolbar({ q, status, onCreate }: UsersToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(q);
  const [filter, setFilter] = useState(status);

  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (filter !== 'all') params.set('status', filter);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}
    >
      <Stack
        component="form"
        role="search"
        onSubmit={apply}
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
      >
        <TextField
          size="small"
          label="Buscar por nome ou e-mail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: { sm: 280 } }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={filter}
          onChange={(event) => setFilter(event.target.value as UserListQuery['status'])}
          sx={{ minWidth: 150 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="outlined">
          Filtrar
        </Button>
      </Stack>
      <Button variant="contained" startIcon={<PersonAddOutlined />} onClick={onCreate}>
        Novo leitor
      </Button>
    </Stack>
  );
}
