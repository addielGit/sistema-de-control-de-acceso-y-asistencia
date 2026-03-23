// src/components/Providers.tsx
'use client'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#f9fafb',
            border: '1px solid #374151',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#111827' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#111827' } },
        }}
      />
    </SessionProvider>
  )
}
