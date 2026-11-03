import type { TrafficSource } from '@/types/domain';

/** Rótulos pt-BR das origens de tráfego (`page_views.source`). */
export const SOURCE_LABEL: Record<TrafficSource, string> = {
  direct: 'Direto',
  organic: 'Busca orgânica',
  social: 'Redes sociais',
  ads: 'Anúncios',
  email: 'E-mail',
};
