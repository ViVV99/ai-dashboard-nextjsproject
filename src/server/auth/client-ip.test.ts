import { describe, expect, it } from 'vitest';
import { clientIp } from './client-ip';

const headers = (xff?: string) => new Headers(xff ? { 'x-forwarded-for': xff } : {});

describe('clientIp', () => {
  it('com 1 proxy confiável usa o valor mais à direita (o forjado fica à esquerda)', () => {
    expect(clientIp(headers('6.6.6.6, 10.0.0.1'), 1)).toBe('10.0.0.1');
  });

  it('com 2 proxies confiáveis usa o penúltimo valor', () => {
    expect(clientIp(headers('6.6.6.6, 10.0.0.1, 172.16.0.1'), 2)).toBe('10.0.0.1');
  });

  it('com menos valores que proxies usa o mais à esquerda', () => {
    expect(clientIp(headers('10.0.0.1'), 3)).toBe('10.0.0.1');
  });

  it('sem cabeçalho → unknown', () => {
    expect(clientIp(headers(), 1)).toBe('unknown');
  });
});
