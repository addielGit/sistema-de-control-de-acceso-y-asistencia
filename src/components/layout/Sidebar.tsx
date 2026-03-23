// src/components/layout/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Clock, FileText,
  Shield, ChevronLeft, LogOut, History, Settings, Palette,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { useEffect } from 'react'

const NAV = [
  { href: '/dashboard',            label: 'Dashboard',     icon: LayoutDashboard, admin: false },
  { href: '/dashboard/attendance', label: 'Mi Asistencia', icon: Clock,           admin: false },
  { href: '/dashboard/history',    label: 'Historial',     icon: History,         admin: false },
  { href: '/dashboard/users',      label: 'Empleados',     icon: Users,           admin: true  },
  { href: '/dashboard/reports',    label: 'Reportes',      icon: FileText,        admin: true  },
  { href: '/dashboard/audit',      label: 'Auditoría',     icon: Shield,          admin: true  },
  { href: '/dashboard/settings',   label: 'Configuración', icon: Settings,        admin: true  },
  { href: '/dashboard/appearance',  label: 'Apariencia',    icon: Palette,         admin: false },
]

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen, toggleSidebar, initSidebar } = useAppStore()
  const isAdmin = role === 'ADMIN'
  const items   = NAV.filter(i => !i.admin || isAdmin)

  useEffect(() => {
    initSidebar()
    const onResize = () => setSidebarOpen(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/*
        DESKTOP: position relative, always in flex flow.
          - Open:   width 256px  → shell gets (100% - 256px)
          - Closed: width 64px   → shell gets (100% - 64px)
          - Both: transition-[width] 300ms so content slides smoothly
        MOBILE: position fixed, overlay — never affects flex layout
      */}
      <aside
        style={{ transitionProperty: 'width, transform', transitionDuration: '300ms', transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
        className={cn(
          'flex flex-col bg-gray-900 border-r border-gray-800 h-screen z-40 shrink-0',
          // Mobile: fixed overlay
          'fixed top-0 left-0',
          // Desktop: back into normal flow
          'lg:relative lg:z-auto',
          // Width + translate
          sidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-64 -translate-x-full lg:w-16 lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800 shrink-0 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <span
              style={{ transitionProperty: 'opacity, max-width', transitionDuration: '250ms' }}
              className={cn('font-bold text-lg gradient-text whitespace-nowrap overflow-hidden',
                sidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 lg:hidden'
              )}
            >
              AccessFlow
            </span>
          </div>
        </div>

        {/* Collapse button — desktop only */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-[72px] w-6 h-6 bg-gray-800 border border-gray-700 rounded-full items-center justify-center hover:bg-gray-700 z-10"
        >
          <ChevronLeft
            style={{ transitionProperty: 'transform', transitionDuration: '300ms' }}
            className={cn('w-3 h-3 text-gray-400', !sidebarOpen && 'rotate-180')}
          />
        </button>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {items.map(({ href, label, icon: Icon, admin }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                title={!sidebarOpen ? label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium group overflow-hidden whitespace-nowrap',
                  'transition-colors duration-150',
                  active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800',
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-blue-400' : 'text-gray-500 group-hover:text-white')} />
                <span
                  style={{ transitionProperty: 'opacity, max-width', transitionDuration: '250ms' }}
                  className={cn('overflow-hidden', sidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 lg:hidden')}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-gray-800 shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title={!sidebarOpen ? 'Cerrar sesión' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full overflow-hidden whitespace-nowrap transition-colors duration-150"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span
              style={{ transitionProperty: 'opacity, max-width', transitionDuration: '250ms' }}
              className={cn('overflow-hidden', sidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 lg:hidden')}
            >
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
