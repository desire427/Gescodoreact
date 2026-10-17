import { useEffect, useMemo, useState } from 'react';

export function usePagination(items, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  useEffect(() => {
    setPage(1);
  }, [total, pageSize]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    pageItems,
    page: currentPage,
    pageCount,
    pageSize,
    setPage: nextPage => setPage(Math.max(1, Math.min(pageCount, nextPage))),
    setPageSize: nextSize => { setPage(1); setPageSize(Number(nextSize)); },
    start: total ? (currentPage - 1) * pageSize + 1 : 0,
    end: Math.min(currentPage * pageSize, total),
    total,
  };
}

export default function Pagination({ pagination, label }) {
  const { page, pageCount, pageSize, setPage, setPageSize, start, end, total } = pagination;
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter(number => number >= 1 && number <= pageCount)
    .sort((a, b) => a - b);

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 border-t border-fog pt-4">
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate">
        <span>Affichage {start}–{end} sur {total} {label}</span>
        <label className="flex items-center gap-2">
          <span>Par page</span>
          <select aria-label="Nombre d’éléments par page" value={pageSize} onChange={event => setPageSize(event.target.value)} className="h-8 rounded-lg border border-fog bg-white px-2 text-[11px] font-semibold text-ink focus:outline-none focus:border-ink">
            {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button type="button" aria-label="Page précédente" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-fog text-slate transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">‹</button>
        {pages.map((number, index) => (
          <span key={number} className="contents">
            {index > 0 && number - pages[index - 1] > 1 && <span className="px-1 text-slate" aria-hidden="true">…</span>}
            <button type="button" aria-current={number === page ? 'page' : undefined} onClick={() => setPage(number)} className={`h-8 min-w-8 rounded-lg px-2 text-[11px] font-bold transition-colors ${number === page ? 'bg-ink text-white' : 'border border-fog text-slate hover:border-ink hover:text-ink'}`}>{number}</button>
          </span>
        ))}
        <button type="button" aria-label="Page suivante" disabled={page >= pageCount} onClick={() => setPage(page + 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-fog text-slate transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">›</button>
      </nav>
    </section>
  );
}
