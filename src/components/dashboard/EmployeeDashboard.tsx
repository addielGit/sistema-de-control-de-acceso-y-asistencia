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
} from "lucide-react";
import toast from "react-hot-toast";
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
  const [today, setToday] = useState<TodayRecord | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setLoading(true);
    fetch(`/api/attendance/check?userId=${userId}`)
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
        body: JSON.stringify({ userId, method: "MANUAL" }),
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

  const checkedIn = !!today?.checkIn;
  const checkedOut = !!today?.checkOut;
  const done = checkedIn && checkedOut;

  // Calcular estado del botón
  const getButtonState = () => {
    if (!schedule) return { blocked: false, reason: "" };
    if (!schedule.isWorkDay)
      return {
        blocked: true,
        reason: "Hoy no es un día laboral",
        icon: CalendarX,
      };
    if (!checkedIn) {
      const deadline = new Date(schedule.checkInDeadline);
      if (now > deadline)
        return {
          blocked: true,
          reason: `Tiempo límite de entrada superado (${deadline.toTimeString().slice(0, 5)})`,
          icon: Ban,
        };
    }
    if (checkedIn && !checkedOut) {
      const start = new Date(schedule.checkOutStart);
      if (now < start) {
        const diffMin = Math.round((start.getTime() - now.getTime()) / 60000);
        return {
          blocked: true,
          reason: `Salida disponible desde las ${start.toTimeString().slice(0, 5)} (faltan ${diffMin} min)`,
          icon: Clock,
        };
      }
    }
    return { blocked: false, reason: "", icon: null };
  };

  const btnState = getButtonState();

  // Color del reloj según proximidad al límite
  const getClockColor = () => {
    if (!schedule || done) return "text-white";
    if (!checkedIn && schedule.checkInDeadline) {
      const deadline = new Date(schedule.checkInDeadline);
      const diffMin = (deadline.getTime() - now.getTime()) / 60000;
      if (diffMin <= 0) return "text-red-400";
      if (diffMin <= 5) return "text-red-400 animate-pulse";
      if (diffMin <= 15) return "text-amber-400";
    }
    return "text-white";
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mi Asistencia</h1>
        <p className="text-gray-400 text-sm mt-1 capitalize">
          {formatDate(now, "EEEE, d 'de' MMMM yyyy")}
        </p>
      </div>

      {/* Reloj + botón */}
      <div className="glass rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 pointer-events-none" />

        <div
          className={cn(
            "text-6xl font-mono font-bold tracking-tight mb-1 transition-colors",
            getClockColor(),
          )}
        >
          {formatTime(now)}
        </div>
        <p className="text-gray-400 text-sm mb-6">{formatDate(now)}</p>

        {/* Indicador de horario */}
        {schedule && !done && (
          <div className="flex items-center justify-center gap-4 mb-6 text-xs text-gray-500">
            {!checkedIn && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Entrada hasta{" "}
                {new Date(schedule.checkInDeadline).toTimeString().slice(0, 5)}
              </span>
            )}
            {checkedIn && !checkedOut && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                Salida desde{" "}
                {new Date(schedule.checkOutStart).toTimeString().slice(0, 5)}
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : done ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Jornada completa registrada</span>
          </div>
        ) : btnState.blocked ? (
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
                <p className="text-xs text-gray-500 mt-2">
                  Contacta a tu administrador para un marcaje manual.
                </p>
              </div>
            </div>
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

      {/* Estado del día */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Estado de Hoy</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Estado",
              value: today ? (
                <StatusBadge status={today.status} />
              ) : (
                <span className="text-gray-500 text-xs">Sin registrar</span>
              ),
            },
            {
              label: "Entrada",
              value: today?.checkIn
                ? formatTime(new Date(today.checkIn))
                : "--:--",
            },
            {
              label: "Salida",
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

      {/* Horario del día */}
      {schedule && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            Horario de hoy
          </h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              {
                label: "Entrada programada",
                value: schedule.checkInTime,
                color: "text-emerald-400",
              },
              {
                label: "Salida programada",
                value: schedule.checkOutTime,
                color: "text-orange-400",
              },
              {
                label: "Límite de entrada",
                value: new Date(schedule.checkInDeadline)
                  .toTimeString()
                  .slice(0, 5),
                color: "text-amber-400",
              },
              {
                label: "Salida mínima",
                value: new Date(schedule.checkOutStart)
                  .toTimeString()
                  .slice(0, 5),
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
              <p className="text-xs text-gray-400">
                Hoy es día no laboral — no se registra asistencia
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
