'use client';

import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useState } from 'react';
import type { UserListQuery } from '@/schemas/users';
import type { UserListPage, UserSummary } from '@/types/users';
import { ResetPasswordDialog } from './reset-password-dialog';
import { StatusDialog } from './status-dialog';
import { UserFormDialog } from './user-form-dialog';
import { UsersTable, type UserAction } from './users-table';
import { UsersToolbar } from './users-toolbar';

type Dialog = { type: 'create' } | { type: UserAction; user: UserSummary } | null;

const pageHref = ({ q, status }: UserListQuery, page: number) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (status !== 'all') params.set('status', status);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/admin/usuarios?${query}` : '/admin/usuarios';
};

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
        {pages > 1 && (
          <Pagination
            page={list.page}
            count={pages}
            renderItem={(item) => (
              <PaginationItem component={Link} href={pageHref(query, item.page ?? 1)} {...item} />
            )}
          />
        )}
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
