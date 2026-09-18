import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/components/ui/Tag";
import { rupiah, idDate } from "@/lib/format";
import { PaymentScheduleTable } from "./PaymentScheduleTable.client";
import type { ContractKind, ContractStatus, GuaranteeKind } from "@/generated/prisma/client";

const KIND_LABEL: Record<ContractKind, string> = {
  KONTRAK: "SPK / Kontrak",
  LOA: "LOA",
  ADENDUM: "Adendum",
  PO: "PO",
};

const STATUS_LABEL: Record<ContractStatus, string> = {
  AKTIF: "Aktif",
  SELESAI: "Selesai",
  DIPUTUS: "Diputus",
  KEDALUWARSA: "Kedaluwarsa",
};

const GUARANTEE_LABEL: Record<GuaranteeKind, string> = {
  UANG_MUKA: "Jaminan uang muka",
  PELAKSANAAN: "Jaminan pelaksanaan",
  PEMELIHARAAN: "Jaminan pemeliharaan",
};

/** Labels for the `extra` JSON blob's keys — matches the field labels in the
 * prototype's KONTRAK_FORM (dc.html) so the read-only detail view stays
 * legible instead of showing raw camelCase keys. Any key not listed here
 * (e.g. from older/foreign data) falls back to the raw key itself. */
const EXTRA_LABEL: Record<string, string> = {
  tglKontrak: "Tanggal kontrak",
  tipeKontrak: "Tipe kontrak",
  kegiatan: "Kegiatan kerja",
  jenisKegiatan: "Jenis kegiatan kerja",
  mataUangKurs: "Mata uang kurs (catatan)",
  kurs: "Nilai kurs",
  uraian: "Uraian / risalah kontrak",
  jwPelaksanaan: "Jangka waktu pelaksanaan (hari)",
  jwPemeliharaan: "Jangka waktu pemeliharaan (hari)",
  noAdendum: "Nomor adendum",
  tglAdendum: "Tgl adendum",
  tglPutus: "Tgl putus kontrak",
  alasanPutus: "Alasan putus",
  nilaiUm: "Nilai uang muka (Rp)",
  caraBayar: "Cara pembayaran",
  caraKembaliUm: "Cara pengembalian uang muka",
  penjaminUm: "Bank / asuransi penjamin UM",
  noJaminanUm: "Nomor surat jaminan UM",
  masaJaminanUm: "Masa berlaku jaminan UM",
  potonganRetensi: "Cara pemotongan retensi",
  sanksi: "Ketentuan sanksi",
  ttdInternal: "Penanda tangan internal",
  ttdMitra: "Penanda tangan mitra",
  jenisHasil: "Jenis hasil",
  upah: "Upah tenaga kerja (Rp)",
  perSatuan: "Per satuan",
};

const MONEY_EXTRA_KEYS = new Set(["nilaiUm", "upah"]);

function formatExtraValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (MONEY_EXTRA_KEYS.has(key) && typeof value === "number") return rupiah(value);
  if (typeof value === "number") return value.toLocaleString("id-ID");
  return String(value);
}

export default async function ContractDetailPage({ params }: PageProps<"/registri/[id]">) {
  const { id } = await params;
  await requireUser();

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      vendor: true,
      company: true,
      project: true,
      paymentSchedules: { orderBy: { id: "asc" } },
      guarantees: { orderBy: { expiresAt: "asc" } },
    },
  });
  if (!contract) notFound();

  const extra = (contract.extra ?? {}) as Record<string, unknown>;
  const extraEntries = Object.entries(extra).filter(([, v]) => v !== "" && v !== null && v !== undefined);

  const schedules = contract.paymentSchedules.map((s) => ({
    id: s.id,
    label: s.label,
    amount: Number(s.amount),
    status: s.status,
    paidAt: s.paidAt,
  }));

  const totalPaid = schedules.filter((s) => s.status === "PAID").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Link href="/registri" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}>← Kembali ke Registri Commitment</Link>

      <section className="card">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div>
            <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{contract.instrumentNo}</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 2 }}>{KIND_LABEL[contract.kind]}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tag level={contract.tagLevel}>{contract.tagLevel}</Tag>
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{STATUS_LABEL[contract.status]}</span>
          </div>
        </div>

        <div className="grid3" style={{ marginTop: 16 }}>
          <InfoField label="Vendor" value={contract.vendor.name} />
          <InfoField label="PT" value={`${contract.company.code} — ${contract.company.name}`} />
          <InfoField label="Proyek" value={contract.project.name} />
          <InfoField label="Cost code" value={contract.costCode} mono />
          <InfoField label="Nilai kontrak" value={rupiah(Number(contract.value))} mono />
          <InfoField label="Mata uang" value={contract.currency} />
          <InfoField label="Tgl mulai" value={idDate(contract.startDate)} />
          <InfoField label="Tgl berakhir" value={idDate(contract.endDate)} />
          <InfoField label="DP" value={`${Number(contract.dpPct)}%`} mono />
          <InfoField label="Retensi" value={`${Number(contract.retensiPct)}%`} mono />
          <InfoField label="Total termin terbayar" value={rupiah(totalPaid)} mono />
          <InfoField label="Sisa dari nilai kontrak" value={rupiah(Number(contract.value) - totalPaid)} mono />
        </div>
      </section>

      <section className="card">
        <div style={{ fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 4 }}>Rincian naskah kontrak</div>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 12, maxWidth: "72ch" }}>
          Field legal, jaminan dan penanda tangan tersimpan di luar kolom baku sebagai catatan naskah kontrak.
        </p>
        {extraEntries.length === 0 ? (
          <div style={{ color: "var(--ink-3)", fontSize: 13.5 }}>Belum ada detail tambahan tersimpan untuk kontrak ini.</div>
        ) : (
          <div className="grid2">
            {extraEntries.map(([key, value]) => (
              <div key={key} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "4px 0", borderBottom: "1px dotted var(--line)" }}>
                <span style={{ flex: "0 0 46%", fontSize: 13, color: "var(--ink-2)" }}>{EXTRA_LABEL[key] ?? key}</span>
                <span style={{ flex: 1, fontSize: 13.5, textWrap: "pretty" as React.CSSProperties["textWrap"] }}>
                  {formatExtraValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div style={{ fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 4 }}>Jadwal Pembayaran</div>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 14px", maxWidth: "70ch" }}>
          Tambah atau ubah satu baris termin. Persentase dihitung otomatis terhadap nilai kontrak.
        </p>
        <PaymentScheduleTable contractId={contract.id} contractValue={Number(contract.value)} schedules={schedules} />
      </section>

      {contract.guarantees.length > 0 && (
        <section className="card">
          <div style={{ fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 12 }}>Jaminan</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Jenis</th>
                <th>Nomor</th>
                <th>Berlaku s/d</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contract.guarantees.map((g) => (
                <tr key={g.id}>
                  <td>{GUARANTEE_LABEL[g.kind]}</td>
                  <td className="num">{g.number}</td>
                  <td className="num">{idDate(g.expiresAt)}</td>
                  <td><Tag level={g.status}>{g.status}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className={mono ? "num" : undefined} style={{ fontSize: 14, marginTop: 2 }}>{value}</div>
    </div>
  );
}
