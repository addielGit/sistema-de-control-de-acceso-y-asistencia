// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().max(30).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  avatar: z.string().optional(), // base64 data URL o URL externa
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      position: true,
      phone: true,
      avatar: true,
      qrCode: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();

  // Cambio de contraseña
  if (body.currentPassword !== undefined) {
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password,
    );
    if (!valid)
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 },
      );

    const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        userId: session.user.id,
        action: "CHANGE_PASSWORD",
        entity: "User",
        entityId: session.user.id,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada",
    });
  }

  // Actualizar perfil
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      position: true,
      phone: true,
      avatar: true,
      updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      userId: session.user.id,
      action: "UPDATE_PROFILE",
      entity: "User",
      entityId: session.user.id,
      newData: parsed.data,
    },
  });

  return NextResponse.json({ success: true, user });
}
