// src/lib/validations.ts
import { z } from 'zod'
import { Role, AttendanceStatus } from '@prisma/client'

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const createUserSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  name: z.string().min(2, 'Nombre muy corto').max(100).trim(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  isActive: z.boolean().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const attendanceCheckSchema = z.object({
  userId: z.string().cuid('ID inválido'),
  method: z.enum(['MANUAL', 'QR', 'RFID']).default('MANUAL'),
  location: z.string().optional(),
})

export const attendanceFiltersSchema = z.object({
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  department: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
})

export const reportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  department: z.string().optional(),
  userId: z.string().optional(),
  format: z.enum(['CSV', 'JSON']).default('CSV'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type AttendanceCheckInput = z.infer<typeof attendanceCheckSchema>
export type AttendanceFiltersInput = z.infer<typeof attendanceFiltersSchema>
export type ReportInput = z.infer<typeof reportSchema>
