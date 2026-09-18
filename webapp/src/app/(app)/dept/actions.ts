"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

/**
 * Master Departemen — create / toggle. Gated to Owner and Head of Budget
 * (ROLE_FLAGS.master), per FR-002a. Departments are never deleted from the
 * UI (a department once used on a submission cannot be removed, only
 * deactivated) — there is intentionally no delete action here.
 */
export async function createDepartmentAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole("OWNER", "HEAD_BUDGET");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const roleNote = String(formData.get("roleNote") ?? "").trim();

  if (!/^[A-Z]{2,5}$/.test(code)) {
    return { error: "Kode departemen wajib 2–5 huruf (A-Z)." };
  }
  if (!name) {
    return { error: "Nama departemen wajib diisi." };
  }

  const existing = await prisma.department.findUnique({ where: { code } });
  if (existing) return { error: `Kode ${code} sudah dipakai.` };

  await prisma.department.create({
    data: { code, name, roleNote: roleNote || null },
  });

  revalidatePath("/dept");
  return { ok: true };
}

export async function toggleDepartmentActiveAction(id: string): Promise<ActionResult> {
  await requireRole("OWNER", "HEAD_BUDGET");

  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) return { error: "Departemen tidak ditemukan." };

  await prisma.department.update({ where: { id }, data: { active: !dept.active } });
  revalidatePath("/dept");
  return { ok: true };
}
