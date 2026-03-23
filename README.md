# AccessFlow — Sistema de Control de Acceso y Asistencia

Sistema web completo para gestión de asistencia laboral con registro QR, control de horarios configurable, panel administrativo y sistema de temas personalizables.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL (Supabase) |
| ORM | Prisma 5 |
| Autenticación | NextAuth.js 4 (JWT) |
| UI | Tailwind CSS + Radix UI |
| Formularios | React Hook Form + Zod |
| Estado global | Zustand (persistido en localStorage) |
| Gráficas | Recharts |
| Códigos QR | react-qr-code + qrcode |
| Notificaciones UI | react-hot-toast |
| Íconos | lucide-react |
| Deploy | Vercel |

---

## Funcionalidades

### Autenticación y usuarios
- Login con email y contraseña (bcrypt + JWT)
- Roles: **Administrador** y **Empleado**
- Protección de rutas via middleware de Next.js
- Redirección automática según rol

### Perfil de usuario
- Edición de nombre, teléfono, cargo y departamento
- Subida de foto de perfil (base64, máx 2MB)
- Cambio de contraseña con indicador de fortaleza
- Avatar visible en tiempo real en el header al guardar

### Registro de asistencia
- Botón de entrada/salida con validación de horario en tiempo real
- Bloqueo automático si se supera el tiempo límite de entrada
- Bloqueo de salida antes del horario mínimo permitido
- Reloj con cambio de color (blanco → ámbar → rojo) según proximidad al límite
- Código QR dinámico por empleado (expira cada 5 minutos)
- Soporte para métodos: MANUAL, QR, RFID

### Marcaje manual (solo admin)
- Desde la tabla de empleados, botón de marcaje manual por persona
- Selección de hora exacta del marcaje
- Campo obligatorio de razón/justificación
- Todo queda registrado en el log de auditoría

### Validación de horario
- Motor de validación centralizado (`src/lib/schedule.ts`)
- Tolerancia de entrada configurable (0–60 min)
- Tolerancia de salida configurable (0–60 min)
- Respeta días festivos configurados por el admin
- Respeta días laborales configurados (L–D individualmente)

### Dashboard
- **Admin:** métricas globales, gráfica de asistencia semanal (área), gráfica por departamento (barras), actividad reciente en tiempo real
- **Empleado:** reloj en vivo, estado del día, horario con límites visibles

### Historial de asistencia
- Tabla paginada con filtros por estado, fecha inicio/fin, búsqueda por nombre
- Admins ven todos los empleados; empleados solo su propio historial

### Reportes (solo admin)
- Vista previa con estadísticas antes de exportar
- Exportación **CSV** (descarga directa)
- Exportación **PDF** (ventana de impresión con diseño profesional: header, stats cards, tabla)
- Filtros por período y departamento

### Configuración laboral (solo admin)
- Días laborales configurables (botones por día de semana)
- Horario de entrada y salida
- Tolerancia de entrada y salida con slider visual (0–60 min)
- Días festivos con nombre opcional, ordenados por fecha
- Botón de guardado flotante que aparece solo con cambios pendientes

### Sistema de notificaciones
- Panel desplegable en el header (portal, z-index correcto)
- Badge con conteo real de no leídas
- Polling automático cada 30 segundos
- Secciones: Nuevas / Anteriores
- Acciones: marcar una leída, marcar todas leídas, eliminar una, eliminar todas las leídas
- Tiempo relativo en español ("hace 5 minutos")
- Tipos con color: INFO (azul), WARNING (ámbar), SUCCESS (verde), ERROR (rojo)
- Eventos que generan notificaciones automáticas:

| Evento | Destinatario |
|---|---|
| Entrada a tiempo | Empleado |
| Entrada con retardo (≥5 min) | Empleado + todos los admins |
| Salida registrada | Empleado |
| Marcaje manual por admin | Empleado afectado |
| Nuevo usuario creado | Admin que lo creó |

