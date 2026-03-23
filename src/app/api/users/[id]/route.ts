// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateUserSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const canAccess = session.user.role === 'ADMIN' || session.user.id === params.id
  if (!canAccess) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, email: true, name: true, role: true,
      department: true, position: true, phone: true,
      avatar: true, isActive: true, qrCode: true,
      createdAt: true, updatedAt: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const oldUser = await prisma.user.findUnique({ where: { id: params.id } })
  if (!oldUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const user = await prisma.user.update({
    where: { id: params.id },
    data: parsed.data,
    select: {
      id: true, email: true, name: true, role: true,
      department: true, position: true, isActive: true, updatedAt: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      userId: params.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: params.id,
      oldData: { name: oldUser.name, isActive: oldUser.isActive },
      newData: parsed.data,
    },
  })

  return NextResponse.json({ success: true, user })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      userId: params.id,
      action: 'DEACTIVATE',
      entity: 'User',
      entityId: params.id,
    },
  })

  return NextResponse.json({ success: true, message: 'Usuario desactivado' })
}
