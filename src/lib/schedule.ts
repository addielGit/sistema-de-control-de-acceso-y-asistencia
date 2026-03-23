// src/lib/schedule.ts
// Lógica centralizada de validación de horario
import { prisma } from "./prisma";
import { differenceInMinutes, parseISO } from "date-fns";

export interface WorkConfig {
  workDays: number[];
  checkInTime: string;
  checkOutTime: string;
  checkInTolerance: number;
  checkOutTolerance: number;
  holidays: string[];
}

// Obtiene config activa o devuelve defaults
export async function getWorkConfig(): Promise<WorkConfig> {
  const config = await prisma.workConfig.findFirst();
  return (
    config ?? {
      workDays: [1, 2, 3, 4, 5],
      checkInTime: "09:00",
      checkOutTime: "18:00",
      checkInTolerance: 10,
      checkOutTolerance: 10,
      holidays: [],
    }
  );
}

// Parsea "HH:MM" y devuelve un Date para hoy con esa hora
function timeToDate(timeStr: string, reference: Date = new Date()): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(reference);
  d.setHours(h, m, 0, 0);
  return d;
}

// Devuelve si una fecha es día festivo
export function isHoliday(date: Date, holidays: string[]): boolean {
  const iso = date.toISOString().slice(0, 10); // "YYYY-MM-DD"
  return holidays.some((h) => h.split("|")[0] === iso);
}

// Devuelve si una fecha es día laboral
export function isWorkDay(date: Date, config: WorkConfig): boolean {
  if (isHoliday(date, config.holidays)) return false;
  return config.workDays.includes(date.getDay());
}

export interface CheckValidation {
  allowed: boolean;
  reason?: string;
  lateMinutes: number;
  isLate: boolean;
  // Límites para mostrar en UI
  checkInDeadline: Date; // Hasta cuándo puede marcar entrada
  checkOutStart: Date; // Desde cuándo puede marcar salida
  checkOutDeadline: Date; // Hasta cuándo puede marcar salida
}

// Valida si el empleado puede marcar en este momento
// type: 'entry' | 'exit'
export function validateCheckTime(
  now: Date,
  type: "entry" | "exit",
  config: WorkConfig,
): CheckValidation {
  const checkInBase = timeToDate(config.checkInTime, now);
  const checkOutBase = timeToDate(config.checkOutTime, now);

  // Límite máximo para marcar entrada = hora entrada + tolerancia
  const checkInDeadline = new Date(checkInBase);
  checkInDeadline.setMinutes(
    checkInDeadline.getMinutes() + config.checkInTolerance,
  );

  // Salida mínima = hora salida - tolerancia
  const checkOutStart = new Date(checkOutBase);
  checkOutStart.setMinutes(
    checkOutStart.getMinutes() - config.checkOutTolerance,
  );

  // Salida máxima = hora salida + 4h (margen generoso para horas extra)
  const checkOutDeadline = new Date(checkOutBase);
  checkOutDeadline.setHours(checkOutDeadline.getHours() + 4);

  // Calcular retardo (minutos después de checkInDeadline)
  const lateMinutes = Math.max(0, differenceInMinutes(now, checkInDeadline));
  const isLate = lateMinutes > 0;

  // --- Validar según tipo ---
  if (type === "entry") {
    // No puede marcar entrada si ya pasó el límite
    if (now > checkInDeadline) {
      const overMin = differenceInMinutes(now, checkInDeadline);
      return {
        allowed: false,
        reason: `El tiempo límite para registrar entrada era ${formatHM(checkInDeadline)} (${formatHM(checkInBase)} + ${config.checkInTolerance} min de tolerancia). Llevas ${overMin} min de retraso. Contacta a tu administrador.`,
        lateMinutes: 0,
        isLate: false,
        checkInDeadline,
        checkOutStart,
        checkOutDeadline,
      };
    }
    return {
      allowed: true,
      lateMinutes,
      isLate,
      checkInDeadline,
      checkOutStart,
      checkOutDeadline,
    };
  }

  // type === 'exit'
  if (now < checkOutStart) {
    const remainMin = differenceInMinutes(checkOutStart, now);
    return {
      allowed: false,
      reason: `Aún no puedes registrar salida. La salida mínima es a las ${formatHM(checkOutStart)} (${formatHM(checkOutBase)} - ${config.checkOutTolerance} min). Faltan ${remainMin} min.`,
      lateMinutes: 0,
      isLate: false,
      checkInDeadline,
      checkOutStart,
      checkOutDeadline,
    };
  }

  return {
    allowed: true,
    lateMinutes: 0,
    isLate: false,
    checkInDeadline,
    checkOutStart,
    checkOutDeadline,
  };
}

function formatHM(d: Date): string {
  return d.toTimeString().slice(0, 5);
}

// Calcula minutos de retardo para guardar en BD
export function calcLateMinutes(checkIn: Date, config: WorkConfig): number {
  const checkInBase = timeToDate(config.checkInTime, checkIn);
  const deadline = new Date(checkInBase);
  deadline.setMinutes(deadline.getMinutes() + config.checkInTolerance);
  return Math.max(0, differenceInMinutes(checkIn, deadline));
}
