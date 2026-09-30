# 0004 — Padrão dos gráficos

- **Status:** Aceita
- **Data:** 2026-09-30

## Contexto

A F5 inaugura os gráficos (MUI X Charts, ver [0001](./0001-stack.md)). F6 e F7 vão repetir
a mesma estrutura, então a moldura, as cores e a acessibilidade precisam de um padrão único.

## Decisão

- **Moldura comum** `ChartCard` (`src/features/sales/chart-card.tsx`): região nomeada pelo título,
  descrição, ações (ex.: alternância), estado vazio e a **tabela equivalente** em `<details>`
  ("Ver dados em tabela"). A tabela é o texto do gráfico para leitores de tela e leitura exata.
- **Série única** usa a cor primária do tema e não tem legenda (o título a nomeia).
- **Categorias** usam a paleta categórica de 8 cores da skill dataviz, validada com
  `validate_palette.js` nas superfícies do tema (claro `#ffffff`, escuro `#111827`), com passos
  próprios no escuro via variáveis CSS (`category-colors.ts`). A cor segue o `categoryId`,
  nunca o ranking, para não repintar ao mudar o filtro.
- No claro, 3 cores ficam abaixo de 3:1 contra o fundo: por isso a legenda da rosca traz nome,
  valor e % em texto, além da tabela.
- Sem eixo duplo: medidas de escalas diferentes viram gráficos separados ou alternância.

## Consequências

- F6/F7 reusam `ChartCard` (mover para `src/components/` quando o 2º uso chegar).
- Mais de 8 categorias exigiria agrupar em "Outras" — hoje o seed tem 6.
