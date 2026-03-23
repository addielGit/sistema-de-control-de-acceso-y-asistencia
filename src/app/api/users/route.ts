// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { generateQRCodeId } from "@/lib/qr";
import { notify } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const department = searchParams.get("department") || "";
  const role = searchParams.get("role") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(department && { department }),
    ...(role && { role }),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        avatar: true,
        isActive: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ data: users, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const { email, name, password, role, department, position, phone } =
    parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json(
      { error: "El email ya está registrado" },
      { status: 409 },
    );

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
      department,
      position,
      phone,
      qrCode: generateQRCodeId("tmp"),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      position: true,
      isActive: true,
      createdAt: true,
    },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { qrCode: generateQRCodeId(user.id) },
  });

  // Notificar al admin que creó el usuario
  await notify.newUser(session.user.id, name);

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      userId: user.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      newData: { email, name, role },
    },
  });

  return NextResponse.json({ success: true, user }, { status: 201 });
}
