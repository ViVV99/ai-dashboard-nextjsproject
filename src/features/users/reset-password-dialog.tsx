'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { resetPasswordSchema, type ResetPasswordInput } from '@/schemas/users';
import type { UserSummary } from '@/types/users';
import { resetPasswordAction } from './actions';
import { ActionDialog } from './action-dialog';

type ResetPasswordDialogProps = {
  user: UserSummary;
  onClose: () => void;
  onDone: (message: string) => void;
};

export function ResetPasswordDialog({ user, onClose, onDone }: ResetPasswordDialogProps) {
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  });

  const submit = handleSubmit(async ({ password }) => {
    const result = await resetPasswordAction({ id: user.id, password });
    if (result.ok) return onDone(`Senha de ${user.name} redefinida.`);
    // Erro de campo aparece só no campo; o alerta fica para erros gerais.
    setError(result.fieldErrors ? undefined : result.error);
    const message = result.fieldErrors?.password;
    if (message) setFieldError('password', { message });
  });

  return (
    <ActionDialog
      title={`Redefinir senha de ${user.name}`}
      submitLabel="Redefinir senha"
      submitting={isSubmitting}
      error={error}
      onClose={onClose}
      onSubmit={submit}
    >
      <Typography color="text.secondary">
        As sessões abertas de {user.name} caem. Passe a nova senha por um canal seguro.
      </Typography>
      <TextField
        {...register('password')}
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        autoFocus
        error={Boolean(errors.password)}
        helperText={errors.password?.message ?? 'Mínimo de 8 caracteres, com letra e número.'}
      />
    </ActionDialog>
  );
}
