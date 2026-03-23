// src/lib/qr.ts
import QRCode from 'qrcode'

export async function generateQRCode(userId: string): Promise<string> {
  const payload = JSON.stringify({ userId, timestamp: Date.now(), type: 'ACCESS' })
  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  })
}

export function generateQRCodeId(userId: string): string {
  return `QR-${userId.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
}

export function parseQRPayload(payload: string): { userId: string; timestamp: number } | null {
  try {
    const data = JSON.parse(payload)
    if (data.userId && data.timestamp && data.type === 'ACCESS') {
      // Validate QR not expired (5 minutes)
      if (Date.now() - data.timestamp > 5 * 60 * 1000) return null
      return data
    }
    return null
  } catch {
    return null
  }
}
