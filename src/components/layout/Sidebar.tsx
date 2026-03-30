// src/components/layout/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Clock, FileText,
  Shield, LogOut, History, Settings, Palette, Bell, ServerCog,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/dashboard',              labelKey: 'nav.dashboard',    icon: LayoutDashboard, admin: false },
  { href: '/dashboard/attendance',   labelKey: 'nav.attendance',   icon: Clock,           admin: false },
  { href: '/dashboard/history',      labelKey: 'nav.history',      icon: History,         admin: false },
  { href: '/dashboard/notifications',labelKey: 'nav.notifications',icon: Bell,            admin: false },
  { href: '/dashboard/users',        labelKey: 'nav.users',        icon: Users,           admin: true  },
  { href: '/dashboard/reports',      labelKey: 'nav.reports',      icon: FileText,        admin: true  },
  { href: '/dashboard/audit',        labelKey: 'nav.audit',        icon: Shield,          admin: true  },
  { href: '/dashboard/settings',     labelKey: 'nav.settings',     icon: Settings,        admin: true  },
  { href: '/dashboard/appearance',   labelKey: 'nav.appearance',   icon: Palette,         admin: false },
  { href: '/dashboard/system',       labelKey: 'nav.system',       icon: ServerCog,       admin: true  },
]

// ── Hamburger icon with animated bars ─────────────────────────────────────────
function HamburgerIcon({ open, size = 18 }: { open: boolean; size?: number }) {
  const bar = 'absolute left-0 bg-current rounded-full'
  const w = size, h = Math.round(size * 0.11)  // bar height ~11% of size
  const gap = Math.round(size * 0.33)           // gap between bars

  return (
    <svg
      width={w} height={w}
      viewBox={`0 0 ${w} ${w}`}
      fill="none"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Top bar — rotates to / when open */}
      <rect
        x="0" y={open ? w/2 - h/2 : Math.round(w*0.22)}
        width={open ? w : w * 0.75}
        height={h}
        rx={h/2}
        fill="currentColor"
        style={{
          transformOrigin: `${w/2}px ${w/2}px`,
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      {/* Middle bar — fades out when open */}
      <rect
        x="0" y={w/2 - h/2}
        width={w}
        height={h}
        rx={h/2}
        fill="currentColor"
        style={{
          opacity: open ? 0 : 1,
          transform: open ? 'scaleX(0)' : 'scaleX(1)',
          transformOrigin: 'left center',
          transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      {/* Bottom bar — rotates to \ when open */}
      <rect
        x="0" y={open ? w/2 - h/2 : Math.round(w*0.67)}
        width={open ? w : w * 0.5}
        height={h}
        rx={h/2}
        fill="currentColor"
        style={{
          transformOrigin: `${w/2}px ${w/2}px`,
          transform: open ? 'rotate(-45deg)' : 'rotate(0deg)',
          transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </svg>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen, toggleSidebar, initSidebar } = useAppStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const { t } = useI18n()
  const isAdmin = role === 'ADMIN'
  const items   = NAV.filter(i => !i.admin || isAdmin).map(i => ({ ...i, label: t(i.labelKey) }))

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const r = await fetch('/api/notifications?limit=1')
        const d = await r.json()
        setUnreadCount(d.unreadCount || 0)
      } catch {}
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 30000)
    return () => clearInterval(t)
  }, [])

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

      <aside
        style={{
          transitionProperty: 'width, transform',
          transitionDuration: '300ms',
          transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
          width: sidebarOpen ? '256px' : '64px',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
        className={cn(
          'flex flex-col bg-gray-900 border-r border-gray-800 h-screen z-40 shrink-0',
          'fixed top-0 left-0',
          'lg:relative lg:z-auto',
          !sidebarOpen && 'max-lg:-translate-x-full',
        )}
      >
        {/* ── Header: logo + hamburger ── */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800 shrink-0 overflow-hidden">
          {sidebarOpen ? (
            /* Expanded: Shield + AccessFlow text + hamburger on the right */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <Shield className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="font-bold text-lg gradient-text whitespace-nowrap">
                  AccessFlow
                </span>
              </div>
              <button
                onClick={toggleSidebar}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                aria-label={t("header.menu.collapse")}
              >
                <HamburgerIcon open={sidebarOpen} size={18} />
              </button>
            </div>
          ) : (
            /* Collapsed: only hamburger, centered */
            <div className="flex items-center justify-center w-full">
              <button
                onClick={toggleSidebar}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                aria-label={t("header.menu.expand")}
              >
                <HamburgerIcon open={sidebarOpen} size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                title={!sidebarOpen ? label : undefined}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium group overflow-hidden whitespace-nowrap',
                  'transition-colors duration-150',
                  active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800',
                )}
              >
                <div className="relative shrink-0">
                  <Icon className={cn('w-5 h-5', active ? 'text-blue-400' : 'text-gray-500 group-hover:text-white')} />
                  {href === '/dashboard/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold bg-blue-500 text-white leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span
                  style={{ transitionProperty: 'opacity, max-width', transitionDuration: '250ms' }}
                  className={cn('overflow-hidden flex-1', sidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 lg:hidden')}
                >
                  {label}
                </span>
                {href === '/dashboard/notifications' && unreadCount > 0 && sidebarOpen && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Logout ── */}
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
