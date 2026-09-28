# Usuários, perfis e permissões

Decisão técnica: [0002 — Autenticação e perfis](../decisions/0002-auth-e-perfis.md)

## Perfis

```ts
type Role = 'admin' | 'viewer';
type UserStatus = 'active' | 'blocked';
```

## Matriz de permissões

| Ação                                                   | viewer |      admin       |
| ------------------------------------------------------ | :----: | :--------------: |
| Ver dashboards (visão geral, vendas, compras, acessos) |   ✅   |        ✅        |
| Editar o próprio perfil (nome, senha)                  |   ✅   |        ✅        |
| Listar usuários                                        |   ❌   |        ✅        |
| Criar viewer                                           |   ❌   |        ✅        |
| Editar cadastro de viewer (nome, e-mail)               |   ❌   |        ✅        |
| Bloquear / desbloquear viewer                          |   ❌   |        ✅        |
| Redefinir senha de viewer                              |   ❌   |        ✅        |
| Ver log de auditoria                                   |   ❌   |        ✅        |
| Promover viewer a admin                                |   ❌   | ❌ (fora do MVP) |

## Regras de negócio

1. **O admin só gerencia viewers.** Ele não edita, bloqueia nem redefine a senha
   de outro admin.
2. **O admin não pode bloquear a si mesmo.**
3. **Sempre existe pelo menos um admin ativo.** O primeiro é criado pelo seed.
4. **Usuário bloqueado:**
   - não consegue fazer login (mensagem genérica "credenciais inválidas");
   - tem as sessões ativas invalidadas (incremento de `session_version`);
   - recebe **401** em qualquer request autenticado.
5. **Redefinir senha (admin) ou trocar a própria senha** incrementa `session_version`.
   No reset, o usuário é deslogado; na troca própria, só as outras sessões caem.
6. **O e-mail é único** e normalizado (trim + minúsculas).
7. **Senha:** mínimo de 8 caracteres, com letra e número (schema Zod compartilhado).
8. **Toda ação administrativa gera um registro em `audit_logs`**, sem senha ou hash.
9. **Não existe exclusão física de usuários no MVP.** Bloquear cumpre esse papel
   e preserva a auditoria.

## Respostas HTTP

| Situação                                              | Status |
| ----------------------------------------------------- | ------ |
| Sem sessão / sessão inválida / usuário bloqueado      | 401    |
| Autenticado, mas sem permissão (viewer em rota admin) | 403    |
| Violação de regra (ex.: bloquear a si mesmo)          | 422    |
| E-mail já cadastrado                                  | 409    |
