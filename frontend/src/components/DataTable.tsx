import { useEffect, useState, type ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  emptyText?: string;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyText = '暂无数据',
  pageSize = 10
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(data.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [data.length, page, pageSize]);

  const maxPage = Math.max(1, Math.ceil(data.length / pageSize));
  const start = (page - 1) * pageSize;
  const currentItems = data.slice(start, start + pageSize);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left font-medium text-slate-600 ${column.className ?? ''}`}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              currentItems.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top text-slate-700">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        <span>
          共 {data.length} 条，第 {page} / {maxPage} 页
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page === 1}
          >
            上一页
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(maxPage, prev + 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page === maxPage}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
