# Métricas do dashboard

Definições oficiais das métricas. Todas respeitam o período filtrado
(`from` e `to` inclusivos, como datas do fuso **America/Sao_Paulo**). Schema: [schema](./schema.md)

## Regras gerais

- Só pedidos com `status = 'paid'` contam como venda.
- Valores em centavos no banco; formatação em BRL só na UI.
- **Fuso horário:** o banco guarda UTC, mas o agrupamento por dia/semana/mês e os
  limites do filtro usam `America/Sao_Paulo`. Em UTC, uma venda às 22h (BRT)
  cairia no dia seguinte.
- **Divisão por zero:** qualquer razão com denominador 0 (ticket médio, conversão,
  margem) retorna `null` e a UI exibe "—".
- **Variação vs. período anterior:** compara com o intervalo de mesma duração
  imediatamente anterior. Ex.: 01–30/09 é comparado com 02–31/08.
  Se o valor anterior for 0, a variação é exibida como "—" (não ∞).
- **Granularidade automática:** até 31 dias → dia; até 180 dias → semana;
  acima disso → mês.

## Visão geral (KPIs)

| KPI               | Fórmula                                     |
| ----------------- | ------------------------------------------- |
| Receita           | `SUM(orders.total_cents)` dos pedidos pagos |
| Pedidos           | `COUNT(orders)` pagos                       |
| Ticket médio      | Receita ÷ Pedidos                           |
| Acessos           | `COUNT(page_views)`                         |
| Visitantes únicos | `COUNT(DISTINCT page_views.session_id)`     |
| Taxa de conversão | Pedidos ÷ Visitantes únicos (aproximação)   |

> A conversão é uma **aproximação**: `orders` e `page_views` não estão ligados
> por sessão, então não é possível saber quais visitantes compraram.

**Implementação (F4):** `getOverviewMetrics` em `src/server/services/metrics/overview.ts`.
Período local → intervalo UTC `[from 03:00Z, to+1 03:00Z)` (`toUtcRange`); uma varredura por
tabela cobre atual + anterior com agregação condicional. Fórmulas em `src/lib/kpi-math.ts`.

## Vendas

- Receita ao longo do tempo (linha)
- Top 10 produtos por receita e por quantidade (barras)
- Receita por categoria (pizza/rosca)

**Implementação (F5):** `getSalesMetrics` em `src/server/services/metrics/sales.ts`. Buckets no fuso
da loja via `date(created_at, '-3 hours', …)`; semana de segunda a domingo (chave = segunda, mesmo
antes de `from`); mês com chave no dia 1; buckets sem venda com 0 (`src/lib/granularity.ts`).
Receita de produto/categoria = `SUM(quantity * unit_price_cents)` dos itens de pedidos pagos.
Top 10 com desempate por nome. 366 dias no banco do seed ≈ 60 ms. Gráficos: [0004](../decisions/0004-graficos.md).

## Compras

- Custo de compras ao longo do tempo: `SUM(quantity * unit_cost_cents)`
- Receita × custo das mercadorias vendidas (linhas sobrepostas)
- Margem bruta: `(receita − custo dos itens vendidos) ÷ receita`, onde o custo dos
  itens vendidos é `SUM(order_items.quantity * products.cost_cents)`

## Acessos

- Acessos e visitantes únicos por período (linha/área)
- Páginas mais vistas (top 10)
- Acessos por origem (`source`)
