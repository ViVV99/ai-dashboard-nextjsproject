// Paleta categórica (skill dataviz, validada com validate_palette.js nas superfícies do tema:
// claro #ffffff, escuro #111827). A cor segue a categoria (ordem do id), nunca o ranking.
// No claro, 3 slots ficam abaixo de 3:1: por isso a legenda traz valores e há tabela.

const LIGHT = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
];
const DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
];

const slot = (categoryId: number) => (categoryId - 1) % LIGHT.length;

/** Variável CSS da cor da categoria (resolvida no tema claro ou escuro). */
export const categoryColor = (categoryId: number) => `var(--category-${slot(categoryId)})`;

const vars = (palette: string[]) =>
  Object.fromEntries(palette.map((color, index) => [`--category-${index}`, color]));

/** Declarações das variáveis para o `sx` do contêiner do gráfico. */
export const categoryColorVars = { light: vars(LIGHT), dark: vars(DARK) };
