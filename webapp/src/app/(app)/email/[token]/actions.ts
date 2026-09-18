"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { LaneStatus, SubmissionStatus } from "@/generated/prisma/client";
import { returnCycleUpdate } from "@/lib/return-cycle";

/**
 * Local copy of the Gate 4/5/6 approve/return logic — deliberately NOT
 * imported from ../../keputusan/actions.ts (that file is owned by a
 * different in-flight change; duplicating a dozen lines here avoids
 * colliding with it). Keep this in sync by hand if the gate-advance rule
 * ever changes.
 */
const ROUTE_STATUS: Record<4 | 5 | 6, SubmissionStatus> = {
  4: "GATE4_CEO_PROJECT",
  5: "GATE5_CFO",
  6: "GATE6_CEO1",
};

const CLEARED_LANE_STATUSES: LaneStatus[] = ["TERVERIFIKASI", "TIDAK_DIPERLUKAN"];

function isLaneBlocked(laneClearances: Array<{ status: LaneStatus }>): boolean {
  return laneClearances.some((l) => !CLEARED_LANE_STATUSES.includes(l.status));
}

export type EmailDecisionType = "APPROVE" | "RETURN";

/**
 * Applied when whoever holds the (unauthenticated, one-time) link token
 * decides. The app shell still requires a logged-in session to reach this
 * route (proxy.ts/layout.tsx are shared infra we don't touch here), so the
 * real authorization is the token match + validity check below, not the
 * signed-in user's role — see final report for this constraint/TODO.
 */
export async function respondEmailApprovalAction(
  token: string,
  decision: EmailDecisionType,
  comment?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  const link = await prisma.emailApprovalLink.findUnique({
    where: { token },
    include: { submission: { include: { laneClearances: true } } },
  });
  if (!link) return { ok: false, error: "Tautan tidak ditemukan." };
  if (link.usedAt) return { ok: false, error: "Tautan ini sudah digunakan dan tidak berlaku lagi." };
  if (link.expiresAt.getTime() < Date.now()) return { ok: false, error: "Tautan ini sudah kedaluwarsa." };

  const gate = link.gate;
  if (gate !== 4 && gate !== 5 && gate !== 6) {
    return { ok: false, error: "Gate pada tautan ini tidak valid." };
  }

  const submission = link.submission;
  const expectedStatus = ROUTE_STATUS[gate];
  if (submission.status !== expectedStatus || submission.currentGate !== gate) {
    return { ok: false, error: "Berkas ini sudah tidak menunggu keputusan di gate tautan ini — status sudah berubah." };
  }

  const trimmedComment = comment?.trim() || undefined;
  if (decision === "RETURN" && !trimmedComment) {
    return { ok: false, error: "Alasan pengembalian wajib diisi." };
  }

  if (decision === "APPROVE") {
    if (isLaneBlocked(submission.laneClearances)) {
      return { ok: false, error: "Tidak dapat menyetujui — klirens lintasan paralel belum lengkap." };
    }
    const advancing = submission.currentGate < submission.routeGate;
    const nextGate = advancing ? ((submission.currentGate + 1) as 4 | 5 | 6) : gate;
    const data = advancing ? { status: ROUTE_STATUS[nextGate], currentGate: nextGate } : { status: "APPROVED" as const };

    await prisma.$transaction([
      prisma.submission.update({ where: { id: submission.id }, data }),
      prisma.gateDecision.create({
        data: { submissionId: submission.id, gate, verdict: "APPROVED", comment: trimmedComment, actorId: user.id },
      }),
      prisma.emailApprovalLink.update({
        where: { id: link.id },
        data: { usedAt: new Date(), decision: "APPROVED", decidedById: user.id },
      }),
      prisma.activityLog.create({
        data: {
          action: `Gate ${gate} — disetujui lewat tautan email`,
          note: trimmedComment ?? null,
          userId: user.id,
          submissionId: submission.id,
        },
      }),
    ]);
    revalidatePath(`/email/${token}`);
    revalidatePath("/email");
    revalidatePath("/keputusan");
    return { ok: true };
  }

  // RETURN
  const rc = await returnCycleUpdate(submission.returnCycles, submission.id);
  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submission.id },
      data: { status: "RETURNED", revisionCount: { increment: 1 }, ...rc.data },
    }),
    ...(rc.notificationCreate ? [rc.notificationCreate] : []),
    prisma.gateDecision.create({
      data: { submissionId: submission.id, gate, verdict: "RETURNED", comment: trimmedComment, actorId: user.id },
    }),
    prisma.emailApprovalLink.update({
      where: { id: link.id },
      data: { usedAt: new Date(), decision: "RETURNED", decidedById: user.id },
    }),
    prisma.activityLog.create({
      data: {
        action: "Gate — dikembalikan lewat tautan email",
        note: trimmedComment ?? null,
        userId: user.id,
        submissionId: submission.id,
      },
    }),
  ]);
  revalidatePath(`/email/${token}`);
  revalidatePath("/email");
  return { ok: true };
}
