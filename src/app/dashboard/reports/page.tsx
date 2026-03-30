// src/app/dashboard/reports/page.tsx
"use client";
import { useI18n } from "@/lib/i18n-context";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  FileText,
  Loader2,
  Calendar,
  Building2,
  FileDown,
  User,
  ChevronDown,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";

const DEPTS = [
  "Tecnología",
  "Recursos Humanos",
  "Ventas",
  "Marketing",
  "Operaciones",
  "Finanzas",
];
const STATUS_LABELS_MAP: Record<string, Record<string, string>> = {
  es: {
    PRESENT: "Presente",
    LATE: "Retardo",
    ABSENT: "Ausente",
    HALF_DAY: "Medio día",
  },
  en: {
    PRESENT: "Present",
    LATE: "Late",
    ABSENT: "Absent",
    HALF_DAY: "Half day",
  },
};
const STATUS_COLORS: Record<string, string> = {
  PRESENT: "#34d399",
  LATE: "#fbbf24",
  ABSENT: "#f87171",
  HALF_DAY: "#60a5fa",
};
interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
}

// ── Employee picker ────────────────────────────────────────────────────────────
function EmployeePicker({
  value,
  onChange,
  disabled,
}: {
  value: Employee | null;
  onChange: (emp: Employee | null) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [employees, setEmps] = useState<Employee[]>([]);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/users?limit=200")
      .then((r) => r.json())
      .then((d: any) =>
        setEmps((d.data || []).filter((e: any) => e.role !== "ADMIN")),
      )
      .catch(() => {});
  }, []);

  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const w = Math.max(r.width, 280),
      ww = window.innerWidth,
      wh = window.innerHeight;
    const top = r.bottom + 4,
      finalTop = top + 220 > wh ? r.top - 220 - 4 : top;
    let left = r.left;
    if (left + w > ww - 8) left = ww - w - 8;
    setMenuStyle({
      position: "fixed",
      top: finalTop,
      left,
      width: w,
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
        !document
          .getElementById("emp-picker-portal")
          ?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = employees.filter(
    (e) =>
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.department || "").toLowerCase().includes(search.toLowerCase()),
  );

  const menu = (
    <div
      id="emp-picker-portal"
      style={menuStyle}
      className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="p-2 border-b border-gray-800">
        <input
          autoFocus
          type="text"
          placeholder={t("users.searchPlaceholder")}
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="overflow-y-auto max-h-52">
        <button
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-gray-800 text-left",
            !value ? "text-blue-400 bg-blue-500/5" : "text-gray-400",
          )}
        >
          <span className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 shrink-0">
            —
          </span>
          <div>
            <p className="font-medium">{t("reports.allEmps")}</p>
            <p className="text-xs text-gray-500">{t("reports.noFilter")}</p>
          </div>
        </button>
        {filtered.map((emp) => (
          <button
            key={emp.id}
            onClick={() => {
              onChange(emp);
              setOpen(false);
              setSearch("");
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-gray-800 text-left",
              value?.id === emp.id
                ? "text-blue-400 bg-blue-500/5"
                : "text-gray-300",
            )}
          >
            <span className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
              {emp.name[0]}
            </span>
            <div className="min-w-0">
              <p className="font-medium truncate">{emp.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {emp.department || emp.email}
              </p>
            </div>
            {value?.id === emp.id && (
              <span className="ml-auto text-blue-400 shrink-0">✓</span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-5 text-xs text-gray-500 text-center">
            {t("reports.noData")}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div ref={ref}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((o) => !o);
          setSearch("");
        }}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all text-left",
          "bg-gray-900 border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          open && "border-blue-500 ring-1 ring-blue-500/20",
        )}
      >
        {value ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">
              {value.name[0]}
            </span>
            <span className="text-white truncate">{value.name}</span>
            {value.department && (
              <span className="text-gray-500 text-xs truncate hidden sm:block">
                · {value.department}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-500">{t("reports.allEmps")}</span>
        )}
        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="w-4 h-4 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700 transition-all"
            >
              <X className="w-2.5 h-2.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-gray-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>
      {mounted && open && createPortal(menu, document.body)}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewData, setPreview] = useState<any[] | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const statusLabels = STATUS_LABELS_MAP[locale] ?? STATUS_LABELS_MAP.es;

  const [form, setForm] = useState({
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    department: "",
  });

  const handleEmpChange = (emp: Employee | null) => {
    setSelectedEmp(emp);
    if (emp) setForm((f) => ({ ...f, department: "" }));
    setPreview(null);
  };

  const buildParams = (fmt: string) => {
    const p: Record<string, string> = {
      startDate: form.startDate,
      endDate: form.endDate,
      format: fmt,
    };
    if (selectedEmp) p.userId = selectedEmp.id;
    if (form.department) p.department = form.department;
    return new URLSearchParams(p);
  };

  const fetchData = async () => {
    const res = await fetch(`/api/reports?${buildParams("JSON")}`);
    if (!res.ok) throw new Error(t("error.generic"));
    return (await res.json()).data as any[];
  };

  const handleCSV = async () => {
    setLoading("csv");
    try {
      const res = await fetch(`/api/reports?${buildParams("CSV")}`);
      if (!res.ok) throw new Error(t("error.generic"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${selectedEmp ? selectedEmp.name.replace(/\s+/g, "_") + "_" : ""}${format(new Date(), "yyyyMMdd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV OK");
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
        toast.error(t("reports.noData"));
        return;
      }
      generatePDF(data, form, selectedEmp, t, locale);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handlePreview = async () => {
    setLoading("preview");
    try {
      setPreview(await fetchData());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const PRESETS = [
    { key: "reports.thisWeek", days: 7 },
    { key: "reports.thisMonth", days: 30 },
    { key: "reports.3months", days: 90 },
    { key: "reports.thisYear", days: 365 },
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

  const stats = previewData
    ? {
        total: previewData.length,
        present: previewData.filter((r) => r["Estado"] === "PRESENT").length,
        late: previewData.filter((r) => r["Estado"] === "LATE").length,
        absent: previewData.filter((r) => r["Estado"] === "ABSENT").length,
      }
    : null;

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("reports.title")}</h1>
        <p className="text-gray-400 text-sm mt-1">{t("reports.subtitle")}</p>
      </div>
      <div className="glass rounded-2xl p-6 space-y-5">
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2.5">
            {t("reports.quickPeriod")}
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.days)}
                className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800 transition-all"
              >
                {t(p.key)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              {t("reports.startDate")}
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
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              {t("reports.endDate")}
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
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
              <User className="w-3.5 h-3.5" />
              {t("reports.employee")}
            </label>
            <EmployeePicker value={selectedEmp} onChange={handleEmpChange} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
              <Building2 className="w-3.5 h-3.5" />
              {t("label.department")}
              {selectedEmp && (
                <span className="text-gray-600 text-[10px] font-normal">
                  {t("reports.notApply")}
                </span>
              )}
            </label>
            <select
              value={form.department}
              disabled={!!selectedEmp}
              onChange={(e) => {
                setForm((f) => ({ ...f, department: e.target.value }));
                setPreview(null);
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">{t("label.allDepts")}</option>
              {DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(selectedEmp || form.department) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">
              {t("reports.filteringBy")}
            </span>
            {selectedEmp && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
                <User className="w-3 h-3" />
                {selectedEmp.name}
                <button
                  onClick={() => handleEmpChange(null)}
                  className="hover:text-white ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {form.department && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs">
                <Building2 className="w-3 h-3" />
                {form.department}
                <button
                  onClick={() => {
                    setForm((f) => ({ ...f, department: "" }));
                    setPreview(null);
                  }}
                  className="hover:text-white ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
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
            {t("action.preview")}
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

      {stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: t("label.total"),
                value: stats.total,
                color: "text-white",
              },
              {
                label: t("reports.presents"),
                value: stats.present,
                color: "text-emerald-400",
              },
              {
                label: t("reports.delays"),
                value: stats.late,
                color: "text-amber-400",
              },
              {
                label: t("reports.absents"),
                value: stats.absent,
                color: "text-red-400",
              },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-white">
                  {t("reports.previewTitle")}
                </p>
                {selectedEmp && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {selectedEmp.name}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  ({previewData!.length})
                </span>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                {t("reports.close")}
              </button>
            </div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-900">
                  <tr>
                    {!selectedEmp && (
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
                        {t("reports.employee")}
                      </th>
                    )}
                    {!selectedEmp && (
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
                        {t("reports.dept")}
                      </th>
                    )}
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
                      {t("label.date")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
                      {t("label.entry")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
                      {t("label.exit")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
                      {t("label.status")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
                      {t("reports.delay")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {previewData!.slice(0, 50).map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      {!selectedEmp && (
                        <td className="px-4 py-2.5 text-white font-medium whitespace-nowrap">
                          {row["Empleado"]}
                        </td>
                      )}
                      {!selectedEmp && (
                        <td className="px-4 py-2.5 text-gray-400">
                          {row["Departamento"] || "—"}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-gray-300 font-mono whitespace-nowrap">
                        {row["Fecha"]}
                      </td>
                      <td className="px-4 py-2.5 text-gray-300 font-mono">
                        {row["Check-in"]}
                      </td>
                      <td className="px-4 py-2.5 text-gray-300 font-mono">
                        {row["Check-out"]}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          style={{
                            color: STATUS_COLORS[row["Estado"]] || "#9ca3af",
                          }}
                          className="font-medium"
                        >
                          {statusLabels[row["Estado"]] || row["Estado"]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 text-center">
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
                  {locale === "es"
                    ? `Mostrando 50 de ${previewData!.length}`
                    : `Showing 50 of ${previewData!.length}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-5">
        <p className="text-xs font-semibold text-white mb-3">
          {t("reports.fields")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            t("reports.employee"),
            "Email",
            t("label.department"),
            t("label.position"),
            t("label.date"),
            t("label.entry"),
            t("label.exit"),
            t("label.status"),
            locale === "es" ? "Retardo (min)" : "Late (min)",
            t("label.notes"),
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

// ── PDF generator — uses string concatenation, NO nested template literals ───
function generatePDF(
  data: any[],
  form: { startDate: string; endDate: string; department: string },
  employee: Employee | null,
  tFn: (k: string) => string,
  locale: string,
) {
  const dateLocale = locale === "es" ? esLocale : enUS;
  const period = form.startDate + " — " + form.endDate;
  const subject = employee?.name || form.department || tFn("label.allDepts");
  const genDate = format(new Date(), "d MMM yyyy, HH:mm", {
    locale: dateLocale,
  });
  const total = data.length;
  const present = data.filter((r) => r["Estado"] === "PRESENT").length;
  const late = data.filter((r) => r["Estado"] === "LATE").length;
  const absent = data.filter((r) => r["Estado"] === "ABSENT").length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  const showEmp = !employee;
  const lbl = STATUS_LABELS_MAP[locale] ?? STATUS_LABELS_MAP.es;

  // Column headers — built with string concat, no nested template literals
  const colEmp = tFn("reports.employee");
  const colDept = tFn("label.department");
  const colDate = tFn("label.date");
  const colEntry = tFn("label.entry");
  const colExit = tFn("label.exit");
  const colStatus = tFn("label.status");
  const colDelay = tFn("reports.delay");
  const thCols =
    (showEmp ? "<th>" + colEmp + "</th><th>" + colDept + "</th>" : "") +
    "<th>" +
    colDate +
    "</th><th>" +
    colEntry +
    "</th><th>" +
    colExit +
    "</th><th>" +
    colStatus +
    "</th><th>" +
    colDelay +
    "</th>";

  const empChip = employee
    ? '<div class="chip">👤 ' +
      (locale === "es" ? "Empleado" : "Employee") +
      ": <strong>" +
      employee.name +
      "</strong></div>"
    : '<div class="chip">🏢 ' +
      (locale === "es" ? "Depto" : "Dept") +
      ": <strong>" +
      subject +
      "</strong></div>";

  const rows = data
    .map((r, i) => {
      const sc =
        (
          {
            PRESENT: "#34d399",
            LATE: "#fbbf24",
            ABSENT: "#f87171",
            HALF_DAY: "#60a5fa",
          } as any
        )[r["Estado"]] || "#9ca3af";
      const bg = i % 2 === 0 ? "#111827" : "#0f172a";
      const empCells = showEmp
        ? "<td>" +
          r["Empleado"] +
          "</td><td>" +
          (r["Departamento"] || "—") +
          "</td>"
        : "";
      const delay = r["Retardo (min)"] > 0 ? r["Retardo (min)"] + " min" : "—";
      return (
        '<tr style="background:' +
        bg +
        '">' +
        empCells +
        '<td style="font-family:monospace">' +
        r["Fecha"] +
        "</td>" +
        '<td style="font-family:monospace">' +
        r["Check-in"] +
        "</td>" +
        '<td style="font-family:monospace">' +
        r["Check-out"] +
        "</td>" +
        '<td><span style="color:' +
        sc +
        ';font-weight:600">' +
        (lbl[r["Estado"]] || r["Estado"]) +
        "</span></td>" +
        '<td style="text-align:center">' +
        delay +
        "</td></tr>"
      );
    })
    .join("");

  const css =
    "*{margin:0;padding:0;box-sizing:border-box}" +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0a0f1a;color:#e2e8f0;font-size:13px}' +
    ".header{background:linear-gradient(135deg,#1e3a5f,#1a1f35);padding:28px 40px 20px;border-bottom:1px solid #1e40af}" +
    ".header-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}" +
    ".logo{display:flex;align-items:center;gap:10px}" +
    ".logo-icon{width:36px;height:36px;background:#1e40af;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px}" +
    ".logo-text{font-size:20px;font-weight:700;background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}" +
    ".meta{text-align:right;font-size:11px;color:#64748b}" +
    ".title{font-size:22px;font-weight:700;color:#f1f5f9}" +
    ".subtitle{font-size:12px;color:#64748b;margin-top:2px}" +
    ".stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:16px 40px;background:#0d1117;border-bottom:1px solid #1e293b}" +
    ".stat{background:#111827;border:1px solid #1e293b;border-radius:8px;padding:12px;text-align:center}" +
    ".stat-value{font-size:22px;font-weight:700;margin-bottom:2px}" +
    ".stat-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}" +
    ".content{padding:20px 40px}" +
    ".chips{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}" +
    ".chip{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:3px 10px;font-size:11px;color:#94a3b8}" +
    ".chip strong{color:#cbd5e1}" +
    "table{width:100%;border-collapse:collapse;font-size:12px}" +
    "thead tr{background:#1e293b}" +
    "th{padding:9px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:1px solid #334155}" +
    "td{padding:8px 12px;border-bottom:1px solid #1e293b;color:#cbd5e1}" +
    ".footer{padding:14px 40px;border-top:1px solid #1e293b;text-align:center;font-size:10px;color:#475569;margin-top:8px}" +
    "@media print{body{background:#fff;color:#1e293b}.header,.stats{-webkit-print-color-adjust:exact;print-color-adjust:exact}}";

  const html =
    '<!DOCTYPE html><html lang="' +
    locale +
    '"><head><meta charset="UTF-8"><title>' +
    tFn("reports.title") +
    "</title>" +
    "<style>" +
    css +
    "</style></head><body>" +
    '<div class="header">' +
    '<div class="header-top"><div class="logo"><div class="logo-icon">🛡</div><span class="logo-text">AccessFlow</span></div>' +
    '<div class="meta">' +
    (locale === "es" ? "Generado: " : "Generated: ") +
    genDate +
    "</div></div>" +
    '<div class="title">' +
    tFn("reports.title") +
    "</div>" +
    '<div class="subtitle">' +
    period +
    " · " +
    subject +
    "</div></div>" +
    '<div class="stats">' +
    '<div class="stat"><div class="stat-value" style="color:#60a5fa">' +
    total +
    '</div><div class="stat-label">' +
    tFn("label.total") +
    "</div></div>" +
    '<div class="stat"><div class="stat-value" style="color:#34d399">' +
    present +
    '</div><div class="stat-label">' +
    tFn("reports.presents") +
    "</div></div>" +
    '<div class="stat"><div class="stat-value" style="color:#fbbf24">' +
    late +
    '</div><div class="stat-label">' +
    tFn("reports.delays") +
    "</div></div>" +
    '<div class="stat"><div class="stat-value" style="color:#f87171">' +
    absent +
    '</div><div class="stat-label">' +
    tFn("reports.absents") +
    "</div></div>" +
    '<div class="stat"><div class="stat-value" style="color:#a78bfa">' +
    rate +
    '%</div><div class="stat-label">' +
    tFn("reports.attendance") +
    "</div></div>" +
    "</div>" +
    '<div class="content"><div class="chips">' +
    '<div class="chip">📅 ' +
    (locale === "es" ? "Período" : "Period") +
    ": <strong>" +
    period +
    "</strong></div>" +
    empChip +
    '<div class="chip">📊 ' +
    (locale === "es" ? "Registros" : "Records") +
    ": <strong>" +
    total +
    "</strong></div>" +
    "</div>" +
    "<table><thead><tr>" +
    thCols +
    "</tr></thead><tbody>" +
    rows +
    "</tbody></table></div>" +
    '<div class="footer">AccessFlow · ' +
    genDate +
    "</div></body></html>";

  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) {
    toast.error(
      locale === "es" ? "Permite ventanas emergentes" : "Allow popups",
    );
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () =>
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
}
