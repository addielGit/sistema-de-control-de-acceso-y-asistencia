// src/components/layout/Header.tsx
"use client";
import { Menu } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getRoleLabel } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { NotificationPanel } from "./NotificationPanel";

interface HeaderProps {
  user: { name: string; email: string; role: string; image?: string };
}

export function Header({ user }: HeaderProps) {
  const now = new Date();
  const dateStr = format(now, "EEEE, d 'de' MMMM yyyy", { locale: es });
  const { toggleSidebar } = useAppStore();

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
        {/* Panel de notificaciones */}
        <NotificationPanel />

        <div className="flex items-center gap-3 pl-3 border-l border-gray-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white leading-none">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {getRoleLabel(user.role)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-blue-400 text-sm font-semibold">
                {user.name[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
