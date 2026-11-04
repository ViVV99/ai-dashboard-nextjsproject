'use client';

import BlockOutlined from '@mui/icons-material/BlockOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import KeyOutlined from '@mui/icons-material/KeyOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { formatDateTime } from '@/lib/format';
import type { UserSummary } from '@/types/users';
import { ROLE_LABEL, STATUS_LABEL } from './labels';

export type UserAction = 'edit' | 'reset' | 'status';

// No celular: nome (com o e-mail embaixo), status e ações, sem rolagem horizontal.
const WIDE_ONLY = { display: { xs: 'none', md: 'table-cell' } } as const;

type UsersTableProps = {
  users: UserSummary[];
  onAction: (action: UserAction, user: UserSummary) => void;
};

function ActionButton(props: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <Tooltip title={props.label}>
      <IconButton size="small" aria-label={props.label} onClick={props.onClick}>
        {props.icon}
      </IconButton>
    </Tooltip>
  );
}

// Admin só gerencia viewers: linhas de admin não têm ações (regra 1).
function RowActions({
  user,
  onAction,
}: {
  user: UserSummary;
  onAction: UsersTableProps['onAction'];
}) {
  if (user.role !== 'viewer') return null;
  const blocked = user.status === 'blocked';
  return (
    <Stack direction="row" spacing={{ xs: 0, md: 0.5 }} sx={{ justifyContent: 'flex-end' }}>
      <ActionButton
        label={`Editar ${user.name}`}
        icon={<EditOutlined fontSize="small" />}
        onClick={() => onAction('edit', user)}
      />
      <ActionButton
        label={`Redefinir senha de ${user.name}`}
        icon={<KeyOutlined fontSize="small" />}
        onClick={() => onAction('reset', user)}
      />
      <ActionButton
        label={`${blocked ? 'Desbloquear' : 'Bloquear'} ${user.name}`}
        icon={blocked ? <LockOpenOutlined fontSize="small" /> : <BlockOutlined fontSize="small" />}
        onClick={() => onAction('status', user)}
      />
    </Stack>
  );
}

export function UsersTable({ users, onAction }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <Paper variant="outlined" sx={{ py: 6, textAlign: 'center' }}>
        <Typography color="text.secondary">Nenhum usuário encontrado com esses filtros.</Typography>
      </Paper>
    );
  }
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="Usuários">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell sx={WIDE_ONLY}>E-mail</TableCell>
            <TableCell sx={WIDE_ONLY}>Perfil</TableCell>
            <TableCell>Status</TableCell>
            <TableCell sx={WIDE_ONLY}>Criado em</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                {user.name}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: { xs: 'block', md: 'none' } }}
                >
                  {user.email}
                </Typography>
              </TableCell>
              <TableCell sx={WIDE_ONLY}>{user.email}</TableCell>
              <TableCell sx={WIDE_ONLY}>{ROLE_LABEL[user.role]}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  variant="outlined"
                  label={STATUS_LABEL[user.status]}
                  color={user.status === 'active' ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell sx={{ ...WIDE_ONLY, whiteSpace: 'nowrap' }}>
                {formatDateTime(user.createdAt)}
              </TableCell>
              <TableCell align="right" sx={{ pl: 0, pr: { xs: 1, md: 2 } }}>
                <RowActions user={user} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
