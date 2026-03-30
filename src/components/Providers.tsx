// src/components/Providers.tsx
'use client'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { I18nProvider } from '@/lib/i18n-context'

function ThemedToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-base)',
          borderRadius: '10px',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#34d399', secondary: 'var(--bg-surface)' } },
        error:   { iconTheme: { primary: '#f87171', secondary: 'var(--bg-surface)' } },
      }}
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        {children}
        <ThemedToaster />
      </I18nProvider>
    </SessionProvider>
  )
}
