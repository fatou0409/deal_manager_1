// src/components/DataTablePro.jsx
import React, { useMemo, useState } from "react";

/**
 * Props:
 *  - columns: [{ key, header, render? }]  // même format que ton DataTable actuel
 *  - rows: Array<object>
 *  - pageSizeOptions?: number[]           // défaut [5, 10, 20, 50]
 *  - initialPageSize?: number             // défaut 10
 *  - searchableKeys?: string[]            // si vide => toutes les colonnes affichées
 */
export default function DataTablePro({
  columns = [],
  rows = [],
  pageSizeOptions = [5, 10, 20, 50],
  initialPageSize = 10,
  searchableKeys = [],
}) {
  // UI state
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState({ key: null, dir: "asc" }); // dir: "asc" | "desc"

  // Colonnes “recherchables”
  const searchKeys = useMemo(() => {
    if (searchableKeys.length) return new Set(searchableKeys);
    return new Set(columns.map((c) => c.key).filter(Boolean));
  }, [columns, searchableKeys]);

  // Filtrage
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [...searchKeys].some((k) =>
        String(r[k] ?? "").toLowerCase().includes(s)
      )
    );
  }, [rows, q, searchKeys]);

  // Tri
  const sorted = useMemo(() => {
    const { key, dir } = sort;
    if (!key) return filtered;
    const factor = dir === "asc" ? 1 : -1;
    const isNumberCol = (val) =>
      typeof val === "number" ||
      (!isNaN(parseFloat(val)) && isFinite(val));

    return [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (isNumberCol(av) && isNumberCol(bv)) {
        return (Number(av) - Number(bv)) * factor;
      }
      return String(av ?? "").localeCompare(String(bv ?? "")) * factor;
    });
  }, [filtered, sort]);

  // Pagination
  const total = sorted.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, maxPage);
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  // Handlers
  const onSort = (key) => {
    setPage(1);
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

  // UI helpers
  const sortIcon = (key) => {
    if (sort.key !== key) return (
      <svg className="h-3.5 w-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6-6 6 6" /><path d="M18 15l-6 6-6-6" />
      </svg>
    );
    return sort.dir === "asc" ? (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 15l6-6 6 6" />
      </svg>
    ) : (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" />
      </svg>
    );
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Rechercher…"
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
          />
          <div className="text-xs text-black/60">
            {total} résultat{total > 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-black/60">Lignes / page</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="rounded-xl border border-black/10 bg-white px-2 py-1 outline-none focus:ring-2 focus:ring-orange-600"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-black/70">
              {columns.map((c) => (
                <th
                  key={c.key || c.header}
                  className="py-2 whitespace-nowrap select-none"
                >
                  <button
                    className="inline-flex items-center gap-1 hover:text-black"
                    onClick={() => c.key && onSort(c.key)}
                    title={c.key ? "Trier" : undefined}
                  >
                    <span>{c.header}</span>
                    {c.key ? sortIcon(c.key) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-6 text-center text-black/50"
                >
                  Aucun élément
                </td>
              </tr>
            ) : (
              pageRows.map((r, idx) => (
                <tr key={r.id ?? idx} className="border-t border-black/5">
                  {columns.map((c) => (
                    <td key={c.key || c.header} className="py-2 whitespace-nowrap pr-4">
                      {c.render ? c.render(r) : (r[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-black/60">
          Page {safePage} / {maxPage}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 hover:bg-orange-50 disabled:opacity-50"
            onClick={() => setPage(1)}
            disabled={safePage === 1}
          >
            «
          </button>
          <button
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 hover:bg-orange-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            Préc.
          </button>
          <button
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 hover:bg-orange-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            disabled={safePage === maxPage}
          >
            Suiv.
          </button>
          <button
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 hover:bg-orange-50 disabled:opacity-50"
            onClick={() => setPage(maxPage)}
            disabled={safePage === maxPage}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
