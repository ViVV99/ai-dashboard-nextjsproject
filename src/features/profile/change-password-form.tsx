'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { changePasswordSchema, type ChangePasswordInput } from '@/schemas/users';
import { changePasswordAction } from './actions';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };
const SUCCESS =
  'Senha alterada. Você continua conectado aqui; nos outros dispositivos, entre de novo.';

/** `changed`: a página voltou do redirect da troca (`?senha=alterada`). */
export function ChangePasswordForm({ changed = false }: { changed?: boolean }) {
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | undefined>(
    changed ? { ok: true, text: SUCCESS } : undefined,
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  const submit = handleSubmit(async (values) => {
    setFeedback(undefined);
    // Em sucesso a action redireciona (não volta aqui); o aviso vem pela prop `changed`.
    const result = await changePasswordAction(values);
    if (result.ok) return reset(EMPTY);
    const fields = Object.entries(result.fieldErrors ?? {});
    for (const [field, message] of fields) {
      setError(field as FieldPath<ChangePasswordInput>, { message });
    }
    if (fields.length === 0) setFeedback({ ok: false, text: result.error });
  });

  const field = (name: keyof ChangePasswordInput, label: string, autoComplete: string) => (
    <TextField
      {...register(name)}
      label={label}
      type="password"
      autoComplete={autoComplete}
      error={Boolean(errors[name])}
      helperText={errors[name]?.message}
    />
  );

  return (
    <Stack component="form" noValidate onSubmit={submit} spacing={2} sx={{ maxWidth: 420 }}>
      {feedback && (
        <Alert severity={feedback.ok ? 'success' : 'error'} role={feedback.ok ? 'status' : 'alert'}>
          {feedback.text}
        </Alert>
      )}
      {field('currentPassword', 'Senha atual', 'current-password')}
      {field('newPassword', 'Nova senha', 'new-password')}
      {field('confirmPassword', 'Confirme a nova senha', 'new-password')}
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        sx={{ alignSelf: 'flex-start' }}
      >
        Trocar senha
      </Button>
    </Stack>
  );
}
