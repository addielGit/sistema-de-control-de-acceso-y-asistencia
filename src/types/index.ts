// src/types/index.ts
import { Role, AttendanceStatus, AccessAction } from '@prisma/client'

export type { Role, AttendanceStatus, AccessAction }

export interface UserDTO {
  id: string
  email: string
  name: string
  role: Role
  department?: string | null
  position?: string | null
  phone?: string | null
  avatar?: string | null
  qrCode?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AttendanceDTO {
  id: string
  userId: string
  date: Date
  checkIn?: Date | null
  checkOut?: Date | null
  status: AttendanceStatus
  lateMinutes: number
  notes?: string | null
  user?: {
    name: string
    email: string
    department?: string | null
  }
}

export interface AccessLogDTO {
  id: string
  userId: string
  action: AccessAction
  timestamp: Date
  method: string
  ipAddress?: string | null
  device?: string | null
  user?: {
    name: string
    email: string
  }
}

export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  lateToday: number
  absentToday: number
  attendanceRate: number
  weeklyData: WeeklyAttendance[]
  departmentData: DepartmentAttendance[]
  recentActivity: AccessLogDTO[]
}

export interface WeeklyAttendance {
  day: string
  present: number
  late: number
  absent: number
}

export interface DepartmentAttendance {
  department: string
  rate: number
  total: number
  present: number
}

export interface AttendanceFilters {
  userId?: string
  startDate?: Date
  endDate?: Date
  status?: AttendanceStatus
  department?: string
  search?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface Session {
  user: {
    id: string
    email: string
    name: string
    role: Role
    image?: string
  }
}
