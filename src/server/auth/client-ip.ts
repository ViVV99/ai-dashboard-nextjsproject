/**
 * IP do cliente a partir do `x-forwarded-for`, contando `trustedHops` proxies confiáveis
 * a partir da direita. Valores à esquerda deles podem ter sido forjados pelo cliente.
 */
export function clientIp(headers: Headers, trustedHops: number): string {
  const hops = headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!hops?.length) return 'unknown';
  return hops[Math.max(hops.length - Math.max(trustedHops, 1), 0)] ?? 'unknown';
}
