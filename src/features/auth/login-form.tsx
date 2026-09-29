'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { loginAction } from './actions';

type LoginFormProps = { callbackUrl: string };

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof loginSchema>, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(undefined);
    const result = await loginAction(values, callbackUrl);
    if (result) setServerError(result.error);
  });

  return (
    <Stack component="form" noValidate spacing={2.5} onSubmit={onSubmit}>
      {serverError && <Alert severity="error">{serverError}</Alert>}
      <TextField
        {...register('email')}
        label="E-mail"
        type="email"
        autoComplete="username"
        autoFocus
        fullWidth
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
      />
      <TextField
        {...register('password')}
        label="Senha"
        type="password"
        autoComplete="current-password"
        fullWidth
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
      />
      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </Stack>
  );
}
