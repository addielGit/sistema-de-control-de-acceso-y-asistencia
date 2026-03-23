// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'ADMIN'

  return isAdmin
    ? <AdminDashboard />
    : <EmployeeDashboard userId={session!.user.id} />
}
