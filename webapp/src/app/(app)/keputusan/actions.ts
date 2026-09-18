"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { GateVerdict, LaneStatus, SubmissionStatus } from "@/generated/prisma/client";
import { returnCycleUpdate } from "@/lib/return-cycle";

export type DecisionType = "APPROVE" | "RETURN" | "REJECT";

/** Same 4/5/6 <-> status mapping as verifikasi/[id]/actions.ts's ROUTE_STATUS —
 * kept as a local copy per the brief (each screen folder owns its own copy). */
const ROUTE_STATUS: Record<4 | 5 | 6, SubmissionStatus> = {
  4: "GATE4_CEO_PROJECT",
  5: "GATE5_CFO",
  6: "GATE6_CEO1",
};

const GATE_ROLE: Record<number, "CEO_PROJECT" | "CFO" | "CEO1"> = {
  4: "CEO_PROJECT",
  5: "CFO",
  6: "CEO1",
};

const CLEARED_LANE_STATUSES: LaneStatus[] = ["TERVERIFIKASI", "TIDAK_DIPERLUKAN"];

/** A lane clearance row that exists and is not TERVERIFIKASI/TIDAK_DIPERLUKAN
 * blocks approval. A lane with no row at all is treated as not applicable
 * (not blocking) — matches the "belum diperlukan" display on this screen. */
function isLaneBlocked(laneClearances: Array<{ status: LaneStatus }>): boolean {
  return laneClearances.some((l) => !CLEARED_LANE_STATUSES.includes(l.status));
}

/**
 * CEO Project / CFO / CEO 1 decision on a berkas routed to their gate.
 * Re-checks role, gate ownership and status server-side on every call —
 * never trusts the client's computed lane-block state. Writes an
 * append-only GateDecision row and an ActivityLog entry inside a
 * transaction alongside the submission status/gate mutation.
 */
export async function decideAction(
  submissionId: string,
  decision: DecisionType,
  comment?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole("CEO_PROJECT", "CFO", "CEO1");
  const gate = user.flags.gate;
  if (!gate || (gate !== 4 && gate !== 5 && gate !== 6)) {
    return { ok: false, error: "Peran Anda tidak terhubung ke gate keputusan manapun." };
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { laneClearances: true },
  });
  if (!submission) return { ok: false, error: "Berkas tidak ditemukan." };
  // The approval chain is sequential (CEO Project → CFO → CEO 1): a submission
  // is awaiting *this* approver's decision when currentGate — not routeGate,
  // which only marks the final gate required — equals their gate.
  if (submission.currentGate !== gate) {
    return { ok: false, error: "Berkas ini sedang tidak menunggu keputusan Anda di gate ini." };
  }
  const expectedStatus = ROUTE_STATUS[gate];
  if (submission.status !== expectedStatus) {
    return { ok: false, error: "Berkas ini tidak lagi menunggu keputusan di gate ini — status sudah berubah." };
  }

  const trimmedComment = comment?.trim() || undefined;
  if ((decision === "RETURN" || decision === "REJECT") && !trimmedComment) {
    return { ok: false, error: decision === "RETURN" ? "Alasan pengembalian wajib diisi." : "Alasan penolakan wajib diisi." };
  }

  if (decision === "APPROVE") {
    if (isLaneBlocked(submission.laneClearances)) {
      return { ok: false, error: "Tidak dapat menyetujui — klirens lintasan paralel belum lengkap." };
    }

    const verdict: GateVerdict = "APPROVED";
    const advancing = submission.currentGate < submission.routeGate;
    const nextGate = advancing ? ((submission.currentGate + 1) as 4 | 5 | 6) : gate;
    const data = advancing
      ? { status: ROUTE_STATUS[nextGate], currentGate: nextGate }
      : { status: "APPROVED" as const };

    await prisma.$transaction([
      prisma.submission.update({ where: { id: submission.id }, data }),
      prisma.gateDecision.create({
        data: { submissionId: submission.id, gate, verdict, comment: trimmedComment, actorId: user.id },
      }),
      prisma.activityLog.create({
        data: {
          action: `Gate ${gate} (${GATE_ROLE[gate]}) — disetujui`,
          note: advancing ? `Diteruskan ke Gate ${nextGate}` : "Keputusan akhir — APPROVED",
          userId: user.id,
          submissionId: submission.id,
        },
      }),
    ]);
    revalidatePath("/keputusan");
    revalidatePath(`/verifikasi/${submission.id}`);
    return { ok: true };
  }

  if (decision === "RETURN") {
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
      prisma.activityLog.create({
        data: {
          action: `Gate ${gate} (${GATE_ROLE[gate]}) — dikembalikan`,
          note: trimmedComment ?? null,
          userId: user.id,
          submissionId: submission.id,
        },
      }),
    ]);
    revalidatePath("/keputusan");
    return { ok: true };
  }

  // REJECT
  await prisma.$transaction([
    prisma.submission.update({ where: { id: submission.id }, data: { status: "REJECTED" } }),
    prisma.gateDecision.create({
      data: { submissionId: submission.id, gate, verdict: "REJECTED", comment: trimmedComment, actorId: user.id },
    }),
    prisma.activityLog.create({
      data: {
        action: `Gate ${gate} (${GATE_ROLE[gate]}) — ditolak`,
        note: trimmedComment ?? null,
        userId: user.id,
        submissionId: submission.id,
      },
    }),
  ]);
  revalidatePath("/keputusan");
  return { ok: true };
}