### Gestión de empleados (solo admin)
- Tabla con búsqueda en vivo por nombre/email
- Crear empleado con todos sus datos
- Editar nombre, rol, departamento, cargo
- Activar/desactivar usuario (soft delete)
- Código QR único generado automáticamente

### Logs de auditoría (solo admin)
- Registro automático de: CREATE, UPDATE, DEACTIVATE (usuarios), CHANGE_PASSWORD, UPDATE_PROFILE, ADMIN_MARK_ENTRY/EXIT

### Apariencia y temas
- **6 temas predefinidos:**
  - Oscuros: Oscuro Azul (por defecto), Oscuro Violeta, Oscuro Esmeralda, Pizarra
  - Claros: Claro Limpio, Claro Cálido
- Editor de colores custom por color individual (color picker nativo)
- Vista previa en vivo de los cambios
- Badge indicador de colores personalizados vs base
- Restauración individual o total de colores
- Sistema de CSS custom properties (`var(--bg-base)`, `var(--accent)`, etc.)
- Persistencia del tema elegido en localStorage

### Sidebar y navegación
- Desktop: colapsa a iconos (64px) con transición suave de ancho — el contenido se expande/contrae dinámicamente
- Móvil: drawer overlay con botón hamburguesa, se cierra al navegar
- Tooltips en iconos cuando el sidebar está colapsado
- Dropdown de usuario con portal (z-index garantizado sobre cualquier elemento)

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth endpoints
│   │   ├── attendance/             # Historial paginado
│   │   ├── attendance/check/       # Check-in / check-out con validación
│   │   ├── audit/                  # Logs de auditoría
│   │   ├── dashboard/              # Estadísticas para el dashboard
│   │   ├── notifications/          # CRUD de notificaciones
│   │   ├── profile/                # Perfil del usuario autenticado
│   │   ├── reports/                # Exportación CSV/JSON
│   │   ├── settings/               # Configuración de horario laboral
│   │   └── users/                  # CRUD de empleados (admin)
│   ├── dashboard/
│   │   ├── appearance/             # Temas y colores
│   │   ├── attendance/             # Registro asistencia + QR
│   │   ├── audit/                  # Tabla de auditoría
│   │   ├── history/                # Historial filtrable
│   │   ├── profile/                # Perfil de usuario
│   │   ├── reports/                # Generación de reportes
│   │   ├── settings/               # Configuración laboral
│   │   ├── users/                  # Gestión de empleados
│   │   ├── layout.tsx              # Layout con Sidebar + DashboardShell
│   │   └── page.tsx                # Dashboard principal
│   ├── login/                      # Página de login
│   ├── globals.css                 # Variables CSS del sistema de temas
│   └── layout.tsx                  # Root layout con ThemeProvider
├── components/
│   ├── attendance/
│   │   ├── AdminMarkModal.tsx      # Modal de marcaje manual
│   │   └── QRCodeWidget.tsx        # Widget QR con countdown
│   ├── dashboard/
│   │   ├── AdminDashboard.tsx      # Dashboard con gráficas
│   │   └── EmployeeDashboard.tsx   # Dashboard empleado con reloj
│   ├── layout/
│   │   ├── DashboardShell.tsx      # Shell con Header, Notifs, UserMenu (autónomo)
│   │   ├── Header.tsx              # Header (legacy, no usado directamente)
│   │   ├── NotificationPanel.tsx   # Panel notificaciones (legacy)
│   │   ├── Sidebar.tsx             # Sidebar con collapse y drawer móvil
│   │   └── UserMenu.tsx            # Dropdown de usuario (legacy)
│   ├── ui/
│   │   ├── Badge.tsx               # StatusBadge, RoleBadge
│   │   ├── DataTable.tsx           # Tabla paginada reutilizable
│   │   ├── Modal.tsx               # Modal genérico
│   │   └── StatCard.tsx            # Tarjeta de métrica
│   ├── Providers.tsx               # SessionProvider + Toaster temático
│   └── ThemeProvider.tsx           # Aplica CSS vars según tema activo
├── hooks/
│   └── useAttendance.ts            # Hook para operaciones de asistencia
├── lib/
│   ├── auth.ts                     # Configuración NextAuth (solo datos pequeños en JWT)
│   ├── notifications.ts            # Servicio de creación de notificaciones
│   ├── prisma.ts                   # Cliente Prisma singleton
│   ├── qr.ts                       # Generación y parseo de QR
│   ├── schedule.ts                 # Motor de validación de horario laboral
│   ├── themes.ts                   # Definición de temas y función applyTheme()
│   ├── utils.ts                    # Helpers de fecha, estado, exportación
│   └── validations.ts              # Schemas Zod para todos los endpoints
├── middleware.ts                   # Protección de rutas y control de roles
├── store/
│   └── useAppStore.ts              # Estado global: sidebar, themeId, customColors
└── types/
    ├── index.ts                    # DTOs y tipos del dominio
    └── next-auth.d.ts              # Extensión del tipo Session de NextAuth
