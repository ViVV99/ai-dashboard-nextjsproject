import { defaultPeriod, periodSchema } from '@/schemas/period';
import type { Period } from '@/types/period';
import { requireUser } from '../auth';
import {
  errorResponse,
  jsonResponse,
  toErrorResponse,
  zodDetails,
  type ErrorDetail,
} from './responses';

type PeriodQuery = { ok: true; period: Period } | { ok: false; details: ErrorDetail[] };

const FIELDS = ['from', 'to'] as const;

/**
 * `from`/`to` da query com o mesmo schema das páginas. Sem nenhum dos dois → padrão de 30 dias;
 * parâmetro repetido é inválido (não escolhemos um dos valores por conta própria).
 */
export function parsePeriodQuery(params: URLSearchParams): PeriodQuery {
  if (FIELDS.every((field) => !params.has(field))) return { ok: true, period: defaultPeriod() };

  const repeated = FIELDS.filter((field) => params.getAll(field).length > 1);
  if (repeated.length > 0) {
    return {
      ok: false,
      details: repeated.map((field) => ({ field, message: 'Informe um único valor.' })),
    };
  }

  // Ausente vira '' para cair na mensagem "Informe uma data válida." do schema.
  const parsed = periodSchema.safeParse({
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  });
  if (parsed.success) return { ok: true, period: parsed.data };
  return { ok: false, details: zodDetails(parsed.error) };
}

/**
 * GET de métricas: autentica antes de validar (sem sessão → 401 mesmo com query inválida),
 * valida o período e chama a fachada, que revalida a sessão (defesa em profundidade).
 */
export function metricsHandler<T>(load: (period: Period) => Promise<T>) {
  return async function GET(request: Request): Promise<Response> {
    try {
      await requireUser();
      const query = parsePeriodQuery(new URL(request.url).searchParams);
      if (!query.ok) {
        return errorResponse(400, 'invalid_request', 'Parâmetros inválidos.', query.details);
      }
      return jsonResponse(await load(query.period));
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
