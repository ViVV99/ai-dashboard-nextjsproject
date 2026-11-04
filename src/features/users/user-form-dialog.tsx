'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { z } from 'zod';
import { createUserSchema, updateUserSchema, type CreateUserInput } from '@/schemas/users';
import type { UserSummary } from '@/types/users';
import { createUserAction, updateUserAction } from './actions';
import { ActionDialog } from './action-dialog';

type UserFormDialogProps = {
  open: boolean;
  /** Ausente → criar leitor; presente → editar nome e e-mail. */
  user?: UserSummary;
  onClose: () => void;
  onDone: (message: string) => void;
};

type FormValues = CreateUserInput;

// Na edição a senha não aparece no formulário (fica '') e o schema não a valida.
const editFormSchema = updateUserSchema.extend({ password: z.string() });
const schemaFor = (editing: boolean): z.ZodType<FormValues, FormValues> =>
  editing ? editFormSchema : createUserSchema;

export function UserFormDialog({ open, user, onClose, onDone }: UserFormDialogProps) {
  const editing = Boolean(user);
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schemaFor(editing)),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', password: '' },
  });

  const submit = handleSubmit(async ({ name, email, password }) => {
    const result = user
      ? await updateUserAction({ id: user.id, name, email })
      : await createUserAction({ name, email, password });
    if (result.ok) return onDone(editing ? 'Alterações salvas.' : 'Leitor criado.');
    // Erro de campo aparece só no campo; o alerta fica para erros gerais.
    setError(result.fieldErrors ? undefined : result.error);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setFieldError(field as FieldPath<FormValues>, { message });
    }
  });

  if (!open) return null;
  const field = (name: keyof FormValues) => ({
    ...register(name),
    error: Boolean(errors[name]),
    helperText: errors[name]?.message,
  });

  return (
    <ActionDialog
      title={editing ? `Editar ${user?.name}` : 'Novo leitor'}
      submitLabel={editing ? 'Salvar alterações' : 'Criar leitor'}
      submitting={isSubmitting}
      error={error}
      onClose={onClose}
      onSubmit={submit}
    >
      <TextField {...field('name')} label="Nome" autoComplete="off" autoFocus />
      <TextField {...field('email')} label="E-mail" type="email" autoComplete="off" />
      {!editing && (
        <TextField
          {...field('password')}
          label="Senha inicial"
          type="password"
          autoComplete="new-password"
          helperText={errors.password?.message ?? 'Mínimo de 8 caracteres, com letra e número.'}
        />
      )}
    </ActionDialog>
  );
}
