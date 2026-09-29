#!/usr/bin/env bash
# Lê um comando shell no stdin e sai com 0 se ele contém um `git commit`.
# Aceita opções globais antes do subcomando (`git -C "dir x" -c a=b commit`) e `git` após
# `(`, `$(`, aspas, `/` ou separadores. Falso positivo só custa rodar lint e testes.
# Limite conhecido: aliases (`git ci`) e comandos montados dinamicamente não são detectados.

sq="'"
word="(\"[^\"]*\"|${sq}[^${sq}]*${sq}|[^-[:space:]\"${sq}][^[:space:]]*)"
option="-[^[:space:]]+([[:space:]]+${word})?"
pattern="(^|[^[:alnum:]_.-])git([[:space:]]+${option})*[[:space:]]+commit([^[:alnum:]_-]|\$)"

grep -Eq -- "$pattern"
