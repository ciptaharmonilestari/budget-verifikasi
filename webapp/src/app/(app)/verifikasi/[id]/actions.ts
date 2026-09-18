"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { routeGateForValue } from "@/lib/gate-routing";
import type { Prisma } from "@/generated/prisma/client";
import { computeVerdict, type RuleResultInput } from "./rule-catalog";
import { returnCycleUpdate } from "@/lib/return-cycle";

export type VerifikasiAction = "RECOMMEND" | "RECOMMEND_NOTES" | "RETURN" | "REJECT";

export interface SubmitVerifikasiInput {
  submissionId: string;
  ruleResults: RuleResultInput[];
  action: VerifikasiAction;
  comment?: string;
}

/** Gate 3 verdict + routing action. Writes an append-only GateDecision row
 * (gate: 3) carrying the rule-result snapshot, updates the submission's
 * status/routeGate/currentGate on recommend, and logs an ActivityLog entry
 * in every case. Re-checks role and submission state server-side — never
 * trusts the client's computed verdict or lock state. */
export async function submitVerifikasiAction(input: SubmitVerifikasiInput) {
  const user = await requireRole("OWNER", "HEAD_BUDGET", "VERIFIKATOR_BUDGET");

  const submission = await prisma.submission.findUnique({ where: { id: input.submissionId } });
  if (!submission) throw new Error("Berkas tidak ditemukan.");
  if (submission.status !== "GATE3_BUDGET_REVIEW") {
    throw new Error("Berkas ini tidak sedang menunggu verifikasi Gate 3 — status sudah berubah.");
  }
  // BR-09: akun penginput tidak boleh memverifikasi berkas yang sama.
  if (submission.createdById === user.id) {
    throw new Error("Anda adalah pengaju berkas ini — tidak dapat memverifikasi berkas sendiri (BR-09).");
  }

  const computed = computeVerdict(input.ruleResults);
  const wantsRecommend = input.action === "RECOMMEND" || input.action === "RECOMMEND_NOTES";
  if (wantsRecommend && computed === "LOCKED") {
    throw new Error("Tidak dapat merekomendasikan — ada aturan pengunci (Block) yang gagal (FR-220).");
  }
  if ((input.action === "RETURN" || input.action === "REJECT") && !input.comment?.trim()) {
    throw new Error(input.action === "RETURN" ? "Alasan pengembalian wajib diisi." : "Alasan penolakan wajib diisi.");
  }

  const ruleResultsJson = input.ruleResults as unknown as Prisma.InputJsonValue;

  if (input.action === "RETURN") {
    const rc = await returnCycleUpdate(submission.returnCycles, submission.id);
    await prisma.$transaction([
      prisma.submission.update({
        where: { id: submission.id },
        data: { status: "RETURNED", revisionCount: { increment: 1 }, ...rc.data },
      }),
      ...(rc.notificationCreate ? [rc.notificationCreate] : []),
      prisma.gateDecision.create({
        data: {
          submissionId: submission.id,
          gate: 3,
          verdict: "RETURNED",
          comment: input.comment,
          ruleResults: ruleResultsJson,
          actorId: user.id,
        },
      }),
      prisma.activityLog.create({
        data: {
          action: "Verifikasi Gate 3 — dikembalikan",
          note: input.comment ?? null,
          userId: user.id,
          submissionId: submission.id,
        },
      }),
    ]);
    revalidatePath(`/verifikasi/${submission.id}`);
    return { verdict: "RETURNED" as const };
  }

  if (input.action === "REJECT") {
    await prisma.$transaction([
      prisma.submission.update({ where: { id: submission.id }, data: { status: "REJECTED" } }),
      prisma.gateDecision.create({
        data: {
          submissionId: submission.id,
          gate: 3,
          verdict: "REJECTED",
          comment: input.comment,
          ruleResults: ruleResultsJson,
          actorId: user.id,
        },
      }),
      prisma.activityLog.create({
        data: {
          action: "Verifikasi Gate 3 — ditolak",
          note: input.comment ?? null,
          userId: user.id,
          submissionId: submission.id,
        },
      }),
    ]);
    revalidatePath(`/verifikasi/${submission.id}`);
    return { verdict: "REJECTED" as const };
  }

  // RECOMMEND or RECOMMEND_NOTES.
  // The authority matrix is sequential ("CEO Project → CFO → CEO 1"), so the
  // approval chain always STARTS at Gate 4 regardless of routeGate — routeGate
  // only marks the final gate required. `keputusan`'s decide action advances
  // currentGate 4→5→6 on each approval until it reaches routeGate.
  const verdict = input.action === "RECOMMEND" ? "CLEAR" : "CLEAR_WITH_NOTES";
  const route = await routeGateForValue(Number(submission.value));

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submission.id },
      data: { status: "GATE4_CEO_PROJECT", routeGate: route.routeGate, currentGate: 4 },
    }),
    prisma.gateDecision.create({
      data: {
        submissionId: submission.id,
        gate: 3,
        verdict,
        comment: input.comment,
        ruleResults: ruleResultsJson,
        actorId: user.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        action: `Verifikasi Gate 3 — ${verdict === "CLEAR" ? "direkomendasikan" : "direkomendasikan dengan catatan"}`,
        note: `Rute ke Gate ${route.routeGate} (${route.tierBand})`,
        userId: user.id,
        submissionId: submission.id,
      },
    }),
  ]);

  revalidatePath(`/verifikasi/${submission.id}`);
  revalidatePath("/keputusan");
  return { verdict, routeGate: route.routeGate };
}
