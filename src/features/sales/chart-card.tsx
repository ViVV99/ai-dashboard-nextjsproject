import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useId, type ReactNode } from 'react';

export type ChartTable = { columns: string[]; rows: string[][] };

type ChartCardProps = {
  title: string;
  description: string;
  /** Mesmos dados do gráfico em texto (acessibilidade e leitura precisa). */
  table: ChartTable;
  /** Mensagem do estado vazio; quando presente, substitui gráfico e tabela. */
  empty?: string;
  actions?: ReactNode;
  children: ReactNode;
};

function DataTable({ title, table }: { title: string; table: ChartTable }) {
  return (
    <Box
      component="details"
      sx={{ mt: 1, '& summary': { cursor: 'pointer', typography: 'body2' } }}
    >
      <summary>Ver dados em tabela</summary>
      <Table size="small" aria-label={title} sx={{ mt: 1 }}>
        <TableHead>
          <TableRow>
            {table.columns.map((column, index) => (
              <TableCell key={column} align={index === 0 ? 'left' : 'right'}>
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {table.rows.map((row) => (
            <TableRow key={row[0]}>
              {row.map((cell, index) => (
                <TableCell key={index} align={index === 0 ? 'left' : 'right'}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

/** Moldura dos gráficos: título, descrição, ações, estado vazio e tabela equivalente. */
export function ChartCard({ title, description, table, empty, actions, children }: ChartCardProps) {
  const id = useId();
  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      sx={{ p: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: 1 }}
      >
        <Box>
          <Typography id={`${id}-title`} variant="h6" component="h2">
            {title}
          </Typography>
          <Typography id={`${id}-description`} variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        {!empty && actions}
      </Stack>
      {empty ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          {empty}
        </Typography>
      ) : (
        <>
          {children}
          <DataTable title={title} table={table} />
        </>
      )}
    </Paper>
  );
}
