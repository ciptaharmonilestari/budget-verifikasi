"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/session";
import { PARAM_BY_ID } from "@/lib/parameters";
import { validateForParam, paramApproverRole } from "./logic";

const WRITE_ROLES = ["OWNER", "HEAD_BUDGET", "DIV_PAJAK", "CFO", "CEO1"] as const;

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

export async function proposeParameterAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parameterId = String(formData.get("parameterId"));
  const newValue = String(formData.get("newValue") ?? "").trim();
  const effectiveDate = String(formData.get("effectiveDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const def = PARAM_BY_ID.get(parameterId);
  if (!def) return { error: "Parameter tidak ditemukan." };
  if (user.role !== def.ownerRole) {
    return { error: `Hanya ${def.ownerRole === "DIV_PAJAK" ? "Div Pajak" : "Head of Budget"} yang dapat mengusulkan grup ${def.groupLabel}.` };
  }
  const existing = await prisma.parameterProposal.findFirst({ where: { parameterId, status: "PENDING" } });
  if (existing) return { error: "Sudah ada usulan yang menunggu untuk parameter ini." };
  if (!reason) return { error: "Dasar usulan wajib diisi." };
  if (!effectiveDate) return { error: "Tanggal mulai berlaku wajib diisi." };

  const validation = await validateForParam(def, newValue);
  if (validation) return { error: validation };

  const approverRole = paramApproverRole(def, newValue);
  const current = await prisma.parameterValue.findUnique({ where: { parameterId } });

  await prisma.$transaction([
    prisma.parameterProposal.create({
      data: {
        parameterId, proposedValue: newValue, proposedEffectiveDate: new Date(effectiveDate),
        approverRole, reason, proposedById: user.id,
      },
    }),
    prisma.parameterHistory.create({
      data: {
        parameterId, kind: "PROPOSED", fromValue: current?.currentValue ?? def.sampleValue,
        toValue: newValue, byId: user.id, effectiveDate: new Date(effectiveDate), reason,
      },
    }),
  ]);

  revalidatePath("/settings");
  return { ok: true };
}

export async function decideParameterAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const proposalId = String(formData.get("proposalId"));
  const decision = String(formData.get("decision"));
  const reason = String(formData.get("reason") ?? "").trim();
  const effectiveDateOverride = String(formData.get("effectiveDate") ?? "");

  const proposal = await prisma.parameterProposal.findUnique({ where: { id: proposalId } });
  if (!proposal || proposal.status !== "PENDING") return { error: "Usulan tidak ditemukan atau sudah diputuskan." };
  if (user.role !== proposal.approverRole) {
    return { error: `Usulan ini menunggu keputusan ${proposal.approverRole}.` };
  }
  const def = PARAM_BY_ID.get(proposal.parameterId);
  if (!def) return { error: "Parameter tidak ditemukan." };

  if (decision === "REJECT") {
    if (!reason) return { error: "Alasan penolakan wajib diisi." };
    await prisma.$transaction([
      prisma.parameterProposal.update({
        where: { id: proposalId },
        data: { status: "REJECTED", decidedById: user.id, decidedAt: new Date(), decisionReason: reason },
      }),
      prisma.parameterHistory.create({
        data: { parameterId: proposal.parameterId, kind: "REJECTED", fromValue: proposal.proposedValue, toValue: null, byId: user.id, reason },
      }),
    ]);
    revalidatePath("/settings");
    return { ok: true };
  }

  const effectiveDate = effectiveDateOverride ? new Date(effectiveDateOverride) : proposal.proposedEffectiveDate;
  const dateShifted = effectiveDateOverride && effectiveDateOverride !== proposal.proposedEffectiveDate.toISOString().slice(0, 10);
  const current = await prisma.parameterValue.findUnique({ where: { parameterId: proposal.parameterId } });

  await prisma.$transaction([
    prisma.parameterValue.upsert({
      where: { parameterId: proposal.parameterId },
      update: { currentValue: proposal.proposedValue, effectiveDate },
      create: { parameterId: proposal.parameterId, currentValue: proposal.proposedValue, effectiveDate },
    }),
    prisma.parameterProposal.update({
      where: { id: proposalId },
      data: { status: "APPROVED", decidedById: user.id, decidedAt: new Date(), decidedEffectiveDate: effectiveDate },
    }),
    prisma.parameterHistory.create({
      data: {
        parameterId: proposal.parameterId, kind: "APPROVED",
        fromValue: current?.currentValue ?? def.sampleValue, toValue: proposal.proposedValue,
        byId: user.id, effectiveDate,
        reason: dateShifted ? "Usulan disetujui; tanggal mulai berlaku digeser oleh penyetuju." : "Usulan disetujui.",
      },
    }),
  ]);

  revalidatePath("/settings");
  return { ok: true };
}

