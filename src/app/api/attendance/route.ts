// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attendanceFiltersSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = attendanceFiltersSchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Parámetros inválidos" },
      { status: 400 },
    );

  const {
    userId,
    startDate,
    endDate,
    status,
    department,
    search,
    page,
    limit,
  } = parsed.data;

  // Employees only see their own data
  const effectiveUserId =
    session.user.role === "ADMIN" ? userId : session.user.id;

  // Build date range using UTC midnight to avoid timezone issues with @db.Date fields.
  // @db.Date stores as YYYY-MM-DD (UTC midnight). Using setHours with local time
  // on a UTC server would shift the range and miss records.
  const buildUTCDateRange = (start?: string, end?: string) => {
    const s = start
      ? new Date(start + "T00:00:00.000Z") // explicit UTC midnight
      : new Date(Date.now() - 30 * 86400000);

    const e = end
      ? new Date(end + "T23:59:59.999Z") // explicit UTC end of day
      : new Date();

    // For records with no start/end specified, align to UTC boundaries
    if (!start) {
      s.setUTCHours(0, 0, 0, 0);
    }
    if (!end) {
      e.setUTCHours(23, 59, 59, 999);
    }

    return { start: s, end: e };
  };

  const { start, end } = buildUTCDateRange(startDate, endDate);

  const where: any = {
    date: { gte: start, lte: end },
    ...(effectiveUserId && { userId: effectiveUserId }),
    ...(status && { status }),
    ...(department && { user: { department } }),
    ...(search && {
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
  };

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, department: true, avatar: true },
        },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: records,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}
