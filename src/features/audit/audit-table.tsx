import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { formatDateTime } from '@/lib/format';
import type { AuditEntry } from '@/types/users';
import { AUDIT_ACTION_LABEL, auditDetails } from './labels';

/** Log de auditoria: quando, o quê, quem fez, em quem e o detalhe. */
export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <Paper variant="outlined" sx={{ py: 6, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Nenhuma ação administrativa registrada ainda.
        </Typography>
      </Paper>
    );
  }
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="Auditoria">
        <TableHead>
          <TableRow>
            <TableCell>Quando</TableCell>
            <TableCell>Ação</TableCell>
            <TableCell>Por</TableCell>
            <TableCell>Usuário</TableCell>
            <TableCell>Campos alterados</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(entry.createdAt)}</TableCell>
              <TableCell component="th" scope="row">
                {AUDIT_ACTION_LABEL[entry.action]}
              </TableCell>
              <TableCell>{entry.actorName}</TableCell>
              <TableCell>{entry.targetName ?? '—'}</TableCell>
              <TableCell>{auditDetails(entry.metadata)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
