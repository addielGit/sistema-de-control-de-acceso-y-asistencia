// src/components/ThemeProvider.tsx
"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getTheme, applyTheme, PRESET_THEMES } from "@/lib/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeId, customColors } = useAppStore();

  useEffect(() => {
    const base = getTheme(themeId);
    const merged = { ...base, colors: { ...base.colors, ...customColors } };
    applyTheme(merged);
  }, [themeId, customColors]);

  return <>{children}</>;
}
