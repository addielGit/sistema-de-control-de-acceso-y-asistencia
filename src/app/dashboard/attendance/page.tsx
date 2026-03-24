// src/app/dashboard/attendance/page.tsx
'use client'
import { useSession } from 'next-auth/react'
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard'
import { QRCodeWidget } from '@/components/attendance/QRCodeWidget'

export default function AttendancePage() {
  const { data: session } = useSession()
  if (!session) return null

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Registro de Asistencia</h1>
        <p className="text-gray-400 text-sm mt-1">Registra tu entrada y salida del día</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <EmployeeDashboard userId={session.user.id} />
        <QRCodeWidget userId={session.user.id} userName={session.user.name!} />
      </div>
    </div>
  )
}
