// src/components/layout/Header.tsx
'use client'
import { Menu } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAppStore } from '@/store/useAppStore'
import { NotificationPanel } from './NotificationPanel'
import { UserMenu } from './UserMenu'
import { useSession } from 'next-auth/react'

export function Header() {
  const { data: session } = useSession()
  const now               = new Date()
  const dateStr           = format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })
  const { toggleSidebar } = useAppStore()

  if (!session) return null

  const user = {
    name:  session.user.name  ?? '',
    email: session.user.email ?? '',
    role:  (session.user as any).role ?? '',
    image: session.user.image ?? undefined,
  }

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden flex items-center justify-center text-gray-400 hover:text-white transition-all"
        >
          <Menu className="w-4 h-4 text-gray-400" />
        </button>
        <p className="hidden sm:block text-xs text-gray-500 capitalize">{dateStr}</p>
      </div>

      <div className="flex items-center gap-3">
        <NotificationPanel />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
