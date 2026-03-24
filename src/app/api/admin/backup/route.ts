// src/app/api/admin/backup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const [users, attendances, accessLogs, auditLogs, notifications, workConfig, workSchedules] =
    await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.attendance.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.accessLog.findMany({ orderBy: { timestamp: 'asc' } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.notification.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.workConfig.findMany(),
      prisma.workSchedule.findMany(),
    ])

  const backup = {
    meta: {
      version:   '1.0',
      app:       'AccessFlow',
      createdAt: new Date().toISOString(),
      createdBy: session.user.email,
      counts: {
        users:         users.length,
        attendances:   attendances.length,
        accessLogs:    accessLogs.length,
        auditLogs:     auditLogs.length,
        notifications: notifications.length,
        workConfig:    workConfig.length,
        workSchedules: workSchedules.length,
      },
    },
    data: { users, attendances, accessLogs, auditLogs, notifications, workConfig, workSchedules },
  }

  const json = JSON.stringify(backup, null, 2)
  const ts   = new Date().toISOString().slice(0, 19).replace(/:/g, '-')

  return new NextResponse(json, {
    headers: {
      'Content-Type':        'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="accessflow_backup_${ts}.json"`,
    },
  })
}
