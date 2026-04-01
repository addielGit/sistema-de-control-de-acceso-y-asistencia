// src/components/dashboard/AdminDashboard.tsx
'use client'
import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Users, UserCheck, UserX, Clock, Activity, GripVertical, RotateCcw } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { DashboardStats } from '@/types'
import { formatDateTime } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'

function useT() { const { t } = useI18n(); return t }

// ─── Types ────────────────────────────────────────────────────────────────────
type WidgetId =
  | 'stat-employees' | 'stat-present' | 'stat-late' | 'stat-absent'
  | 'attendance-rate' | 'weekly-chart' | 'dept-chart' | 'recent-activity'

interface WidgetConfig { id: WidgetId; span: 'quarter' | 'half' | 'full' }

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'stat-employees',  span: 'quarter' },
  { id: 'stat-present',    span: 'quarter' },
  { id: 'stat-late',       span: 'quarter' },
  { id: 'stat-absent',     span: 'quarter' },
  { id: 'attendance-rate', span: 'full'    },
  { id: 'weekly-chart',    span: 'half'    },
  { id: 'dept-chart',      span: 'half'    },
  { id: 'recent-activity', span: 'full'    },
]

const SPAN_CLASS: Record<string, string> = {
  quarter: 'col-span-1',
  half:    'col-span-1 lg:col-span-2',
  full:    'col-span-1 lg:col-span-4',
}

// ─── Chart tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 rounded-xl text-xs">
      <p className="text-gray-300 font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ─── Draggable widget wrapper ──────────────────────────────────────────────────
function DraggableWidget(props: React.PropsWithChildren<{
  config:      WidgetConfig
  editMode:    boolean
  isDragOver:  boolean
  isDragging:  boolean
  onDragStart: () => void
  onDragEnter: () => void
  onDragOver:  (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop:      () => void
  onDragEnd:   () => void
}>) {
  const { config, editMode, isDragOver, isDragging, onDragStart, onDragEnter, onDragOver, onDragLeave, onDrop, onDragEnd, children } = props
  return (
    <div
      className={`${SPAN_CLASS[config.span]} relative group transition-all duration-200 ${
        isDragging  ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
      }`}
      draggable={editMode}
      onDragStart={editMode ? onDragStart : undefined}
      onDragEnd={editMode ? onDragEnd : undefined}
      onDragEnter={editMode ? onDragEnter : undefined}
      onDragOver={editMode ? onDragOver : undefined}
      onDragLeave={editMode ? onDragLeave : undefined}
      onDrop={editMode ? onDrop : undefined}
    >
      {/* Drop target highlight */}
      {editMode && isDragOver && !isDragging && (
        <div className="absolute inset-0 rounded-2xl z-10 border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none" />
      )}

      {/* Edit mode ring */}
      {editMode && !isDragging && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/20 group-hover:ring-blue-500/50 transition-all pointer-events-none" />
      )}

      {/* Drag handle */}
      {editMode && (
        <div
          className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg
            cursor-grab active:cursor-grabbing select-none
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            bg-gray-800/95 hover:bg-blue-500/20
            border border-gray-600 hover:border-blue-500/50 shadow-md"
        >
          <GripVertical className="w-3.5 h-3.5 text-blue-400" />
        </div>
      )}

      {children}
    </div>
  )
}