```

---

## Base de datos

```
users           → Empleados y administradores (con avatar, QR)
attendances     → Registros diarios (check-in/out, estado, retardo)
access_logs     → Log de cada evento de acceso (método, IP, acción)
work_schedules  → Horarios base (legacy, reemplazado por work_config)
work_config     → Configuración activa: días, horarios, tolerancias, festivos
audit_logs      → Historial de cambios del sistema con datos old/new en JSON
notifications   → Notificaciones por usuario (tipo, leída, timestamp)
```

---

## API Reference

### Autenticación
```
POST /api/auth/signin          Login con credenciales
POST /api/auth/signout         Logout
GET  /api/auth/session         Sesión actual del usuario
```

### Asistencia
```
GET  /api/attendance                          Historial paginado con filtros
POST /api/attendance/check                    Registrar entrada o salida
GET  /api/attendance/check?userId=            Estado de hoy + horario del día
```

Parámetros del POST check-in:
```json
{
  "userId": "cuid",
  "method": "MANUAL | QR | RFID | ADMIN_OVERRIDE",
  "overrideTime": "ISO string (solo admin)",
  "reason": "texto (obligatorio para ADMIN_OVERRIDE)"
}
```

### Usuarios
```
GET    /api/users               Listar con búsqueda, departamento, rol y paginación
POST   /api/users               Crear usuario (admin)
GET    /api/users/:id           Obtener usuario
PATCH  /api/users/:id           Actualizar usuario (admin)
DELETE /api/users/:id           Desactivar usuario (admin, soft delete)
```

### Perfil
```
GET   /api/profile              Perfil del usuario autenticado
PATCH /api/profile              Actualizar info personal o cambiar contraseña
```

### Dashboard, Reportes y Auditoría
```
GET /api/dashboard              Estadísticas globales (solo admin)
GET /api/reports?startDate=&endDate=&format=CSV|JSON   Exportar reporte
GET /api/audit                  Logs de auditoría paginados (solo admin)
```

### Configuración y notificaciones
```
GET /api/settings               Obtener configuración laboral activa
PUT /api/settings               Guardar configuración (solo admin)
GET    /api/notifications       Listar notificaciones del usuario
PATCH  /api/notifications       Marcar leída(s)
DELETE /api/notifications       Eliminar una o todas las leídas
```

---

## Roles y permisos

| Funcionalidad | Empleado | Admin |
|---|:---:|:---:|
| Ver y editar su perfil | ✅ | ✅ |
| Registrar entrada/salida | ✅ | ✅ |
| Ver su historial propio | ✅ | ✅ |
| Código QR personal | ✅ | ✅ |
| Cambiar tema de la app | ✅ | ✅ |
| Ver dashboard de métricas | ❌ | ✅ |
| Ver historial de todos | ❌ | ✅ |
| Marcaje manual para empleados | ❌ | ✅ |
| Gestionar empleados (CRUD) | ❌ | ✅ |
| Generar reportes CSV/PDF | ❌ | ✅ |
| Configurar horario y festivos | ❌ | ✅ |
| Ver logs de auditoría | ❌ | ✅ |

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/sistema-de-control-de-acceso-y-asistencia.git
cd sistema-de-control-de-acceso-y-asistencia
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Base de datos Supabase — Transaction Pooler (puerto 6543)
DATABASE_URL="postgresql://postgres.xxx:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true&connection_limit=1"

# Supabase Session Mode (puerto 5432) — para migraciones Prisma
DIRECT_URL="postgresql://postgres.xxx:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres?schema=public"

# Generar con: openssl rand -base64 32
NEXTAUTH_SECRET="secreto-seguro-min-32-caracteres"

# URL local
NEXTAUTH_URL="http://localhost:3000"

# Para acceso desde móvil en la misma red
# NEXTAUTH_URL="http://192.168.x.x:3000"
```

