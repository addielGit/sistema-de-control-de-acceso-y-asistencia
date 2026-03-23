// src/hooks/useAttendance.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useAttendance(userId: string) {
  const [today, setToday] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/attendance/check?userId=${userId}`)
    const data = await res.json()
    setToday(data.attendance)
    setLoading(false)
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  const checkInOut = async (method = 'MANUAL') => {
    setChecking(true)
    try {
      const res = await fetch('/api/attendance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, method }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setToday(data.attendance)
      return data
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar')
      return null
    } finally {
      setChecking(false)
    }
  }

  return { today, loading, checking, checkInOut, refresh }
}

// src/hooks/useUsers.ts
export function useUsers(initialPage = 1) {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '15', ...(search && { search }) })
    const res = await fetch(`/api/users?${params}`)
    const data = await res.json()
    setUsers(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return { users, total, page, setPage, search, setSearch, loading, refresh: fetchUsers }
}
