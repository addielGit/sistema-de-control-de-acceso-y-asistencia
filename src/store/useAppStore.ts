// src/store/useAppStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ThemeColors, PRESET_THEMES } from "@/lib/themes";

interface ThemeState {
  themeId: string;
  customColors: Partial<ThemeColors>;
}

interface AppState {
  sidebarOpen: boolean;
  themeId: string;
  customColors: Partial<ThemeColors>;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  initSidebar: () => void;
  setThemeId: (id: string) => void;
  setCustomColors: (colors: Partial<ThemeColors>) => void;
  resetCustomColors: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      themeId: "dark-blue",
      customColors: {},

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setThemeId: (id) => set({ themeId: id, customColors: {} }),
      setCustomColors: (colors) =>
        set((s) => ({ customColors: { ...s.customColors, ...colors } })),
      resetCustomColors: () => set({ customColors: {} }),

      initSidebar: () => {
        const isMobile =
          typeof window !== "undefined" && window.innerWidth < 1024;
        set({ sidebarOpen: !isMobile });
      },
    }),
    { name: "accessflow-app" },
  ),
);
