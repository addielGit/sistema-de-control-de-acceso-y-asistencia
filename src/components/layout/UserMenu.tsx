// src/components/layout/UserMenu.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react'
import { cn, getRoleLabel } from '@/lib/utils'

interface UserMenuProps {
  user: { name: string; email: string; role: string; image?: string }
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen]         = useState(false)
  const [mounted, setMounted]   = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const btnRef                  = useRef<HTMLButtonElement>(null)
  const router                  = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const updatePosition = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const menuWidth = 220
    const windowWidth = window.innerWidth
    let left = rect.right - menuWidth
    if (left < 8) left = 8
    if (left + menuWidth > windowWidth - 8) left = windowWidth - menuWidth - 8
    setMenuStyle({ position: 'fixed', top: rect.bottom + 8, left, width: menuWidth, zIndex: 99999 })
  }

  useEffect(() => {
    if (open) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
    }
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target)) return
      const menu = document.getElementById('user-menu-portal')
      if (menu && !menu.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const initials = user.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

  const menuContent = (
    <div
      id="user-menu-portal"
      style={menuStyle}
      className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
    >
      {/* Info usuario */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 overflow-hidden">
            {user.image
              ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-blue-400 text-sm font-semibold">{initials}</span>}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Shield className="w-2.5 h-2.5" />{getRoleLabel(user.role)}
          </span>
        </div>
      </div>

      {/* Opciones */}
      <div className="p-1.5">
        <MenuItem
          icon={User}
          label="Mi perfil"
          description="Editar información"
          onClick={() => { router.push('/dashboard/profile'); setOpen(false) }}
        />
        {user.role === 'ADMIN' && (
          <MenuItem
            icon={Settings}
            label="Configuración"
            description="Horario y festivos"
            onClick={() => { router.push('/dashboard/settings'); setOpen(false) }}
          />
        )}
      </div>

      {/* Logout */}
      <div className="p-1.5 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2.5 pl-3 border-l border-gray-800 transition-all group',
        )}
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white leading-none group-hover:text-blue-400 transition-colors">{user.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{getRoleLabel(user.role)}</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400/50">
            {user.image
              ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-blue-400 text-sm font-semibold">{initials}</span>}
          </div>
          <ChevronDown className={cn('w-3.5 h-3.5 text-gray-500 transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </button>

      {mounted && open && createPortal(menuContent, document.body)}
    </>
  )
}

function MenuItem({ icon: Icon, label, description, onClick }: {
  icon: React.ElementType; label: string; description: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-all group text-left"
    >
      <div className="shrink-0">
        <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-200 group-hover:text-white leading-tight">{label}</p>
        <p className="text-[10px] text-gray-500">{description}</p>
      </div>
    </button>
  )
}
