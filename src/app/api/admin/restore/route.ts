// src/app/api/admin/restore/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// NOTE: In Next.js App Router, body size limit is set in next.config.js,
// not here. The `export const config` pattern is Pages Router only.

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let backup: any
  const contentType = req.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file')
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 })
      }
      const text = await (file as File).text()
      if (!text?.trim()) return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
      backup = JSON.parse(text)
    } else {
      const text = await req.text()
      if (!text?.trim()) return NextResponse.json({ error: 'El cuerpo está vacío' }, { status: 400 })
      backup = JSON.parse(text)
    }
  } catch (err: any) {
    return NextResponse.json({
      error: `Archivo inválido: ${err.message}. Asegúrate de que sea un JSON de backup de AccessFlow.`,
    }, { status: 400 })
  }

  // Validate structure
  if (!backup?.meta?.version || !backup?.data) {
    return NextResponse.json({
      error: 'El archivo no es un backup válido de AccessFlow. Falta meta.version o data.',
    }, { status: 400 })
  }

  const { users, attendances, accessLogs, auditLogs, notifications, workConfig, workSchedules } = backup.data

  if (!users?.length) {
    return NextResponse.json({ error: 'El backup no contiene usuarios. Archivo posiblemente corrupto.' }, { status: 400 })
  }

  // Validate that restored users have required fields
  const requiredUserFields = ['id', 'email', 'name', 'password', 'role']
  const invalidUser = users.find((u: any) => requiredUserFields.some(f => !u[f]))
  if (invalidUser) {
    return NextResponse.json({
      error: `Usuario inválido en backup (faltan campos requeridos). Email: ${invalidUser.email || 'desconocido'}`,
    }, { status: 400 })
  }

  const results: Record<string, number> = {}
  const errors: string[] = []

  try {
    // ── Step 1: Delete in dependency order ───────────────────────────────
    await prisma.notification.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.accessLog.deleteMany()
    await prisma.attendance.deleteMany()
    await prisma.workConfig.deleteMany()
    await prisma.workSchedule.deleteMany()
    await prisma.user.deleteMany()

    // ── Step 2: Insert in batches of 50 (smaller = safer for prod) ───────
    const batchInsert = async (
      label: string,
      createFn: (data: any[]) => Promise<{ count: number }>,
      data: any[]
    ) => {
      if (!data?.length) { results[label] = 0; return }
      let count = 0
      const BATCH = 50
      for (let i = 0; i < data.length; i += BATCH) {
        try {
          const r = await createFn(data.slice(i, i + BATCH))
          count += r.count
        } catch (err: any) {
          errors.push(`${label} batch ${i}-${i + BATCH}: ${err.message}`)
        }
      }
      results[label] = count
    }

    await batchInsert('users', (d) =>
      prisma.user.createMany({ data: d, skipDuplicates: true }), users)

    await batchInsert('attendances', (d) =>
      prisma.attendance.createMany({ data: d, skipDuplicates: true }), attendances ?? [])

    await batchInsert('accessLogs', (d) =>
      prisma.accessLog.createMany({ data: d, skipDuplicates: true }), accessLogs ?? [])

    await batchInsert('auditLogs', (d) =>
      prisma.auditLog.createMany({ data: d, skipDuplicates: true }), auditLogs ?? [])

    await batchInsert('notifications', (d) =>
      prisma.notification.createMany({ data: d, skipDuplicates: true }), notifications ?? [])

    if (workConfig?.length) {
      await batchInsert('workConfig', (d) =>
        prisma.workConfig.createMany({ data: d, skipDuplicates: true }), workConfig)
    }

    if (workSchedules?.length) {
      await batchInsert('workSchedules', (d) =>
        prisma.workSchedule.createMany({ data: d, skipDuplicates: true }), workSchedules)
    }

    // ── Step 3: Audit log (using the restored admin user) ────────────────
    // Find any admin in the restored data to use as actor
    const restoredAdmin = users.find((u: any) => u.role === 'ADMIN')
    if (restoredAdmin) {
      await prisma.auditLog.create({
        data: {
          actorId: restoredAdmin.id,
          action:  'RESTORE_BACKUP',
          entity:  'System',
          newData: {
            restoredFrom: backup.meta.createdAt,
            restoredBy:   session.user.email,
            results,
            errors: errors.length ? errors : undefined,
          },
        },
      }).catch(() => {})
    }

    const hasErrors = errors.length > 0
    return NextResponse.json({
      success:  !hasErrors,
      partial:  hasErrors,
      message:  hasErrors
        ? `Restauración parcial completada con ${errors.length} error(es)`
        : 'Base de datos restaurada exitosamente',
      restored: results,
      errors:   hasErrors ? errors : undefined,
      meta: {
        backupDate: backup.meta.createdAt,
        backupBy:   backup.meta.createdBy,
      },
    })

  } catch (err: any) {
    console.error('[RESTORE] Fatal error:', err)
    return NextResponse.json({
      error: `Error crítico durante la restauración: ${err.message}`,
      partial: true,
      details: 'Es posible que la base de datos haya quedado en un estado inconsistente. Intenta restaurar de nuevo.',
    }, { status: 500 })
  }
}
