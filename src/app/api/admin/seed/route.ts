// src/app/api/admin/seed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const adminPassword = await bcrypt.hash('admin123', 12)
    const empPassword   = await bcrypt.hash('employee123', 12)

    // Create demo admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@accessflow.com' },
      update: {},
      create: {
        email:      'admin@accessflow.com',
        name:       'Admin Principal',
        password:   adminPassword,
        role:       'ADMIN',
        department: 'Tecnología',
        position:   'Administrador del Sistema',
        qrCode:     'QR-DEMO-ADMIN-001',
        isActive:   true,
      },
    })

    const employeeDefs = [
      { name: 'María García',   email: 'maria@accessflow.com',  dept: 'Recursos Humanos', pos: 'HR Manager',           qr: 'QR-DEMO-EMP-001' },
      { name: 'Carlos López',   email: 'carlos@accessflow.com', dept: 'Ventas',            pos: 'Sales Executive',      qr: 'QR-DEMO-EMP-002' },
      { name: 'Ana Martínez',   email: 'ana@accessflow.com',    dept: 'Marketing',         pos: 'Marketing Lead',       qr: 'QR-DEMO-EMP-003' },
      { name: 'Luis Torres',    email: 'luis@accessflow.com',   dept: 'Operaciones',       pos: 'Operations Manager',   qr: 'QR-DEMO-EMP-004' },
      { name: 'Sofia Ramírez',  email: 'sofia@accessflow.com',  dept: 'Finanzas',          pos: 'Financial Analyst',    qr: 'QR-DEMO-EMP-005' },
    ]

    const employees = []
    for (const emp of employeeDefs) {
      const u = await prisma.user.upsert({
        where:  { email: emp.email },
        update: {},
        create: { email: emp.email, name: emp.name, password: empPassword, role: 'EMPLOYEE', department: emp.dept, position: emp.pos, qrCode: emp.qr, isActive: true },
      })
      employees.push(u)
    }

    // Seed 30 days of attendance for employees
    const today = new Date()
    let attCount = 0

    for (const user of employees) {
      for (let d = 29; d >= 0; d--) {
        const date = new Date(today)
        date.setDate(date.getDate() - d)
        if (date.getDay() === 0 || date.getDay() === 6) continue

        const rand = Math.random()
        if (rand < 0.05) continue // 5% absent

        const isLate      = rand > 0.80
        const checkInHour = isLate ? 9 : 8
        const checkInMin  = isLate ? Math.floor(Math.random() * 30) + 15 : Math.floor(Math.random() * 30)
        const lateMinutes = isLate ? checkInMin : 0

        const checkIn  = new Date(date); checkIn.setHours(checkInHour, checkInMin, 0, 0)
        const checkOut = new Date(date); checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0)

        const dateOnly = new Date(date); dateOnly.setHours(0, 0, 0, 0)

        await prisma.attendance.upsert({
          where:  { userId_date: { userId: user.id, date: dateOnly } },
          update: {},
          create: { userId: user.id, date: dateOnly, checkIn, checkOut, status: isLate ? 'LATE' : 'PRESENT', lateMinutes },
        })
        attCount++
      }
    }

    // Default work schedule
    await prisma.workConfig.upsert({
      where:  { id: (await prisma.workConfig.findFirst())?.id ?? 'new' },
      update: {},
      create: { workDays: [1,2,3,4,5], checkInTime: '09:00', checkOutTime: '18:00', checkInTolerance: 10, checkOutTolerance: 10, holidays: [] },
    }).catch(() => {})

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: 'SEED_DEMO_DATA', entity: 'System', newData: { users: employees.length + 1, attendances: attCount } },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Datos de prueba creados exitosamente',
      created: { users: employees.length + 1, attendances: attCount },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
