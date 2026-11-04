import type { AuditAction } from '@/types/users';

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  'user.create': 'Criou o leitor',
  'user.update': 'Editou o leitor',
  'user.block': 'Bloqueou o leitor',
  'user.unblock': 'Desbloqueou o leitor',
  'user.reset_password': 'Redefiniu a senha',
};

const FIELD_LABEL: Record<string, string> = { name: 'nome', email: 'e-mail' };

/** Detalhe legível da metadata (hoje só os campos alterados na edição). */
export function auditDetails(metadata: Record<string, unknown> | null): string {
  const changed = metadata?.changed;
  if (!Array.isArray(changed) || changed.length === 0) return '—';
  const text = changed.map((field) => FIELD_LABEL[String(field)] ?? String(field)).join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