// ─── Widget content ───────────────────────────────────────────────────────────
function WidgetContent({ id, stats, t }: {
  id: WidgetId; stats: DashboardStats; t: (k: string) => string
}) {
  switch (id) {
    case 'stat-employees':
      return <StatCard title={t('admin.totalEmployees')} value={stats.totalEmployees} icon={Users}     iconColor="text-blue-400"    subtitle={t('admin.activeSystem')} />
    case 'stat-present':
      return <StatCard title={t('admin.present')}        value={stats.presentToday}   icon={UserCheck} iconColor="text-emerald-400" />
    case 'stat-late':
      return <StatCard title={t('admin.late')}           value={stats.lateToday}      icon={Clock}     iconColor="text-amber-400"   />
    case 'stat-absent':
      return <StatCard title={t('admin.absent')}         value={stats.absentToday}    icon={UserX}     iconColor="text-red-400"     />

    case 'attendance-rate':
      return (
        <div className="glass rounded-2xl p-5 h-full">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-300">{t('admin.attendanceRate')}</p>
            <span className="text-2xl font-bold text-white">{stats.attendanceRate}%</span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${stats.attendanceRate}%`, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }}
            />
          </div>
        </div>
      )

    case 'weekly-chart':
      return (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-5">{t('admin.weeklyChart')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
              <Area type="monotone" dataKey="present" name={t('admin.present')} stroke="#34d399" fill="url(#gP)" strokeWidth={2} />
              <Area type="monotone" dataKey="late"    name={t('admin.late')}    stroke="#fbbf24" fill="url(#gL)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )

    case 'dept-chart':
      return (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-5">{t('admin.byDepartment')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.departmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="department" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {stats.departmentData.map((_: any, i: number) => (
                  <Cell key={i} fill={['#3b82f6','#8b5cf6','#34d399','#f59e0b','#ef4444'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )

    case 'recent-activity':
      return (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">{t('admin.recentActivity')}</h3>
          </div>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 8).map((log: any) => (
              <div key={log.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 hover:bg-gray-900 transition-colors">
                <span className={`text-xs font-bold shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  log.action === 'ENTRY'
                    ? 'text-emerald-400 bg-emerald-400/10'
                    : 'text-orange-400 bg-orange-400/10'
                }`}>
                  {log.action === 'ENTRY' ? '→' : '←'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{log.user?.name || '—'}</p>
                  <p className="text-xs text-gray-500">
                    {log.action === 'ENTRY' ? t('dashboard.entryLog') : t('dashboard.exitLog')}
                  </p>
                </div>
                <p className="text-xs text-gray-500 shrink-0 tabular-nums">{formatDateTime(log.timestamp)}</p>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <p className="text-center text-sm text-gray-600 py-6">{t('history.noRecords')}</p>
            )}
          </div>
        </div>
      )

    default: return null
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AdminDashboard() {
  const t = useT()

  const [stats,    setStats]    = useState<DashboardStats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [layout,   setLayout]   = useState<WidgetConfig[]>(DEFAULT_LAYOUT)
  const [editMode, setEditMode] = useState<boolean>(false)
  const [saved,    setSaved]    = useState(false)

  // Drag state — tracked in refs to avoid unnecessary re-renders mid-drag
  const dragSrc      = useRef<WidgetId | null>(null)
  const [dragOver,   setDragOver]   = useState<WidgetId | null>(null)
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null)

  // Debounce timer for auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // ── Load stats ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  // ── Load persisted layout ───────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/dashboard/layout')
      .then(r => r.json())
      .then(d => {
        if (!d.layout || !Array.isArray(d.layout) || d.layout.length === 0) return
        // Merge: keep saved order, append any new widgets not yet in the saved layout
        const savedIds = new Set(d.layout.map((w: WidgetConfig) => w.id))
        const missing  = DEFAULT_LAYOUT.filter((w: any) => !savedIds.has(w.id))
        setLayout([...d.layout, ...missing])
      })
      .catch(() => {})
  }, [])

  // ── Auto-save with 800ms debounce ───────────────────────────────────────────
  const saveLayout = useCallback((next: WidgetConfig[]) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/dashboard/layout', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ layout: next }),
      })
        .then(r => r.ok && (setSaved(true), setTimeout(() => setSaved(false), 2200)))
        .catch(() => {})
    }, 800)
  }, [])

  // ── Drag & drop handlers (native HTML5) ─────────────────────────────────────
  const handleDragStart = (id: WidgetId) => {
    dragSrc.current = id
    setDraggingId(id)
    // Small delay so the drag image renders before opacity change
    setTimeout(() => setDraggingId(id), 0)
  }

  const handleDragEnter = (id: WidgetId) => {
    if (dragSrc.current && dragSrc.current !== id) setDragOver(id)
  }

  const handleDragOver = (e: React.DragEvent, id: WidgetId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragSrc.current && dragSrc.current !== id) setDragOver(id)
  }

  const handleDragLeave = (id: WidgetId) => {
    setDragOver((prev: WidgetId | null) => prev === id ? null : prev)
  }

  const handleDrop = (targetId: WidgetId) => {
    const srcId = dragSrc.current
    if (!srcId || srcId === targetId) return

    setLayout((prev: WidgetConfig[]) => {
      const srcIdx = prev.findIndex((w: WidgetConfig) => w.id === srcId)
      const tgtIdx = prev.findIndex((w: WidgetConfig) => w.id === targetId)
      if (srcIdx === -1 || tgtIdx === -1) return prev

      const next = [...prev]
      // Swap the two widgets
      const [removed] = next.splice(srcIdx, 1)
      next.splice(tgtIdx, 0, removed)
      saveLayout(next)
      return next
    })

    setDragOver(null)
    setDraggingId(null)
    dragSrc.current = null
  }

  const handleDragEnd = () => {
    setDragOver(null)
    setDraggingId(null)
    dragSrc.current = null
  }

  const handleReset = () => {
    setLayout(DEFAULT_LAYOUT)
    saveLayout(DEFAULT_LAYOUT)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <DashboardSkeleton />
  if (!stats)  return <p className="text-gray-500 text-center py-12">{t('admin.errorLoading')}</p>

  return (
    <div className="space-y-4 w-full">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.dashboard')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.todaySummary')}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-save indicator */}
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 px-2.5 py-1.5
              bg-emerald-500/10 rounded-lg border border-emerald-500/20 animate-pulse-once">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('settings.saved')}
            </span>
          )}

          {/* Toggle edit mode */}
          <button
            onClick={() => setEditMode((m: boolean) => !m)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              editMode
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/10'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-750 hover:border-gray-600'
            }`}
          >
            <GripVertical className="w-4 h-4" />
            {editMode ? t('dashboard.editMode') : t('dashboard.arrange')}
          </button>

          {/* Reset to default */}
          {editMode && (
            <button
              onClick={handleReset}
              title={t('dashboard.resetLayout')}
              className="p-2.5 rounded-xl border border-gray-700 hover:border-red-500/40
                text-gray-400 hover:text-red-400 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Edit mode hint ── */}
      {editMode && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
          bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
          <GripVertical className="w-4 h-4 shrink-0 text-blue-400" />
          {t('dashboard.editHint')}
        </div>
      )}

      {/* ── Widget grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {layout.map((config: WidgetConfig) => (
          <DraggableWidget
            key={config.id}
            config={config}
            editMode={editMode as boolean}
            isDragOver={dragOver === config.id}
            isDragging={draggingId === config.id}
            onDragStart={() => handleDragStart(config.id)}
            onDragEnter={() => handleDragEnter(config.id)}
            onDragOver={e  => handleDragOver(e, config.id)}
            onDragLeave={() => handleDragLeave(config.id)}
            onDrop={() => handleDrop(config.id)}
            onDragEnd={handleDragEnd}
          >
            <WidgetContent id={config.id} stats={stats!} t={t} />
          </DraggableWidget>
        ))}
      </div>

    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 skeleton rounded-xl" />
        <div className="h-10 w-36 skeleton rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map((i: any) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
      </div>
      <div className="h-14 skeleton rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  )
}
