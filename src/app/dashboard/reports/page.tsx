// src/app/dashboard/reports/page.tsx
"use client";
import { useState } from "react";
import {
  Download,
  FileText,
  Loader2,
  Calendar,
  Building2,
  FileDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DEPTS = [
  "Tecnología",
  "Recursos Humanos",
  "Ventas",
  "Marketing",
  "Operaciones",
  "Finanzas",
];

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Presente",
  LATE: "Retardo",
  ABSENT: "Ausente",
  HALF_DAY: "Medio día",
};

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "#34d399",
  LATE: "#fbbf24",
  ABSENT: "#f87171",
  HALF_DAY: "#60a5fa",
};

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [previewData, setPreview] = useState<any[] | null>(null);
  const [form, setForm] = useState({
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    department: "",
  });

  const fetchData = async () => {
    const params = new URLSearchParams({ ...form, format: "JSON" });
    const res = await fetch(`/api/reports?${params}`);
    if (!res.ok) throw new Error("Error obteniendo datos");
    const json = await res.json();
    return json.data as any[];
  };

  const handleCSV = async () => {
    setLoading("csv");
    try {
      const params = new URLSearchParams({ ...form, format: "CSV" });
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error("Error generando reporte");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asistencia_${format(new Date(), "yyyyMMdd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV descargado");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handlePDF = async () => {
    setLoading("pdf");
    try {
      const data = await fetchData();
      if (!data.length) {
        toast.error("No hay datos para el período seleccionado");
        return;
      }
      generatePDF(data, form);
      toast.success("PDF generado");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handlePreview = async () => {
    setLoading("preview");
    try {
      const data = await fetchData();
      setPreview(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const presets = [
    { label: "Esta semana", days: 7 },
    { label: "Este mes", days: 30 },
    { label: "3 meses", days: 90 },
    { label: "Este año", days: 365 },
  ];

  const applyPreset = (days: number) => {
    setForm((f) => ({
      ...f,
      startDate: new Date(Date.now() - days * 86400000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    }));
    setPreview(null);
  };

  // Estadísticas del preview
  const stats = previewData
    ? {
        total: previewData.length,
        present: previewData.filter((r) => r["Estado"] === "PRESENT").length,
        late: previewData.filter((r) => r["Estado"] === "LATE").length,
        absent: previewData.filter((r) => r["Estado"] === "ABSENT").length,
      }
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-gray-400 text-sm mt-1">
          Exporta registros de asistencia en CSV o PDF
        </p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        {/* Presets */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2.5">
            Período rápido
          </p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800 transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Fecha inicio
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => {
                setForm((f) => ({ ...f, startDate: e.target.value }));
                setPreview(null);
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Fecha fin
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => {
                setForm((f) => ({ ...f, endDate: e.target.value }));
                setPreview(null);
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Departamento
            </label>
            <select
              value={form.department}
              onChange={(e) => {
                setForm((f) => ({ ...f, department: e.target.value }));
                setPreview(null);
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            >
              <option value="">Todos los departamentos</option>
              {DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <button
            onClick={handlePreview}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 hover:border-gray-500 hover:bg-gray-800 text-gray-300 text-sm font-medium transition-all disabled:opacity-40"
          >
            {loading === "preview" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Vista previa
          </button>
          <button
            onClick={handleCSV}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-sm font-medium transition-all disabled:opacity-40"
          >
            {loading === "csv" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            CSV
          </button>
          <button
            onClick={handlePDF}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-medium transition-all disabled:opacity-40"
          >
            {loading === "pdf" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            PDF
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas + preview */}
      {stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              {
                label: "Presentes",
                value: stats.present,
                color: "text-emerald-400",
              },
              { label: "Retardos", value: stats.late, color: "text-amber-400" },
              { label: "Ausentes", value: stats.absent, color: "text-red-400" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabla preview */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <p className="text-xs font-semibold text-white">
                Vista previa ({previewData!.length} registros)
              </p>
              <button
                onClick={() => setPreview(null)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Cerrar
              </button>
            </div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-900">
                  <tr>
                    {[
                      "Empleado",
                      "Depto.",
                      "Fecha",
                      "Entrada",
                      "Salida",
                      "Estado",
                      "Retardo",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {previewData!.slice(0, 50).map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-white font-medium">
                        {row["Empleado"]}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">
                        {row["Departamento"] || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-300 font-mono">
                        {row["Fecha"]}
                      </td>
                      <td className="px-4 py-2.5 text-gray-300 font-mono">
                        {row["Check-in"]}
                      </td>
                      <td className="px-4 py-2.5 text-gray-300 font-mono">
                        {row["Check-out"]}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          style={{
                            color: STATUS_COLORS[row["Estado"]] || "#9ca3af",
                          }}
                          className="font-medium"
                        >
                          {STATUS_LABELS[row["Estado"]] || row["Estado"]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">
                        {row["Retardo (min)"] > 0
                          ? `${row["Retardo (min)"]} min`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData!.length > 50 && (
                <p className="px-4 py-3 text-xs text-gray-500 text-center">
                  Mostrando primeros 50 de {previewData!.length} registros.
                  Exporta para ver todos.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campos incluidos */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs font-semibold text-white mb-3">
          Campos incluidos en el reporte
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            "Empleado",
            "Email",
            "Departamento",
            "Cargo",
            "Fecha",
            "Check-in",
            "Check-out",
            "Estado",
            "Retardo (min)",
            "Notas",
          ].map((f) => (
            <div
              key={f}
              className="flex items-center gap-1.5 text-xs text-gray-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Generador de PDF ──────────────────────────────────────────────
function generatePDF(
  data: any[],
  form: { startDate: string; endDate: string; department: string },
) {
  const title = "Reporte de Asistencia";
  const period = `${form.startDate} — ${form.endDate}`;
  const dept = form.department || "Todos los departamentos";
  const genDate = format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es });

  // Estadísticas
  const total = data.length;
  const present = data.filter((r) => r["Estado"] === "PRESENT").length;
  const late = data.filter((r) => r["Estado"] === "LATE").length;
  const absent = data.filter((r) => r["Estado"] === "ABSENT").length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  // Construir HTML del PDF
  const rowsHtml = data
    .map((r, i) => {
      const statusColor =
        (
          {
            PRESENT: "#34d399",
            LATE: "#fbbf24",
            ABSENT: "#f87171",
            HALF_DAY: "#60a5fa",
          } as any
        )[r["Estado"]] || "#9ca3af";
      const statusLabel = STATUS_LABELS[r["Estado"]] || r["Estado"];
      return `
      <tr style="background:${i % 2 === 0 ? "#111827" : "#0f172a"}">
        <td>${r["Empleado"]}</td>
        <td>${r["Departamento"] || "—"}</td>
        <td style="font-family:monospace">${r["Fecha"]}</td>
        <td style="font-family:monospace">${r["Check-in"]}</td>
        <td style="font-family:monospace">${r["Check-out"]}</td>
        <td><span style="color:${statusColor};font-weight:600">${statusLabel}</span></td>
        <td style="text-align:center">${r["Retardo (min)"] > 0 ? `${r["Retardo (min)"]} min` : "—"}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0a0f1a; color:#e2e8f0; font-size:13px; }
  .header { background:linear-gradient(135deg,#1e3a5f,#1a1f35); padding:32px 40px 24px; border-bottom:1px solid #1e40af; }
  .header-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .logo { display:flex; align-items:center; gap:12px; }
  .logo-icon { width:40px; height:40px; background:#1e40af; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; }
  .logo-text { font-size:22px; font-weight:700; background:linear-gradient(135deg,#60a5fa,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .meta { text-align:right; font-size:11px; color:#64748b; }
  .title-row { display:flex; align-items:baseline; gap:12px; }
  .title { font-size:26px; font-weight:700; color:#f1f5f9; }
  .subtitle { font-size:13px; color:#64748b; }
  .stats { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; padding:20px 40px; background:#0d1117; border-bottom:1px solid #1e293b; }
  .stat { background:#111827; border:1px solid #1e293b; border-radius:10px; padding:14px; text-align:center; }
  .stat-value { font-size:24px; font-weight:700; margin-bottom:4px; }
  .stat-label { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
  .content { padding:24px 40px; }
  .filters { display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
  .filter-chip { background:#1e293b; border:1px solid #334155; border-radius:20px; padding:4px 12px; font-size:11px; color:#94a3b8; display:flex; align-items:center; gap:5px; }
  .filter-chip strong { color:#cbd5e1; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  thead tr { background:#1e293b; }
  th { padding:10px 12px; text-align:left; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:#64748b; border-bottom:1px solid #334155; }
  td { padding:9px 12px; border-bottom:1px solid #1e293b; color:#cbd5e1; }
  .footer { padding:16px 40px; border-top:1px solid #1e293b; text-align:center; font-size:10px; color:#475569; margin-top:8px; }
  @media print {
    body { background:#fff; color:#1e293b; }
    .header { background:#1e3a8a; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .stats { background:#f8fafc; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="header-top">
    <div class="logo">
      <div class="logo-icon">🛡</div>
      <span class="logo-text">AccessFlow</span>
    </div>
    <div class="meta">
      <div>Generado el ${genDate}</div>
      <div>Sistema de Control de Asistencia</div>
    </div>
  </div>
  <div class="title-row">
    <h1 class="title">${title}</h1>
    <span class="subtitle">${period}</span>
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-value" style="color:#60a5fa">${total}</div><div class="stat-label">Total registros</div></div>
  <div class="stat"><div class="stat-value" style="color:#34d399">${present}</div><div class="stat-label">Presentes</div></div>
  <div class="stat"><div class="stat-value" style="color:#fbbf24">${late}</div><div class="stat-label">Retardos</div></div>
  <div class="stat"><div class="stat-value" style="color:#f87171">${absent}</div><div class="stat-label">Ausentes</div></div>
  <div class="stat"><div class="stat-value" style="color:#a78bfa">${rate}%</div><div class="stat-label">Asistencia</div></div>
</div>

<div class="content">
  <div class="filters">
    <div class="filter-chip">📅 Período: <strong>${period}</strong></div>
    <div class="filter-chip">🏢 Depto: <strong>${dept}</strong></div>
    <div class="filter-chip">📊 Registros: <strong>${total}</strong></div>
  </div>
  <table>
    <thead><tr>
      <th>Empleado</th><th>Departamento</th><th>Fecha</th>
      <th>Entrada</th><th>Salida</th><th>Estado</th><th>Retardo</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</div>
<div class="footer">AccessFlow — Reporte generado automáticamente el ${genDate} · Confidencial</div>
</body></html>`;

  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) {
    toast.error("Permite las ventanas emergentes para generar el PDF");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };
}
