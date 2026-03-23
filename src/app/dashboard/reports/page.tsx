// src/app/dashboard/reports/page.tsx
'use client'
import { useState } from 'react'
import { Download, FileText, Loader2, Calendar, Building2, User } from 'lucide-react'
import toast from 'react-hot-toast'

const DEPTS = ['', 'Tecnología', 'Recursos Humanos', 'Ventas', 'Marketing', 'Operaciones', 'Finanzas']

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: '',
  })

  const handleDownload = async (format: 'CSV' | 'JSON') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...form,
        format,
      })
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error('Error generando reporte')

      if (format === 'CSV') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_asistencia_${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Reporte descargado')
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_asistencia_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Reporte JSON descargado')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const presets = [
    { label: 'Esta semana', days: 7 },
    { label: 'Este mes', days: 30 },
    { label: 'Últimos 3 meses', days: 90 },
    { label: 'Este año', days: 365 },
  ]

  const applyPreset = (days: number) => {
    setForm(f => ({
      ...f,
      startDate: new Date(Date.now() - days * 86400000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-gray-400 text-sm mt-1">Genera reportes de asistencia en CSV o JSON</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Quick presets */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">Período rápido</p>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button key={p.label} onClick={() => applyPreset(p.days)}
                className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Fecha inicio
            </label>
            <input type="date" value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Fecha fin
            </label>
            <input type="date" value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Departamento (opcional)
            </label>
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">Todos los departamentos</option>
              {DEPTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => handleDownload('CSV')} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-sm font-medium transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Descargar CSV
          </button>
          <button onClick={() => handleDownload('JSON')} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Descargar JSON
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Campos incluidos en el reporte</h3>
        <div className="grid grid-cols-2 gap-2">
          {['Empleado', 'Email', 'Departamento', 'Cargo', 'Fecha', 'Check-in', 'Check-out', 'Estado', 'Retardo (min)', 'Notas'].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
