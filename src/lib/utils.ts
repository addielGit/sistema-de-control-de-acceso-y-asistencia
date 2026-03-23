// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInMinutes, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { AttendanceStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parsea cualquier valor a Date de forma segura, devuelve null si es inválido
function safeDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

export function formatDate(
  date: Date | string | null | undefined,
  fmt = "dd/MM/yyyy",
): string {
  const d = safeDate(date);
  if (!d) return "—";
  try {
    return format(d, fmt, { locale: es });
  } catch {
    return "—";
  }
}

export function formatTime(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  if (!d) return "--:--";
  try {
    return format(d, "HH:mm");
  } catch {
    return "--:--";
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  if (!d) return "—";
  try {
    return format(d, "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return "—";
  }
}

export function calculateWorkHours(checkIn: Date, checkOut: Date): number {
  const minutes = differenceInMinutes(checkOut, checkIn);
  return Math.round((minutes / 60) * 100) / 100;
}

export function calculateLateMinutes(
  checkIn: Date,
  scheduledTime: string,
  toleranceMin = 15,
): number {
  const [h, m] = scheduledTime.split(":").map(Number);
  const scheduled = new Date(checkIn);
  scheduled.setHours(h, m + toleranceMin, 0, 0);
  const diff = differenceInMinutes(checkIn, scheduled);
  return Math.max(0, diff);
}

export function determineStatus(
  checkIn: Date | null,
  scheduledTime: string,
  toleranceMin = 15,
): AttendanceStatus {
  if (!checkIn) return AttendanceStatus.ABSENT;
  const lateMin = calculateLateMinutes(checkIn, scheduledTime, toleranceMin);
  return lateMin > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
}

export function getStatusColor(status: AttendanceStatus) {
  const colors: Record<string, string> = {
    PRESENT: "text-emerald-400 bg-emerald-400/10",
    LATE: "text-amber-400 bg-amber-400/10",
    ABSENT: "text-red-400 bg-red-400/10",
    HALF_DAY: "text-blue-400 bg-blue-400/10",
  };
  return colors[status] ?? "text-gray-400 bg-gray-400/10";
}

export function getStatusLabel(status: AttendanceStatus) {
  const labels: Record<string, string> = {
    PRESENT: "Presente",
    LATE: "Retardo",
    ABSENT: "Ausente",
    HALF_DAY: "Medio día",
  };
  return labels[status] ?? status;
}

export function getRoleLabel(role: string) {
  return role === "ADMIN" ? "Administrador" : "Empleado";
}

export function sanitizeString(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

export function buildDateRange(startDate?: string, endDate?: string) {
  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val == null ? "" : String(val);
          return str.includes(",") ? `"${str}"` : str;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${format(new Date(), "yyyyMMdd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
