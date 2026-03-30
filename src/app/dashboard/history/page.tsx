// src/app/dashboard/history/page.tsx
'use client'
import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatTime, exportToCSV, cn } from '@/lib/utils'
import { AttendanceStatus } from '@prisma/client'
import { Search, Filter, Download, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PRESENT', label: 'Presente' },
  { value: 'LATE', label: 'Retardo' },
  { value: 'ABSENT', label: 'Ausente' },
  { value: 'HALF_DAY', label: 'Medio día' },
]

export default function HistoryPage() {
  const { t } = useI18n()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
  })

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: '15',
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    })
    const res = await fetch(`/api/attendance?${params}`)
    const data = await res.json()
    setRecords(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, filters])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleExport = async () => {
    const params = new URLSearchParams({
      startDate: filters.startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      endDate: filters.endDate || new Date().toISOString().split('T')[0],
      format: 'CSV',
    })
    const res = await fetch(`/api/reports?${params}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asistencia_${Date.now()}.csv`
    a.click()
  }

  const columns = [
    ...(isAdmin ? [{
      key: 'user',
      header: 'Empleado',
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium text-white">{row.user?.name}</p>
          <p className="text-xs text-gray-500">{row.user?.department}</p>
        </div>
      ),
    }] : []),
    {
      key: 'date',
      header: 'Fecha',
      render: (row: any) => <span className="text-sm text-gray-300">{formatDate(row.date)}</span>,
    },
    {
      key: 'checkIn',
      header: 'Entrada',
      render: (row: any) => (
        <span className={cn('font-mono text-sm', row.checkIn ? 'text-white' : 'text-gray-600')}>
          {row.checkIn ? formatTime(new Date(row.checkIn)) : '--:--'}
        </span>
      ),
    },
    {
      key: 'checkOut',
      header: 'Salida',
      render: (row: any) => (
        <span className={cn('font-mono text-sm', row.checkOut ? 'text-white' : 'text-gray-600')}>
          {row.checkOut ? formatTime(new Date(row.checkOut)) : '--:--'}
        </span>
      ),
    },
    {
      key: 'lateMinutes',
      header: 'Retardo',
      render: (row: any) => (
        <span className={cn('text-sm', row.lateMinutes > 0 ? 'text-amber-400' : 'text-gray-500')}>
          {row.lateMinutes > 0 ? `${row.lateMinutes} min` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: any) => <StatusBadge status={row.status as AttendanceStatus} />,
    },
  ]

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('history.title')}</h1>
          <p className="text-gray-400 text-sm mt-1">{total} registros encontrados</p>
        </div>
        {isAdmin && (
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-all">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isAdmin && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={filters.search}
                onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          <select
            value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1) }}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="date" value={filters.startDate}
            onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1) }}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input type="date" value={filters.endDate}
            onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1) }}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        total={total}
        page={page}
        limit={15}
        onPageChange={setPage}
        emptyMessage={t("history.noRecords")}
      />
    </div>
  )
}
