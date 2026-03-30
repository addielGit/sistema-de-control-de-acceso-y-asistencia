// src/lib/i18n-context.tsx
'use client'
import { createContext, useContext, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { t as translate, Locale } from './i18n'

interface I18nContextValue {
  locale: Locale
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  t: (key) => key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useAppStore(s => s.locale) as Locale

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
