"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { returnCycleUpdate } from "@/lib/return-cycle";

/**
 * Head Departemen meneruskan berkas ke Divisi Budget: DEPT_APPROVAL -> Gate 1.
 * Nomor indeks dan gate tidak berubah — hanya statusnya yang maju.
 */
export async function approveDeptAction(submissionId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole("HEAD_DEPARTEMEN");

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { ok: false, error: "Berkas tidak ditemukan." };
  if (submission.departmentId !== user.departmentId) {
    return { ok: false, error: "Berkas ini bukan milik departemen Anda." };
  }
  if (submission.status !== "DEPT_APPROVAL") {
    return { ok: false, error: "Berkas ini sudah tidak menunggu persetujuan departemen." };
  }

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: { status: "GATE1_KELENGKAPAN", currentGate: 1 },
    }),
    prisma.activityLog.create({
      data: {
        action: "DEPT_APPROVED",
        note: `${user.name} meneruskan ${submission.indexNo} ke Divisi Budget`,
        userId: user.id,
        submissionId,
      },
    }),
  ]);

  revalidatePath("/approvaldept");
  return { ok: true };
}

/**
 * Head Departemen mengembalikan berkas ke pengaju — tidak pernah sampai ke
 * Divisi Budget. Wajib alasan, dan revisionCount naik satu.
 */
export async function returnDeptAction(submissionId: string, reason: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole("HEAD_DEPARTEMEN");

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { ok: false, error: "Alasan pengembalian wajib diisi." };
  }

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { ok: false, error: "Berkas tidak ditemukan." };
  if (submission.departmentId !== user.departmentId) {
    return { ok: false, error: "Berkas ini bukan milik departemen Anda." };
  }
  if (submission.status !== "DEPT_APPROVAL") {
    return { ok: false, error: "Berkas ini sudah tidak menunggu persetujuan departemen." };
  }

  const rc = await returnCycleUpdate(submission.returnCycles, submissionId);
  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: { status: "RETURNED", revisionCount: { increment: 1 }, ...rc.data },
    }),
    ...(rc.notificationCreate ? [rc.notificationCreate] : []),
    prisma.activityLog.create({
      data: {
        action: "DEPT_RETURNED",
        note: trimmedReason,
        userId: user.id,
        submissionId,
      },
    }),
  ]);

  revalidatePath("/approvaldept");
  return { ok: true };
}
