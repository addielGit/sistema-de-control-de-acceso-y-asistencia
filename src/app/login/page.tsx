// src/app/login/page.tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { t as translate } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

export default function LoginPage() {
  const locale = useAppStore(s => s.locale) as Locale
  const t = (key: string) => translate(locale, key)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.error) { setError(t('login.error')); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">AccessFlow</h1>
          <p className="text-gray-400 text-sm mt-1">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-6">{t('login.title')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('login.emailLabel')}</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="correo@empresa.com" required autoComplete="email"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('login.passwordLabel')}</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t('login.loading')}</> : t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
