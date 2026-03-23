// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reportSchema } from '@/lib/validations'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = reportSchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

  const { startDate, endDate, department, userId, format: fmt } = parsed.data

  const start = new Date(startDate)
  const end = new Date(endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  const where: any = {
    date: { gte: start, lte: end },
    ...(userId && { userId }),
    ...(department && { user: { department } }),
  }

  const records = await prisma.attendance.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, department: true, position: true } },
    },
    orderBy: [{ date: 'asc' }, { user: { name: 'asc' } }],
  })

  const rows = records.map(r => ({
    Empleado: r.user.name,
    Email: r.user.email,
    Departamento: r.user.department || '',
    Cargo: r.user.position || '',
    Fecha: format(r.date, 'dd/MM/yyyy'),
    'Check-in': r.checkIn ? format(r.checkIn, 'HH:mm') : '--',
    'Check-out': r.checkOut ? format(r.checkOut, 'HH:mm') : '--',
    Estado: r.status,
    'Retardo (min)': r.lateMinutes,
    Notas: r.notes || '',
  }))

  if (fmt === 'CSV') {
    const headers = Object.keys(rows[0] || {})
    const csv = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = String((row as any)[h] ?? '')
          return val.includes(',') ? `"${val}"` : val
        }).join(',')
      ),
    ].join('\n')

    return new NextResponse('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reporte_asistencia_${format(new Date(), 'yyyyMMdd')}.csv"`,
      },
    })
  }

  return NextResponse.json({ data: rows, total: rows.length })
}
