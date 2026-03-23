// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  workDays: z
    .array(z.number().min(0).max(6))
    .min(1, "Selecciona al menos un día"),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  checkInTolerance: z.number().min(0).max(60),
  checkOutTolerance: z.number().min(0).max(60),
  holidays: z.array(z.string()),
});

// Obtiene o crea la config por defecto
async function getConfig() {
  let config = await prisma.workConfig.findFirst();
  if (!config) {
    config = await prisma.workConfig.create({
      data: {
        workDays: [1, 2, 3, 4, 5],
        checkInTime: "09:00",
        checkOutTime: "18:00",
        checkInTolerance: 10,
        checkOutTolerance: 10,
        holidays: [],
      },
    });
  }
  return config;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const config = await getConfig();
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await getConfig();
  const config = await prisma.workConfig.update({
    where: { id: existing.id },
    data: { ...parsed.data, updatedBy: session.user.id },
  });

  // Log auditoría
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UPDATE",
      entity: "WorkConfig",
      entityId: config.id,
      newData: parsed.data,
    },
  });

  return NextResponse.json({ success: true, config });
}
