'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { profileNameSchema, type ProfileNameInput } from '@/schemas/users';
import { updateNameAction } from './actions';

export function ProfileNameForm({ name }: { name: string }) {
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string }>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileNameInput>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: { name },
  });

  const submit = handleSubmit(async (values) => {
    setFeedback(undefined);
    const result = await updateNameAction(values);
    if (result.ok) return setFeedback({ ok: true, text: 'Nome atualizado.' });
    const message = result.fieldErrors?.name;
    if (message) return setError('name', { message });
    setFeedback({ ok: false, text: result.error });
  });

  return (
    <Stack component="form" noValidate onSubmit={submit} spacing={2} sx={{ maxWidth: 420 }}>
      {feedback && (
        <Alert severity={feedback.ok ? 'success' : 'error'} role={feedback.ok ? 'status' : 'alert'}>
          {feedback.text}
        </Alert>
      )}
      <TextField
        {...register('name')}
        label="Nome"
        autoComplete="name"
        error={Boolean(errors.name)}
        helperText={errors.name?.message}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        sx={{ alignSelf: 'flex-start' }}
      >
        Salvar nome
      </Button>
    </Stack>
  );
}
