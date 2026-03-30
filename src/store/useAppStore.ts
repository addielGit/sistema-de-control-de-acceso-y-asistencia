// src/store/useAppStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ThemeColors, PRESET_THEMES } from '@/lib/themes'
import type { Locale } from '@/lib/i18n'

interface AppState {
  sidebarOpen:  boolean
  themeId:      string
  customColors: Partial<ThemeColors>
  locale:       Locale
  setSidebarOpen:    (open: boolean) => void
  toggleSidebar:     () => void
  initSidebar:       () => void
  setThemeId:        (id: string) => void
  setCustomColors:   (colors: Partial<ThemeColors>) => void
  resetCustomColors: () => void
  setLocale:         (locale: Locale) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen:  true,
      themeId:      'dark-blue',
      customColors: {},
      locale:       'es',

      setSidebarOpen:    (open)   => set({ sidebarOpen: open }),
      toggleSidebar:     ()       => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setThemeId:        (id)     => set({ themeId: id, customColors: {} }),
      setCustomColors:   (colors) => set((s) => ({ customColors: { ...s.customColors, ...colors } })),
      resetCustomColors: ()       => set({ customColors: {} }),
      setLocale:         (locale) => set({ locale }),

      initSidebar: () => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
        set({ sidebarOpen: !isMobile })
      },
    }),
    { name: 'accessflow-app' }
  )
)
