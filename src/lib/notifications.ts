// src/lib/notifications.ts
// Servicio centralizado para crear notificaciones
import { prisma } from "./prisma";

type NotifType = "INFO" | "WARNING" | "ERROR" | "SUCCESS";

interface CreateNotifParams {
  userId: string;
  title: string;
  message: string;
  type?: NotifType;
}

export async function createNotification(params: CreateNotifParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "INFO",
    },
  });
}

// Notifica a todos los admins del sistema
export async function notifyAdmins(
  title: string,
  message: string,
  type: NotifType = "INFO",
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, title, message, type })),
  });
}

// Helpers semánticos
export const notify = {
  checkIn: (userId: string, userName: string, lateMinutes: number) =>
    lateMinutes > 0
      ? createNotification({
          userId,
          title: "Retardo registrado",
          message: `Entrada con ${lateMinutes} min de retardo`,
          type: "WARNING",
        })
      : createNotification({
          userId,
          title: "Entrada registrada",
          message: "Tu entrada fue registrada correctamente",
          type: "SUCCESS",
        }),

  checkOut: (userId: string) =>
    createNotification({
      userId,
      title: "Salida registrada",
      message: "Tu salida fue registrada correctamente. ¡Hasta mañana!",
      type: "SUCCESS",
    }),

  adminMark: (
    userId: string,
    adminName: string,
    action: "ENTRY" | "EXIT",
    time: string,
    reason: string,
  ) =>
    createNotification({
      userId,
      title: `Marcaje manual — ${action === "ENTRY" ? "Entrada" : "Salida"}`,
      message: `El administrador ${adminName} registró tu ${action === "ENTRY" ? "entrada" : "salida"} a las ${time}. Motivo: ${reason}`,
      type: "INFO",
    }),

  lateAlert: (adminId: string, userName: string, lateMinutes: number) =>
    createNotification({
      userId: adminId,
      title: "Alerta de retardo",
      message: `${userName} llegó con ${lateMinutes} min de retardo`,
      type: "WARNING",
    }),

  newUser: (adminId: string, userName: string) =>
    createNotification({
      userId: adminId,
      title: "Nuevo empleado registrado",
      message: `Se creó el usuario ${userName} en el sistema`,
      type: "INFO",
    }),

  userDeactivated: (adminId: string, userName: string) =>
    createNotification({
      userId: adminId,
      title: "Empleado desactivado",
      message: `El usuario ${userName} fue desactivado`,
      type: "WARNING",
    }),
};
