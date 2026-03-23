// src/components/Providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster, useToasterStore } from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";

function ThemedToaster() {
  const { themeId } = useAppStore();
  const isDark = !themeId.startsWith("light");
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-base)",
          borderRadius: "10px",
          fontSize: "14px",
        },
        success: {
          iconTheme: { primary: "#34d399", secondary: "var(--bg-surface)" },
        },
        error: {
          iconTheme: { primary: "#f87171", secondary: "var(--bg-surface)" },
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ThemedToaster />
    </SessionProvider>
  );
}
