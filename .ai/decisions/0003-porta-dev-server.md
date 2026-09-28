# 0003 — Porta do dev server

- **Status:** Aceita
- **Data:** 2026-09-28

## Contexto

O `CLAUDE.md` citava `localhost:5173`, que é a porta padrão do Vite. O projeto
usa Next.js, cuja porta padrão é `3000`.

## Decisão

Usar a porta padrão do Next.js: **`localhost:3000`**. O `CLAUDE.md` foi corrigido.
