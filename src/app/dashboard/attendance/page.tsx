// src/app/dashboard/attendance/page.tsx
'use client'
import { useI18n } from '@/lib/i18n-context'
import { useSession } from 'next-auth/react'
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard'
import { QRCodeWidget } from '@/components/attendance/QRCodeWidget'

export default function AttendancePage() {
  const { data: session } = useSession()
  const { t } = useI18n()
  if (!session) return null

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('attendance.title')}</h1>
        <p className="text-gray-400 text-sm mt-1">{t('attendance.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <EmployeeDashboard userId={session.user.id} />
        <QRCodeWidget userId={session.user.id} userName={session.user.name!} />
      </div>
    </div>
  )
}
