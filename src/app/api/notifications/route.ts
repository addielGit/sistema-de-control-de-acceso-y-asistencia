// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — listar notificaciones del usuario actual
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const page = parseInt(searchParams.get("page") || "1");

  const where = {
    userId: session.user.id,
    ...(unreadOnly && { isRead: false }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({ notifications, total, unreadCount, page, limit });
}

// PATCH — marcar como leída(s) — cualquier usuario sobre sus propias notifs
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, markAll } = body;

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (id) {
    // Verificar que la notificación pertenece al usuario
    const notif = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!notif)
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Se requiere id o markAll" },
    { status: 400 },
  );
}

// DELETE — solo administradores pueden eliminar notificaciones
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Solo admins pueden eliminar
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo los administradores pueden eliminar notificaciones" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all") === "true";
  const userId = searchParams.get("userId"); // admin puede eliminar de cualquier usuario

  if (all) {
    // Eliminar todas las leídas del usuario especificado (o del admin si no se especifica)
    const targetUserId = userId || session.user.id;
    await prisma.notification.deleteMany({
      where: { userId: targetUserId, isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (id) {
    // Verificar que existe (admin puede eliminar de cualquier usuario)
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif)
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Se requiere id o all" }, { status: 400 });
}
