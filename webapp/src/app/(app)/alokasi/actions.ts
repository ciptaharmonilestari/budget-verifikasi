"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export interface MoveActionState {
  ok: boolean;
  message: string;
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Moves a submission's budget allocation to a different BudgetAllocation
 * row, logging the move (AllocationMoveLog) and an ActivityLog entry.
 * Gated: only OWNER/HEAD_BUDGET (flags.master), per PRD §"Master Alokasi
 * Budget" — Divisi Budget is the only party allowed to reassign a berkas's
 * allocation. */
export async function moveAllocationAction(_prev: MoveActionState, formData: FormData): Promise<MoveActionState> {
  const user = await requireRole("OWNER", "HEAD_BUDGET");

  const submissionId = str(formData.get("submissionId"));
  const toAllocId = str(formData.get("toAllocId"));
  const reason = str(formData.get("reason"));

  if (!submissionId || !toAllocId) {
    return { ok: false, message: "Pilih berkas dan alokasi tujuan terlebih dahulu." };
  }
  if (!reason) {
    return { ok: false, message: "Alasan pemindahan wajib diisi." };
  }

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { ok: false, message: "Berkas tidak ditemukan." };
  if (!submission.allocationId) return { ok: false, message: "Berkas ini belum memiliki alokasi untuk dipindahkan." };
  if (submission.allocationId === toAllocId) {
    return { ok: false, message: "Alokasi tujuan sama dengan alokasi asal — tidak ada yang dipindahkan." };
  }

  const [fromAlloc, toAlloc] = await Promise.all([
    prisma.budgetAllocation.findUnique({ where: { id: submission.allocationId } }),
    prisma.budgetAllocation.findUnique({ where: { id: toAllocId } }),
  ]);
  if (!toAlloc) return { ok: false, message: "Alokasi tujuan tidak ditemukan." };

  await prisma.$transaction([
    prisma.submission.update({ where: { id: submissionId }, data: { allocationId: toAllocId } }),
    prisma.allocationMoveLog.create({
      data: {
        fromAllocId: submission.allocationId,
        toAllocId,
        submissionId,
        amount: submission.value,
        reason,
        byId: user.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        action: "ALLOCATION_MOVED",
        note: `Berkas ${submission.indexNo} dipindah dari alokasi ${fromAlloc?.allocNo ?? "?"} ke ${toAlloc.allocNo} — ${reason}`,
        userId: user.id,
        submissionId,
      },
    }),
    prisma.notification.create({
      data: {
        category: "STATUS",
        title: "Alokasi berkas dipindahkan",
        body: `Berkas ${submission.indexNo} dipindahkan ke alokasi ${toAlloc.allocNo} (${toAlloc.name}) oleh ${user.name}. Alasan: ${reason}`,
        submissionId,
        tagLevel: "INFO",
        toUserId: submission.createdById,
      },
    }),
  ]);

  revalidatePath("/alokasi");
  return { ok: true, message: `Berkas ${submission.indexNo} dipindahkan ke alokasi ${toAlloc.allocNo} dan pengaju diberi tahu.` };
}
