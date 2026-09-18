"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export interface TaxActionState {
  ok: boolean;
  message: string;
  /** Only set on a successful sendTaxEmailAction — the generated email-approval link. */
  url?: string;
}

/** "Sahkan tarif master" — only Div Pajak owns tax verification (flags.taxOwner). */
export async function validateTaxAction(_prev: TaxActionState, formData: FormData): Promise<TaxActionState> {
  const user = await requireRole("DIV_PAJAK", "OWNER");
  const submissionId = String(formData.get("submissionId") ?? "");
  if (!submissionId) return { ok: false, message: "Berkas tidak ditemukan." };

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { ok: false, message: "Berkas tidak ditemukan." };
  if (!submission.taxTxTypeCode) {
    return { ok: false, message: "Berkas ini tidak membawa jenis transaksi pajak." };
  }

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: { taxVerifiedAt: new Date(), taxVerifiedById: user.id },
    }),
    prisma.activityLog.create({
      data: {
        action: "TAX_RATE_VALIDATED",
        note: `Tarif master disahkan untuk ${submission.indexNo}`,
        userId: user.id,
        submissionId,
      },
    }),
  ]);

  revalidatePath("/pajak");
  return { ok: true, message: "Tarif master disahkan." };
}

/** "Kirim verifikasi via email" — creates a gate-3 EmailApprovalLink as a stand-in
 * for an actual outbound email; no email is sent, the link is just returned so the
 * caller can see/copy it. */
export async function sendTaxEmailAction(_prev: TaxActionState, formData: FormData): Promise<TaxActionState> {
  const user = await requireRole("DIV_PAJAK", "OWNER");
  const submissionId = String(formData.get("submissionId") ?? "");
  if (!submissionId) return { ok: false, message: "Berkas tidak ditemukan." };

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { ok: false, message: "Berkas tidak ditemukan." };

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const link = await prisma.emailApprovalLink.create({
    data: { submissionId, gate: 3, token, expiresAt },
  });

  await prisma.activityLog.create({
    data: {
      action: "TAX_EMAIL_SENT",
      note: `Permintaan verifikasi tarif dikirim lewat email untuk ${submission.indexNo}`,
      userId: user.id,
      submissionId,
    },
  });

  revalidatePath("/pajak");
  return {
    ok: true,
    message: "Permintaan verifikasi tarif terkirim lewat email ke pengaju dan Divisi Budget.",
    url: `/email/${link.token}`,
  };
}
