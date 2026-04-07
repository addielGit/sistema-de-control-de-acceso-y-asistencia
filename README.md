# AccessFlow — Sistema de Control de Acceso y Asistencia

Sistema web completo para gestión de asistencia laboral con registro de entrada/salida, control de horarios configurable, panel administrativo, notificaciones automáticas inteligentes, dashboard interactivo con drag & drop, y soporte multiidioma.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL (Supabase) |
| ORM | Prisma 5 |
| Autenticación | NextAuth.js 4 (JWT) |
| UI | Tailwind CSS |
| Estado global | Zustand (persistido en localStorage) |
| Gráficas | Recharts |
| Códigos QR | react-qr-code |
| Notificaciones UI | react-hot-toast |
| Íconos | lucide-react |
| Deploy | Vercel |

---

## Credenciales demo

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Admin | `admin@accessflow.com` | `admin123` | Administrador |
| María García | `maria@accessflow.com` | `employee123` | Empleado |
| Carlos López | `carlos@accessflow.com` | `employee123` | Empleado |
| Ana Martínez | `ana@accessflow.com` | `employee123` | Empleado |
| Luis Rodríguez | `luis@accessflow.com` | `employee123` | Empleado |
| Sofia Chen | `sofia@accessflow.com` | `employee123` | Empleado |

> Los datos demo se crean desde `Dashboard → Sistema → Crear datos de prueba`.

---

## Variables de entorno

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=tu_secreto_aleatorio_largo
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
CRON_SECRET=tu_secreto_para_el_scheduler
```

---

## Instalación local

```bash
git clone <repositorio>
cd accessflow
npm install
npx prisma db push
npm run dev
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── attendance/             # GET historial paginado
│   │   ├── attendance/check/       # POST check-in / check-out con validación
│   │   ├── attendance/edit/        # PATCH edición de registros (admin)
│   │   ├── attendance/request/     # POST solicitud de marcaje manual
│   │   ├── cron/notifications/     # GET/POST scheduler automático (Vercel Cron)
│   │   ├── dashboard/              # GET estadísticas del dashboard admin
│   │   ├── dashboard/layout/       # GET/PUT layout de widgets por usuario
│   │   ├── notifications/          # GET/PATCH/DELETE notificaciones
│   │   ├── profile/                # GET/PATCH perfil del usuario autenticado
│   │   ├── reports/                # GET exportación CSV/JSON
│   │   ├── settings/               # GET/PUT configuración laboral
│   │   ├── users/                  # CRUD empleados (admin)
│   │   ├── audit/                  # GET logs de auditoría
│   │   └── admin/                  # backup / restore / seed / clear
│   ├── dashboard/
│   │   ├── appearance/             # Temas y colores
│   │   ├── attendance/             # Registro asistencia + QR
│   │   ├── audit/                  # Tabla de auditoría
│   │   ├── history/                # Historial con origen del marcaje
│   │   ├── notifications/          # Centro de notificaciones
│   │   ├── profile/                # Perfil + idioma
│   │   ├── reports/                # Generación de reportes
│   │   ├── settings/               # Configuración laboral
│   │   ├── system/                 # Backup / restore / datos demo
│   │   ├── users/                  # Gestión de empleados + historial
│   │   ├── layout.tsx
│   │   └── page.tsx                # Dashboard principal (admin/empleado)
│   ├── login/
│   ├── globals.css                 # Variables CSS del sistema de temas
│   └── layout.tsx
├── components/
│   ├── attendance/
│   │   ├── AdminMarkModal.tsx      # Modal marcaje manual por admin
│   │   └── QRCodeWidget.tsx        # Widget QR con countdown de 5 min
│   ├── dashboard/
│   │   ├── AdminDashboard.tsx      # Dashboard drag & drop con persistencia
│   │   └── EmployeeDashboard.tsx   # Dashboard empleado con reloj en vivo
│   ├── layout/
│   │   ├── DashboardShell.tsx      # Shell: header, notifs popover, user menu
│   │   ├── NotificationPanel.tsx   # Panel notificaciones completo
│   │   ├── Sidebar.tsx             # Sidebar colapsable + hamburger animado
│   │   └── UserMenu.tsx            # Dropdown de usuario
│   └── ui/                         # Badge, DataTable, Modal, StatCard
├── config/
│   └── notifications.ts            # Config central del scheduler
├── lib/
│   ├── notifications/
│   │   ├── notification-engine.ts  # Motor de reglas (puras, extensibles)
│   │   ├── notification-service.ts # Envío + deduplicación
│   │   ├── notification-scheduler.ts # Orquestador por lotes
│   │   └── index.ts
│   ├── auth.ts                     # Configuración NextAuth
│   ├── i18n.ts                     # Diccionario ES/EN (~300 claves)
│   ├── i18n-context.tsx            # Provider + hook useI18n()
│   ├── notifications.ts            # Helpers semánticos (checkIn, checkOut, etc.)
│   ├── prisma.ts
│   ├── schedule.ts                 # Motor de validación de horarios
│   └── themes.ts                   # 6 temas + sistema de CSS vars
├── middleware.ts                   # Protección de rutas por rol
└── store/
    └── useAppStore.ts              # Estado global: sidebar, tema, locale
