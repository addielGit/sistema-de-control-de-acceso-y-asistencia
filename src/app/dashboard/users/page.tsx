// src/app/dashboard/users/page.tsx
'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal }        from 'react-dom'
import { DataTable }           from '@/components/ui/DataTable'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { Modal }               from '@/components/ui/Modal'
import { AdminMarkModal }      from '@/components/attendance/AdminMarkModal'
import { formatDate, formatTime, cn } from '@/lib/utils'
import {
  Search, UserPlus, Pencil, Power, Loader2,
  ClipboardCheck, History, ChevronLeft, ChevronRight,
  LogIn, LogOut, AlertTriangle, Save, X, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AttendanceStatus } from '@prisma/client'

interface User {
  id: string; name: string; email: string; role: string
  department?: string; position?: string; isActive: boolean; createdAt: string
}

interface AttendanceRecord {
  id: string; date: string
  checkIn: string | null; checkOut: string | null
  status: AttendanceStatus; lateMinutes: number; notes?: string | null
}

const DEPTS = ['Tecnología','Recursos Humanos','Ventas','Marketing','Operaciones','Finanzas']
const STATUS_OPTS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'PRESENT',  label: 'Presente',   color: 'text-emerald-400' },
  { value: 'LATE',     label: 'Retardo',    color: 'text-amber-400'   },
  { value: 'ABSENT',   label: 'Ausente',    color: 'text-red-400'     },
  { value: 'HALF_DAY', label: 'Medio día',  color: 'text-blue-400'    },
]
const HIST_LIMIT = 10

// ── Inline time editor ─────────────────────────────────────────────────────────
function TimeInput({ value, date, onChange, label, icon: Icon, iconClass }: {
  value: string | null      // ISO string of the current checkIn/checkOut
  date:  string             // ISO date string of the attendance record (YYYY-MM-DD)
  onChange: (v: string | null) => void
  label: string; icon: any; iconClass: string
}) {
  // Convert ISO → local HH:MM for display in the time input
  // Use the record's date to extract correct local date, not today
  const toLocalTime = (iso: string | null): string => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const [val, setVal] = useState(toLocalTime(value))

  // Sync when parent changes (e.g. modal opens with new record)
  useEffect(() => { setVal(toLocalTime(value)) }, [value])

  // Called both on blur AND before save — converts HH:MM local → ISO using record date
  const commit = (timeStr: string) => {
    if (!timeStr) { onChange(null); return }
    // Build a local Date from the record date + the entered time
    // date is "YYYY-MM-DD" (UTC), but we treat it as local date for display purposes
    const [year, month, day] = date.split('-').map(Number)
    const [hours, minutes]   = timeStr.split(':').map(Number)
    // Create date in LOCAL timezone
    const local = new Date(year, month - 1, day, hours, minutes, 0, 0)
    onChange(local.toISOString())
  }

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
        <Icon className={cn('w-3 h-3', iconClass)} />{label}
      </label>
      <input
        type="time"
        value={val}
        onChange={e => {
          setVal(e.target.value)
          // Update parent immediately on every change (no need to wait for blur)
          commit(e.target.value)
        }}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
      />
    </div>
  )
}

