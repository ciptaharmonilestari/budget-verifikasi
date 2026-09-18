"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { ContractKind, PaymentScheduleStatus } from "@/generated/prisma/client";

export interface ActionState {
  ok: boolean;
  message: string;
}

const KIND_MAP: Record<string, ContractKind> = {
  "SPK / Kontrak": "KONTRAK",
  LOA: "LOA",
  Adendum: "ADENDUM",
  PO: "PO",
};

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dateOrUndef(v: FormDataEntryValue | null): Date | undefined {
  const s = str(v);
  return s ? new Date(s) : undefined;
}

/** Creates a new contract/commitment record from the 5-section KONTRAK_FORM
 * shape. Fields with a matching real column are stored there; every other
 * legal/signer/jaminan field from the prototype's field-group definition is
 * stashed verbatim in `extra`. Gated: only OWNER/HEAD_BUDGET (flags.master). */
export async function createContractAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("OWNER", "HEAD_BUDGET");

  const instrumentNo = str(formData.get("instrumentNo"));
  const projectId = str(formData.get("projectId"));
  const costCode = str(formData.get("costCode"));
  const value = num(formData.get("nilaiKontrak"));
  const tipeKomitmen = str(formData.get("tipeKomitmen"));
  const kind = KIND_MAP[tipeKomitmen] ?? "KONTRAK";

  if (!instrumentNo || !projectId || !costCode || value <= 0) {
    return { ok: false, message: "No. kontrak, proyek, cost code, dan nilai kontrak wajib diisi." };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false, message: "Proyek tidak ditemukan." };

  const existing = await prisma.contract.findUnique({ where: { instrumentNo } });
  if (existing) return { ok: false, message: `No. kontrak/instrumen "${instrumentNo}" sudah dipakai.` };

  // Vendor: pick an existing one, or create a new vendor from section 2 fields.
  let vendorId = str(formData.get("vendorId"));
  if (!vendorId) {
    const mitraBaru = str(formData.get("mitraBaru"));
    if (!mitraBaru) return { ok: false, message: "Pilih vendor yang sudah ada, atau isi nama mitra baru." };
    const vendor = await prisma.vendor.create({
      data: {
        name: mitraBaru,
        npwp: str(formData.get("npwp")) || undefined,
        bank: str(formData.get("bank")) || undefined,
        rekening: str(formData.get("rek")) || undefined,
        alamat: str(formData.get("alamat")) || undefined,
        tipeSupplier: str(formData.get("tipeSupplier")) || undefined,
        pkpStatus: "NON_PKP",
      },
    });
    vendorId = vendor.id;
  }

  const extra: Record<string, string | number> = {};
  const stash = (key: string) => {
    const v = str(formData.get(key));
    if (v) extra[key] = v;
  };
  const stashNum = (key: string) => {
    const raw = formData.get(key);
    if (raw !== null && str(raw) !== "") extra[key] = num(raw);
  };
  stash("tglKontrak");
  stash("tipeKontrak");
  stash("kegiatan");
  stash("jenisKegiatan");
  stash("mataUangKurs");
  stashNum("kurs");
  stash("uraian");
  stashNum("jwPelaksanaan");
  stashNum("jwPemeliharaan");
  stash("noAdendum");
  stash("tglAdendum");
  stash("tglPutus");
  stash("alasanPutus");
  stashNum("nilaiUm");
  stash("caraBayar");
  stash("caraKembaliUm");
  stash("penjaminUm");
  stash("noJaminanUm");
  stash("masaJaminanUm");
  stash("potonganRetensi");
  stash("sanksi");
  stash("ttdInternal");
  stash("ttdMitra");
  stash("jenisHasil");
  stashNum("upah");
  stash("perSatuan");

  const contract = await prisma.contract.create({
    data: {
      instrumentNo,
      kind,
      vendorId,
      companyId: project.companyId,
      projectId,
      costCode,
      value,
      currency: str(formData.get("mataUang")) || "IDR",
      startDate: dateOrUndef(formData.get("tglMulai")),
      endDate: dateOrUndef(formData.get("tglSelesai")),
      dpPct: num(formData.get("dpPct")),
      retensiPct: num(formData.get("retensiPct")),
      status: "AKTIF",
      tagLevel: "INFO",
      extra,
    },
  });

  await prisma.activityLog.create({
    data: { action: "CONTRACT_CREATED", note: `Kontrak ${instrumentNo} dibuat`, userId: user.id },
  });

  revalidatePath("/registri");
  redirect(`/registri/${contract.id}`);
}

/** Adds or edits one payment-schedule (termin) row for a contract. */
export async function upsertPaymentScheduleAction(formData: FormData): Promise<void> {
  await requireRole("OWNER", "HEAD_BUDGET");

  const contractId = str(formData.get("contractId"));
  const id = str(formData.get("id"));
  const label = str(formData.get("label"));
  const amount = num(formData.get("amount"));
  const status = str(formData.get("status")) as PaymentScheduleStatus;
  const paidAt = dateOrUndef(formData.get("paidAt"));

  if (!contractId || !label) {
    throw new Error("Label termin dan kontrak wajib diisi.");
  }

  if (id) {
    await prisma.paymentSchedule.update({
      where: { id },
      data: { label, amount, status, paidAt: status === "PAID" ? (paidAt ?? new Date()) : paidAt ?? null },
    });
  } else {
    await prisma.paymentSchedule.create({
      data: { contractId, label, amount, status, paidAt: status === "PAID" ? (paidAt ?? new Date()) : paidAt },
    });
  }

  revalidatePath(`/registri/${contractId}`);
}
