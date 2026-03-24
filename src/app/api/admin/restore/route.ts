// src/app/api/admin/restore/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Aumentar el límite del body para Vercel (default 4.5MB es insuficiente para backups grandes)
export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } },
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let backup: any

  const contentType = req.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('multipart/form-data')) {
      // El archivo viene como FormData (cuando el JSON es grande)
      const form = await req.formData()
      const file = form.get('file')
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No se encontró el archivo en el formulario' }, { status: 400 })
      }
      const text = await (file as File).text()
      backup = JSON.parse(text)
    } else {
      // application/json — intenta leer el body como texto primero para mejor error handling
      const text = await req.text()
      if (!text || text.length === 0) {
        return NextResponse.json({ error: 'El cuerpo de la petición está vacío' }, { status: 400 })
      }
      backup = JSON.parse(text)
    }
  } catch (err: any) {
    return NextResponse.json({
      error: `No se pudo leer el archivo de backup: ${err.message}`,
    }, { status: 400 })
  }

  if (!backup?.meta?.version || !backup?.data) {
    return NextResponse.json({ error: 'El archivo no es un backup válido de AccessFlow' }, { status: 400 })
  }

  const { users, attendances, accessLogs, auditLogs, notifications, workConfig, workSchedules } = backup.data

  try {
    // Restaurar por lotes para evitar timeouts en Vercel (max 10s en plan hobby)
    // Primero limpiar, luego insertar tabla por tabla fuera de una sola transacción grande
    await prisma.notification.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.accessLog.deleteMany()
    await prisma.attendance.deleteMany()
    await prisma.workConfig.deleteMany()
    await prisma.workSchedule.deleteMany()
    await prisma.user.deleteMany()

    // Insertar en lotes de 100 para no sobrecargar la conexión
    const batchInsert = async (createFn: (data: any[]) => Promise<any>, data: any[]) => {
      if (!data?.length) return
      const size = 100
      for (let i = 0; i < data.length; i += size) {
        await createFn(data.slice(i, i + size))
      }
    }

    await batchInsert(
      (d) => prisma.user.createMany({ data: d, skipDuplicates: true }),
      users
    )
    await batchInsert(
      (d) => prisma.attendance.createMany({ data: d, skipDuplicates: true }),
      attendances
    )
    await batchInsert(
      (d) => prisma.accessLog.createMany({ data: d, skipDuplicates: true }),
      accessLogs
    )
    await batchInsert(
      (d) => prisma.auditLog.createMany({ data: d, skipDuplicates: true }),
      auditLogs
    )
    await batchInsert(
      (d) => prisma.notification.createMany({ data: d, skipDuplicates: true }),
      notifications
    )
    if (workConfig?.length) {
      await prisma.workConfig.createMany({ data: workConfig, skipDuplicates: true })
    }
    if (workSchedules?.length) {
      await prisma.workSchedule.createMany({ data: workSchedules, skipDuplicates: true })
    }

    // Log (non-critical)
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action:  'RESTORE_BACKUP',
        entity:  'System',
        newData: { restoredFrom: backup.meta.createdAt, restoredBy: session.user.email },
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Base de datos restaurada exitosamente',
      restored: backup.meta.counts ?? backup.meta.tables,
    })
  } catch (err: any) {
    console.error('Restore error:', err)
    return NextResponse.json({ error: `Error al restaurar: ${err.message}` }, { status: 500 })
  }
}