// ── Edit modal for a single attendance record ──────────────────────────────────
function EditRecordModal({
  record, onClose, onSaved,
}: {
  record: AttendanceRecord | null
  onClose: () => void
  onSaved: (updated: AttendanceRecord) => void
}) {
  const [checkIn,  setCheckIn]  = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [status,   setStatus]   = useState<AttendanceStatus>('PRESENT')
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  useEffect(() => {
    if (!record) return
    setCheckIn(record.checkIn)
    setCheckOut(record.checkOut)
    setStatus(record.status)
    setNotes(record.notes || '')
    setConfirm(false)
  }, [record])

  if (!record) return null

  const validate = (): string | null => {
    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn))
      return 'La salida debe ser posterior a la entrada'
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { toast.error(err); return }
    if (!confirm) { setConfirm(true); return }

    setSaving(true)
    try {
      const res = await fetch('/api/attendance/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:       record.id,
          checkIn:  checkIn,   // may be null
          checkOut: checkOut,  // may be null
          status,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Registro actualizado')
      onSaved(data.attendance)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
      setConfirm(false)
    } finally {
      setSaving(false)
    }
  }

  const dateLabel = formatDate(record.date)

  return (
    <Modal open={!!record} onClose={onClose} title="Editar registro" size="sm">
      <div className="space-y-4">
        {/* Date header */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-sm font-medium text-white">{dateLabel}</p>
          <StatusBadge status={record.status} />
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <TimeInput value={checkIn}  date={record.date.slice(0,10)} onChange={setCheckIn}  label="Entrada" icon={LogIn}  iconClass="text-emerald-400" />
          <TimeInput value={checkOut} date={record.date.slice(0,10)} onChange={setCheckOut} label="Salida"  icon={LogOut} iconClass="text-orange-400"  />
        </div>

        {/* Status */}
        <div>
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">Estado</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTS.map(o => (
              <button key={o.value} onClick={() => setStatus(o.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                  status === o.value
                    ? 'bg-gray-800 border-gray-500 text-white'
                    : 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'
                )}>
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', o.color.replace('text-','bg-'))} />
                <span className={status === o.value ? o.color : ''}>{o.label}</span>
                {status === o.value && <Check className="w-3 h-3 ml-auto text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">Notas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Motivo del cambio o notas adicionales..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Confirmation prompt */}
        {confirm && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Esta acción quedará registrada en auditoría. ¿Confirmar cambios?
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button onClick={() => { setConfirm(false); onClose() }}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm font-medium transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50',
              confirm ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
            )}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
              : confirm
                ? <><Check className="w-4 h-4" />Confirmar</>
                : <><Save className="w-4 h-4" />Guardar cambios</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── History Modal ──────────────────────────────────────────────────────────────
function HistoryModal({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [editRec, setEditRec] = useState<AttendanceRecord | null>(null)

  const load = useCallback(async (p = page) => {
    if (!user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(HIST_LIMIT) })
      const res    = await fetch(`/api/attendance?userId=${user.id}&${params}`)
      const data   = await res.json()
      setRecords(data.data || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }, [user, page])

  useEffect(() => {
    if (open && user) { setPage(1); load(1) }
    if (!open) { setRecords([]); setTotal(0) }
  }, [open, user])

  useEffect(() => { if (open) load() }, [page])

  if (!user) return null

  const pages = Math.ceil(total / HIST_LIMIT)

  const handleSaved = (updated: AttendanceRecord) => {
    setRecords(rs => rs.map(r => r.id === updated.id ? { ...r, ...updated } : r))
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="" size="lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
            {user.name[0]}
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{user.name}</h2>
            <p className="text-xs text-gray-400">{user.department || user.email} · {total} registros</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <History className="w-10 h-10 text-gray-700" />
            <p className="text-sm text-gray-500">Sin registros de asistencia</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {records.map(r => {
                const dayOfWeek = new Date(r.date).toLocaleDateString('es', { weekday: 'short' })
                const dateLabel = formatDate(r.date)
                return (
                  <div key={r.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-colors group">
                    {/* Date */}
                    <div className="shrink-0 text-center w-12">
                      <p className="text-[10px] text-gray-500 uppercase leading-none">{dayOfWeek}</p>
                      <p className="text-sm font-mono font-semibold text-white leading-tight">{dateLabel.slice(0,5)}</p>
                      <p className="text-[10px] text-gray-600 leading-none">{dateLabel.slice(-4)}</p>
                    </div>

                    <div className="w-px self-stretch bg-gray-800 shrink-0" />

                    {/* Times */}
                    <div className="flex items-center gap-4 flex-1 min-w-0 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <LogIn className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className={cn('text-sm font-mono', r.checkIn ? 'text-white' : 'text-gray-600')}>
                          {r.checkIn ? formatTime(new Date(r.checkIn)) : '--:--'}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <LogOut className="w-3 h-3 text-orange-400 shrink-0" />
                        <span className={cn('text-sm font-mono', r.checkOut ? 'text-white' : 'text-gray-600')}>
                          {r.checkOut ? formatTime(new Date(r.checkOut)) : '--:--'}
                        </span>
                      </span>
                      {r.lateMinutes > 0 && (
                        <span className="flex items-center gap-1 text-amber-400 text-xs">
                          <AlertTriangle className="w-3 h-3" />{r.lateMinutes} min
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <StatusBadge status={r.status} />

                    {/* Edit button — visible on hover */}
                    <button
                      onClick={() => setEditRec(r)}
                      title="Editar registro"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-blue-400"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500">Página {page} de {pages} · {total} registros</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                  </button>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    Siguiente <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      <EditRecordModal record={editRec} onClose={() => setEditRec(null)} onSaved={handleSaved} />
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]           = useState<User[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser]     = useState<User | null>(null)
  const [markUser, setMarkUser]     = useState<User | null>(null)
  const [histUser, setHistUser]     = useState<User | null>(null)
  const [saving, setSaving]         = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'EMPLOYEE', department:'', position:'', phone:'' })

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
    setEditUser(null); setShowCreate(true)
  }
  const openEdit = (u: User) => {
    setForm({ name:u.name, email:u.email, password:'', role:u.role, department:u.department||'', position:u.position||'', phone:'' })
    setEditUser(u); setShowCreate(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url  = editUser ? `/api/users/${editUser.id}` : '/api/users'
      const body = editUser
        ? { name:form.name, role:form.role, department:form.department, position:form.position }
        : form
      const res  = await fetch(url, { method: editUser ? 'PATCH':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success(editUser ? 'Usuario actualizado' : 'Usuario creado')
      setShowCreate(false); fetchUsers()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const toggleActive = async (u: User) => {
    const res = await fetch(`/api/users/${u.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ isActive:!u.isActive }) })
    if (res.ok) { toast.success(`Usuario ${u.isActive?'desactivado':'activado'}`); fetchUsers() }
  }

  const columns = [
    {
      key: 'name', header: 'Empleado',
      render: (u: User) => (
        <button onClick={() => setHistUser(u)} title="Ver historial"
          className="flex items-center gap-3 group text-left hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
            {u.name[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{u.name}</p>
            <p className="text-xs text-gray-500">{u.email}</p>
          </div>
        </button>
      ),
    },
    { key:'department', header:'Departamento', render:(u:User)=><span className="text-sm text-gray-300">{u.department||'—'}</span> },
    { key:'role',       header:'Rol',          render:(u:User)=><RoleBadge role={u.role} /> },
    {
      key:'isActive', header:'Estado',
      render:(u:User)=>(
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.isActive?'text-emerald-400 bg-emerald-400/10':'text-red-400 bg-red-400/10'}`}>
          {u.isActive?'Activo':'Inactivo'}
        </span>
      ),
    },
    { key:'createdAt', header:'Alta', render:(u:User)=><span className="text-xs text-gray-500">{formatDate(u.createdAt)}</span> },
    {
      key:'actions', header:'',
      render:(u:User)=>(
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={()=>setHistUser(u)} title="Ver historial"
            className="flex items-center justify-center text-gray-400 hover:text-blue-400 transition-all p-1">
            <History className="w-3.5 h-3.5" />
          </button>
          {u.isActive && u.role!=='ADMIN' && (
            <button onClick={()=>setMarkUser(u)} title="Marcaje manual"
              className="flex items-center justify-center text-blue-400 hover:text-blue-300 transition-all p-1">
              <ClipboardCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={()=>openEdit(u)} title="Editar"
            className="flex items-center justify-center text-gray-400 hover:text-white transition-all p-1">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={()=>toggleActive(u)} title={u.isActive?'Desactivar':'Activar'}
            className={`flex items-center justify-center transition-all p-1 ${u.isActive?'text-red-400 hover:text-red-300':'text-emerald-400 hover:text-emerald-300'}`}>
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 w-full">
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
        <p className="text-xs text-gray-600 mt-2">Haz clic en el nombre del empleado para ver su historial.</p>
      </div>

      <DataTable columns={columns} data={users} loading={loading} total={total} page={page} limit={15} onPageChange={setPage} />

      {/* Modal crear/editar */}
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title={editUser?'Editar Empleado':'Nuevo Empleado'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          {[
            { key:'name',     label:'Nombre completo',    type:'text',     placeholder:'Juan García' },
            { key:'email',    label:'Correo electrónico', type:'email',    placeholder:'juan@empresa.com' },
            ...(!editUser?[{ key:'password', label:'Contraseña', type:'password', placeholder:'••••••••' }]:[]),
            { key:'position', label:'Cargo',              type:'text',     placeholder:'Desarrollador' },
            { key:'phone',    label:'Teléfono',           type:'tel',      placeholder:'+52 800 000 0000' },
          ].map(f=>(
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Departamento</label>
            <select value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">Sin departamento</option>
              {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Rol</label>
            <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="EMPLOYEE">Empleado</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={()=>setShowCreate(false)}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm font-medium">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {saving&&<Loader2 className="w-4 h-4 animate-spin" />}
            {editUser?'Guardar Cambios':'Crear Empleado'}
          </button>
        </div>
      </Modal>

      <HistoryModal user={histUser} open={!!histUser} onClose={()=>setHistUser(null)} />
      <AdminMarkModal open={!!markUser} onClose={()=>setMarkUser(null)} user={markUser} />
    </div>
  )
}
