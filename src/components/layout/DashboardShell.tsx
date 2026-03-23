// src/components/layout/DashboardShell.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { cn, getRoleLabel } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import {
  Menu,
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Notif {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  isRead: boolean;
  createdAt: string;
}

const NOTIF_CFG = {
  INFO: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  WARNING: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  SUCCESS: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  ERROR: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
};

// ─── NotificationPanel ─────────────────────────────────────────────────────────

function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [pStyle, setPStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const pw = 360,
      ww = window.innerWidth;
    let left = r.right - pw;
    left = Math.max(8, Math.min(left, ww - pw - 8));
    setPStyle({
      position: "fixed",
      top: r.bottom + 8,
      left,
      width: Math.min(pw, ww - 16),
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    calcPos();
    window.addEventListener("resize", calcPos);
    window.addEventListener("scroll", calcPos, true);
    return () => {
      window.removeEventListener("resize", calcPos);
      window.removeEventListener("scroll", calcPos, true);
    };
  }, [open, calcPos]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await fetch("/api/notifications?limit=30");
      const d = await r.json();
      setNotifs(d.notifications || []);
      setUnread(d.unreadCount || 0);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (!document.getElementById("notif-portal")?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const markOne = async (id: string) => {
    setActing(id);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs((n) => n.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    setUnread((c) => Math.max(0, c - 1));
    setActing(null);
  };
  const markAll = async () => {
    setActing("all");
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifs((n) => n.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    setActing(null);
  };
  const del = async (id: string) => {
    setActing(id + "-d");
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    setNotifs((n) => n.filter((x) => x.id !== id));
    setActing(null);
  };
  const clearRead = async () => {
    setActing("clear");
    await fetch("/api/notifications?all=true", { method: "DELETE" });
    setNotifs((n) => n.filter((x) => !x.isRead));
    setActing(null);
  };

  const unreadList = notifs.filter((n) => !n.isRead);
  const readList = notifs.filter((n) => n.isRead);

  const panel = (
    <div
      id="notif-portal"
      style={pStyle}
      className="flex flex-col max-h-[520px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {unread} nuevas
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={markAll}
              disabled={acting === "all"}
              className="w-7 h-7 rounded-lg hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              {acting === "all" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          {readList.length > 0 && (
            <button
              onClick={clearRead}
              disabled={acting === "clear"}
              className="w-7 h-7 rounded-lg hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
            >
              {acting === "clear" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center">
              <Bell className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">Sin notificaciones</p>
          </div>
        ) : (
          <div className="py-2">
            {unreadList.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Nuevas
                </p>
                {unreadList.map((n) => (
                  <NRow
                    key={n.id}
                    n={n}
                    onRead={markOne}
                    onDel={del}
                    acting={acting}
                  />
                ))}
              </>
            )}
            {readList.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
                  Anteriores
                </p>
                {readList.map((n) => (
                  <NRow
                    key={n.id}
                    n={n}
                    onRead={markOne}
                    onDel={del}
                    acting={acting}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) load();
        }}
        className={cn(
          "relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all",
          open
            ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
            : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-400",
        )}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold bg-blue-500 text-white leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {mounted && open && createPortal(panel, document.body)}
    </>
  );
}

function NRow({
  n,
  onRead,
  onDel,
  acting,
}: {
  n: Notif;
  onRead: (id: string) => void;
  onDel: (id: string) => void;
  acting: string | null;
}) {
  const cfg = NOTIF_CFG[n.type] || NOTIF_CFG.INFO;
  const Icon = cfg.icon;
  const ago = formatDistanceToNow(new Date(n.createdAt), {
    addSuffix: true,
    locale: es,
  });
  return (
    <div
      onClick={() => !n.isRead && onRead(n.id)}
      className={cn(
        "group flex gap-3 px-4 py-3 transition-colors cursor-pointer",
        n.isRead
          ? "hover:bg-gray-800/40"
          : "bg-blue-500/5 hover:bg-blue-500/10 border-l-2 border-l-blue-500",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
          cfg.bg,
          cfg.border,
        )}
      >
        <Icon className={cn("w-4 h-4", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-xs font-semibold leading-tight",
              n.isRead ? "text-gray-300" : "text-white",
            )}
          >
            {n.title}
          </p>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!n.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRead(n.id);
                }}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-emerald-400"
              >
                {acting === n.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDel(n.id);
              }}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-red-400"
            >
              {acting === n.id + "-d" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
          {n.message}
        </p>
        <p className="text-[10px] text-gray-600 mt-1">{ago}</p>
      </div>
      {!n.isRead && (
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
      )}
    </div>
  );
}

// ─── UserMenu ──────────────────────────────────────────────────────────────────

function UserMenu({
  name,
  email,
  role,
  avatar,
}: {
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mStyle, setMStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const mw = 220,
      ww = window.innerWidth;
    let left = r.right - mw;
    left = Math.max(8, Math.min(left, ww - mw - 8));
    setMStyle({
      position: "fixed",
      top: r.bottom + 8,
      left,
      width: mw,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    calcPos();
    window.addEventListener("resize", calcPos);
    window.addEventListener("scroll", calcPos, true);
    return () => {
      window.removeEventListener("resize", calcPos);
      window.removeEventListener("scroll", calcPos, true);
    };
  }, [open, calcPos]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (
        !document.getElementById("usermenu-portal")?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const AvatarEl = ({ size }: { size: string }) => (
    <div
      className={cn(
        size,
        "rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center overflow-hidden shrink-0",
      )}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-blue-400 text-sm font-semibold">{initials}</span>
      )}
    </div>
  );

  const menu = (
    <div
      id="usermenu-portal"
      style={mStyle}
      className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <AvatarEl size="w-9 h-9" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-[11px] text-gray-500 truncate">{email}</p>
          </div>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Shield className="w-2.5 h-2.5" />
            {getRoleLabel(role)}
          </span>
        </div>
      </div>
      <div className="p-1.5">
        <MBtn
          icon={User}
          label="Mi perfil"
          desc="Editar información"
          onClick={() => {
            router.push("/dashboard/profile");
            setOpen(false);
          }}
        />
        {role === "ADMIN" && (
          <MBtn
            icon={Settings}
            label="Configuración"
            desc="Horario y festivos"
            onClick={() => {
              router.push("/dashboard/settings");
              setOpen(false);
            }}
          />
        )}
      </div>
      <div className="p-1.5 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 pl-3 border-l border-gray-800 group"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white leading-none group-hover:text-blue-400 transition-colors">
            {name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{getRoleLabel(role)}</p>
        </div>
        <div className="flex items-center gap-1">
          <AvatarEl size="w-9 h-9" />
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-gray-500 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </div>
      </button>
      {mounted && open && createPortal(menu, document.body)}
    </>
  );
}

function MBtn({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-all group text-left"
    >
      <div className="w-7 h-7 rounded-lg bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center shrink-0 transition-all">
        <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-200 group-hover:text-white leading-tight">
          {label}
        </p>
        <p className="text-[10px] text-gray-500">{desc}</p>
      </div>
    </button>
  );
}

// ─── AppHeader ────────────────────────────────────────────────────────────────
// avatar se obtiene con un fetch local para evitar el límite de 4KB del JWT cookie

function AppHeader() {
  const { data: session } = useSession();
  const { toggleSidebar } = useAppStore();
  const [avatar, setAvatar] = useState<string | null>(null);
  const dateStr = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

  // Carga el avatar desde la API (evita el límite de tamaño del JWT)
  useEffect(() => {
    if (!session) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setAvatar(d.user?.avatar ?? null))
      .catch(() => {});
  }, [session]);

  // Escucha el evento custom que lanza la página de perfil al guardar
  useEffect(() => {
    const handler = (e: Event) => {
      const newAvatar = (e as CustomEvent).detail?.avatar ?? null;
      setAvatar(newAvatar);
    };
    window.addEventListener("profile:updated", handler);
    return () => window.removeEventListener("profile:updated", handler);
  }, []);

  if (!session) return null;

  const name = session.user.name ?? "";
  const email = session.user.email ?? "";
  const role = (session.user as any).role ?? "";

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center"
        >
          <Menu className="w-4 h-4 text-gray-400" />
        </button>
        <p className="hidden sm:block text-xs text-gray-500 capitalize">
          {dateStr}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationPanel />
        <UserMenu name={name} email={email} role={role} avatar={avatar} />
      </div>
    </header>
  );
}

// ─── DashboardShell ────────────────────────────────────────────────────────────
// El sidebar es `relative` en desktop y cambia entre w-64 y w-16.
// Este componente usa `flex-1 min-w-0` para ocupar automáticamente el espacio restante.
// La transición de ancho del sidebar (transition-all duration-300) arrastra el contenido.

export function DashboardShell({ children }: { children: React.ReactNode }) {
  // min-w-0 prevents flex child from overflowing its container
  // flex-1 makes this grow to fill remaining space after sidebar
  // As sidebar transitions width (256px → 64px), this automatically expands
  return (
    <div
      className="flex-1 min-w-0 flex flex-col"
      style={{ overflow: "hidden" }}
    >
      <AppHeader />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
    </div>
  );
}
