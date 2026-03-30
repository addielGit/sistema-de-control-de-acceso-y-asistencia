// src/app/dashboard/settings/page.tsx
'use client'
import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState } from 'react'
import { Settings, Clock, Calendar, Plus, Trash2, Loader2, Save, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const DAYS = [
  { value: 1, label: 'Lunes',     short: 'L' },
  { value: 2, label: 'Martes',    short: 'M' },
  { value: 3, label: 'Miércoles', short: 'X' },
  { value: 4, label: 'Jueves',    short: 'J' },
  { value: 5, label: 'Viernes',   short: 'V' },
  { value: 6, label: 'Sábado',    short: 'S' },
  { value: 0, label: 'Domingo',   short: 'D' },
]

interface Config {
  workDays: number[]
  checkInTime: string
  checkOutTime: string
  checkInTolerance: number
  checkOutTolerance: number
  holidays: string[]
}

const DEFAULT: Config = {
  workDays: [1, 2, 3, 4, 5],
  checkInTime: '09:00',
  checkOutTime: '18:00',
  checkInTolerance: 10,
  checkOutTolerance: 10,
  holidays: [],
}

export default function SettingsPage() {
  const { t } = useI18n()
  const [config, setConfig] = useState<Config>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newHoliday, setNewHoliday] = useState('')
  const [holidayLabel, setHolidayLabel] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { setConfig(d.config); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function update(patch: Partial<Config>) {
    setConfig(c => ({ ...c, ...patch }))
    setDirty(true)
  }

  function toggleDay(day: number) {
    const next = config.workDays.includes(day)
      ? config.workDays.filter(d => d !== day)
      : [...config.workDays, day].sort()
    if (next.length === 0) return toast.error('Debe haber al menos un día laboral')
    update({ workDays: next })
  }

  function addHoliday() {
    if (!newHoliday) return toast.error('Selecciona una fecha')
    if (config.holidays.includes(newHoliday)) return toast.error('Esa fecha ya está registrada')
    const entry = holidayLabel.trim() ? `${newHoliday}|${holidayLabel.trim()}` : newHoliday
    update({ holidays: [...config.holidays, entry].sort() })
    setNewHoliday('')
    setHolidayLabel('')
  }

  function removeHoliday(h: string) {
    update({ holidays: config.holidays.filter(x => x !== h) })
  }

  function parseHoliday(h: string) {
    const [date, label] = h.split('|')
    return { date, label: label || '' }
  }

  function formatHolidayDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    return `${d} ${months[parseInt(m) - 1]} ${y}`
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      toast.success(t('settings.saved'))
      setDirty(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setConfig(DEFAULT)
    setDirty(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <Settings className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
            <p className="text-gray-400 text-sm">{t('settings.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Restablecer
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Días laborales */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-semibold text-white">{t('settings.workDays')}</h2>
        </div>
        <p className="text-sm text-gray-400">Selecciona los días que se consideran hábiles para el cálculo de asistencia.</p>

        <div className="flex gap-2 flex-wrap">
          {DAYS.map(day => {
            const active = config.workDays.includes(day.value)
            return (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={cn(
                  'flex flex-col items-center gap-1 w-14 py-3 rounded-xl border text-xs font-medium transition-all',
                  active
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                    : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                )}
              >
                <span className="text-base font-bold">{day.short}</span>
                <span className="text-[10px]">{day.label.slice(0, 3)}</span>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-gray-500">
          Días seleccionados: {config.workDays
            .sort()
            .map(d => DAYS.find(x => x.value === d)?.label)
            .join(', ')}
        </p>
      </div>

      {/* Horario y tolerancia */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-semibold text-white">{t('settings.workHours')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Hora de entrada */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">{t('settings.checkIn')}</label>
            <input
              type="time"
              value={config.checkInTime}
              onChange={e => update({ checkInTime: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Hora de salida */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">{t('settings.checkOut')}</label>
            <input
              type="time"
              value={config.checkOutTime}
              onChange={e => update({ checkOutTime: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Tolerancia entrada */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Tolerancia de entrada
              <span className="ml-2 text-blue-400 font-semibold">{config.checkInTolerance} min</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={config.checkInTolerance}
                onChange={e => update({ checkInTolerance: parseInt(e.target.value) })}
                className="flex-1 accent-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              El empleado puede llegar hasta {config.checkInTolerance} min tarde sin registrar retardo.
            </p>
          </div>

          {/* Tolerancia salida */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Tolerancia de salida
              <span className="ml-2 text-blue-400 font-semibold">{config.checkOutTolerance} min</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={config.checkOutTolerance}
                onChange={e => update({ checkOutTolerance: parseInt(e.target.value) })}
                className="flex-1 accent-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              El empleado puede salir hasta {config.checkOutTolerance} min antes sin penalización.
            </p>
          </div>
        </div>

        {/* Resumen visual */}
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400 mb-3 font-medium">{t('settings.schedulePreview')}</p>
          <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
            {/* Zona antes de entrada */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-gray-500 whitespace-nowrap">{t('settings.delay')}</span>
            </div>
            <div className="h-px bg-red-400/30 w-8 shrink-0" />

            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="text-emerald-400 font-mono font-semibold">{config.checkInTime}</span>
              <span className="text-gray-500">Entrada</span>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded text-amber-400 whitespace-nowrap">
                +{config.checkInTolerance} min
              </div>
              <span className="text-gray-500">{t('settings.tolerance')}</span>
            </div>
            <div className="flex-1 h-px bg-emerald-400/20 min-w-4" />

            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="text-orange-400 font-mono font-semibold">{config.checkOutTime}</span>
              <span className="text-gray-500">Salida</span>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded text-amber-400 whitespace-nowrap">
                -{config.checkOutTolerance} min
              </div>
              <span className="text-gray-500">{t('settings.tolerance')}</span>
            </div>
            <div className="h-px bg-gray-700 w-8 shrink-0" />
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-gray-500">Fin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Días festivos */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-semibold text-white">{t('settings.holidays')}</h2>
        </div>
        <p className="text-sm text-gray-400">Los días festivos no contarán como ausencias aunque el empleado no registre asistencia.</p>

        {/* Añadir festivo */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="date"
            value={newHoliday}
            onChange={e => setNewHoliday(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Nombre del festivo (opcional)"
            value={holidayLabel}
            onChange={e => setHolidayLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHoliday()}
            className="flex-1 min-w-40 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={addHoliday}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> Añadir
          </button>
        </div>

        {/* Lista de festivos */}
        {config.holidays.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 border border-dashed border-gray-700 rounded-xl">
            No hay días festivos configurados
          </div>
        ) : (
          <div className="space-y-2">
            {config.holidays.map(h => {
              const { date, label } = parseHoliday(h)
              return (
                <div
                  key={h}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <Calendar className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {label || 'Día festivo'}
                      </p>
                      <p className="text-xs text-gray-500">{formatHolidayDate(date)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeHoliday(h)}
                    className="flex items-center justify-center text-gray-600 group-hover:text-red-400 transition-all p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {config.holidays.length > 0 && (
          <p className="text-xs text-gray-500">{config.holidays.length} día{config.holidays.length !== 1 ? 's' : ''} festivo{config.holidays.length !== 1 ? 's' : ''} configurado{config.holidays.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Botón guardar flotante (visible si hay cambios) */}
      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      )}
    </div>
  )
}