```

---

## Funcionalidades implementadas

### Autenticación y sesión
- Login con email y contraseña (bcrypt + JWT)
- Roles: **Administrador** y **Empleado**
- Protección de rutas por rol via middleware
- Avatar cargado via evento custom (evita límite JWT 431)

### Perfil de usuario
- Edición de nombre, teléfono, cargo y departamento
- Foto de perfil (base64, máx 2 MB), visible en tiempo real en el header
- Cambio de contraseña con indicador de fortaleza
- **Selector de idioma** (tab "Idioma") — cambia toda la interfaz instantáneamente

### Internacionalización (i18n)
- Soporte completo **Español / English** en toda la interfaz
- Sistema propio sin dependencias externas (`src/lib/i18n.ts`)
- Hook `useI18n()` disponible en todos los componentes
- Persistencia del idioma en localStorage via Zustand
- Login usa el idioma guardado aunque esté fuera del árbol de providers

### Registro de asistencia
- Botón de entrada/salida con validación de horario en tiempo real
- Bloqueo automático fuera del horario permitido (con tolerancia configurable)
- Código QR dinámico por empleado (expira cada 5 minutos)
- Métodos soportados: `MANUAL`, `QR`, `RFID`, `ADMIN_OVERRIDE`
- Solicitud de marcaje manual al admin (con motivo obligatorio)

### Origen del marcaje (trazabilidad)
- Cada registro de asistencia guarda su origen: `USER` | `ADMIN` | `EDIT`
- Campo `markedBy`: nombre del admin responsable cuando aplica
- Campos separados `entryNotes` / `exitNotes` para razones de entrada y salida
- En el **historial**, columna Estado muestra:
  - Pill 🛡 **Admin** (azul) o ✏️ **Editado** (ámbar) cuando corresponde
  - Botón ⓘ que abre un popover con: origen, quién marcó, motivo de entrada y motivo de salida por separado

### Dashboard admin — Drag & Drop
- 8 widgets reordenables: 4 métricas, tasa de asistencia, gráfica semanal, gráfica por departamento, actividad reciente
- Drag & drop nativo HTML5 (sin dependencias externas)
- Modo edición activado con botón "Organizar widgets" (solo admins)
- Handle ⠿ visible en hover, widget activo con opacidad reducida, destino con borde azul punteado
- **Persistencia automática** del layout por usuario via `PUT /api/dashboard/layout`
- Carga del layout guardado al montar, debounce de 800ms para guardar
- Botón de reset restaura el orden original
- Indicador "✓ Guardado" al confirmar persistencia

### Dashboard empleado
- Reloj en vivo con cambio de color (blanco → ámbar → rojo) según proximidad al límite
- Estado del día, horario con límites visibles
- Solicitud de marcaje manual si está bloqueado

### Historial de asistencia
- Tabla paginada con filtros: estado, fecha inicio/fin, búsqueda por nombre (admin)
- Admins ven todos los empleados; empleados solo su propio historial
- Leyenda de origen del marcaje en los filtros

### Gestión de empleados (admin)
- Tabla con búsqueda en vivo, paginación
- Crear, editar, activar/desactivar empleados
- **Click en nombre** → modal de historial de asistencia con paginación
- Edición de registros desde el modal (con validación entrada < salida, log de auditoría)
- Marcaje manual desde la tabla

### Reportes (admin)
- Vista previa con estadísticas antes de exportar
- Exportación **CSV** y **PDF** (diseño profesional con stats cards)
- Filtros: período, departamento, **empleado específico** (dropdown con búsqueda)
- El filtro de empleado y departamento son mutuamente excluyentes
- PDF generado en el idioma activo del usuario

### Sistema de notificaciones
- Panel popover en el header (últimas 3 + botón "Ver todas")
- Badge con conteo en tiempo real — se actualiza inmediatamente al leer (evento `notif:read`)
- Polling automático cada 30 segundos
- Tipos con color: INFO, WARNING, SUCCESS, ERROR
- Acciones: marcar leída, marcar todas, eliminar, eliminar leídas

**Eventos que generan notificaciones:**

| Evento | Destinatario |
|---|---|
| Entrada a tiempo | Empleado |
| Entrada con retardo ≥5 min | Empleado + todos los admins |
| Salida registrada | Empleado |
| Marcaje manual por admin | Empleado afectado |
| Nuevo usuario creado | Admin que lo creó |
| Usuario desactivado | Admin que lo desactivó |

### Notificaciones automáticas inteligentes (Scheduler)
Motor de reglas ejecutado via Vercel Cron cada 5 minutos:

| Regla | Cuándo | Destinatario |
|---|---|---|
| **Llegada tarde** | Después de registrar entrada con retardo | Empleado |
| **Fin de jornada** | 10 min antes del horario de salida (si no ha salido) | Empleado |
| **Próximo turno** | 12h antes del inicio del siguiente día laboral | Empleado |

- Deduplicación automática: no envía la misma notificación dos veces en 20h
- Configurable desde `src/config/notifications.ts` (activar/desactivar reglas, tiempos)
- Modo dry run para testing: `POST /api/cron/notifications?dryRun=true&secret=...`
- Fácil extensión: añadir nueva regla → crear función `RuleFn` + registrar en `RULES[]`

### Configuración laboral (admin)
- Días laborales configurables (botones por día de semana)
- Horario de entrada y salida
- Tolerancia de entrada y salida configurable
- Días festivos con nombre opcional

### Sistema de temas y apariencia
- **6 temas predefinidos:** Oscuro Azul (default), Oscuro Violeta, Oscuro Esmeralda, Pizarra, Claro Limpio, Claro Cálido
- Editor de colores custom con color picker nativo
- Sistema de CSS custom properties (`var(--bg-base)`, `var(--accent)`, etc.)
- Persistencia en localStorage

### Sidebar y navegación
- Hamburger animado (≡ → ✕) a la derecha del logo "AccessFlow"
- Desktop: colapsa a solo el hamburger centrado
- Móvil: drawer overlay, se cierra al navegar
- Badge de notificaciones no leídas en el ítem del sidebar

### Auditoría
- Registro automático de: marcajes admin, edición de registros, creación/edición/desactivación de usuarios, cambio de contraseña

### Sistema (admin)
- Backup completo en JSON
- Restauración desde archivo (límite 50 MB, lotes de 50)
- Seed con 6 usuarios demo + 30 días de historial
- Clear: solo datos demo o todo excepto usuario actual

---

## API endpoints

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| POST | `/api/attendance/check` | Registrar entrada/salida | Todos |
| GET | `/api/attendance` | Historial paginado + filtros | Todos |
| PATCH | `/api/attendance/edit` | Editar registro | Admin |
| POST | `/api/attendance/request` | Solicitar marcaje manual | Empleado |
| GET | `/api/dashboard` | Estadísticas dashboard | Admin |
| GET/PUT | `/api/dashboard/layout` | Layout de widgets | Admin |
| GET/PATCH/DELETE | `/api/notifications` | CRUD notificaciones | Todos |
| GET/PATCH | `/api/profile` | Perfil del usuario | Todos |
| GET | `/api/reports` | Exportar CSV/JSON | Admin |
| GET/PUT | `/api/settings` | Configuración laboral | Admin |
| GET/POST/PATCH | `/api/users` | CRUD empleados | Admin |
| GET | `/api/audit` | Logs de auditoría | Admin |
| GET/POST | `/api/cron/notifications` | Ejecutar scheduler | Cron/Admin |
| GET | `/api/admin/backup` | Descargar backup | Admin |
| POST | `/api/admin/restore` | Restaurar backup | Admin |
| POST | `/api/admin/seed` | Crear datos demo | Admin |
| DELETE | `/api/admin/clear` | Limpiar datos | Admin |

---

## Schema Prisma — modelos principales

```
User              → id, email, name, role, department, isActive, dashboardLayout
Attendance        → id, userId, date, checkIn, checkOut, status, lateMinutes,
                    notes, entryNotes, exitNotes, source, markedBy
