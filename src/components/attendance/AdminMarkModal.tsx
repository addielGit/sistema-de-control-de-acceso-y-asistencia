// src/components/attendance/AdminMarkModal.tsx
'use client'
import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Loader2, LogIn, LogOut, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface User { id: string; name: string; email: string; department?: string }

interface TodayStatus {
  checkIn: string | null
  checkOut: string | null
  status: string
  lateMinutes: number
}

interface AdminMarkModalProps {
  open: boolean
  onClose: () => void
  user: User | null
}

export function AdminMarkModal({ open, onClose, user }: AdminMarkModalProps) {
  const { t } = useI18n()
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null)
  const [loadingStatus, setLoadingStatus]   = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [overrideTime, setOverrideTime]     = useState('')
  const [reason, setReason]                 = useState('')
  const [success, setSuccess]               = useState<string | null>(null)

  // Cargar estado actual del empleado al abrir
  useEffect(() => {
    if (!open || !user) return
    setSuccess(null)
    setReason('')
    setOverrideTime(new Date().toTimeString().slice(0, 5)) // hora actual por defecto
    setLoadingStatus(true)
    fetch(`/api/attendance/check?userId=${user.id}`)
      .then(r => r.json())
      .then(d => setTodayStatus(d.attendance))
      .finally(() => setLoadingStatus(false))
  }, [open, user])

  if (!user) return null

  const checkedIn  = !!todayStatus?.checkIn
  const checkedOut = !!todayStatus?.checkOut
  const done       = checkedIn && checkedOut
  const actionType = !checkedIn ? 'ENTRY' : 'EXIT'

  const handleMark = async () => {
    if (!reason.trim()) {
      toast.error('Debes ingresar una razón para el marcaje manual')
      return
    }
    if (!overrideTime) {
      toast.error('Selecciona la hora del marcaje')
      return
    }

    setSaving(true)
    try {
      // Construir datetime completo con la fecha de hoy y hora seleccionada
      const today = new Date()
      const [h, m] = overrideTime.split(':').map(Number)
      today.setHours(h, m, 0, 0)

      const res = await fetch('/api/attendance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:       user.id,
          method:       'ADMIN_OVERRIDE',
          overrideTime: today.toISOString(),
          reason:       reason.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(data.message)
      setTodayStatus(data.attendance)
      toast.success(data.message)
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('mark.title')} size="md">
      {/* Info del empleado */}
      <div className="flex items-center gap-3 p-3 bg-gray-900/60 rounded-xl border border-gray-800 mb-5">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-sm shrink-0">
          {user.name[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-gray-400">{user.department || user.email}</p>
        </div>
      </div>

      {loadingStatus ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        </div>
      ) : success ? (
        // Estado de éxito
        <div className="flex flex-col items-center py-6 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white">{success}</p>
          <button onClick={onClose} className="mt-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-all">
            Cerrar
          </button>
        </div>
      ) : done ? (
        // Ya completó jornada
        <div className="flex flex-col items-center py-6 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-white">{t('mark.fullDay')}</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>Entrada: <span className="text-white font-mono">{formatTime(new Date(todayStatus!.checkIn!))}</span></span>
            <span>Salida: <span className="text-white font-mono">{formatTime(new Date(todayStatus!.checkOut!))}</span></span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Estado actual */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/60 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">{t('mark.entry')}</p>
              <p className={cn('text-sm font-mono font-semibold', checkedIn ? 'text-emerald-400' : 'text-gray-600')}>
                {checkedIn ? formatTime(new Date(todayStatus!.checkIn!)) : 'Sin registrar'}
              </p>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">{t('mark.exit')}</p>
              <p className={cn('text-sm font-mono font-semibold', checkedOut ? 'text-orange-400' : 'text-gray-600')}>
                {checkedOut ? formatTime(new Date(todayStatus!.checkOut!)) : 'Sin registrar'}
              </p>
            </div>
          </div>

          {/* Acción a realizar */}
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-xl border',
            actionType === 'ENTRY'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-orange-500/10 border-orange-500/20'
          )}>
            {actionType === 'ENTRY'
              ? <LogIn  className="w-4 h-4 text-emerald-400 shrink-0" />
              : <LogOut className="w-4 h-4 text-orange-400  shrink-0" />
            }
            <p className={cn('text-xs font-medium', actionType === 'ENTRY' ? 'text-emerald-300' : 'text-orange-300')}>
              {actionType === 'ENTRY'
                ? t('mark.action')
                : t('mark.actionExit')}
            </p>
          </div>

          {/* Hora del marcaje */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Hora del marcaje
            </label>
            <input
              type="time"
              value={overrideTime}
              onChange={e => setOverrideTime(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Razón */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Razón del marcaje manual <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Empleado olvidó registrar entrada, problema técnico con el lector QR, etc."
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Aviso de auditoría */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Esta acción quedará registrada en el log de auditoría con tu usuario, la hora y la razón indicada.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleMark}
              disabled={saving || !reason.trim()}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                actionType === 'ENTRY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-orange-600 hover:bg-orange-500 text-white'
              )}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                : actionType === 'ENTRY'
                  ? <><LogIn  className="w-4 h-4" /> Registrar Entrada</>
                  : <><LogOut className="w-4 h-4" /> Registrar Salida</>
              }
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
