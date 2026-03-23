// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateQRCode } from '../src/lib/qr'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@accessflow.com' },
    update: {},
    create: {
      email: 'admin@accessflow.com',
      name: 'Admin Principal',
      password: adminPassword,
      role: Role.ADMIN,
      department: 'Tecnología',
      position: 'Administrador del Sistema',
      qrCode: 'QR-ADMIN-001',
      isActive: true,
    },
  })

  // Create sample employees
  const employees = [
    { name: 'María García', email: 'maria@accessflow.com', dept: 'Recursos Humanos', pos: 'HR Manager' },
    { name: 'Carlos López', email: 'carlos@accessflow.com', dept: 'Ventas', pos: 'Sales Executive' },
    { name: 'Ana Martínez', email: 'ana@accessflow.com', dept: 'Marketing', pos: 'Marketing Lead' },
    { name: 'Luis Torres', email: 'luis@accessflow.com', dept: 'Operaciones', pos: 'Operations Manager' },
    { name: 'Sofia Ramírez', email: 'sofia@accessflow.com', dept: 'Finanzas', pos: 'Financial Analyst' },
  ]

  const empPassword = await bcrypt.hash('employee123', 12)
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        name: emp.name,
        password: empPassword,
        role: Role.EMPLOYEE,
        department: emp.dept,
        position: emp.pos,
        qrCode: `QR-EMP-00${i + 1}`,
        isActive: true,
      },
    })
  }

  // Create default work schedule
  await prisma.workSchedule.upsert({
    where: { id: 'default-schedule' },
    update: {},
    create: {
      id: 'default-schedule',
      name: 'Horario Estándar',
      checkInTime: '09:00',
      checkOutTime: '18:00',
      lateTolerance: 15,
      isDefault: true,
    },
  })

  // Seed attendance for last 30 days
  const users = await prisma.user.findMany({ where: { role: Role.EMPLOYEE } })
  const today = new Date()

  for (const user of users) {
    for (let d = 29; d >= 0; d--) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue // Skip weekends

      const rand = Math.random()
      if (rand < 0.05) continue // 5% absent

      const isLate = rand > 0.8
      const checkInHour = isLate ? 9 : 8
      const checkInMin = isLate ? Math.floor(Math.random() * 30) + 15 : Math.floor(Math.random() * 30)
      const lateMinutes = isLate ? checkInMin : 0

      const checkIn = new Date(date)
      checkIn.setHours(checkInHour, checkInMin, 0, 0)

      const checkOut = new Date(date)
      checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0)

      const dateOnly = new Date(date)
      dateOnly.setHours(0, 0, 0, 0)

      await prisma.attendance.upsert({
        where: { userId_date: { userId: user.id, date: dateOnly } },
        update: {},
        create: {
          userId: user.id,
          date: dateOnly,
          checkIn,
          checkOut,
          status: isLate ? 'LATE' : 'PRESENT',
          lateMinutes,
        },
      })
    }
  }

  console.log('✅ Seed completed!')
  console.log('👤 Admin: admin@accessflow.com / admin123')
  console.log('👤 Employee: maria@accessflow.com / employee123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
