# 0002 — Autenticação e perfis

- **Status:** Aceita
- **Data:** 2026-09-28

## Contexto

O MVP precisa de login e de dois perfis. O admin faz operações que o viewer não
pode, como alterar o cadastro de viewers e bloqueá-los.

## Decisões

1. **Auth.js v5 com provider Credentials** (e-mail + senha).
2. **Perfis como union type:** `type Role = 'admin' | 'viewer'` (sem `enum`).
3. **Sessão via JWT em cookie httpOnly**, com `sessionVersion` do usuário
   embutido no token.
4. **Bloqueio invalida sessões:** ao bloquear, `session_version` é incrementado.
   Todo request autenticado compara a versão do token com a do banco. Se divergir
   ou se o usuário estiver bloqueado, a sessão é rejeitada (401).
   _Implementação (F2): o callback `jwt` também revalida e remove o cookie; ver
   [autenticação](../architeture/autenticacao.md)._
5. **Autorização em duas camadas:**
   - `src/proxy.ts` — checagem otimista: redireciona não autenticados e barra
     `/admin/*` para não-admin.
   - `requireUser()` / `requireRole('admin')` em todo service, action e handler.
6. **Promoção a admin fica fora do MVP.** A mudança de perfil só acontece via
   seed/script. Isso reduz o risco de escalonamento de privilégio.
   _(Proposta, pendente de confirmação do time.)_
7. **Auditoria:** toda ação administrativa gera um registro em `audit_logs`.
8. **Rate limit no login**, em duas chaves:
   - 5 tentativas por e-mail+IP a cada 15 min;
   - 20 tentativas por IP a cada 15 min, independente do e-mail (contra
     credential stuffing);
   - 10 tentativas por e-mail a cada 15 min, de qualquer IP (F2: o IP pode ser
     forjado sem proxy reverso).
     Fica em memória no MVP, o que **exige instância única** do servidor.
9. **Tempo de resposta constante no login:** se o e-mail não existe, o
   `verify` do argon2 roda contra um hash fictício. Isso evita descobrir
   e-mails cadastrados pelo tempo de resposta.
10. **Trocar ou redefinir senha incrementa `session_version`.** No reset feito
    pelo admin, todas as sessões do viewer caem. Na troca da própria senha, a
    sessão atual é reemitida com a nova versão e as demais caem.

## Motivos

- JWT evita consulta a tabela de sessões em todo request, mas sozinho não permite
  revogação. O `sessionVersion` resolve a revogação com uma consulta leve por PK.
- Checar só no proxy é inseguro: server actions e route handlers podem ser
  chamados diretamente.

## Regras de negócio

As regras detalhadas estão em [usuários e perfis](../domains/usuarios-e-perfis.md).
