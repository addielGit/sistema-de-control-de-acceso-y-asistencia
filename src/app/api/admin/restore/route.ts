// src/app/api/admin/restore/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let backup: any
  try {
    backup = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Validate backup structure
  if (!backup?.meta?.version || !backup?.data) {
    return NextResponse.json({ error: 'El archivo no es un backup válido de AccessFlow' }, { status: 400 })
  }

  const { users, attendances, accessLogs, auditLogs, notifications, workConfig, workSchedules } = backup.data

  try {
    // Restore in a transaction — clear all then insert
    await prisma.$transaction(async (tx) => {
      // Clear in reverse dependency order
      await tx.notification.deleteMany()
      await tx.auditLog.deleteMany()
      await tx.accessLog.deleteMany()
      await tx.attendance.deleteMany()
      await tx.workConfig.deleteMany()
      await tx.workSchedule.deleteMany()
      await tx.user.deleteMany()

      // Restore users first (other tables depend on userId)
      if (users?.length) {
        await tx.user.createMany({ data: users, skipDuplicates: true })
      }
      if (attendances?.length) {
        await tx.attendance.createMany({ data: attendances, skipDuplicates: true })
      }
      if (accessLogs?.length) {
        await tx.accessLog.createMany({ data: accessLogs, skipDuplicates: true })
      }
      if (auditLogs?.length) {
        await tx.auditLog.createMany({ data: auditLogs, skipDuplicates: true })
      }
      if (notifications?.length) {
        await tx.notification.createMany({ data: notifications, skipDuplicates: true })
      }
      if (workConfig?.length) {
        await tx.workConfig.createMany({ data: workConfig, skipDuplicates: true })
      }
      if (workSchedules?.length) {
        await tx.workSchedule.createMany({ data: workSchedules, skipDuplicates: true })
      }
    }, { timeout: 30000 })

    // Log this critical action
    await prisma.auditLog.create({
      data: {
        actorId:  session.user.id,
        action:   'RESTORE_BACKUP',
        entity:   'System',
        newData:  { restoredFrom: backup.meta.createdAt, restoredBy: session.user.email },
      },
    }).catch(() => {}) // Non-critical

    return NextResponse.json({
      success: true,
      message: 'Base de datos restaurada exitosamente',
      restored: backup.meta.counts,
    })
  } catch (err: any) {
    console.error('Restore error:', err)
    return NextResponse.json({ error: `Error al restaurar: ${err.message}` }, { status: 500 })
  }
}
