// src/app/api/attendance/request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyAdmins } from '@/lib/notifications'

const schema = z.object({
  userId:          z.string().cuid(),
  type:            z.enum(['ENTRY', 'EXIT']),
  reason:          z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
  timezoneOffset:  z.number().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { userId, type, reason } = parsed.data

  // Only the employee themselves can submit a request for their own ID
  if (userId !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, department: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const typeLabel = type === 'ENTRY' ? 'entrada' : 'salida'
  const now       = new Date()
  const timeStr   = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  const dateStr   = now.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })

  // Notify all admins
  await notifyAdmins(
    `Solicitud de marcaje manual — ${user.name}`,
    `${user.name}${user.department ? ` (${user.department})` : ''} solicita que registres su ${typeLabel} del ${dateStr} a las ${timeStr}. Motivo: "${reason}"`,
    'WARNING'
  )

  // Log in audit
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action:  'REQUEST_MANUAL_MARK',
      entity:  'Attendance',
      newData: { type, reason, requestedAt: now },
    },
  })

  return NextResponse.json({ success: true, message: 'Solicitud enviada a los administradores' })
}
