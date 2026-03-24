// src/components/dashboard/AdminDashboard.tsx
'use client'
import { useEffect, useState } from 'react'
import { Users, UserCheck, UserX, Clock, TrendingUp, Activity } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { DashboardStats } from '@/types'
import { formatDateTime } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'

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

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  if (!stats) return <p className="text-gray-500 text-center py-12">Error cargando datos</p>

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Resumen de asistencia de hoy</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Empleados" value={stats.totalEmployees} icon={Users} iconColor="text-blue-400" subtitle="Activos en el sistema" />
        <StatCard title="Presentes Hoy" value={stats.presentToday} icon={UserCheck} iconColor="text-emerald-400" trend={{ value: 5, label: 'vs ayer' }} />
        <StatCard title="Retardos" value={stats.lateToday} icon={Clock} iconColor="text-amber-400" />
        <StatCard title="Ausentes" value={stats.absentToday} icon={UserX} iconColor="text-red-400" />
      </div>

      {/* Attendance rate */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-300">Tasa de Asistencia Global</p>
          <span className="text-2xl font-bold text-white">{stats.attendanceRate}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${stats.attendanceRate}%`,
              background: `linear-gradient(90deg, #3b82f6, #8b5cf6)`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly chart */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Asistencia Semanal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
              <Area type="monotone" dataKey="present" name="Presentes" stroke="#34d399" fill="url(#gPresent)" strokeWidth={2} />
              <Area type="monotone" dataKey="late" name="Retardos" stroke="#fbbf24" fill="url(#gLate)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department chart */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Por Departamento</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.departmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="department" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" name="Asistencia %" radius={[6, 6, 0, 0]}>
                {stats.departmentData.map((_, i) => (
                  <Cell key={i} fill={['#3b82f6','#8b5cf6','#34d399','#f59e0b','#ef4444'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Actividad Reciente</h3>
        </div>
        <div className="space-y-3">
          {stats.recentActivity.slice(0, 8).map((log: any) => (
            <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-900/50 hover:bg-gray-900 transition-colors">
              <div className={`flex items-center justify-center text-xs font-bold ${log.action === 'ENTRY' ? 'text-emerald-400' : 'text-orange-400'}`}>
                {log.action === 'ENTRY' ? '→' : '←'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{log.user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{log.action === 'ENTRY' ? 'Registró entrada' : 'Registró salida'}</p>
              </div>
              <p className="text-xs text-gray-500 shrink-0">{formatDateTime(log.timestamp)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full">
      <div className="h-8 w-48 skeleton rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 skeleton rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </div>
  )
}
