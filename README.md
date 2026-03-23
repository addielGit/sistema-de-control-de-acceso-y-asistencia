# AccessFlow — Sistema de Control de Acceso y Asistencia

Sistema web moderno construido con **Next.js 14**, **TypeScript**, **Prisma** y **PostgreSQL**.

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | NextAuth.js (JWT) |
| UI | Tailwind CSS + Radix UI |
| Estado | Zustand |
| Validación | Zod |
| Gráficas | Recharts |
| QR | react-qr-code + qrcode |
| Deploy | Vercel |

---

## 📁 Estructura del Proyecto

```
accessflow/
├── prisma/
│   ├── schema.prisma        # Modelos de BD
│   └── seed.ts              # Datos iniciales
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        # NextAuth endpoints
│   │   │   ├── attendance/  # Check-in/out, historial
│   │   │   ├── users/       # CRUD usuarios
│   │   │   ├── dashboard/   # Estadísticas
│   │   │   ├── reports/     # Generación de reportes
│   │   │   └── audit/       # Logs de auditoría
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Dashboard principal
│   │   │   ├── attendance/       # Registro asistencia
│   │   │   ├── history/          # Historial filtrable
│   │   │   ├── users/            # Gestión empleados
│   │   │   ├── reports/          # Reportes CSV/JSON
│   │   │   └── audit/            # Logs auditoría
│   │   ├── login/           # Página login
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Estilos globales
│   ├── components/
│   │   ├── ui/              # Componentes base (Table, Modal, Badge...)
│   │   ├── layout/          # Sidebar, Header
│   │   ├── dashboard/       # AdminDashboard, EmployeeDashboard
│   │   └── attendance/      # QRCodeWidget
│   ├── lib/
│   │   ├── prisma.ts        # Cliente Prisma singleton
│   │   ├── auth.ts          # Config NextAuth
│   │   ├── validations.ts   # Schemas Zod
│   │   ├── utils.ts         # Utilidades
│   │   └── qr.ts            # Generación QR
│   ├── hooks/               # Hooks personalizados
│   ├── store/               # Estado global (Zustand)
│   ├── types/               # TypeScript types
│   └── middleware.ts        # Protección de rutas
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── vercel.json
```

---

## ⚙️ Instalación y Configuración

### 1. Clonar y instalar dependencias

```bash
git clone <repo-url>
cd accessflow
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/accessflow"
NEXTAUTH_SECRET="genera-un-secreto-seguro-aqui-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

**Generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Configurar base de datos

```bash
# Crear tablas
npm run db:push

# Generar cliente Prisma
npm run db:generate

# Poblar con datos de prueba
npm run db:seed
```

### 4. Iniciar servidor de desarrollo

```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)

---

## 🔑 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@accessflow.com | admin123 |
| Empleado | maria@accessflow.com | employee123 |

---

## 🌐 API Endpoints

### Autenticación
```
POST /api/auth/signin      # Login
POST /api/auth/signout     # Logout
GET  /api/auth/session     # Sesión actual
```

### Asistencia
```
GET  /api/attendance                    # Historial (filtrable)
POST /api/attendance/check              # Registrar entrada/salida
GET  /api/attendance/check?userId=xxx   # Estado de hoy
```

### Usuarios (Admin)
```
GET    /api/users           # Listar usuarios
POST   /api/users           # Crear usuario
GET    /api/users/:id       # Obtener usuario
PATCH  /api/users/:id       # Actualizar usuario
DELETE /api/users/:id       # Desactivar usuario
```

### Dashboard
```
GET /api/dashboard          # Estadísticas generales (Admin)
```

### Reportes
```
GET /api/reports?startDate=&endDate=&format=CSV   # Exportar reporte
```

### Auditoría
```
GET /api/audit              # Logs de auditoría (Admin)
```

---

## 🔐 Roles y Permisos

| Funcionalidad | Empleado | Admin |
|---------------|----------|-------|
| Ver su propia asistencia | ✅ | ✅ |
| Registrar entrada/salida | ✅ | ✅ |
| Ver historial propio | ✅ | ✅ |
| Ver historial de todos | ❌ | ✅ |
| Gestionar empleados | ❌ | ✅ |
| Ver dashboard de métricas | ❌ | ✅ |
| Generar reportes | ❌ | ✅ |
| Ver auditoría | ❌ | ✅ |

---

## 🚀 Despliegue en Vercel

### 1. Crear base de datos PostgreSQL
Recomendado: [Neon](https://neon.tech) (gratis), [Supabase](https://supabase.com), o [Railway](https://railway.app)

### 2. Desplegar en Vercel

```bash
npm i -g vercel
vercel --prod
```

### 3. Configurar variables de entorno en Vercel Dashboard

```
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tu-app.vercel.app
```

### 4. Ejecutar seed en producción

```bash
DATABASE_URL="tu-url-produccion" npm run db:seed
```

---

## 📊 Esquema de Base de Datos

```
users           → Empleados y administradores
attendances     → Registros diarios de asistencia (check-in/out)
access_logs     → Log de cada evento de acceso
work_schedules  → Horarios de trabajo configurables
audit_logs      → Historial de cambios del sistema
notifications   → Notificaciones por usuario
```

---

## 🧩 Funcionalidades Implementadas

- ✅ Autenticación JWT con NextAuth
- ✅ Roles (Admin / Empleado) con protección de rutas
- ✅ Dashboard con métricas, gráficas de área y barras
- ✅ Registro de entrada/salida manual
- ✅ Código QR dinámico (expira cada 5 minutos)
- ✅ Historial de asistencia filtrable con paginación
- ✅ Gestión de empleados (CRUD completo)
- ✅ Detección de retardos automática
- ✅ Exportación de reportes CSV y JSON
- ✅ Logs de auditoría
- ✅ Diseño dark mode responsive
- ✅ Validación con Zod en frontend y backend
- ✅ Logs de acceso por IP y método
- ✅ Seed de datos de prueba (30 días de historial)
