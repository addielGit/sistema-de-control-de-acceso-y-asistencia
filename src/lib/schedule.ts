// src/lib/schedule.ts
import { prisma } from './prisma'
import { differenceInMinutes } from 'date-fns'

export interface WorkConfig {
  workDays: number[]
  checkInTime: string
  checkOutTime: string
  checkInTolerance: number
  checkOutTolerance: number
  holidays: string[]
}

export async function getWorkConfig(): Promise<WorkConfig> {
  const config = await prisma.workConfig.findFirst()
  return config ?? {
    workDays: [1, 2, 3, 4, 5],
    checkInTime: '09:00',
    checkOutTime: '18:00',
    checkInTolerance: 10,
    checkOutTolerance: 10,
    holidays: [],
  }
}

/**
 * Construye un Date con la hora HH:MM aplicada sobre la fecha de `reference`,
 * respetando el offset de timezone del cliente.
 *
 * `clientOffsetMinutes` = lo que devuelve `new Date().getTimezoneOffset()` en el cliente
 * (negativo para zonas este, positivo para zonas oeste).
 * Si no se pasa, se usa la hora local del servidor (solo correcto si servidor y cliente
 * están en la misma zona horaria).
 */
function timeToDateWithOffset(
  timeStr: string,
  reference: Date,
  clientOffsetMinutes?: number
): Date {
  const [h, m] = timeStr.split(':').map(Number)

  if (clientOffsetMinutes !== undefined) {
    // Construir el instante correcto en UTC:
    // 1. Tomar medianoche UTC del día según la fecha local del cliente
    const serverOffset  = reference.getTimezoneOffset()          // minutos desfase servidor
    const clientOffset  = clientOffsetMinutes                     // minutos desfase cliente
    // Ajustar la referencia al inicio del día local del cliente
    const startOfDayUTC = new Date(reference)
    startOfDayUTC.setUTCHours(0, 0, 0, 0)
    // Compensar diferencia entre servidor y cliente
    const offsetDiff = clientOffset - serverOffset
    startOfDayUTC.setMinutes(startOfDayUTC.getMinutes() + offsetDiff)
    // 2. Añadir las horas/minutos de la config como si fuera hora local del cliente
    const result = new Date(startOfDayUTC)
    result.setUTCHours(
      result.getUTCHours()   + h,
      result.getUTCMinutes() + m,
      0, 0
    )
    return result
  }

  // Fallback: construir con hora local del servidor
  const d = new Date(reference)
  d.setHours(h, m, 0, 0)
  return d
}

export function isHoliday(date: Date, holidays: string[]): boolean {
  const iso = date.toISOString().slice(0, 10)
  return holidays.some(h => h.split('|')[0] === iso)
}

export function isWorkDay(date: Date, config: WorkConfig): boolean {
  if (isHoliday(date, config.holidays)) return false
  return config.workDays.includes(date.getDay())
}

export interface CheckValidation {
  allowed: boolean
  reason?: string
  lateMinutes: number
  isLate: boolean
  checkInDeadline: Date
  checkOutStart: Date
  checkOutDeadline: Date
}

export function validateCheckTime(
  now: Date,
  type: 'entry' | 'exit',
  config: WorkConfig,
  clientOffsetMinutes?: number
): CheckValidation {
  const checkInBase     = timeToDateWithOffset(config.checkInTime,  now, clientOffsetMinutes)
  const checkOutBase    = timeToDateWithOffset(config.checkOutTime, now, clientOffsetMinutes)

  const checkInDeadline = new Date(checkInBase)
  checkInDeadline.setMinutes(checkInDeadline.getMinutes() + config.checkInTolerance)

  const checkOutStart = new Date(checkOutBase)
  checkOutStart.setMinutes(checkOutStart.getMinutes() - config.checkOutTolerance)

  const checkOutDeadline = new Date(checkOutBase)
  checkOutDeadline.setHours(checkOutDeadline.getHours() + 4)

  const lateMinutes = Math.max(0, differenceInMinutes(now, checkInDeadline))
  const isLate      = lateMinutes > 0

  if (type === 'entry') {
    if (now > checkInDeadline) {
      const overMin = differenceInMinutes(now, checkInDeadline)
      return {
        allowed: false,
        reason: `El tiempo límite para registrar entrada era las ${fmtLocal(checkInDeadline, clientOffsetMinutes)} (${config.checkInTime} + ${config.checkInTolerance} min de tolerancia). Llevas ${overMin} min de retraso. Contacta a tu administrador.`,
        lateMinutes: 0, isLate: false, checkInDeadline, checkOutStart, checkOutDeadline,
      }
    }
    return { allowed: true, lateMinutes, isLate, checkInDeadline, checkOutStart, checkOutDeadline }
  }

  if (now < checkOutStart) {
    const remainMin = differenceInMinutes(checkOutStart, now)
    return {
      allowed: false,
      reason: `Aún no puedes registrar salida. La salida mínima es a las ${fmtLocal(checkOutStart, clientOffsetMinutes)} (${config.checkOutTime} - ${config.checkOutTolerance} min). Faltan ${remainMin} min.`,
      lateMinutes: 0, isLate: false, checkInDeadline, checkOutStart, checkOutDeadline,
    }
  }

  return { allowed: true, lateMinutes: 0, isLate: false, checkInDeadline, checkOutStart, checkOutDeadline }
}

/** Formatea un Date en HH:MM aplicando el offset del cliente */
function fmtLocal(d: Date, clientOffsetMinutes?: number): string {
  if (clientOffsetMinutes === undefined) return d.toTimeString().slice(0, 5)
  const localMs = d.getTime() - clientOffsetMinutes * 60000
  const local   = new Date(localMs)
  return `${String(local.getUTCHours()).padStart(2,'0')}:${String(local.getUTCMinutes()).padStart(2,'0')}`
}

export function calcLateMinutes(checkIn: Date, config: WorkConfig, clientOffsetMinutes?: number): number {
  const checkInBase = timeToDateWithOffset(config.checkInTime, checkIn, clientOffsetMinutes)
  const deadline    = new Date(checkInBase)
  deadline.setMinutes(deadline.getMinutes() + config.checkInTolerance)
  return Math.max(0, differenceInMinutes(checkIn, deadline))
}
