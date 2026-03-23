// src/app/dashboard/profile/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Camera,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatDate, getRoleLabel } from "@/lib/utils";

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
  avatar?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

const DEPTS = [
  "Tecnología",
  "Recursos Humanos",
  "Ventas",
  "Marketing",
  "Operaciones",
  "Finanzas",
];

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    department: "",
    position: "",
    avatar: "",
  });
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.user);
        setForm({
          name: d.user.name,
          phone: d.user.phone || "",
          department: d.user.department || "",
          position: d.user.position || "",
          avatar: d.user.avatar || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setForm((f) => ({ ...f, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setProfile(data.user);
      await updateSession({ name: data.user.name });
      // Notifica al header via evento custom (evita límite de JWT con base64)
      window.dispatchEvent(
        new CustomEvent("profile:updated", {
          detail: { avatar: data.user.avatar ?? null },
        }),
      );
      toast.success("Perfil actualizado");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwd.newPassword || !pwd.currentPassword) {
      toast.error("Completa todos los campos");
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pwd),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast.success("Contraseña actualizada");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );

  const avatarSrc = form.avatar || null;
  const initials =
    profile?.name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        <p className="text-gray-400 text-sm mt-1">
          Gestiona tu información personal y seguridad
        </p>
      </div>

      {/* Avatar + info básica */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={profile?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-blue-400 text-2xl font-bold">
                  {initials}
                </span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-gray-900 flex items-center justify-center transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Datos */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              {profile?.name}
            </h2>
            <p className="text-sm text-gray-400">{profile?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Shield className="w-3 h-3" />
                {getRoleLabel(profile?.role || "")}
              </span>
              {profile?.department && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                  <Building2 className="w-3 h-3" />
                  {profile.department}
                </span>
              )}
            </div>
          </div>
        </div>

        {form.avatar && form.avatar !== profile?.avatar && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
            <Camera className="w-3.5 h-3.5 shrink-0" />
            Nueva foto seleccionada — guarda los cambios para aplicarla
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800">
        {(
          [
            ["info", "Información personal", User],
            ["security", "Seguridad", Lock],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === id
                ? "bg-gray-800 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-300",
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Información */}
      {activeTab === "info" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                key: "name",
                label: "Nombre completo",
                icon: User,
                type: "text",
                placeholder: "Tu nombre",
              },
              {
                key: "phone",
                label: "Teléfono",
                icon: Phone,
                type: "tel",
                placeholder: "+52 800 000 0000",
              },
              {
                key: "position",
                label: "Cargo",
                icon: Briefcase,
                type: "text",
                placeholder: "Tu cargo",
              },
            ].map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  placeholder={placeholder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Departamento
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              >
                <option value="">Sin departamento</option>
                {DEPTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Correo electrónico
            </label>
            <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2.5">
              <span className="text-sm text-gray-500 flex-1">
                {profile?.email}
              </span>
              <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                Solo lectura
              </span>
            </div>
          </div>

          {/* Metadatos */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              {
                label: "Miembro desde",
                value: profile ? formatDate(profile.createdAt) : "—",
                icon: Calendar,
              },
              {
                label: "Última actualización",
                value: profile ? formatDate(profile.updatedAt) : "—",
                icon: CheckCircle,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-gray-900/40 rounded-xl px-4 py-3 border border-gray-800"
              >
                <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-1">
                  <Icon className="w-3 h-3" />
                  {label}
                </p>
                <p className="text-xs font-medium text-gray-300">{value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all mt-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar cambios
          </button>
        </div>
      )}

      {/* Tab: Seguridad */}
      {activeTab === "security" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            Usa una contraseña de al menos 6 caracteres que no uses en otros
            servicios.
          </div>
          {(
            [
              ["currentPassword", "Contraseña actual", "current"],
              ["newPassword", "Nueva contraseña", "new"],
              ["confirmPassword", "Confirmar nueva contraseña", "confirm"],
            ] as const
          ).map(([key, label, showKey]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                {label}
              </label>
              <div className="relative">
                <input
                  type={showPwd[showKey] ? "text" : "password"}
                  value={pwd[key]}
                  placeholder="••••••••"
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, [key]: e.target.value }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPwd((s) => ({ ...s, [showKey]: !s[showKey] }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPwd[showKey] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Indicador de fortaleza */}
          {pwd.newPassword && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => {
                  const strength = [
                    pwd.newPassword.length >= 6,
                    /[A-Z]/.test(pwd.newPassword),
                    /[0-9]/.test(pwd.newPassword),
                    /[^A-Za-z0-9]/.test(pwd.newPassword),
                  ].filter(Boolean).length;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all",
                        i <= strength
                          ? [
                              "bg-red-400",
                              "bg-amber-400",
                              "bg-yellow-400",
                              "bg-emerald-400",
                            ][strength - 1]
                          : "bg-gray-700",
                      )}
                    />
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-500">
                {
                  [, "Muy débil", "Débil", "Aceptable", "Segura"][
                    [
                      pwd.newPassword.length >= 6,
                      /[A-Z]/.test(pwd.newPassword),
                      /[0-9]/.test(pwd.newPassword),
                      /[^A-Za-z0-9]/.test(pwd.newPassword),
                    ].filter(Boolean).length
                  ]
                }
              </p>
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={
              savingPwd ||
              !pwd.currentPassword ||
              !pwd.newPassword ||
              !pwd.confirmPassword
            }
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all"
          >
            {savingPwd ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Cambiar contraseña
          </button>
        </div>
      )}
    </div>
  );
}
