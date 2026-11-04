'use client';

import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { PageLinks } from '@/components/page-links';
import type { UserListQuery } from '@/schemas/users';
import type { UserListPage, UserSummary } from '@/types/users';
import { ResetPasswordDialog } from './reset-password-dialog';
import { StatusDialog } from './status-dialog';
import { UserFormDialog } from './user-form-dialog';
import { UsersTable, type UserAction } from './users-table';
import { UsersToolbar } from './users-toolbar';

type Dialog = { type: 'create' } | { type: UserAction; user: UserSummary } | null;

// Só os filtros que mudam a lista vão para a URL da paginação.
const filterParams = ({ q, status }: UserListQuery): Record<string, string> => ({
  ...(q && { q }),
  ...(status !== 'all' && { status }),
});

const countLabel = (total: number) => `${total} ${total === 1 ? 'usuário' : 'usuários'}`;

/** Lista de usuários com filtros, paginação e os diálogos de ação (um aberto por vez). */
export function UsersManager({ list, query }: { list: UserListPage; query: UserListQuery }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState<string>();
  const pages = Math.ceil(list.total / list.pageSize);
  const close = () => setDialog(null);
  const done = (text: string) => {
    setDialog(null);
    setMessage(text);
  };

  return (
    <>
      <UsersToolbar
        q={query.q}
        status={query.status}
        onCreate={() => setDialog({ type: 'create' })}
      />
      <UsersTable users={list.items} onAction={(type, user) => setDialog({ type, user })} />
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {countLabel(list.total)}
        </Typography>
        <PageLinks
          page={list.page}
          pages={pages}
          pathname="/admin/usuarios"
          params={filterParams(query)}
        />
      </Stack>
      {dialog?.type === 'create' && <UserFormDialog open onClose={close} onDone={done} />}
      {dialog?.type === 'edit' && (
        <UserFormDialog open user={dialog.user} onClose={close} onDone={done} />
      )}
      {dialog?.type === 'reset' && (
        <ResetPasswordDialog user={dialog.user} onClose={close} onDone={done} />
      )}
      {dialog?.type === 'status' && (
        <StatusDialog user={dialog.user} onClose={close} onDone={done} />
      )}
      <Snackbar
        open={Boolean(message)}
        message={message}
        autoHideDuration={5000}
        onClose={() => setMessage(undefined)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
