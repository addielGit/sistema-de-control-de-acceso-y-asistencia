// src/store/useAppStore.ts
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  sidebarOpen: boolean;
  theme: "dark" | "light";
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "dark" | "light") => void;
  initSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "dark",
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      // Abre en desktop, cierra en móvil al inicializar
      initSidebar: () => {
        const isMobile =
          typeof window !== "undefined" && window.innerWidth < 1024;
        set({ sidebarOpen: !isMobile });
      },
    }),
    { name: "accessflow-app" },
  ),
);
