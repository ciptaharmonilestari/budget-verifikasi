"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Divisi Budget issues a one-time email-approval link for a berkas waiting
 * at Gate 4/5/6 — for the approver on that gate to decide without logging
 * in (§5.5 · FR-002c). Token is opaque and single-use; link dies after 7
 * days or after first use, whichever comes first (enforced in
 * email/[token]/actions.ts, not here).
 */
export async function createEmailLinkAction(
  submissionId: string,
  gate: number,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const user = await requireRole("OWNER", "HEAD_BUDGET", "VERIFIKATOR_BUDGET", "ADMIN_BUDGET");

  if (![4, 5, 6].includes(gate)) {
    return { ok: false, error: "Gate tidak valid — hanya Gate 4, 5, atau 6." };
  }

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return { ok: false, error: "Berkas tidak ditemukan." };

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);

  await prisma.$transaction([
    prisma.emailApprovalLink.create({
      data: { submissionId, gate, token, expiresAt },
    }),
    prisma.activityLog.create({
      data: {
        action: "Tautan review lewat email dibuat",
        note: `Gate ${gate} · ${submission.indexNo} · berlaku 7 hari`,
        userId: user.id,
        submissionId,
      },
    }),
  ]);

  revalidatePath("/email");
  return { ok: true, token };
}
