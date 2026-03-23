// src/components/ui/Badge.tsx
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils'
import { AttendanceStatus } from '@prisma/client'

interface StatusBadgeProps {
  status: AttendanceStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
      getStatusColor(status),
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {getStatusLabel(status)}
    </span>
  )
}

interface RoleBadgeProps {
  role: string
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
      role === 'ADMIN' ? 'text-violet-400 bg-violet-400/10 border border-violet-400/20' : 'text-blue-400 bg-blue-400/10 border border-blue-400/20',
      className
    )}>
      {role === 'ADMIN' ? 'Administrador' : 'Empleado'}
    </span>
  )
}
