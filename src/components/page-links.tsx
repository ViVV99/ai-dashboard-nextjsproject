'use client';

import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import Link from 'next/link';

type PageLinksProps = {
  page: number;
  pages: number;
  pathname: string;
  /** Outros parâmetros da URL, preservados em cada link (ex.: busca e filtro). */
  params: Record<string, string>;
};

const hrefFor = (pathname: string, params: Record<string, string>, page: number) => {
  const search = new URLSearchParams(params);
  if (page > 1) search.set('page', String(page));
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
};

const ARIA: Record<string, string> = {
  first: 'Primeira página',
  last: 'Última página',
  next: 'Próxima página',
  previous: 'Página anterior',
};

/** Paginação por links (navegável sem JS, compartilhável); some com uma página só. */
export function PageLinks({ page, pages, pathname, params }: PageLinksProps) {
  if (pages <= 1) return null;
  return (
    <Pagination
      aria-label="Paginação"
      page={page}
      count={pages}
      getItemAriaLabel={(type, item, selected) =>
        type === 'page'
          ? selected
            ? `Página ${item}`
            : `Ir para a página ${item}`
          : (ARIA[type] ?? '')
      }
      renderItem={(item) => (
        <PaginationItem
          component={Link}
          href={hrefFor(pathname, params, item.page ?? 1)}
          {...item}
        />
      )}
    />
  );
}
