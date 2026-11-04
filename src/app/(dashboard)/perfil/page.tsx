import type { Metadata } from 'next';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/page-header';
import { ChangePasswordForm } from '@/features/profile/change-password-form';
import { ProfileNameForm } from '@/features/profile/profile-name-form';
import { ROLE_LABEL } from '@/features/users/labels';
import { requirePageUser } from '@/server/auth';

export const metadata: Metadata = { title: 'Meu perfil' };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      {children}
    </Paper>
  );
}

export default async function ProfilePage({ searchParams }: PageProps<'/perfil'>) {
  const user = await requirePageUser();
  const { senha, v } = await searchParams;
  const changed = senha === 'alterada';

  return (
    <>
      <PageHeader title="Meu perfil" description="Seu nome e sua senha." />
      <Stack spacing={2}>
        <Section
          title="Dados da conta"
          description="O e-mail e o perfil são definidos pelo administrador."
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4 }} sx={{ mb: 3 }}>
            <Typography>
              <Typography component="span" color="text.secondary">
                E-mail:{' '}
              </Typography>
              {user.email}
            </Typography>
            <Typography>
              <Typography component="span" color="text.secondary">
                Perfil:{' '}
              </Typography>
              {ROLE_LABEL[user.role]}
            </Typography>
          </Stack>
          <ProfileNameForm name={user.name} />
        </Section>
        <Section
          title="Senha"
          description="Ao trocar, as sessões abertas em outros dispositivos são encerradas."
        >
          <ChangePasswordForm key={changed ? String(v) : 'form'} changed={changed} />
        </Section>
      </Stack>
    </>
  );
}
