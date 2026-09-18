import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { generateQrDataUri, qrContentForIndexNo } from "@/lib/qr";
import { docTemplateForKind, WORDMARK_WIDTH } from "@/lib/doc-template";
import { DEFAULT_SIGNERS_GENERIC, DEFAULT_SIGNERS_PAYMENT, type SignatureColumnLike } from "@/lib/signature";
import type { PrintCommonData } from "@/lib/print-types";
import { PrintToolbar } from "@/components/print/PrintToolbar.client";
import { MemoDoc } from "@/components/print/templates/MemoDoc";
import { BayarRingkasDoc } from "@/components/print/templates/BayarRingkasDoc";
import { DphDoc } from "@/components/print/templates/DphDoc";
import { BappDoc } from "@/components/print/templates/BappDoc";
import "@/components/print/print.css";

export default async function CetakPage({ params }: PageProps<"/cetak/[id]">) {
  const { id } = await params;
  await requireUser();

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      company: true, project: true, department: true, vendor: true, createdBy: true,
      allocation: true, contract: { include: { paymentSchedules: true, vendor: true } },
      signatureColumns: { orderBy: { order: "asc" } },
    },
  });
  if (!submission) notFound();

  const template = docTemplateForKind(submission.kind);
  const qrDataUri = await generateQrDataUri(qrContentForIndexNo(submission.indexNo));

  const signatureColumns: SignatureColumnLike[] = submission.signatureColumns.length > 0
    ? submission.signatureColumns
    : (template === "BAPP" ? DEFAULT_SIGNERS_PAYMENT : DEFAULT_SIGNERS_GENERIC)
        .filter((s) => s.gate <= submission.routeGate)
        .map((s, i) => ({ gate: s.gate, role: s.role, jabatan: s.jabatan, name: null, order: i, active: true }));

  const defaultStamp =
    submission.status === "PAID" ? "LUNAS" as const :
    submission.status === "VOID" ? "VOID" as const :
    submission.status === "APPROVED" ? "FINAL" as const : "DRAF" as const;

  const common = {
    indexNo: submission.indexNo,
    subject: submission.subject,
    ptName: submission.company.name,
    projectLabel: `${submission.company.code}-${submission.project.name}`,
    deptName: submission.department.name,
    value: Number(submission.value),
    createdAt: submission.createdAt,
    createdByName: submission.createdBy.name,
    vendorName: submission.vendor?.name,
    memo: (submission.memo ?? {}) as Record<string, string>,
    formData: (submission.formData ?? {}) as Record<string, unknown>,
    qrDataUri,
    signatureColumns,
    wordmarkWidth: WORDMARK_WIDTH[template],
  };

  return (
    <div className="om-root">
      <PrintToolbar footText={`${submission.indexNo} · ${submission.company.name}`} defaultStamp={defaultStamp} />
      <div className="om-print-area">
        {template === "MEMO" && <MemoDoc data={common} />}
        {template === "BAYAR_RINGKAS" && <BayarRingkasDoc data={common} />}
        {template === "DPH" && <DphDoc data={common} />}
        {template === "BAPP" && (
          <BappDoc
            data={common}
            contract={submission.contract ? { value: Number(submission.contract.value), dpPct: Number(submission.contract.dpPct), retensiPct: Number(submission.contract.retensiPct) } : null}
          />
        )}
      </div>
    </div>
  );
}
