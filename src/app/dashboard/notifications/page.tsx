// src/app/dashboard/notifications/page.tsx
'use client'
import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Bell, Check, CheckCheck, Trash2, Loader2,
  Info, AlertTriangle, CheckCircle, XCircle,
  Filter, RefreshCw, BellOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

type NotifType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
type FilterType = 'ALL' | 'UNREAD' | 'READ'

interface Notif {
  id: string
  title: string
  message: string
  type: NotifType
  isRead: boolean
  createdAt: string
}

const TYPE_CFG: Record<NotifType, { icon: any; color: string; bg: string; label: string }> = {
  INFO:    { icon: Info,          color: 'text-blue-400',    bg: 'bg-blue-400/10',    label: 'Info'    },
  WARNING: { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-400/10',   label: 'Alerta'  },
  SUCCESS: { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Éxito'   },
  ERROR:   { icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-400/10',     label: 'Error'   },
}

const FILTER_OPTS: { value: FilterType; label: string }[] = [
  { value: 'ALL',    label: 'Todas' },
  { value: 'UNREAD', label: 'No leídas' },
  { value: 'READ',   label: 'Leídas' },
]

export default function NotificationsPage() {
  const { t } = useI18n()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const [notifs, setNotifs]       = useState<Notif[]>([])
  const [total, setTotal]         = useState(0)
  const [unread, setUnread]       = useState(0)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<FilterType>('ALL')
  const [typeFilter, setTypeFilter] = useState<NotifType | 'ALL'>('ALL')
  const [acting, setActing]       = useState<string | null>(null)
  const [page, setPage]           = useState(1)
  const LIMIT = 20

  const load = useCallback(async (resetPage = false) => {
    setLoading(true)
    const p = resetPage ? 1 : page
    if (resetPage) setPage(1)
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        page: String(p),
        ...(filter === 'UNREAD' && { unread: 'true' }),
      })
      const r = await fetch(`/api/notifications?${params}`)
      const d = await r.json()
      let items: Notif[] = d.notifications || []
      if (filter === 'READ')   items = items.filter(n => n.isRead)
      if (typeFilter !== 'ALL') items = items.filter(n => n.type === typeFilter)
      setNotifs(items)
      setTotal(d.total || 0)
      setUnread(d.unreadCount || 0)
    } finally {
      setLoading(false)
    }
  }, [page, filter, typeFilter])

  useEffect(() => { load() }, [load])

  const markOne = async (id: string) => {
    setActing(id)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
    setUnread(c => Math.max(0, c - 1))
    setActing(null)
  }

  const markAll = async () => {
    setActing('all')
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifs(n => n.map(x => ({ ...x, isRead: true })))
    setUnread(0)
    setActing(null)
    toast.success('Todas marcadas como leídas')
  }

  const delOne = async (id: string) => {
    if (!isAdmin) return
    setActing('del-' + id)
    const r = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    if (r.ok) {
      setNotifs(n => n.filter(x => x.id !== id))
      setTotal(t => t - 1)
      toast.success('Notificación eliminada')
    }
    setActing(null)
  }

  const delAllRead = async () => {
    if (!isAdmin) return
    setActing('delall')
    const r = await fetch('/api/notifications?all=true', { method: 'DELETE' })
    if (r.ok) {
      setNotifs(n => n.filter(x => !x.isRead))
      toast.success('Notificaciones leídas eliminadas')
    }
    setActing(null)
  }

  const readCount   = notifs.filter(n => n.isRead).length
  const unreadLocal = notifs.filter(n => !n.isRead).length

  return (
    <div className="space-y-6 w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('notif.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {unread > 0 ? <>{unread} sin leer · </> : null}{total} en total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {unread > 0 && (
            <button onClick={markAll} disabled={acting === 'all'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ border: '1px solid var(--border-base)', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
              {acting === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Marcar todas leídas
            </button>
          )}
          {isAdmin && readCount > 0 && (
            <button onClick={delAllRead} disabled={acting === 'delall'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 transition-all"
              style={{ border: '1px solid rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.05)' }}>
              {acting === 'delall' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Eliminar leídas
            </button>
          )}
          <button onClick={() => load(true)}
            className="flex items-center gap-2 p-2 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-base)' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',      value: total,                                    color: 'var(--text-primary)'   },
          { label: 'Sin leer',   value: unread,                                   color: '#60a5fa'               },
          { label: 'Leídas',     value: total - unread,                           color: '#34d399'               },
          { label: 'En pantalla',value: notifs.length,                            color: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center glass">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />

        {/* Read/unread filter */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          {FILTER_OPTS.map(o => (
            <button key={o.value} onClick={() => { setFilter(o.value); setPage(1) }}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: filter === o.value ? 'var(--accent)' : 'transparent',
                color: filter === o.value ? '#fff' : 'var(--text-secondary)',
              }}>
              {o.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1 flex-wrap">
          {(['ALL', 'INFO', 'WARNING', 'SUCCESS', 'ERROR'] as const).map(t => {
            const cfg = t !== 'ALL' ? TYPE_CFG[t] : null
            const active = typeFilter === t
            return (
              <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: active ? (cfg ? cfg.bg : 'var(--accent-muted)') : 'transparent',
                  color: active ? (cfg ? cfg.color : 'var(--accent-text)') : 'var(--text-muted)',
                  border: `1px solid ${active ? (cfg ? cfg.color + '40' : 'var(--accent)') : 'transparent'}`,
                }}>
                {cfg && <cfg.icon className="w-3 h-3" />}
                {t === 'ALL' ? 'Todos los tipos' : cfg?.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando notificaciones...</p>
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <BellOff className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Sin notificaciones</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {filter !== 'ALL' || typeFilter !== 'ALL' ? 'Prueba cambiando los filtros' : 'Todo al día'}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {notifs.map((n, i) => {
              const cfg = TYPE_CFG[n.type] || TYPE_CFG.INFO
              const Icon = cfg.icon
              const isActing = acting === 'del-' + n.id || acting === n.id
              return (
                <div key={n.id}
                  className={cn('group flex gap-4 px-5 py-4 transition-colors', !n.isRead && 'border-l-2')}
                  style={{
                    borderBottom: i < notifs.length - 1 ? '1px solid var(--border-muted)' : 'none',
                    borderLeftColor: !n.isRead ? 'var(--accent)' : 'transparent',
                    backgroundColor: !n.isRead ? 'var(--accent-muted)' : 'transparent',
                    cursor: !n.isRead ? 'pointer' : 'default',
                  }}
                  onClick={() => !n.isRead && markOne(n.id)}
                >
                  {/* Type icon */}
                  <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', cfg.color)} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          {!n.isRead && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent-text)' }}>
                              Nueva
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                          {' · '}
                          {format(new Date(n.createdAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button
                            onClick={e => { e.stopPropagation(); markOne(n.id) }}
                            disabled={isActing}
                            title="Marcar como leída"
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            {acting === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={e => { e.stopPropagation(); delOne(n.id) }}
                            disabled={isActing}
                            title="Eliminar notificación"
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            {acting === 'del-' + n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: 'var(--accent)' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--border-muted)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                style={{ border: '1px solid var(--border-base)', color: 'var(--text-secondary)' }}>
                Anterior
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                style={{ border: '1px solid var(--border-base)', color: 'var(--text-secondary)' }}>
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Permission note for employees */}
      {!isAdmin && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Puedes marcar notificaciones como leídas. Solo los administradores pueden eliminarlas.
        </p>
      )}
    </div>
  )
}