> **Importante:** No almacenar avatares (base64) en variables de entorno ni en el JWT. El sistema ya gestiona esto correctamente leyendo el avatar desde la BD en cada request.

### 4. Inicializar base de datos

```bash
npm run db:push       # Crea tablas en la BD
npm run db:generate   # Genera el cliente Prisma
npm run db:seed       # Puebla con datos de prueba (5 empleados + 30 días de historial)
```

### 5. Iniciar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Acceso desde móvil (red local)

```bash
# Arrancar en todas las interfaces
npm run dev   # ya configurado con -H 0.0.0.0
```

Accede desde el móvil a `http://TU_IP_LOCAL:3000` (misma red WiFi).

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@accessflow.com | admin123 |
| Empleado | maria@accessflow.com | employee123 |
| Empleado | carlos@accessflow.com | employee123 |

---

## Scripts

```bash
npm run dev          # Servidor de desarrollo (0.0.0.0:3000)
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # ESLint
npm run db:push      # Sincronizar schema con la BD
npm run db:generate  # Regenerar cliente Prisma
npm run db:seed      # Poblar BD con datos de prueba
npm run db:studio    # Abrir Prisma Studio (GUI visual de la BD)
```

---

## Deploy en Vercel

### 1. Base de datos

Usar [Supabase](https://supabase.com) (recomendado) o [Neon](https://neon.tech). Ambos son gratuitos.

En Supabase, ir a **Project Settings → Database → Connection string** y copiar:
- **Transaction** (puerto 6543) → `DATABASE_URL`
- **Session** (puerto 5432) → `DIRECT_URL`

### 2. Deploy

```bash
npm i -g vercel
vercel --prod
```

### 3. Variables de entorno en Vercel

Configurar en el dashboard de Vercel → Settings → Environment Variables:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Transaction Pooler de Supabase (puerto 6543) |
| `DIRECT_URL` | Session Mode de Supabase (puerto 5432) |
| `NEXTAUTH_SECRET` | Secreto JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL final de Vercel (ej: `https://mi-app.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Igual que `NEXTAUTH_URL` |

### 4. Post-deploy

```bash
# Ejecutar seed en producción con la URL de producción
DATABASE_URL="..." DIRECT_URL="..." npm run db:seed
```

---

## Notas técnicas importantes

### JWT y cookies
El JWT solo almacena `id`, `name` y `role`. **Nunca** se almacena el avatar en el JWT para evitar el error HTTP 431 (Request Header Fields Too Large). El avatar se carga desde la API en el cliente.

### Sistema de temas
Los temas funcionan mediante CSS custom properties (`var(--bg-base)`, `var(--accent)`, etc.) seteadas en el elemento `<html>` por `ThemeProvider`. Tailwind sigue usándose para layout y utilidades; los colores de superficie y acento son manejados por las variables.

### Validación de horario
`src/lib/schedule.ts` centraliza toda la lógica: calcula si el empleado puede marcar, cuántos minutos de retardo lleva, y retorna los límites exactos para mostrarlos en la UI. Los administradores nunca son bloqueados por esta validación.

### DashboardShell autónomo
`DashboardShell.tsx` contiene inline los componentes `NotificationPanel`, `UserMenu` y `AppHeader` para evitar errores de importación circular entre componentes cliente de Next.js 14.

---

## Licencia

MIT