Notification      → id, userId, title, message, type, isRead
WorkConfig        → checkInTime, checkOutTime, checkInTolerance, checkOutTolerance,
                    workDays, holidays
AccessLog         → userId, action, method, timestamp
AuditLog          → actorId, userId, action, entity, oldData, newData
```

---

## Deploy en Vercel

1. Conectar repositorio en Vercel
2. Configurar variables de entorno (ver sección anterior)
3. El `vercel.json` incluido configura el Cron Job automáticamente:
   ```json
   { "crons": [{ "path": "/api/cron/notifications", "schedule": "*/5 * * * *" }] }
   ```
4. En Supabase usar **Transaction Pooler** (puerto 6543) para `DATABASE_URL` y conexión directa (puerto 5432) para `DIRECT_URL`
5. Tras el primer deploy: `npx prisma db push`

---

## Notas técnicas

- **JWT sin avatar** — el avatar se excluye del JWT para evitar el error 431 (headers demasiado grandes). Se carga via `GET /api/profile` y evento custom `profile:updated`.
- **Timezone** — los registros de asistencia usan UTC midnight explícito para compatibilidad con `@db.Date` de Prisma en Supabase.
- **Drag & Drop** — implementado con HTML5 nativo sin dependencias externas para evitar problemas de instalación en producción.
- **Deduplicación de notificaciones automáticas** — la clave de deduplicación se incrusta en el campo `message` con prefijo `[key]`, eliminado antes de mostrar al usuario via `cleanMessage()`.
- **Evento `notif:read`** — evento custom global que disparan todos los componentes al marcar notificaciones, permitiendo al Sidebar actualizar el badge instantáneamente.
- **`source` en Attendance** — valor `"USER"` por defecto (retrocompatible con registros anteriores al campo), `"ADMIN"` para marcajes manuales por admin, `"EDIT"` para ediciones posteriores.