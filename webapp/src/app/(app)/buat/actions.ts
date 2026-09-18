"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatIndexNo } from "@/lib/index-no";
import { routeGateForValue } from "@/lib/gate-routing";
import { calcTax } from "@/lib/tax";
import { DEFAULT_SIGNERS_GENERIC, DEFAULT_SIGNERS_PAYMENT } from "@/lib/signature";
import { docTemplateForKind } from "@/lib/doc-template";
import type { DocType, FormKind, Prisma } from "@/generated/prisma/client";

export interface ActionResult {
  error?: string;
}

const DOC_TYPE_BY_KIND: Record<FormKind, DocType> = {
  PNJ: "DOC01", BAYAR: "DOC04", BIAYA: "DOC03", PTG: "DOC03", DPH: "DOC01", PO: "DOC03", FIN: "DOC03",
};

const PNJ_SUBTYPE_DOC: Record<string, DocType> = { SPK: "DOC01", LOA: "DOC02", ADD: "DOC05" };

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function num(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function createSubmissionAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const kind = str(formData.get("kind")) as FormKind;
  const projectId = str(formData.get("projectId"));
  const departmentId = str(formData.get("departmentId"));
  const costCode = str(formData.get("costCode"));
  const subject = str(formData.get("subject"));
  const value = num(formData.get("value"));
  const vendorId = str(formData.get("vendorId")) || undefined;
  const pnjSubtype = str(formData.get("pnjSubtype"));

  if (!kind || !projectId || !departmentId || !costCode || !subject || value <= 0) {
    return { error: "Jenis berkas, proyek, departemen, cost code, perihal, dan nilai wajib diisi dengan benar." };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { company: true } });
  if (!project) return { error: "Proyek tidak ditemukan." };
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) return { error: "Departemen tidak ditemukan." };

  const docType = kind === "PNJ" ? (PNJ_SUBTYPE_DOC[pnjSubtype] ?? "DOC01") : DOC_TYPE_BY_KIND[kind];

  // Tax (optional — only for kinds that carry a vendor + tax transaction type)
  const taxTxTypeCode = str(formData.get("taxTxTypeCode")) || undefined;
  let taxProposedRate: number | undefined;
  if (taxTxTypeCode) {
    const vendor = vendorId ? await prisma.vendor.findUnique({ where: { id: vendorId } }) : null;
    const tax = await calcTax(value, taxTxTypeCode, !!vendor?.npwp);
    taxProposedRate = tax.rate;
  }

  const memo = {
    kepada: str(formData.get("kepada")),
    dari: str(formData.get("dari")) || user.name,
    tanggal: str(formData.get("tanggal")),
    perihal: str(formData.get("perihal")) || subject,
    isi: str(formData.get("isi")),
  };

  const documentChecklist = ["Invoice/Kuitansi", "Dokumen pendukung", "NPWP vendor"].map((label, i) => ({
    code: `DOC-${i + 1}`, label, required: true, fulfilled: formData.get(`doc_${i}`) === "on",
  }));

  const formDataExtra: Record<string, unknown> = {};
  if (kind === "PNJ") { formDataExtra.subtype = pnjSubtype; formDataExtra.masaBerlaku = num(formData.get("masaBerlaku")); }
  if (kind === "BAYAR") { formDataExtra.contractId = str(formData.get("contractId")); formDataExtra.termin = num(formData.get("termin")); }
  if (kind === "BIAYA") { formDataExtra.biayaType = str(formData.get("biayaType")); }
  if (kind === "PTG") { formDataExtra.advanceRef = str(formData.get("advanceRef")); }
  if (kind === "DPH") { formDataExtra.repeatOrder = formData.get("repeatOrder") === "on"; }
  if (kind === "PO") { formDataExtra.channel = str(formData.get("channel")); }
  if (kind === "FIN") { formDataExtra.poRef = str(formData.get("poRef")); }

  const route = await routeGateForValue(value);
  const now = new Date();

  const updatedProject = await prisma.project.update({ where: { id: projectId }, data: { currentSequence: { increment: 1 } } });
  const nnn = updatedProject.currentSequence - 100000;
  const indexNo = formatIndexNo(nnn, project.company.code, project.name, department.code, now);

  const isPaymentDoc = docTemplateForKind(kind) === "BAPP";
  const signerSeeds = (isPaymentDoc ? DEFAULT_SIGNERS_PAYMENT : DEFAULT_SIGNERS_GENERIC).filter((s) => s.gate <= route.routeGate);

  const submission = await prisma.submission.create({
    data: {
      indexNo, kind, docType, subject,
      companyId: project.companyId, projectId, departmentId, costCode,
      value, status: "DEPT_APPROVAL", currentGate: 0, routeGate: route.routeGate,
      vendorId, taxTxTypeCode, taxProposedRate,
      memo, documentChecklist, formData: formDataExtra as Prisma.InputJsonValue,
      createdById: user.id, sentAt: now,
      signatureColumns: {
        create: signerSeeds.map((s, i) => ({ gate: s.gate, role: s.role, jabatan: s.jabatan, order: i, active: true })),
      },
    },
  });

  await prisma.activityLog.create({
    data: { action: "SUBMISSION_CREATED", note: `Berkas ${indexNo} dikirim ke antrean (rute Gate ${route.routeGate})`, userId: user.id, submissionId: submission.id },
  });

  redirect(`/antrean/${submission.id}`);
}
