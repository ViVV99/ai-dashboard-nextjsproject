'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { DEFAULT_PERIOD_DAYS, periodSchema, periodToSearch } from '@/schemas/period';
import type { Period } from '@/types/period';
import { activePresetId, PERIOD_PRESETS, presetPeriod } from './presets';

type PeriodFilterProps = { period: Period; invalid: boolean };

/** Filtro de período na URL (`?from&to`): atalhos e intervalo personalizado. */
export function PeriodFilter({ period, invalid }: PeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Period>({ resolver: zodResolver(periodSchema), values: period });

  const navigate = (next: Period) => router.push(pathname + periodToSearch(next, searchParams));
  const onPreset = (_: unknown, id: string | null) => {
    const preset = PERIOD_PRESETS.find((item) => item.id === id);
    if (preset) navigate(presetPeriod(preset.days));
  };

  return (
    <Stack spacing={1.5} sx={{ alignItems: { md: 'flex-end' } }}>
      {invalid && (
        <Alert severity="warning">
          O período informado é inválido; mostrando os últimos {DEFAULT_PERIOD_DAYS} dias.
        </Alert>
      )}
      <Stack
        component="form"
        noValidate
        onSubmit={handleSubmit(navigate)}
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'flex-start' } }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={activePresetId(period)}
          onChange={onPreset}
          aria-label="Atalhos de período"
        >
          {PERIOD_PRESETS.map((preset) => (
            <ToggleButton key={preset.id} value={preset.id} sx={{ px: 1.5 }}>
              {preset.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Stack direction="row" spacing={1}>
          <TextField
            {...register('from')}
            label="De"
            type="date"
            size="small"
            error={Boolean(errors.from)}
            helperText={errors.from?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            {...register('to')}
            label="Até"
            type="date"
            size="small"
            error={Boolean(errors.to)}
            helperText={errors.to?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
        <Button type="submit" variant="outlined" sx={{ height: 40 }}>
          Aplicar
        </Button>
      </Stack>
    </Stack>
  );
}
