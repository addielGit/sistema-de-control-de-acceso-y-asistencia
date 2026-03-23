// src/app/api/attendance/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  getWorkConfig,
  validateCheckTime,
  calcLateMinutes,
  isWorkDay,
} from "@/lib/schedule";
import { notify, notifyAdmins } from "@/lib/notifications";

const checkSchema = z.object({
  userId: z.string().cuid(),
  method: z.enum(["MANUAL", "QR", "RFID", "ADMIN_OVERRIDE"]).default("MANUAL"),
  location: z.string().optional(),
  overrideTime: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = checkSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const { userId, method, location, overrideTime, reason } = parsed.data;
  const isAdmin = session.user.role === "ADMIN";
  const isAdminOverride = method === "ADMIN_OVERRIDE";

  if (!isAdmin && userId !== session.user.id)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (isAdminOverride && !isAdmin)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive)
    return NextResponse.json(
      { error: "Usuario no encontrado o inactivo" },
      { status: 404 },
    );

  const config = await getWorkConfig();
  const now = overrideTime ? new Date(overrideTime) : new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (!isAdmin && !isWorkDay(now, config))
    return NextResponse.json(
      { error: "Hoy no es un día laboral.", code: "NON_WORK_DAY" },
      { status: 422 },
    );

  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const alreadyIn = !!existing?.checkIn;
  const alreadyOut = !!existing?.checkOut;
  if (alreadyIn && alreadyOut)
    return NextResponse.json(
      { error: "Ya se registró entrada y salida hoy.", code: "ALREADY_DONE" },
      { status: 409 },
    );

  const checkType = !alreadyIn ? "entry" : "exit";

  if (!isAdmin) {
    const validation = validateCheckTime(now, checkType, config);
    if (!validation.allowed)
      return NextResponse.json(
        {
          error: validation.reason,
          code: "TIME_RESTRICTED",
          checkInDeadline: validation.checkInDeadline,
          checkOutStart: validation.checkOutStart,
          checkOutDeadline: validation.checkOutDeadline,
        },
        { status: 422 },
      );
  }

  let attendance;
  let action: "ENTRY" | "EXIT";
  let message: string;

  if (checkType === "entry") {
    const lateMinutes = calcLateMinutes(now, config);
    const status = lateMinutes > 0 ? "LATE" : "PRESENT";

    attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        checkIn: now,
        status,
        lateMinutes,
        notes: reason,
      },
      update: { checkIn: now, status, lateMinutes, notes: reason },
    });
    action = "ENTRY";
    message = isAdminOverride
      ? `Entrada registrada manualmente para ${user.name} a las ${now.toTimeString().slice(0, 5)}`
      : lateMinutes > 0
        ? `Entrada registrada con ${lateMinutes} min de retardo`
        : "Entrada registrada exitosamente";

    // Notificaciones
    if (isAdminOverride) {
      await notify.adminMark(
        userId,
        session.user.name!,
        "ENTRY",
        now.toTimeString().slice(0, 5),
        reason || "",
      );
    } else {
      await notify.checkIn(userId, user.name, lateMinutes);
      // Alertar a admins si hay retardo significativo
      if (lateMinutes >= 5) {
        await notifyAdmins(
          "Alerta de retardo",
          `${user.name} registró entrada con ${lateMinutes} min de retardo (${now.toTimeString().slice(0, 5)})`,
          "WARNING",
        );
      }
    }
  } else {
    attendance = await prisma.attendance.update({
      where: { id: existing!.id },
      data: { checkOut: now, notes: existing?.notes ?? reason },
    });
    action = "EXIT";
    message = isAdminOverride
      ? `Salida registrada manualmente para ${user.name} a las ${now.toTimeString().slice(0, 5)}`
      : "Salida registrada exitosamente";

    if (isAdminOverride) {
      await notify.adminMark(
        userId,
        session.user.name!,
        "EXIT",
        now.toTimeString().slice(0, 5),
        reason || "",
      );
    } else {
      await notify.checkOut(userId);
    }
  }

  await prisma.accessLog.create({
    data: { userId, action, method, ipAddress, location },
  });

  if (isAdminOverride) {
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        userId,
        action: `ADMIN_MARK_${action}`,
        entity: "Attendance",
        entityId: attendance.id,
        newData: { time: now, reason, overrideTime },
      },
    });
  }

  return NextResponse.json({ success: true, attendance, action, message });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || session.user.id;

  if (session.user.role !== "ADMIN" && userId !== session.user.id)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [attendance, config] = await Promise.all([
    prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    }),
    getWorkConfig(),
  ]);

  const now = new Date();
  const entryValidation = validateCheckTime(now, "entry", config);
  const exitValidation = validateCheckTime(now, "exit", config);

  return NextResponse.json({
    attendance,
    schedule: {
      checkInTime: config.checkInTime,
      checkOutTime: config.checkOutTime,
      checkInTolerance: config.checkInTolerance,
      checkOutTolerance: config.checkOutTolerance,
      checkInDeadline: entryValidation.checkInDeadline,
      checkOutStart: exitValidation.checkOutStart,
      isWorkDay: isWorkDay(now, config),
    },
  });
}
