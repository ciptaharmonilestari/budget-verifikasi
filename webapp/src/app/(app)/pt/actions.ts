"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

/**
 * Master PT & Proyek — add-only (FR-002a, FR-205). Once a company is
 * `locked` (all 22 seeded companies are) its code/name is not editable —
 * there is deliberately no edit/delete UI for existing PT or projects here,
 * only forms to add new ones. `Project.currentSequence` (index numbers
 * issued so far) is display-only and never written from this screen.
 */
export async function createCompanyAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole("OWNER", "HEAD_BUDGET");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!/^[A-Z]{2,5}$/.test(code)) {
    return { error: "Kode PT wajib 2–5 huruf (A-Z)." };
  }
  if (!name) {
    return { error: "Nama PT wajib diisi." };
  }

  const existing = await prisma.company.findUnique({ where: { code } });
  if (existing) return { error: `Kode ${code} sudah dipakai.` };

  await prisma.company.create({ data: { code, name } });

  revalidatePath("/pt");
  return { ok: true };
}

export async function createProjectAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole("OWNER", "HEAD_BUDGET");

  const companyId = String(formData.get("companyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!companyId) return { error: "Pilih PT terlebih dahulu." };
  if (!name) return { error: "Nama proyek wajib diisi." };

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "PT tidak ditemukan." };

  const existing = await prisma.project.findUnique({ where: { companyId_name: { companyId, name } } });
  if (existing) return { error: `Proyek "${name}" sudah ada pada ${company.name}.` };

  await prisma.project.create({ data: { companyId, name } });

  revalidatePath("/pt");
  return { ok: true };
}