export async function directChangeParameterAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("CFO", "CEO1");
  const parameterId = String(formData.get("parameterId"));
  const newValue = String(formData.get("newValue") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  const def = PARAM_BY_ID.get(parameterId);
  if (!def) return { error: "Parameter tidak ditemukan." };
  if (!reason) return { error: "Alasan wajib diisi untuk perubahan langsung." };

  const validation = await validateForParam(def, newValue);
  if (validation) return { error: validation };

  const current = await prisma.parameterValue.findUnique({ where: { parameterId } });
  await prisma.$transaction([
    prisma.parameterValue.upsert({
      where: { parameterId },
      update: { currentValue: newValue, effectiveDate: new Date() },
      create: { parameterId, currentValue: newValue, effectiveDate: new Date() },
    }),
    prisma.parameterHistory.create({
      data: {
        parameterId, kind: "PERUBAHAN_LANGSUNG", fromValue: current?.currentValue ?? def.sampleValue,
        toValue: newValue, byId: user.id, effectiveDate: new Date(), reason,
      },
    }),
  ]);

  revalidatePath("/settings");
  return { ok: true };
}

export async function revertParameterAction(parameterId: string): Promise<ActionResult> {
  const user = await requireUser();
  const def = PARAM_BY_ID.get(parameterId);
  if (!def) return { error: "Parameter tidak ditemukan." };
  const allowed = user.role === def.ownerRole || user.role === "CFO" || user.role === "CEO1" || user.role === "OWNER";
  if (!allowed) return { error: "Tidak berwenang mengembalikan parameter ini." };

  const lastChange = await prisma.parameterHistory.findFirst({
    where: { parameterId, kind: { in: ["APPROVED", "PERUBAHAN_LANGSUNG"] } },
    orderBy: { at: "desc" },
  });
  if (!lastChange || lastChange.fromValue === null) return { error: "Tidak ada riwayat perubahan untuk dikembalikan." };

  const current = await prisma.parameterValue.findUnique({ where: { parameterId } });
  await prisma.$transaction([
    prisma.parameterValue.upsert({
      where: { parameterId },
      update: { currentValue: lastChange.fromValue, effectiveDate: new Date() },
      create: { parameterId, currentValue: lastChange.fromValue, effectiveDate: new Date() },
    }),
    prisma.parameterHistory.create({
      data: {
        parameterId, kind: "DIKEMBALIKAN", fromValue: current?.currentValue ?? def.sampleValue,
        toValue: lastChange.fromValue, byId: user.id, effectiveDate: new Date(),
      },
    }),
  ]);

  revalidatePath("/settings");
  return { ok: true };
}

export async function resetAllParametersAction(): Promise<ActionResult> {
  const user = await requireRole(...WRITE_ROLES);
  await prisma.$transaction([
    prisma.parameterHistory.deleteMany({}),
    prisma.parameterProposal.deleteMany({}),
    prisma.parameterValue.deleteMany({}),
  ]);
  void user;
  revalidatePath("/settings");
  return { ok: true };
}
