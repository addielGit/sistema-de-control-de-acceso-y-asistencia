// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  const [totalEmployees, todayAttendances, recentActivity] = await Promise.all([
    prisma.user.count({ where: { role: 'EMPLOYEE', isActive: true } }),
    prisma.attendance.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { user: { select: { department: true } } },
    }),
    prisma.accessLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { name: true, email: true, avatar: true } } },
    }),
  ])

  const presentToday = todayAttendances.filter(a => a.status === 'PRESENT').length
  const lateToday = todayAttendances.filter(a => a.status === 'LATE').length
  const checkedInToday = todayAttendances.length
  const absentToday = totalEmployees - checkedInToday

  // Weekly data (last 7 days)
  const weeklyData = []
  for (let i = 6; i >= 0; i--) {
    const day = subDays(today, i)
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)
    const dayAttendances = await prisma.attendance.groupBy({
      by: ['status'],
      where: { date: { gte: dayStart, lte: dayEnd } },
      _count: { status: true },
    })
    const map = Object.fromEntries(dayAttendances.map(d => [d.status, d._count.status]))
    weeklyData.push({
      day: format(day, 'EEE'),
      present: map.PRESENT || 0,
      late: map.LATE || 0,
      absent: map.ABSENT || 0,
    })
  }

  // Department attendance
  const departments = await prisma.user.groupBy({
    by: ['department'],
    where: { role: 'EMPLOYEE', isActive: true, department: { not: null } },
    _count: { id: true },
  })

  const departmentData = await Promise.all(
    departments.map(async (dept) => {
      const deptAttendances = todayAttendances.filter(a => a.user.department === dept.department)
      return {
        department: dept.department || 'Sin departamento',
        total: dept._count.id,
        present: deptAttendances.filter(a => a.status !== 'ABSENT').length,
        rate: dept._count.id > 0
          ? Math.round((deptAttendances.length / dept._count.id) * 100)
          : 0,
      }
    })
  )

  return NextResponse.json({
    totalEmployees,
    presentToday,
    lateToday,
    absentToday,
    attendanceRate: totalEmployees > 0 ? Math.round((checkedInToday / totalEmployees) * 100) : 0,
    weeklyData,
    departmentData,
    recentActivity,
  })
}
