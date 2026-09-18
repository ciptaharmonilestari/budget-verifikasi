/**
 * Small local helpers shared by the antrean / berkas / monitor / approvaldept
 * screens (a private route-group folder — the leading underscore keeps
 * Next.js from treating it as a route). Not shared infra from the rest of
 * the app; kept local to these four screens only.
 */
import type { SubmissionStatus, DocType, FormKind } from "@/generated/prisma/client";
import { FORM_KINDS } from "@/lib/reference-data";

/** Statuses that mean a submission has left the running queue for good. */
export const TERMINAL_STATUSES: SubmissionStatus[] = ["DRAFT", "APPROVED", "REJECTED", "PAID", "VOID"];

/** "Belum diputuskan sepenuhnya" — anything still moving through the flow. */
export const NON_TERMINAL_STATUSES: SubmissionStatus[] = [
  "DEPT_APPROVAL",
  "GATE1_KELENGKAPAN",
  "RETURNED",
  "GATE2_PARALLEL",
  "GATE3_BUDGET_REVIEW",
  "TREASURY_CHECK",
  "GATE4_CEO_PROJECT",
  "GATE5_CFO",
  "GATE6_CEO1",
];

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  DRAFT: "Draf",
  DEPT_APPROVAL: "Menunggu Head Departemen",
  GATE1_KELENGKAPAN: "Gate 1 · Kelengkapan",
  RETURNED: "Dikembalikan",
  GATE2_PARALLEL: "Gate 2 · Teknis & Legal",
  GATE3_BUDGET_REVIEW: "Gate 3 · Verifikasi Anggaran",
  TREASURY_CHECK: "Treasury Check",
  GATE4_CEO_PROJECT: "Gate 4 · CEO Project",
  GATE5_CFO: "Gate 5 · CFO",
  GATE6_CEO1: "Gate 6 · CEO 1",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  PAID: "Dibayar",
  VOID: "Void",
};

/** Who is currently holding the file — used by Monitoring Berkas and Berkas Saya. */
export const STATUS_HOLDER: Record<SubmissionStatus, string> = {
  DRAFT: "Pengaju · draf belum dikirim",
  DEPT_APPROVAL: "Head Departemen",
  GATE1_KELENGKAPAN: "Admin / Document Control",
  RETURNED: "Pengaju · menunggu revisi",
  GATE2_PARALLEL: "QS/MK & Legal",
  GATE3_BUDGET_REVIEW: "Divisi Budget",
  TREASURY_CHECK: "Finance / Treasury",
  GATE4_CEO_PROJECT: "CEO Project",
  GATE5_CFO: "CFO",
  GATE6_CEO1: "CEO 1",
  APPROVED: "Siap dieksekusi",
  REJECTED: "Selesai · ditolak",
  PAID: "Selesai · dibayar",
  VOID: "Void",
};

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  DOC01: "DOC-01 · SPK / PNJ",
  DOC02: "DOC-02 · LOA",
  DOC03: "DOC-03 · Advance / Reimbursement / PTG / PO",
  DOC04: "DOC-04 · Payment / BAPP",
  DOC05: "DOC-05 · Adendum",
};

export function formKindLabel(kind: FormKind): string {
  return FORM_KINDS.find((f) => f.code === kind)?.label ?? kind;
}

export type GateStepState = "done" | "current" | "fail" | "future";

/**
 * Six-gate dot stepper (nice-to-have on Berkas Saya). Purely derived from
 * `currentGate` + `status` — gate ownership detail lives in GATE_DETAIL.
 */
export function gateSteps(status: SubmissionStatus, currentGate: number): GateStepState[] {
  if (status === "DRAFT" || status === "DEPT_APPROVAL") {
    return [1, 2, 3, 4, 5, 6].map(() => "future");
  }
  const failed = status === "RETURNED" || status === "REJECTED" || status === "VOID";
  const allDone = status === "APPROVED" || status === "PAID";
  return [1, 2, 3, 4, 5, 6].map((step) => {
    if (allDone) return "done";
    if (step < currentGate) return "done";
    if (step === currentGate) return failed ? "fail" : "current";
    return "future";
  });
}
