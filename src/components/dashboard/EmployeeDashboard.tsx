// src/components/dashboard/EmployeeDashboard.tsx
"use client";
import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  Loader2,
  LogIn,
  LogOut,
  AlertTriangle,
  Ban,
  CalendarX,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n-context";
import { formatTime, formatDate, cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { AttendanceStatus } from "@prisma/client";

interface TodayRecord {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
}

interface Schedule {
  checkInTime: string;
  checkOutTime: string;
  checkInTolerance: number;
  checkOutTolerance: number;
  checkInDeadline: string;
  checkOutStart: string;
  isWorkDay: boolean;
}

export function EmployeeDashboard({ userId }: { userId: string }) {
  const { t, locale } = useI18n();
  const [today, setToday] = useState<TodayRecord | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(new Date());
  const [showRequest, setShowRequest] = useState(false);
  const [reqReason, setReqReason] = useState("");
  const [reqType, setReqType] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [sending, setSending] = useState(false);

  // Client timezone offset (minutes) — sent to server for correct comparisons
  const tzOffset = new Date().getTimezoneOffset();

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const refresh = () => {
    setLoading(true);
    fetch(`/api/attendance/check?userId=${userId}&tz=${tzOffset}`)
      .then((r) => r.json())
      .then((d) => {
        setToday(d.attendance);
        setSchedule(d.schedule);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/attendance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          method: "MANUAL",
          timezoneOffset: tzOffset,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setToday(data.attendance);
    } catch (err: any) {
      toast.error(err.message || "Error al registrar", { duration: 5000 });
    } finally {
      setChecking(false);
    }
  };

  const handleSendRequest = async () => {
    if (!reqReason.trim()) {
      toast.error("Escribe el motivo de la solicitud");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/attendance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: reqType,
          reason: reqReason.trim(),
          timezoneOffset: tzOffset,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Solicitud enviada a los administradores");
      setShowRequest(false);
      setReqReason("");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar solicitud");
    } finally {
      setSending(false);
    }
  };

  const checkedIn = !!today?.checkIn;
  const checkedOut = !!today?.checkOut;
  const done = checkedIn && checkedOut;

  const getButtonState = () => {
    if (!schedule) return { blocked: false };
    if (!schedule.isWorkDay)
      return {
        blocked: true,
        reason: "Hoy no es un día laboral",
        icon: CalendarX,
      };
    if (!checkedIn) {
      if (now > new Date(schedule.checkInDeadline))
        return {
          blocked: true,
          reason: `Tiempo límite de entrada superado (${schedule.checkInTime} + ${schedule.checkInTolerance} min)`,
          icon: Ban,
        };
    }
    if (checkedIn && !checkedOut) {
      const start = new Date(schedule.checkOutStart);
      if (now < start) {
        const diffMin = Math.round((start.getTime() - now.getTime()) / 60000);
        return {
          blocked: true,
          reason: `Salida disponible desde las ${start.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} (faltan ${diffMin} min)`,
          icon: Clock,
        };
      }
    }
    return { blocked: false };
  };

  const btnState = getButtonState();
  const isBlocked = btnState.blocked;

  const getClockColor = () => {
    if (!schedule || done) return "text-white";
    if (!checkedIn && schedule.checkInDeadline) {
      const diffMin =
        (new Date(schedule.checkInDeadline).getTime() - now.getTime()) / 60000;
      if (diffMin <= 0) return "text-red-400";
      if (diffMin <= 5) return "text-red-400 animate-pulse";
      if (diffMin <= 15) return "text-amber-400";
    }
    return "text-white";
  };

  return (
    <div className="space-y-6 w-full max-w-2xl">
      <div>
        <p className="text-gray-400 text-sm mt-1 capitalize">
          {formatDate(now, "EEEE, d 'de' MMMM yyyy")}
        </p>
      </div>

      {/* Reloj + botón */}
      <div className="glass rounded-2xl p-8 text-center relative overflow-hidden">
        <div
          className={cn(
            "text-6xl font-mono font-bold tracking-tight mb-1 transition-colors",
            getClockColor(),
          )}
        >
          {formatTime(now)}
        </div>
        <p className="text-gray-400 text-sm mb-6">{formatDate(now)}</p>

        {schedule && !done && (
          <div className="flex items-center justify-center gap-4 mb-6 text-xs text-gray-500 flex-wrap">
            {!checkedIn && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {t("attendance.entryUntil")}{" "}
                {new Date(schedule.checkInDeadline).toLocaleTimeString(
                  locale === "es" ? "es" : "en",
                  { hour: "2-digit", minute: "2-digit" },
                )}
              </span>
            )}
            {checkedIn && !checkedOut && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                {t("attendance.exitFrom")}{" "}
                {new Date(schedule.checkOutStart).toLocaleTimeString(
                  locale === "es" ? "es" : "en",
                  { hour: "2-digit", minute: "2-digit" },
                )}
              </span>
            )}
          </div>
        )}

        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
        ) : done ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Jornada completa registrada</span>
          </div>
        ) : isBlocked ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
              <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">
                  Marcaje no disponible
                </p>
                <p className="text-xs text-red-400/80 mt-1">
                  {btnState.reason}
                </p>
              </div>
            </div>
            {/* Solicitud de marcaje manual */}
            <button
              onClick={() => {
                setReqType(!checkedIn ? "ENTRY" : "EXIT");
                setShowRequest(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              Solicitar marcaje manual al administrador
            </button>
          </div>
        ) : (
          <button
            onClick={handleCheck}
            disabled={checking}
            className={cn(
              "px-8 py-4 rounded-2xl font-semibold text-base flex items-center gap-3 mx-auto transition-all",
              !checkedIn
                ? "bg-emerald-600 hover:bg-emerald-500 text-white pulse-glow"
                : "bg-orange-600 hover:bg-orange-500 text-white",
              checking && "opacity-70 cursor-not-allowed",
            )}
          >
            {checking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Registrando...
              </>
            ) : !checkedIn ? (
              <>
                <LogIn className="w-5 h-5" /> Registrar Entrada
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" /> Registrar Salida
              </>
            )}
          </button>
        )}
      </div>

      {/* Modal solicitud marcaje */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRequest(false)}
          />
          <div className="relative w-full max-w-md glass rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">
              Solicitar marcaje manual
            </h3>
            <p className="text-sm text-gray-400">
              Se enviará una notificación a todos los administradores con tu
              solicitud de {reqType === "ENTRY" ? "entrada" : "salida"}.
            </p>

            {/* Tipo */}
            <div className="flex gap-2">
              {(["ENTRY", "EXIT"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setReqType(t)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-medium transition-all border",
                    reqType === t
                      ? t === "ENTRY"
                        ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                        : "bg-orange-600/20 border-orange-500/40 text-orange-400"
                      : "border-gray-700 text-gray-500 hover:border-gray-600",
                  )}
                >
                  {t === "ENTRY"
                    ? locale === "es"
                      ? "→ Entrada"
                      : "→ Entry"
                    : locale === "es"
                      ? "← Salida"
                      : "← Exit"}
                </button>
              ))}
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Motivo de la solicitud <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                placeholder="Ej: Olvidé marcar mi entrada, tuve problemas con el dispositivo..."
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRequest(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendRequest}
                disabled={sending || !reqReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado del día */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Estado de Hoy</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: t("label.status"),
              value: today ? (
                <StatusBadge status={today.status} />
              ) : (
                <span className="text-gray-500 text-xs">Sin registrar</span>
              ),
            },
            {
              label: t("label.entry"),
              value: today?.checkIn
                ? formatTime(new Date(today.checkIn))
                : "--:--",
            },
            {
              label: t("label.exit"),
              value: today?.checkOut
                ? formatTime(new Date(today.checkOut))
                : "--:--",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-gray-900/50 rounded-xl p-4 text-center"
            >
              <p className="text-xs text-gray-500 mb-2">{label}</p>
              <div className="text-sm font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>
        {(today?.lateMinutes ?? 0) > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">
              Retardo registrado: {today!.lateMinutes} minutos
            </p>
          </div>
        )}
      </div>

      {/* Horario */}
      {schedule && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            Horario de hoy
          </h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              {
                label: t("attendance.scheduledEntry"),
                value: schedule.checkInTime,
                color: "text-emerald-400",
              },
              {
                label: t("attendance.scheduledExit"),
                value: schedule.checkOutTime,
                color: "text-orange-400",
              },
              {
                label: t("attendance.entryDeadline"),
                value: new Date(schedule.checkInDeadline).toLocaleTimeString(
                  locale === "es" ? "es" : "en",
                  { hour: "2-digit", minute: "2-digit" },
                ),
                color: "text-amber-400",
              },
              {
                label: t("attendance.minExit"),
                value: new Date(schedule.checkOutStart).toLocaleTimeString(
                  locale === "es" ? "es" : "en",
                  { hour: "2-digit", minute: "2-digit" },
                ),
                color: "text-blue-400",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900/50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={cn("text-sm font-mono font-semibold", color)}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          {!schedule.isWorkDay && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-gray-700/20 border border-gray-700 rounded-xl">
              <CalendarX className="w-4 h-4 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-400">Hoy es día no laboral</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
