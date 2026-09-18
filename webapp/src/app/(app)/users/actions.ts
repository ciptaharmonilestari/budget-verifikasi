"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/reference-data";
import type { Role } from "@/generated/prisma/client";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

/**
 * User Management — role changes, active toggle and unlock are all
 * Owner-only (FR-002b, FR-006). Roles are never selectable at login; only
 * Owner may reassign them here.
 */
export async function changeUserRoleAction(userId: string, role: Role): Promise<ActionResult> {
  await requireRole("OWNER");

  if (!(role in ROLE_LABEL)) return { error: "Peran tidak dikenal." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Pengguna tidak ditemukan." };

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/users");
  return { ok: true };
}

export async function toggleUserActiveAction(userId: string): Promise<ActionResult> {
  await requireRole("OWNER");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Pengguna tidak ditemukan." };

  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
  revalidatePath("/users");
  return { ok: true };
}

/**
 * Clears the permanent lockout the real login flow (lib/auth-actions.ts)
 * sets after 5 failed attempts — this screen is the only way to undo it.
 */
export async function unlockUserAction(userId: string): Promise<ActionResult> {
  await requireRole("OWNER");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Pengguna tidak ditemukan." };

  await prisma.user.update({ where: { id: userId }, data: { lockedUntil: null, failedLoginCount: 0 } });
  revalidatePath("/users");
  return { ok: true };
}
