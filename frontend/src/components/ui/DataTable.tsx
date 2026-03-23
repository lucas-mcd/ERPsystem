import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, Edit2, Eye } from 'lucide-react'

export interface Column<T> {
  header: string
  accessor: keyof T | string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T extends { id: number }> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
}

export function DataTable<T extends { id: number }>({
  columns,
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
      <table className="w-full text-sm">
        {/* Header */}
        <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-300"
              >
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete || onView) && (
              <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-300">
                Ações
              </th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {isLoading ? (
            // Loading Skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <tr
                key={i}
                className="border-b border-gray-200 dark:border-slate-700"
              >
                {columns.map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                className="px-6 py-8 text-center text-gray-500 dark:text-slate-400"
              >
                Nenhum registro encontrado
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {columns.map((col, i) => (
                  <td key={i} className="px-6 py-4 text-gray-900 dark:text-slate-300">
                    {col.render ? (
                      col.render(row)
                    ) : (
                      <span>
                        {String(
                          (row as Record<string, any>)[col.accessor as string] || '-'
                        )}
                      </span>
                    )}
                  </td>
                ))}

                {/* Actions */}
                {(onEdit || onDelete || onView) && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Página {pagination.currentPage} de {pagination.totalPages}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                pagination.onPageChange(Math.max(1, pagination.currentPage - 1))
              }
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= pagination.currentPage - 1 &&
                      page <= pagination.currentPage + 1)
                )
                .map((page, i, arr) => (
                  <React.Fragment key={page}>
                    {i > 0 && arr[i - 1] !== page - 1 && (
                      <span className="px-2 text-gray-600 dark:text-slate-400">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => pagination.onPageChange(page)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        pagination.currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <button
              onClick={() =>
                pagination.onPageChange(
                  Math.min(pagination.totalPages, pagination.currentPage + 1)
                )
              }
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
