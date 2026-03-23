// src/lib/themes.ts
export interface ThemeColors {
  // Backgrounds
  bgBase: string; // página principal
  bgSurface: string; // cards, panels
  bgElevated: string; // header, sidebar
  bgInput: string; // inputs, selects
  bgHover: string; // hover states
  // Borders
  borderBase: string;
  borderMuted: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accent (primary color — botones, links, activos)
  accent: string;
  accentHover: string;
  accentMuted: string; // bg tenue del accent
  accentText: string; // texto sobre accent background
  // Glass effect
  glassBg: string;
  glassBorder: string;
}

export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
}

export const PRESET_THEMES: Theme[] = [
  // ── DARK THEMES ──────────────────────────────────────────────────
  {
    id: "dark-blue",
    name: "Oscuro Azul",
    isDark: true,
    colors: {
      bgBase: "#030712",
      bgSurface: "#111827",
      bgElevated: "#0f172a",
      bgInput: "#1f2937",
      bgHover: "#1f2937",
      borderBase: "#374151",
      borderMuted: "#1f2937",
      textPrimary: "#f9fafb",
      textSecondary: "#9ca3af",
      textMuted: "#6b7280",
      accent: "#3b82f6",
      accentHover: "#2563eb",
      accentMuted: "rgba(59,130,246,0.15)",
      accentText: "#93c5fd",
      glassBg: "rgba(17,24,39,0.8)",
      glassBorder: "rgba(55,65,81,0.5)",
    },
  },
  {
    id: "dark-violet",
    name: "Oscuro Violeta",
    isDark: true,
    colors: {
      bgBase: "#0d0a1a",
      bgSurface: "#130f22",
      bgElevated: "#1a1530",
      bgInput: "#211c35",
      bgHover: "#211c35",
      borderBase: "#3d3460",
      borderMuted: "#2a2445",
      textPrimary: "#f5f3ff",
      textSecondary: "#a78bfa",
      textMuted: "#7c3aed",
      accent: "#8b5cf6",
      accentHover: "#7c3aed",
      accentMuted: "rgba(139,92,246,0.15)",
      accentText: "#c4b5fd",
      glassBg: "rgba(19,15,34,0.85)",
      glassBorder: "rgba(61,52,96,0.5)",
    },
  },
  {
    id: "dark-emerald",
    name: "Oscuro Esmeralda",
    isDark: true,
    colors: {
      bgBase: "#022c22",
      bgSurface: "#064e3b",
      bgElevated: "#065f46",
      bgInput: "#047857",
      bgHover: "#065f46",
      borderBase: "#065f46",
      borderMuted: "#047857",
      textPrimary: "#ecfdf5",
      textSecondary: "#6ee7b7",
      textMuted: "#34d399",
      accent: "#10b981",
      accentHover: "#059669",
      accentMuted: "rgba(16,185,129,0.15)",
      accentText: "#6ee7b7",
      glassBg: "rgba(6,78,59,0.85)",
      glassBorder: "rgba(6,95,70,0.5)",
    },
  },
  {
    id: "dark-slate",
    name: "Pizarra",
    isDark: true,
    colors: {
      bgBase: "#0f172a",
      bgSurface: "#1e293b",
      bgElevated: "#162032",
      bgInput: "#293548",
      bgHover: "#293548",
      borderBase: "#334155",
      borderMuted: "#1e293b",
      textPrimary: "#f1f5f9",
      textSecondary: "#94a3b8",
      textMuted: "#64748b",
      accent: "#38bdf8",
      accentHover: "#0ea5e9",
      accentMuted: "rgba(56,189,248,0.15)",
      accentText: "#7dd3fc",
      glassBg: "rgba(30,41,59,0.8)",
      glassBorder: "rgba(51,65,85,0.5)",
    },
  },
  // ── LIGHT THEMES ─────────────────────────────────────────────────
  {
    id: "light-clean",
    name: "Claro Limpio",
    isDark: false,
    colors: {
      bgBase: "#f8fafc",
      bgSurface: "#ffffff",
      bgElevated: "#f1f5f9",
      bgInput: "#f8fafc",
      bgHover: "#f1f5f9",
      borderBase: "#e2e8f0",
      borderMuted: "#f1f5f9",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#94a3b8",
      accent: "#3b82f6",
      accentHover: "#2563eb",
      accentMuted: "rgba(59,130,246,0.1)",
      accentText: "#1d4ed8",
      glassBg: "rgba(255,255,255,0.85)",
      glassBorder: "rgba(226,232,240,0.8)",
    },
  },
  {
    id: "light-warm",
    name: "Claro Cálido",
    isDark: false,
    colors: {
      bgBase: "#fafaf9",
      bgSurface: "#ffffff",
      bgElevated: "#f5f5f4",
      bgInput: "#fafaf9",
      bgHover: "#f5f5f4",
      borderBase: "#e7e5e4",
      borderMuted: "#f5f5f4",
      textPrimary: "#1c1917",
      textSecondary: "#57534e",
      textMuted: "#a8a29e",
      accent: "#f97316",
      accentHover: "#ea580c",
      accentMuted: "rgba(249,115,22,0.1)",
      accentText: "#c2410c",
      glassBg: "rgba(255,255,255,0.85)",
      glassBorder: "rgba(231,229,228,0.8)",
    },
  },
];

export function getTheme(id: string): Theme {
  return PRESET_THEMES.find((t) => t.id === id) ?? PRESET_THEMES[0];
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const c = theme.colors;

  // Set CSS vars on :root
  root.style.setProperty("--bg-base", c.bgBase);
  root.style.setProperty("--bg-surface", c.bgSurface);
  root.style.setProperty("--bg-elevated", c.bgElevated);
  root.style.setProperty("--bg-input", c.bgInput);
  root.style.setProperty("--bg-hover", c.bgHover);
  root.style.setProperty("--border-base", c.borderBase);
  root.style.setProperty("--border-muted", c.borderMuted);
  root.style.setProperty("--text-primary", c.textPrimary);
  root.style.setProperty("--text-secondary", c.textSecondary);
  root.style.setProperty("--text-muted", c.textMuted);
  root.style.setProperty("--accent", c.accent);
  root.style.setProperty("--accent-hover", c.accentHover);
  root.style.setProperty("--accent-muted", c.accentMuted);
  root.style.setProperty("--accent-text", c.accentText);
  root.style.setProperty("--glass-bg", c.glassBg);
  root.style.setProperty("--glass-border", c.glassBorder);

  // dark/light class on html element
  if (theme.isDark) {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
}
