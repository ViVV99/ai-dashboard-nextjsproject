#!/usr/bin/env bash
# Hook PreToolUse (Bash) do Claude Code: antes de qualquer `git commit`, roda lint e
# testes. Se falharem, sai com código 2, o que bloqueia o commit e devolve o erro ao agente.
set -uo pipefail

command=$(jq -r '.tool_input.command // ""')

# Detecta `git commit` também em comandos compostos (`cd x && git commit ...`, `git -C dir commit`).
if ! grep -Eq '(^|[;&|[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+commit([[:space:]]|$)' <<<"$command"; then
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
