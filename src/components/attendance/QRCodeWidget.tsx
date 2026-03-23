// src/components/attendance/QRCodeWidget.tsx
'use client'
import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { QrCode, RefreshCw } from 'lucide-react'

interface QRCodeWidgetProps {
  userId: string
  userName: string
}

export function QRCodeWidget({ userId, userName }: QRCodeWidgetProps) {
  const [qrValue, setQrValue] = useState('')
  const [expires, setExpires] = useState(0)

  const generate = () => {
    const payload = JSON.stringify({ userId, timestamp: Date.now(), type: 'ACCESS' })
    setQrValue(payload)
    setExpires(300) // 5 minutes
  }

  useEffect(() => {
    generate()
    const interval = setInterval(generate, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    if (expires <= 0) return
    const timer = setInterval(() => setExpires(e => Math.max(0, e - 1)), 1000)
    return () => clearInterval(timer)
  }, [expires])

  const mins = Math.floor(expires / 60)
  const secs = expires % 60
  const pct = (expires / 300) * 100

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <QrCode className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Mi Código QR</h3>
          <p className="text-xs text-gray-500">Para registro de acceso</p>
        </div>
      </div>

      {qrValue && (
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl">
            <QRCode value={qrValue} size={180} level="H" />
          </div>
        </div>
      )}

      {/* Expiry countdown */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-500">Expira en</p>
          <p className="text-xs font-mono text-gray-300">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</p>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
      </div>

      <button onClick={generate}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-all">
        <RefreshCw className="w-3.5 h-3.5" /> Regenerar código
      </button>

      <p className="text-xs text-gray-600 text-center">
        Muestra este código al lector de acceso para registrar tu asistencia
      </p>
    </div>
  )
}
