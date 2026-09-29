#!/usr/bin/env bash
# Hook PreToolUse (Bash) do Claude Code: antes de qualquer `git commit`, roda lint e
# testes. Se falharem, sai com código 2, o que bloqueia o commit e devolve o erro ao agente.
# Checa a working tree (não só o que está staged). É rede de segurança, não garantia.
set -uo pipefail

hooks_dir=$(dirname "${BASH_SOURCE[0]}")

# Falha fechada: entrada que não dá para interpretar bloqueia em vez de liberar.
if ! command=$(jq -er '.tool_input.command // ""'); then
  echo "Hook de commit: entrada inválida (JSON esperado); comando bloqueado." >&2
  exit 2
fi

if ! bash "$hooks_dir/is-git-commit.sh" <<<"$command"; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 2

run() {
  local output
  if ! output=$("$@" 2>&1); then
    {
      echo "Commit bloqueado: '$*' falhou. Corrija antes de commitar."
      tail -n 40 <<<"$output"
    } >&2
    exit 2
  fi
}

run yarn -s lint
run yarn -s test:run
exit 0
