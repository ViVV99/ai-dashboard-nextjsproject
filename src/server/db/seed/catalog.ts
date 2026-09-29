// Catálogo fictício da loja usado pelo seed. Preços em centavos.

export type CatalogProduct = { name: string; priceCents: number };

export const CATALOG: Record<string, readonly CatalogProduct[]> = {
  Eletrônicos: [
    { name: 'Fone Bluetooth', priceCents: 24_990 },
    { name: 'Caixa de Som Portátil', priceCents: 32_990 },
    { name: 'Smartwatch', priceCents: 89_900 },
    { name: 'Carregador Turbo', priceCents: 7_990 },
    { name: 'Power Bank 20000mAh', priceCents: 15_990 },
  ],
  Informática: [
    { name: 'Mouse Sem Fio', priceCents: 8_990 },
    { name: 'Teclado Mecânico', priceCents: 34_990 },
    { name: 'Monitor 27"', priceCents: 149_900 },
    { name: 'Webcam Full HD', priceCents: 22_990 },
    { name: 'SSD 1TB', priceCents: 44_990 },
  ],
  Casa: [
    { name: 'Luminária LED', priceCents: 12_990 },
    { name: 'Jogo de Toalhas', priceCents: 9_990 },
    { name: 'Organizador de Gavetas', priceCents: 4_990 },
    { name: 'Cafeteira Elétrica', priceCents: 27_990 },
  ],
  Esportes: [
    { name: 'Garrafa Térmica', priceCents: 6_990 },
    { name: 'Tapete de Yoga', priceCents: 11_990 },
    { name: 'Halteres 5kg (par)', priceCents: 18_990 },
    { name: 'Corda de Pular', priceCents: 3_990 },
  ],
  Moda: [
    { name: 'Mochila Urbana', priceCents: 19_990 },
    { name: 'Boné Clássico', priceCents: 5_990 },
    { name: 'Óculos de Sol', priceCents: 14_990 },
    { name: 'Carteira de Couro', priceCents: 9_990 },
  ],
  Livros: [
    { name: 'Clean Code', priceCents: 8_990 },
    { name: 'O Programador Pragmático', priceCents: 9_490 },
    { name: 'Design de Interfaces', priceCents: 7_990 },
  ],
};

export const SUPPLIERS = [
  'Distribuidora Alfa',
  'Atacado Beta',
  'Importadora Gama',
  'Fornecedor Delta',
] as const;

export const FIRST_NAMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Eduarda',
  'Felipe',
  'Gabriela',
  'Henrique',
  'Isabela',
  'João',
  'Larissa',
  'Marcos',
  'Natália',
  'Otávio',
  'Paula',
  'Rafael',
] as const;

export const LAST_NAMES = [
  'Silva',
  'Souza',
  'Oliveira',
  'Santos',
  'Lima',
  'Pereira',
  'Costa',
  'Almeida',
] as const;

export const CITIES = [
  'São Paulo',
  'Rio de Janeiro',
  'Belo Horizonte',
  'Curitiba',
  'Porto Alegre',
  'Salvador',
  'Recife',
  'Fortaleza',
  'Brasília',
  'Florianópolis',
] as const;

export const STATIC_PAGES = ['/', '/produtos', '/carrinho', '/checkout', '/sobre'] as const;
