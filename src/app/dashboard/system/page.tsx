// src/app/dashboard/system/page.tsx
'use client'
import { useI18n } from '@/lib/i18n-context'
import { useRef, useState } from 'react'
import {
  Database, Download, Upload, Trash2, Loader2, CheckCircle,
  AlertTriangle, RefreshCw, Shield, FlaskConical, ServerCrash,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface ActionState {
  status: Status
  message?: string
  detail?: any
}

function useAction() {
  const [state, setState] = useState<ActionState>({ status: 'idle' })
  const run = async (fn: () => Promise<{ message: string; detail?: any }>) => {
    setState({ status: 'loading' })
    try {
      const result = await fn()
      setState({ status: 'success', message: result.message, detail: result.detail })
    } catch (err: any) {
      setState({ status: 'error', message: err.message })
    }
  }
  const reset = () => setState({ status: 'idle' })
  return { state, run, reset }
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmModal({
  open, title, description, danger, onConfirm, onCancel, loading,
}: {
  open: boolean; title: string; description: string
  danger?: boolean; onConfirm: () => void; onCancel: () => void; loading?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl p-6 z-10"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className={cn('w-6 h-6 shrink-0 mt-0.5', danger ? 'text-red-400' : 'text-amber-400')} />
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ border: '1px solid var(--border-base)', color: 'var(--text-secondary)' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ backgroundColor: danger ? '#ef4444' : 'var(--accent)', color: '#fff' }}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Result display ────────────────────────────────────────────────────────────
function ResultCard({ state, onReset }: { state: ActionState; onReset: () => void }) {
  if (state.status === 'idle') return null
  if (state.status === 'loading') return (
    <div className="flex items-center gap-3 p-4 rounded-xl mt-4"
      style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-muted)' }}>
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Procesando...</p>
    </div>
  )
  const ok = state.status === 'success'
  return (
    <div className="mt-4 p-4 rounded-xl" style={{
      backgroundColor: ok ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
      border: `1px solid ${ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
    }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {ok
            ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
          <div>
            <p className="text-sm font-medium" style={{ color: ok ? '#34d399' : '#f87171' }}>{state.message}</p>
            {state.detail && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(state.detail).map(([k, v]) => (
                  <span key={k} className="text-xs px-2 py-1 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                    {k}: <strong style={{ color: 'var(--text-primary)' }}>{String(v)}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={onReset} className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>✕</button>
      </div>
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, iconColor, title, description, children }: {
  icon: any; iconColor: string; title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-6 glass space-y-4">
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', iconColor)} />
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SystemPage() {
  const { t, locale } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)

  const backup  = useAction()
  const restore = useAction()
  const seed    = useAction()
  const clearD  = useAction()
  const clearA  = useAction()

  const [confirm, setConfirm] = useState<null | 'demo' | 'all' | 'seed' | 'restore'>(null)
  const [pendingFile, setPendingFile] = useState<any>(null)

  // ── Backup ──
  const handleBackup = async () => {
    await backup.run(async () => {
      const res = await fetch('/api/admin/backup')
      if (!res.ok) throw new Error('Error generando backup')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const cd   = res.headers.get('content-disposition') ?? ''
      const name = cd.match(/filename="([^"]+)"/)?.[1] ?? 'backup.json'
      const a    = document.createElement('a')
      a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
      return { message: `Backup descargado: ${name}` }
    })
  }

  // ── Restore ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Read to validate structure, but store the raw File for sending
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (!parsed?.meta?.version || !parsed?.data) {
          toast.error('Archivo no válido — debe ser un backup de AccessFlow')
          return
        }
        // Store both parsed (for display) and raw file (for upload)
        setPendingFile({ meta: parsed.meta, rawFile: file })
        setConfirm('restore')
      } catch {
        toast.error('No se pudo leer el archivo JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleRestore = async () => {
    if (!pendingFile?.rawFile) return
    setConfirm(null)
    await restore.run(async () => {
      // Send as FormData to bypass Vercel 4.5MB JSON body limit
      const form = new FormData()
      form.append('file', pendingFile.rawFile)
      const res  = await fetch('/api/admin/restore', {
        method: 'POST',
        body:   form,
        // No Content-Type header — browser sets it automatically with boundary
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Error al restaurar')
      setPendingFile(null)
      const detail: Record<string,any> = { ...(data.restored || {}) }
      if (data.meta?.backupDate) detail['Backup de'] = new Date(data.meta.backupDate).toLocaleDateString('es')
      if (data.errors?.length)   detail['⚠ Errores'] = data.errors.length
      return { message: data.message, detail }
    })
  }

  // ── Seed ──
  const handleSeed = async () => {
    setConfirm(null)
    await seed.run(async () => {
      const res  = await fetch('/api/admin/seed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return { message: data.message, detail: data.created }
    })
  }

  // ── Clear ──
  const handleClear = async (mode: 'demo' | 'all') => {
    setConfirm(null)
    const action = mode === 'demo' ? clearD : clearA
    await action.run(async () => {
      const res  = await fetch('/api/admin/clear', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return { message: data.message || 'Datos eliminados', detail: data.deleted }
    })
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6" style={{ color: 'var(--accent-text)' }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('system.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Backup, restauración y gestión de datos — solo administradores
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm" style={{ color: '#fbbf24' }}>
          Las operaciones de esta sección son irreversibles. Realiza siempre un backup antes de borrar o restaurar datos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Backup ── */}
        <SectionCard icon={Download} iconColor="text-blue-400" title="Crear backup"
          description="Descarga un archivo JSON con todos los datos del sistema: usuarios, asistencias, configuración, logs y notificaciones.">
          <button onClick={handleBackup} disabled={backup.state.status === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
            {backup.state.status === 'loading'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
              : <><Download className="w-4 h-4" /> Descargar backup completo</>}
          </button>
          <ResultCard state={backup.state} onReset={backup.reset} />
        </SectionCard>

        {/* ── Restore ── */}
        <SectionCard icon={Upload} iconColor="text-violet-400" title="Restaurar backup"
          description="Sube un archivo de backup generado por este sistema. Se reemplazarán TODOS los datos actuales con los del backup.">
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          <button onClick={() => fileRef.current?.click()} disabled={restore.state.status === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.08)' }}>
            {restore.state.status === 'loading'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Restaurando...</>
              : <><Upload className="w-4 h-4" /> Seleccionar archivo de backup</>}
          </button>
          <ResultCard state={restore.state} onReset={restore.reset} />
        </SectionCard>

        {/* ── Datos de prueba ── */}
        <SectionCard icon={FlaskConical} iconColor="text-emerald-400" title="Datos de prueba"
          description="Crea los 6 usuarios demo (admin + 5 empleados) con 30 días de historial de asistencia. Se omiten si ya existen.">
          <div className="space-y-2">
            <button onClick={() => setConfirm('seed')} disabled={seed.state.status === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', backgroundColor: 'rgba(52,211,153,0.08)' }}>
              {seed.state.status === 'loading'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
                : <><RefreshCw className="w-4 h-4" /> Crear datos de prueba</>}
            </button>
            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-input)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{locale === 'es' ? 'Se crearán:' : 'Will be created:'}</p>
              <div className="text-xs space-y-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <p>admin@accessflow.com / admin123</p>
                <p>maria@accessflow.com / employee123</p>
                <p>carlos@accessflow.com / employee123</p>
                <p>ana@accessflow.com / employee123</p>
                <p>luis@accessflow.com / employee123</p>
                <p>sofia@accessflow.com / employee123</p>
              </div>
            </div>
          </div>
          <ResultCard state={seed.state} onReset={seed.reset} />
        </SectionCard>

        {/* ── Limpiar datos ── */}
        <SectionCard icon={Trash2} iconColor="text-red-400" title="Limpiar datos"
          description="Elimina registros de la base de datos. Esta acción no se puede deshacer.">
          <div className="space-y-3">
            {/* Demo only */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-muted)' }}>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{t('system.onlyDemo')}</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Elimina únicamente los 6 usuarios demo y toda su información asociada (asistencias, logs, notificaciones).
              </p>
              <button onClick={() => setConfirm('demo')} disabled={clearD.state.status === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                {clearD.state.status === 'loading'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
                  : <><Trash2 className="w-4 h-4" /> Eliminar datos de prueba</>}
              </button>
              <ResultCard state={clearD.state} onReset={clearD.reset} />
            </div>

            {/* Everything */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-sm font-medium mb-1 text-red-400">{t('system.clearAll2')}</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Elimina TODOS los usuarios (excepto tu sesión actual), asistencias, logs y notificaciones. Solo tú permanecerás en el sistema.
              </p>
              <button onClick={() => setConfirm('all')} disabled={clearA.state.status === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                {clearA.state.status === 'loading'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
                  : <><ServerCrash className="w-4 h-4" /> Limpiar todos los datos</>}
              </button>
              <ResultCard state={clearA.state} onReset={clearA.reset} />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Confirm modals ── */}
      <ConfirmModal
        open={confirm === 'restore'}
        title="¿Restaurar backup?"
        description={`Se reemplazarán TODOS los datos actuales con los del backup generado el ${pendingFile?.meta?.createdAt?.slice(0,10) ?? 'fecha desconocida'}. Esta acción es irreversible.`}
        danger
        loading={restore.state.status === 'loading'}
        onConfirm={handleRestore}
        onCancel={() => { setConfirm(null); setPendingFile(null) }}
      />
      <ConfirmModal
        open={confirm === 'seed'}
        title="¿Crear datos de prueba?"
        description="Se crearán 6 usuarios demo con 30 días de historial. Los usuarios existentes con ese email no se modificarán."
        loading={seed.state.status === 'loading'}
        onConfirm={handleSeed}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'demo'}
        title="¿Eliminar datos de prueba?"
        description="Se eliminarán los 6 usuarios demo (admin@accessflow.com, maria@accessflow.com y otros) junto con todas sus asistencias y logs."
        danger
        loading={clearD.state.status === 'loading'}
        onConfirm={() => handleClear('demo')}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'all'}
        title="⚠️ ¿Limpiar TODOS los datos?"
        description="Se eliminarán TODOS los usuarios, asistencias, logs de acceso y notificaciones. Solo tu usuario permanecerá. Esta acción NO se puede deshacer."
        danger
        loading={clearA.state.status === 'loading'}
        onConfirm={() => handleClear('all')}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
