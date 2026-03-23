// src/app/dashboard/users/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { RoleBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { AdminMarkModal } from '@/components/attendance/AdminMarkModal'
import { formatDate } from '@/lib/utils'
import { Search, UserPlus, Pencil, Power, Loader2, ClipboardCheck } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
  position?: string
  isActive: boolean
  createdAt: string
}

const DEPTS = ['Tecnología','Recursos Humanos','Ventas','Marketing','Operaciones','Finanzas']

export default function UsersPage() {
  const [users, setUsers]           = useState<User[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser]     = useState<User | null>(null)
  const [markUser, setMarkUser]     = useState<User | null>(null)
  const [saving, setSaving]         = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'EMPLOYEE',
    department: '', position: '', phone: '',
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '15', ...(search && { search }) })
    const res  = await fetch(`/api/users?${params}`)
    const data = await res.json()
    setUsers(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openCreate = () => {
    setForm({ name:'', email:'', password:'', role:'EMPLOYEE', department:'', position:'', phone:'' })
    setEditUser(null)
    setShowCreate(true)
  }

  const openEdit = (user: User) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role, department: user.department || '', position: user.position || '', phone: '' })
    setEditUser(user)
    setShowCreate(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url    = editUser ? `/api/users/${editUser.id}` : '/api/users'
      const method = editUser ? 'PATCH' : 'POST'
      const body   = editUser
        ? { name: form.name, role: form.role, department: form.department, position: form.position }
        : form
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success(editUser ? 'Usuario actualizado' : 'Usuario creado')
      setShowCreate(false)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (user: User) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    if (res.ok) { toast.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'}`); fetchUsers() }
  }

  const columns = [
    {
      key: 'name', header: 'Empleado',
      render: (u: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
            {u.name[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{u.name}</p>
            <p className="text-xs text-gray-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'department', header: 'Departamento', render: (u: User) => <span className="text-sm text-gray-300">{u.department || '—'}</span> },
    { key: 'role',       header: 'Rol',           render: (u: User) => <RoleBadge role={u.role} /> },
    {
      key: 'isActive', header: 'Estado',
      render: (u: User) => (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.isActive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {u.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Alta', render: (u: User) => <span className="text-xs text-gray-500">{formatDate(u.createdAt)}</span> },
    {
      key: 'actions', header: '',
      render: (u: User) => (
        <div className="flex items-center gap-1.5 justify-end">
          {/* Marcaje manual */}
          {u.isActive && u.role !== 'ADMIN' && (
            <button
              onClick={() => setMarkUser(u)}
              title="Marcaje manual"
              className="flex items-center justify-center text-blue-400 hover:text-blue-300 transition-all p-1"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => openEdit(u)} className="flex items-center justify-center text-gray-400 hover:text-white transition-all p-1">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggleActive(u)}
            className={`flex items-center justify-center transition-all p-1 ${u.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Empleados</h1>
          <p className="text-gray-400 text-sm mt-1">{total} empleados registrados</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all">
          <UserPlus className="w-4 h-4" /> Nuevo Empleado
        </button>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o email..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <DataTable columns={columns} data={users} loading={loading} total={total} page={page} limit={15} onPageChange={setPage} />

      {/* Modal crear/editar usuario */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editUser ? 'Editar Empleado' : 'Nuevo Empleado'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          {[
            { key:'name',     label:'Nombre completo',    type:'text',     placeholder:'Juan García' },
            { key:'email',    label:'Correo electrónico', type:'email',    placeholder:'juan@empresa.com' },
            ...(!editUser ? [{ key:'password', label:'Contraseña', type:'password', placeholder:'••••••••' }] : []),
            { key:'position', label:'Cargo',              type:'text',     placeholder:'Desarrollador' },
            { key:'phone',    label:'Teléfono',           type:'tel',      placeholder:'+52 800 000 0000' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Departamento</label>
            <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">Sin departamento</option>
              {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Rol</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="EMPLOYEE">Empleado</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowCreate(false)}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm font-medium">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editUser ? 'Guardar Cambios' : 'Crear Empleado'}
          </button>
        </div>
      </Modal>

      {/* Modal marcaje manual */}
      <AdminMarkModal
        open={!!markUser}
        onClose={() => setMarkUser(null)}
        user={markUser}
      />
    </div>
  )
}
