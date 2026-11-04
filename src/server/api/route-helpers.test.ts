import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AuthError } from '../auth/errors';
import { apiRoute, parseId, parseQuery, readBody } from './route-helpers';
import { jsonResponse } from './responses';

const m = vi.hoisted(() => ({ requireUser: vi.fn(), requireRole: vi.fn() }));
vi.mock('../auth', () => ({ requireUser: m.requireUser, requireRole: m.requireRole }));

const schema = z.object({ name: z.string().min(2) });
const post = (body: string) =>
  new Request('http://localhost/api/x', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  });

beforeEach(() => {
  vi.clearAllMocks();
  m.requireUser.mockResolvedValue({ id: 3 });
  m.requireRole.mockResolvedValue({ id: 1 });
});

describe('apiRoute', () => {
  it('admin: exige o perfil antes de rodar o handler (403 sem executar)', async () => {
    m.requireRole.mockRejectedValue(new AuthError('forbidden'));
    const handle = vi.fn();

    const response = await apiRoute('admin', handle)(post('{lixo'), {});

    expect(response.status).toBe(403);
    expect(m.requireRole).toHaveBeenCalledWith('admin');
    expect(handle).not.toHaveBeenCalled();
  });

  it('user: exige sessão; erros do handler viram a resposta padronizada', async () => {
    const route = apiRoute('user', async (request) =>
      jsonResponse(await readBody(request, schema)),
    );

    expect((await route(post('{"name":"Bia"}'), {})).status).toBe(200);
    expect((await route(post('{"name":"B"}'), {})).status).toBe(400);
    expect(m.requireUser).toHaveBeenCalled();
  });
});

describe('readBody', () => {
  it('devolve o corpo validado', async () => {
    await expect(readBody(post('{"name":"Bia","extra":1}'), schema)).resolves.toEqual({
      name: 'Bia',
    });
  });

  it.each([
    ['JSON quebrado', '{lixo', '_root'],
    ['schema inválido', '{"name":"B"}', 'name'],
  ])('%s → InvalidRequestError no campo', async (_, body, field) => {
    await expect(readBody(post(body), schema)).rejects.toMatchObject({
      details: [expect.objectContaining({ field })],
    });
  });
});

describe('parseQuery', () => {
  const query = z.object({ q: z.string().default(''), page: z.coerce.number().default(1) });

  it('lê a query com o schema', () => {
    expect(parseQuery(new URLSearchParams('q=ana&page=2'), query)).toEqual({ q: 'ana', page: 2 });
  });

  it('parâmetro repetido é inválido', () => {
    expect(() => parseQuery(new URLSearchParams('q=a&q=b'), query)).toThrow(
      expect.objectContaining({ details: [{ field: 'q', message: 'Informe um único valor.' }] }),
    );
  });
});

describe('parseId', () => {
  it('aceita inteiro positivo', () => {
    expect(parseId('42')).toBe(42);
  });

  it.each(['0', '-1', '1.5', 'abc', '1e3', ''])('%j → 404 not_found', (raw) => {
    expect(() => parseId(raw)).toThrow(expect.objectContaining({ status: 404 }));
  });
});
