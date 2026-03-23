// src/components/layout/NotificationPanel.tsx
'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X, Check, CheckCheck, Trash2, Loader2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  isRead: boolean
  createdAt: string
}

const TYPE_CONFIG = {
  INFO:    { icon: Info,          color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20'    },
  WARNING: { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20'   },
  SUCCESS: { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  ERROR:   { icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/20'     },
}

export function NotificationPanel() {
  const [open, setOpen]                       = useState(false)
  const [notifications, setNotifications]     = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]         = useState(0)
  const [loading, setLoading]                 = useState(false)
  const [acting, setActing]                   = useState<string | null>(null)
  const [panelStyle, setPanelStyle]           = useState<React.CSSProperties>({})
  const [mounted, setMounted]                 = useState(false)
  const bellRef                               = useRef<HTMLButtonElement>(null)

  // Solo renderizar el portal en el cliente
  useEffect(() => { setMounted(true) }, [])

  // Calcular posición del panel relativa al botón campana
  const updatePosition = useCallback(() => {
    if (!bellRef.current) return
    const rect = bellRef.current.getBoundingClientRect()
    const panelWidth = 360
    const windowWidth = window.innerWidth

    // Posición base: alineado a la derecha del botón
    let left = rect.right - panelWidth
    // Si se saldría por la izquierda, anclar al margen
    if (left < 8) left = 8
    // Si se saldría por la derecha, anclar al margen derecho
    if (left + panelWidth > windowWidth - 8) left = windowWidth - panelWidth - 8

    setPanelStyle({
      position: 'fixed',
      top:      rect.bottom + 8,
      left,
      width:    Math.min(panelWidth, windowWidth - 16),
      zIndex:   99999,
    })
  }, [])

  useEffect(() => {
    if (open) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
    }
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  // Fetch notificaciones
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res  = await fetch('/api/notifications?limit=30')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Polling cada 30 segundos
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(() => fetchNotifications(true), 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      // Ignorar clicks en el botón campana (lo maneja su propio onClick)
      if (bellRef.current?.contains(target)) return
      // Cerrar si click fuera del panel (el panel está en el portal)
      const panel = document.getElementById('notification-panel-portal')
      if (panel && !panel.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const markRead = async (id: string) => {
    setActing(id)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
    setUnreadCount(c => Math.max(0, c - 1))
    setActing(null)
  }

  const markAllRead = async () => {
    setActing('all')
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications(n => n.map(x => ({ ...x, isRead: true })))
    setUnreadCount(0)
    setActing(null)
  }

  const deleteNotif = async (id: string) => {
    setActing(id + '-del')
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setNotifications(n => n.filter(x => x.id !== id))
    setActing(null)
  }

  const clearRead = async () => {
    setActing('clear')
    await fetch('/api/notifications?all=true', { method: 'DELETE' })
    setNotifications(n => n.filter(x => !x.isRead))
    setActing(null)
  }

  const handleBellClick = () => {
    const next = !open
    setOpen(next)
    if (next) fetchNotifications()
  }

  const unreadNotifications = notifications.filter(n => !n.isRead)
  const readNotifications   = notifications.filter(n =>  n.isRead)

  // Panel content (renderizado via portal)
  const panelContent = (
    <div
      id="notification-panel-portal"
      style={panelStyle}
      className={cn(
        'flex flex-col max-h-[520px]',
        'bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {unreadCount} nuevas
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={acting === 'all'}
              title="Marcar todas como leídas"
              className="flex items-center justify-center text-gray-400 hover:text-white transition-all p-1"
            >
              {acting === 'all'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCheck className="w-3.5 h-3.5" />}
            </button>
          )}
          {readNotifications.length > 0 && (
            <button
              onClick={clearRead}
              disabled={acting === 'clear'}
              title="Eliminar leídas"
              className="flex items-center justify-center text-gray-400 hover:text-red-400 transition-all p-1"
            >
              {acting === 'clear'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center text-gray-400 hover:text-white transition-all p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto flex-1 overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center">
              <Bell className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">Sin notificaciones</p>
          </div>
        ) : (
          <div className="py-2">
            {unreadNotifications.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Nuevas
                </p>
                {unreadNotifications.map(n => (
                  <NotifItem key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} acting={acting} />
                ))}
              </>
            )}
            {readNotifications.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
                  Anteriores
                </p>
                {readNotifications.map(n => (
                  <NotifItem key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} acting={acting} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Botón campana */}
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className={cn(
          'relative flex items-center justify-center transition-all p-1',
          open
            ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-400'
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold bg-blue-500 text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel renderizado en el body vía portal para evitar clipping */}
      {mounted && open && createPortal(panelContent, document.body)}
    </>
  )
}

// ── Item individual ────────────────────────────────────────────────
function NotifItem({
  notif, onRead, onDelete, acting,
}: {
  notif: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
  acting: string | null
}) {
  const cfg        = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO
  const Icon       = cfg.icon
  const isDeleting = acting === notif.id + '-del'
  const isReading  = acting === notif.id
  const timeAgo    = formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })

  return (
    <div
      onClick={() => !notif.isRead && onRead(notif.id)}
      className={cn(
        'group flex gap-3 px-4 py-3 transition-colors cursor-pointer',
        notif.isRead
          ? 'hover:bg-gray-800/40'
          : 'bg-blue-500/5 hover:bg-blue-500/10 border-l-2 border-l-blue-500',
      )}
    >
      {/* Ícono tipo */}
      <div className={cn(
        'shrink-0 mt-0.5',
        cfg.bg, cfg.border
      )}>
        <Icon className={cn('w-4 h-4', cfg.color)} />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-xs font-semibold leading-tight', notif.isRead ? 'text-gray-300' : 'text-white')}>
            {notif.title}
          </p>
          {/* Acciones hover */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notif.isRead && (
              <button
                onClick={e => { e.stopPropagation(); onRead(notif.id) }}
                title="Marcar como leída"
                className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-emerald-400 transition-colors"
              >
                {isReading
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Check className="w-3 h-3" />}
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDelete(notif.id) }}
              title="Eliminar"
              className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
            >
              {isDeleting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <X className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>
        <p className="text-[10px] text-gray-600 mt-1">{timeAgo}</p>
      </div>

      {/* Indicador no leída */}
      {!notif.isRead && (
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
      )}
    </div>
  )
}
