// src/app/dashboard/history/page.tsx
'use client'
import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState, useCallback, useRef } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatTime, cn } from '@/lib/utils'
import { AttendanceStatus } from '@prisma/client'
import { Search, Download, User, ShieldCheck, Pencil, Info } from 'lucide-react'
import { useSession } from 'next-auth/react'

const STATUS_OPTIONS = [
  { value: '',         label: 'Todos los estados' },
  { value: 'PRESENT',  label: 'Presente'          },
  { value: 'LATE',     label: 'Retardo'           },
  { value: 'ABSENT',   label: 'Ausente'           },
  { value: 'HALF_DAY', label: 'Medio día'         },
]

// ── Source badge + popover ─────────────────────────────────────────────────────
function SourcePopover({ row }: { row: any }) {
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)
  const { locale }        = useI18n()

  const source   = row.source   || 'USER'
  const markedBy = row.markedBy || null
  const notes    = row.notes    || null

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Source metadata
  const meta: Record<string, { icon: any; label: string; color: string; bg: string; border: string }> = {
    USER: {
      icon:   User,
      label:  locale === 'es' ? 'Marcaje propio' : 'Self check-in',
      color:  'text-gray-400',
      bg:     'bg-gray-500/10',
      border: 'border-gray-600/30',
    },
    ADMIN: {
      icon:   ShieldCheck,
      label:  locale === 'es' ? 'Marcaje manual por admin' : 'Manual by admin',
      color:  'text-blue-400',
      bg:     'bg-blue-500/10',
      border: 'border-blue-500/30',
    },
    EDIT: {
      icon:   Pencil,
      label:  locale === 'es' ? 'Editado por admin' : 'Edited by admin',
      color:  'text-amber-400',
      bg:     'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
  }

  const m = meta[source] ?? meta.USER
  const Icon = m.icon

  // Only show tooltip trigger if there's extra info
  const hasInfo = source !== 'USER' || notes

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {/* Status badge */}
      <StatusBadge status={row.status as AttendanceStatus} />

      {/* Source pill — always visible */}
      {source !== 'USER' && (
        <span className={cn(
          'hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border',
          m.color, m.bg, m.border
        )}>
          <Icon className="w-2.5 h-2.5" />
          {source === 'ADMIN'
            ? (locale === 'es' ? 'Admin' : 'Admin')
            : (locale === 'es' ? 'Editado' : 'Edited')}
        </span>
      )}

      {/* Info trigger — shows when there's notes or non-user source */}
      {hasInfo && (
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'flex items-center justify-center w-5 h-5 rounded-full transition-all',
            open
              ? 'text-white bg-gray-700'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
          )}
        >
          <Info className="w-3 h-3" />
        </button>
      )}

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-8 z-50 w-72 rounded-xl bg-gray-900 border border-gray-700 shadow-2xl shadow-black/60 overflow-hidden">
          {/* Source header */}
          <div className={cn('flex items-center gap-2.5 px-4 py-3 border-b border-gray-800', m.bg)}>
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', m.bg, 'border', m.border)}>
              <Icon className={cn('w-3.5 h-3.5', m.color)} />
            </div>
            <div>
              <p className={cn('text-xs font-semibold', m.color)}>{m.label}</p>
              {markedBy && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {locale === 'es' ? 'Por: ' : 'By: '}<span className="text-gray-300">{markedBy}</span>
                </p>
              )}
            </div>
          </div>

          {/* Notes / reason */}
          {notes ? (
            <div className="px-4 py-3">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                {locale === 'es' ? 'Motivo / Notas' : 'Reason / Notes'}
              </p>
              <p className="text-xs text-gray-300 leading-relaxed">{notes}</p>
            </div>
          ) : (
            <div className="px-4 py-3">
              <p className="text-xs text-gray-600 italic">
                {locale === 'es' ? 'Sin notas adicionales' : 'No additional notes'}
              </p>
            </div>
          )}

          {/* Status row */}
          <div className="px-4 py-2.5 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between">
            <span className="text-[10px] text-gray-500">
              {locale === 'es' ? 'Estado registrado' : 'Recorded status'}
            </span>
            <StatusBadge status={row.status as AttendanceStatus} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { t, locale } = useI18n()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [records, setRecords] = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    search:    '',
    status:    '',
    startDate: '',
    endDate:   '',
  })

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page:  String(page),
      limit: '15',
      ...(filters.search    && { search:    filters.search    }),
      ...(filters.status    && { status:    filters.status    }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate   && { endDate:   filters.endDate   }),
    })
    const res  = await fetch(`/api/attendance?${params}`)
    const data = await res.json()
    setRecords(data.data || [])
    setTotal(data.total  || 0)
    setLoading(false)
  }, [page, filters])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleExport = async () => {
    const params = new URLSearchParams({
      startDate: filters.startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      endDate:   filters.endDate   || new Date().toISOString().split('T')[0],
      format:    'CSV',
    })
    const res  = await fetch(`/api/reports?${params}`)
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `asistencia_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    ...(isAdmin ? [{
      key:    'user',
      header: locale === 'es' ? 'Empleado' : 'Employee',
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium text-white">{row.user?.name}</p>
          <p className="text-xs text-gray-500">{row.user?.department}</p>
        </div>
      ),
    }] : []),
    {
      key:    'date',
      header: locale === 'es' ? 'Fecha' : 'Date',
      render: (row: any) => <span className="text-sm text-gray-300">{formatDate(row.date)}</span>,
    },
    {
      key:    'checkIn',
      header: locale === 'es' ? 'Entrada' : 'Check-in',
      render: (row: any) => (
        <span className={cn('font-mono text-sm', row.checkIn ? 'text-white' : 'text-gray-600')}>
          {row.checkIn ? formatTime(new Date(row.checkIn)) : '--:--'}
        </span>
      ),
    },
    {
      key:    'checkOut',
      header: locale === 'es' ? 'Salida' : 'Check-out',
      render: (row: any) => (
        <span className={cn('font-mono text-sm', row.checkOut ? 'text-white' : 'text-gray-600')}>
          {row.checkOut ? formatTime(new Date(row.checkOut)) : '--:--'}
        </span>
      ),
    },
    {
      key:    'lateMinutes',
      header: locale === 'es' ? 'Retardo' : 'Late',
      render: (row: any) => (
        <span className={cn('text-sm', row.lateMinutes > 0 ? 'text-amber-400' : 'text-gray-500')}>
          {row.lateMinutes > 0 ? `${row.lateMinutes} min` : '—'}
        </span>
      ),
    },
    {
      key:    'status',
      header: locale === 'es' ? 'Estado' : 'Status',
      render: (row: any) => <SourcePopover row={row} />,
    },
  ]

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('history.title')}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {total} {locale === 'es' ? 'registros encontrados' : 'records found'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-all">
            <Download className="w-4 h-4" />
            {t('history.exportCSV')}
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
                placeholder={locale === 'es' ? 'Buscar empleado...' : 'Search employee...'}
                value={filters.search}
                onChange={(e: any) => { setFilters((f: any) => ({ ...f, search: e.target.value })); setPage(1) }}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          <select
            value={filters.status}
            onChange={(e: any) => { setFilters((f: any) => ({ ...f, status: e.target.value })); setPage(1) }}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date" value={filters.startDate}
            onChange={(e: any) => { setFilters((f: any) => ({ ...f, startDate: e.target.value })); setPage(1) }}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="date" value={filters.endDate}
            onChange={(e: any) => { setFilters((f: any) => ({ ...f, endDate: e.target.value })); setPage(1) }}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800 flex-wrap">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            {locale === 'es' ? 'Origen del marcaje:' : 'Check-in source:'}
          </span>
          {[
            { source: 'USER',  icon: User,       color: 'text-gray-400',  label: locale === 'es' ? 'Propio'  : 'Self'    },
            { source: 'ADMIN', icon: ShieldCheck, color: 'text-blue-400',  label: locale === 'es' ? 'Admin'   : 'Admin'   },
            { source: 'EDIT',  icon: Pencil,      color: 'text-amber-400', label: locale === 'es' ? 'Editado' : 'Edited'  },
          ].map(({ source, icon: Icon, color, label }) => (
            <span key={source} className="flex items-center gap-1.5 text-xs text-gray-400">
              <Icon className={cn('w-3 h-3', color)} />{label}
            </span>
          ))}
          <span className="text-[10px] text-gray-600 ml-auto">
            {locale === 'es'
              ? '— Haz clic en ⓘ para ver detalles del marcaje'
              : '— Click ⓘ to see check-in details'}
          </span>
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
        emptyMessage={t('history.noRecords')}
      />
    </div>
  )
}
