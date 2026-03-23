// src/app/dashboard/audit/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { formatDateTime } from '@/lib/utils'
import { Shield, RefreshCw } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId?: string
  createdAt: string
  actor: { name: string; email: string }
  user?: { name: string; email: string }
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-emerald-400 bg-emerald-400/10',
  UPDATE: 'text-blue-400 bg-blue-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
  DEACTIVATE: 'text-orange-400 bg-orange-400/10',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    const res = await fetch(`/api/audit?${params}`)
    const data = await res.json()
    setLogs(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const columns = [
    {
      key: 'actor', header: 'Actor',
      render: (l: AuditLog) => (
        <div>
          <p className="text-sm font-medium text-white">{l.actor?.name}</p>
          <p className="text-xs text-gray-500">{l.actor?.email}</p>
        </div>
      ),
    },
    {
      key: 'action', header: 'Acción',
      render: (l: AuditLog) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ACTION_COLORS[l.action] || 'text-gray-400 bg-gray-400/10'}`}>
          {l.action}
        </span>
      ),
    },
    { key: 'entity', header: 'Entidad', render: (l: AuditLog) => <span className="text-sm text-gray-300">{l.entity}</span> },
    {
      key: 'user', header: 'Afectado',
      render: (l: AuditLog) => l.user
        ? <span className="text-sm text-gray-300">{l.user.name}</span>
        : <span className="text-gray-600">—</span>,
    },
    {
      key: 'createdAt', header: 'Fecha y hora',
      render: (l: AuditLog) => <span className="text-xs font-mono text-gray-400">{formatDateTime(l.createdAt)}</span>,
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Auditoría</h1>
            <p className="text-gray-400 text-sm">{total} eventos registrados</p>
          </div>
        </div>
        <button onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm transition-all">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        emptyMessage="No hay eventos de auditoría"
      />
    </div>
  )
}
