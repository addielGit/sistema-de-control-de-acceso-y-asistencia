// src/components/layout/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  FileText,
  Shield,
  ChevronLeft,
  LogOut,
  History,
  Settings,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    href: "/dashboard/attendance",
    label: "Mi Asistencia",
    icon: Clock,
    adminOnly: false,
  },
  {
    href: "/dashboard/history",
    label: "Historial",
    icon: History,
    adminOnly: false,
  },
  {
    href: "/dashboard/users",
    label: "Empleados",
    icon: Users,
    adminOnly: true,
  },
  {
    href: "/dashboard/reports",
    label: "Reportes",
    icon: FileText,
    adminOnly: true,
  },
  {
    href: "/dashboard/audit",
    label: "Auditoría",
    icon: Shield,
    adminOnly: true,
  },
  {
    href: "/dashboard/settings",
    label: "Configuración",
    icon: Settings,
    adminOnly: true,
  },
];

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar, initSidebar } =
    useAppStore();
  const isAdmin = role === "ADMIN";
  const items = navItems.filter((i) => !i.adminOnly || isAdmin);
  const isDesktop = () =>
    typeof window !== "undefined" && window.innerWidth >= 1024;

  // Inicializa abierto en desktop, cerrado en móvil
  useEffect(() => {
    initSidebar();
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // En móvil cierra al navegar
  useEffect(() => {
    if (!isDesktop()) setSidebarOpen(false);
  }, [pathname]);

  // Escape cierra
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-gray-900 border-r border-gray-800 shrink-0",
          "transition-all duration-300 ease-in-out",
          // Móvil: fixed overlay, no ocupa espacio en el flujo
          "fixed top-0 left-0 h-full z-40",
          "lg:relative lg:z-auto lg:h-screen",
          // Ancho: en desktop alterna 256px / 64px (empuja el contenido)
          // En móvil: siempre 256px pero fuera de pantalla si cerrado
          sidebarOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full lg:w-16 lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <span
              className={cn(
                "font-bold text-white text-lg gradient-text whitespace-nowrap",
                "transition-all duration-300 overflow-hidden",
                sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0 lg:hidden",
              )}
            >
              AccessFlow
            </span>
          </div>
        </div>

        {/* Botón colapsar — solo desktop */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full items-center justify-center hover:bg-gray-700 z-10 shrink-0"
        >
          <ChevronLeft
            className={cn(
              "w-3 h-3 text-gray-400 transition-transform duration-300",
              !sidebarOpen && "rotate-180",
            )}
          />
        </button>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={!sidebarOpen ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  "whitespace-nowrap overflow-hidden",
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-blue-400"
                      : "text-gray-500 group-hover:text-white",
                  )}
                />
                <span
                  className={cn(
                    "transition-all duration-300 overflow-hidden",
                    sidebarOpen
                      ? "opacity-100 max-w-xs"
                      : "opacity-0 max-w-0 lg:hidden",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-gray-800 shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={!sidebarOpen ? "Cerrar sesión" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all group overflow-hidden"
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:text-red-400" />
            <span
              className={cn(
                "transition-all duration-300 overflow-hidden whitespace-nowrap",
                sidebarOpen
                  ? "opacity-100 max-w-xs"
                  : "opacity-0 max-w-0 lg:hidden",
              )}
            >
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
