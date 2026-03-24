// src/app/api/admin/clear/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Demo emails created by the seed
const DEMO_EMAILS = [
  'admin@accessflow.com',
  'maria@accessflow.com',
  'carlos@accessflow.com',
  'ana@accessflow.com',
  'luis@accessflow.com',
  'sofia@accessflow.com',
]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { mode } = await req.json()
  // mode: 'demo' = delete only demo data | 'all' = delete everything except current user

  if (!['demo', 'all'].includes(mode)) {
    return NextResponse.json({ error: 'Modo inválido' }, { status: 400 })
  }

  try {
    let deleted: Record<string, number> = {}

    if (mode === 'demo') {
      // Get demo user IDs
      const demoUsers = await prisma.user.findMany({
        where: { email: { in: DEMO_EMAILS } },
        select: { id: true },
      })
      const demoIds = demoUsers.map(u => u.id)

      if (demoIds.length === 0) {
        return NextResponse.json({ success: true, message: 'No se encontraron datos de prueba', deleted: {} })
      }

      // Delete dependent data of demo users
      const [notifs, audits, logs, att] = await Promise.all([
        prisma.notification.deleteMany({ where: { userId: { in: demoIds } } }),
        prisma.auditLog.deleteMany({ where: { userId: { in: demoIds } } }),
        prisma.accessLog.deleteMany({ where: { userId: { in: demoIds } } }),
        prisma.attendance.deleteMany({ where: { userId: { in: demoIds } } }),
      ])

      // Delete demo users (skip current admin if they're in the list)
      const usersToDelete = demoIds.filter(id => id !== session.user.id)
      const users = await prisma.user.deleteMany({ where: { id: { in: usersToDelete } } })

      deleted = {
        users:       users.count,
        attendances: att.count,
        accessLogs:  logs.count,
        auditLogs:   audits.count,
        notifications: notifs.count,
      }

    } else if (mode === 'all') {
      // Delete everything except the current logged-in admin
      const [notifs, audits, logs, att] = await Promise.all([
        prisma.notification.deleteMany({ where: { userId: { not: session.user.id } } }),
        prisma.auditLog.deleteMany({ where: { userId: { not: session.user.id } } }),
        prisma.accessLog.deleteMany({ where: { userId: { not: session.user.id } } }),
        prisma.attendance.deleteMany({ where: { userId: { not: session.user.id } } }),
      ])
      const users = await prisma.user.deleteMany({ where: { id: { not: session.user.id } } })

      // Also clear own logs/notifs/attendance but keep the user
      await Promise.all([
        prisma.notification.deleteMany({ where: { userId: session.user.id } }),
        prisma.auditLog.deleteMany({ where: { userId: session.user.id } }),
        prisma.accessLog.deleteMany({ where: { userId: session.user.id } }),
        prisma.attendance.deleteMany({ where: { userId: session.user.id } }),
      ])

      deleted = {
        users:       users.count,
        attendances: att.count,
        accessLogs:  logs.count,
        auditLogs:   audits.count,
        notifications: notifs.count,
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action:  `CLEAR_DATA_${mode.toUpperCase()}`,
        entity:  'System',
        newData: { deleted },
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, deleted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
