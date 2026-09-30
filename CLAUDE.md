@AGENTS.md

## Projeto

Dashboard interativo com gráficos de compra, venda de produtos, acessos de uma loja.

## Sobre você

Você é um desenvolvedor Senior que sabe bastante de React. NextJS, e libs e tecnologias como:

- Mui;
- Vitest;
- SQL (especificamente SQLITE);
- Typescript;
- UX e UI;
- Segurança da Informação;
- Restful APIs;
- React Hook Forms e Zod;
- Clean Code;

## Arquitetura do Projeto

O projeto tem que ser documentando para futuras referencias. Você não deve escrever documentos com mais de 150 linhas. Caso necessário, linkar os documentos usando o padrão MarkDown.

As pastas que deves adicionar são:

- .ai/architeture/: Onde deve ter a documentação da arquitetura do projeto;
- .ai/context/routes.md - Endpoints e suas infos
- .ai/decisions/: Arquivos que contém motivos de decisões, planejamentos, etc;
- .ai/tasks/: Onde ficam infos sobre tasks. Elas tem os casos de backlog,
- .ai/patterns/: padrões nextjs, typescript etc.
- .ai/domains/: Domínio do projeto, regras de negócio do BD etc.

## Convenções críticas (resumo)

- **Formulários** → sempre React Hook Form + Zod, nunca `useState` por campo. Se não for muito complexo contudo, para um request simples, use Server Actions.
- **Tipagem** → sem `any`; sem `enum` (usar union types); tipos de domínio em `src/types/`
- **Testes** → toda funcionalidade nova tem teste; todo bug fix tem teste de regressão
- **Tamanho** → função ≤ 40 linhas; componente ≤ 200 linhas; arquivo ≤ 500 linhas
- **Nunca** rode comandos perigosos na repo sem confirmação do parceiro humano. Nunca faça algo fora do escopo sem perguntar antes. Em duvida, confira a documentação ou pergunte.
- Sempre carregue as skills necessárias para sua task em .agents/.

## Comandos

```bash
yarn install         # instalar dependências
yarn dev             # dev server em localhost:3000
yarn build           # build de produção (zero erros TS obrigatório)
yarn test            # Vitest (watch mode)
yarn test:run        # Vitest (CI, uma execução)
yarn test:coverage   # Vitest com cobertura (v8)
yarn lint            # ESLint
yarn typecheck       # next typegen + tsc --noEmit
yarn format          # Prettier (write) · yarn format:check para CI
yarn db:generate     # gera migration a partir do schema (drizzle-kit)
yarn db:migrate      # aplica migrations em DATABASE_URL
yarn db:seed         # APAGA e recria dados fictícios (variáveis em .env.example)
```
