"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

/**
 * Marks one notification as read — only if it actually targets the calling
 * user (direct toUserId, their role via toRole, or a broadcast with both
 * null). Never trusts the client's own idea of who a notification is for.
 */
export async function markReadAction(notificationId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();

  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) return { ok: false };

  const targetsUser = notif.toUserId === user.id;
  const targetsRole = notif.toRole === user.role;
  const isBroadcast = notif.toUserId === null && notif.toRole === null;
  if (!targetsUser && !targetsRole && !isBroadcast) {
    throw new Error("Akses ditolak — notifikasi ini bukan untuk Anda.");
  }

  if (!notif.readAt) {
    await prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
  }

  revalidatePath("/notifikasi");
  return { ok: true };
}
