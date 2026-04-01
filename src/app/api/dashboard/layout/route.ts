// src/app/api/dashboard/layout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_IDS = new Set([
  'stat-employees','stat-present','stat-late','stat-absent',
  'attendance-rate','weekly-chart','dept-chart','recent-activity',
])
const VALID_SPANS = new Set(['quarter','half','full'])

/** GET — returns the saved layout for the current admin, or null */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ layout: null })

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { dashboardLayout: true },
  })

  return NextResponse.json({ layout: user?.dashboardLayout ?? null })
}

/** PUT — saves the layout for the current admin */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores pueden guardar el layout' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.layout)) {
    return NextResponse.json({ error: 'Layout inválido' }, { status: 400 })
  }

  // Validate each widget entry
  const layout = body.layout as any[]
  for (const w of layout) {
    if (!VALID_IDS.has(w.id) || !VALID_SPANS.has(w.span)) {
      return NextResponse.json({ error: `Widget inválido: ${w.id}` }, { status: 400 })
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { dashboardLayout: layout },
  })

  return NextResponse.json({ success: true })
}
