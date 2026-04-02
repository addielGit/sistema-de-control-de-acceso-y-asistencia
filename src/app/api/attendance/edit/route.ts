// src/app/api/attendance/edit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const editSchema = z.object({
  id:       z.string().cuid(),
  // ISO strings from client (already in correct UTC representation because
  // the client builds them with `new Date(localYear, localMonth, localDay, h, m).toISOString()`)
  checkIn:  z.string().nullable().optional(),
  checkOut: z.string().nullable().optional(),
  status:   z.enum(['PRESENT','LATE','ABSENT','HALF_DAY']).optional(),
  notes:    z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = editSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { id, checkIn, checkOut, status, notes } = parsed.data

  const existing = await prisma.attendance.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
  }

  // Resolve final values: use new value if provided, else keep existing
  const finalIn  = checkIn  !== undefined ? (checkIn  ? new Date(checkIn)  : null) : existing.checkIn
  const finalOut = checkOut !== undefined ? (checkOut ? new Date(checkOut) : null) : existing.checkOut

  // Validate: checkOut must be strictly after checkIn
  if (finalIn && finalOut) {
    if (finalOut.getTime() <= finalIn.getTime()) {
      return NextResponse.json({
        error: 'La hora de salida debe ser posterior a la hora de entrada',
      }, { status: 422 })
    }
  }

  const oldData = {
    checkIn:  existing.checkIn?.toISOString() ?? null,
    checkOut: existing.checkOut?.toISOString() ?? null,
    status:   existing.status,
    notes:    existing.notes,
  }

  // Build update payload — only include fields that were sent
  const updateData: any = {}
  if (checkIn  !== undefined) updateData.checkIn  = finalIn
  if (checkOut !== undefined) updateData.checkOut = finalOut
  if (status   !== undefined) updateData.status   = status
  if (notes    !== undefined) updateData.notes    = notes || null
  // Tag as admin edit
  updateData.source   = 'EDIT'
  updateData.markedBy = session.user.name ?? 'Admin'

  const updated = await prisma.attendance.update({
    where: { id },
    data:  updateData,
  })

  // Audit — non-critical
  await prisma.auditLog.create({
    data: {
      actorId:  session.user.id,
      userId:   existing.userId,
      action:   'EDIT_ATTENDANCE',
      entity:   'Attendance',
      entityId: id,
      oldData,
      newData: {
        checkIn:  finalIn?.toISOString()  ?? null,
        checkOut: finalOut?.toISOString() ?? null,
        status,
        notes,
      },
    },
  }).catch(() => {})

  return NextResponse.json({ success: true, attendance: updated })
}
