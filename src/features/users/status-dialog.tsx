'use client';

import Typography from '@mui/material/Typography';
import { useState, useTransition } from 'react';
import type { UserSummary } from '@/types/users';
import { setUserStatusAction } from './actions';
import { ActionDialog } from './action-dialog';

type StatusDialogProps = {
  user: UserSummary;
  onClose: () => void;
  onDone: (message: string) => void;
};

/** Confirmação de bloqueio (com o efeito explicado) ou de desbloqueio. */
export function StatusDialog({ user, onClose, onDone }: StatusDialogProps) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const blocking = user.status === 'active';

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await setUserStatusAction({
        id: user.id,
        status: blocking ? 'blocked' : 'active',
      });
      if (!result.ok) return setError(result.error);
      onDone(blocking ? `Acesso de ${user.name} bloqueado.` : `Acesso de ${user.name} liberado.`);
    });
  };

  return (
    <ActionDialog
      title={`${blocking ? 'Bloquear' : 'Desbloquear'} ${user.name}?`}
      submitLabel={blocking ? 'Bloquear' : 'Desbloquear'}
      submitting={pending}
      error={error}
      danger={blocking}
      onClose={onClose}
      onSubmit={submit}
    >
      <Typography>
        {blocking
          ? `${user.name} perde o acesso agora: as sessões abertas caem e o login fica bloqueado até você desbloquear.`
          : `${user.name} volta a entrar com a senha atual.`}
      </Typography>
    </ActionDialog>
  );
}
