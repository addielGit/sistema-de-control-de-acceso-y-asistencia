// src/components/ui/DataTable.tsx
'use client'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  total?: number
  page?: number
  limit?: number
  onPageChange?: (page: number) => void
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  columns, data, loading = false, total = 0, page = 1, limit = 20,
  onPageChange, emptyMessage = 'No hay datos disponibles'
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {columns.map(col => (
                <th key={col.key} className={cn('px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Cargando...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-gray-800/30 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className={cn('px-5 py-4 text-sm', col.className)}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Mostrando {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex items-center gap-1">
            {[
              { icon: ChevronsLeft, action: () => onPageChange(1), disabled: page === 1 },
              { icon: ChevronLeft, action: () => onPageChange(page - 1), disabled: page === 1 },
              { icon: ChevronRight, action: () => onPageChange(page + 1), disabled: page === totalPages },
              { icon: ChevronsRight, action: () => onPageChange(totalPages), disabled: page === totalPages },
            ].map(({ icon: Icon, action, disabled }, i) => (
              <button key={i} onClick={action} disabled={disabled}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed">
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
