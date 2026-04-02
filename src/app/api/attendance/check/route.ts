// src/app/api/attendance/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getWorkConfig, validateCheckTime, calcLateMinutes, isWorkDay } from '@/lib/schedule'
import { notify, notifyAdmins } from '@/lib/notifications'

const checkSchema = z.object({
  userId:         z.string().cuid(),
  method:         z.enum(['MANUAL', 'QR', 'RFID', 'ADMIN_OVERRIDE']).default('MANUAL'),
  location:       z.string().optional(),
  overrideTime:   z.string().optional(),
  reason:         z.string().optional(),
  timezoneOffset: z.number().optional(),
})

// Build a UTC-midnight Date for the day of `ref`, ignoring time portion.
// Using ISO date string forces UTC interpretation and avoids server TZ issues.
function todayUTC(ref: Date): Date {
  const iso = ref.toISOString().slice(0, 10) // "YYYY-MM-DD"
  return new Date(iso + 'T00:00:00.000Z')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body   = await req.json()
  const parsed = checkSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { userId, method, location, overrideTime, reason, timezoneOffset } = parsed.data
  const isAdmin         = session.user.role === 'ADMIN'
  const isAdminOverride = method === 'ADMIN_OVERRIDE'

  if (!isAdmin && userId !== session.user.id)
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (isAdminOverride && !isAdmin)
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.isActive)
    return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 404 })

  const config = await getWorkConfig()
  const now    = overrideTime ? new Date(overrideTime) : new Date()

  // Use ISO-based UTC midnight so it always matches @db.Date stored values
  const dateKey = todayUTC(now)

  if (!isAdmin && !isWorkDay(now, config))
    return NextResponse.json({ error: 'Hoy no es un día laboral.', code: 'NON_WORK_DAY' }, { status: 422 })

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  // Load existing record for today
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: dateKey } },
  })

  const alreadyIn  = !!existing?.checkIn
  const alreadyOut = !!existing?.checkOut

  // ── Strict flow validation ───────────────────────────────────────────────
  // Enforce: no entry without prior exit, no double exit
  if (alreadyIn && alreadyOut) {
    return NextResponse.json({
      error: 'Ya se registró la jornada completa de hoy (entrada y salida).',
      code: 'ALREADY_DONE',
    }, { status: 409 })
  }

  if (alreadyIn && !alreadyOut) {
    // Next action must be EXIT — cannot mark entry again
    const checkType = 'exit'
    if (!isAdmin) {
      const validation = validateCheckTime(now, checkType, config, timezoneOffset)
      if (!validation.allowed)
        return NextResponse.json({
          error: validation.reason, code: 'TIME_RESTRICTED',
          checkInDeadline:  validation.checkInDeadline,
          checkOutStart:    validation.checkOutStart,
          checkOutDeadline: validation.checkOutDeadline,
        }, { status: 422 })
    }

    const attendance = await prisma.attendance.update({
      where: { id: existing!.id },
      data:  {
        checkOut: now,
        notes:    existing?.notes ?? reason ?? null,
        // Preserve existing source if already admin-marked; only overwrite on new admin action
        ...(isAdminOverride && {
          source:   'ADMIN',
          markedBy: session.user.name ?? 'Admin',
        }),
      },
    })

    await prisma.accessLog.create({ data: { userId, action: 'EXIT', method, ipAddress, location } })

    if (isAdminOverride) {
      await notify.adminMark(userId, session.user.name!, 'EXIT', now.toTimeString().slice(0, 5), reason || '')
      await prisma.auditLog.create({
        data: { actorId: session.user.id, userId, action: 'ADMIN_MARK_EXIT', entity: 'Attendance', entityId: attendance.id, newData: { time: now, reason } },
      })
    } else {
      await notify.checkOut(userId)
    }

    return NextResponse.json({
      success: true, attendance, action: 'EXIT',
      message: isAdminOverride
        ? `Salida registrada manualmente para ${user.name} a las ${now.toTimeString().slice(0, 5)}`
        : 'Salida registrada exitosamente',
    })
  }

  // No entry yet — must be ENTRY
  if (!alreadyIn) {
    const checkType = 'entry'
    if (!isAdmin) {
      const validation = validateCheckTime(now, checkType, config, timezoneOffset)
      if (!validation.allowed)
        return NextResponse.json({
          error: validation.reason, code: 'TIME_RESTRICTED',
          checkInDeadline:  validation.checkInDeadline,
          checkOutStart:    validation.checkOutStart,
          checkOutDeadline: validation.checkOutDeadline,
        }, { status: 422 })
    }

    const lateMinutes = calcLateMinutes(now, config, timezoneOffset)
    const status      = lateMinutes > 0 ? 'LATE' : 'PRESENT'

    // Use create instead of upsert to enforce strict flow — no overwriting existing entry
    const attendance = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data:  {
            checkIn: now, status, lateMinutes, notes: reason ?? null,
            source:   isAdminOverride ? 'ADMIN' : 'USER',
            markedBy: isAdminOverride ? (session.user.name ?? 'Admin') : null,
          },
        })
      : await prisma.attendance.create({
          data: {
            userId, date: dateKey, checkIn: now, status, lateMinutes, notes: reason ?? null,
            source:   isAdminOverride ? 'ADMIN' : 'USER',
            markedBy: isAdminOverride ? (session.user.name ?? 'Admin') : null,
          },
        })

    await prisma.accessLog.create({ data: { userId, action: 'ENTRY', method, ipAddress, location } })

    if (isAdminOverride) {
      await notify.adminMark(userId, session.user.name!, 'ENTRY', now.toTimeString().slice(0, 5), reason || '')
      await prisma.auditLog.create({
        data: { actorId: session.user.id, userId, action: 'ADMIN_MARK_ENTRY', entity: 'Attendance', entityId: attendance.id, newData: { time: now, reason } },
      })
    } else {
      await notify.checkIn(userId, user.name, lateMinutes)
      if (lateMinutes >= 5)
        await notifyAdmins('Alerta de retardo', `${user.name} registró entrada con ${lateMinutes} min de retardo`, 'WARNING')
    }

    return NextResponse.json({
      success: true, attendance, action: 'ENTRY',
      message: isAdminOverride
        ? `Entrada registrada manualmente para ${user.name} a las ${now.toTimeString().slice(0, 5)}`
        : lateMinutes > 0
          ? `Entrada registrada con ${lateMinutes} min de retardo`
          : 'Entrada registrada exitosamente',
    })
  }

  return NextResponse.json({ error: 'Estado de asistencia inconsistente' }, { status: 500 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId   = searchParams.get('userId') || session.user.id
  const tzOffset = searchParams.get('tz') ? parseInt(searchParams.get('tz')!) : undefined

  if (session.user.role !== 'ADMIN' && userId !== session.user.id)
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const now     = new Date()
  const dateKey = todayUTC(now)

  const [attendance, config] = await Promise.all([
    prisma.attendance.findUnique({ where: { userId_date: { userId, date: dateKey } } }),
    getWorkConfig(),
  ])

  const entryValidation = validateCheckTime(now, 'entry', config, tzOffset)
  const exitValidation  = validateCheckTime(now, 'exit',  config, tzOffset)

  return NextResponse.json({
    attendance,
    schedule: {
      checkInTime:      config.checkInTime,
      checkOutTime:     config.checkOutTime,
      checkInTolerance: config.checkInTolerance,
      checkOutTolerance: config.checkOutTolerance,
      checkInDeadline:  entryValidation.checkInDeadline,
      checkOutStart:    exitValidation.checkOutStart,
      isWorkDay:        isWorkDay(now, config),
    },
  })
}
