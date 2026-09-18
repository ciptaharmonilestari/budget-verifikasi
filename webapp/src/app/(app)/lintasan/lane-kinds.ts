/**
 * Lane-owner copy — ported verbatim from the prototype's LANE_KINDS constant
 * (dc.html) and LANE_FLOW (the 10-step flow diagram). Not in @/lib/reference-data
 * since only this screen uses it. Keys renamed to match the Lane enum
 * (HRDGA -> HRD_GA, ACTG -> ACCOUNTING) — copy is unchanged.
 */
import type { Lane } from "@/generated/prisma/client";

export const LANE_KINDS: Record<Lane, { label: string; desc: string }> = {
  TAX: {
    label: "Divisi Tax",
    desc: "Validasi DPP, tarif PPN dan PPh, status PKP atau Non-PKP, termasuk PPh 21 progresif perorangan, PPh final, dan pembelian barang impor. Hasilnya dicatat melalui surel verifikasi.",
  },
  LEGAL: {
    label: "Divisi Legal",
    desc: "Menerbitkan nomor draft SPK, LOA, Adendum, PHS, dan MOU. Setelah approval CFO, Legal memproses tanda tangan Direktur sesuai PT penerbit lalu finalisasi dokumen.",
  },
  HRD_GA: {
    label: "Divisi HRD / GA",
    desc: "Wajib untuk pengajuan aset: memeriksa kelayakan kebutuhan, rekap aset dan stok terkini, serta nomor register aset sebelum berkas kembali ke Divisi Budget.",
  },
  ACCOUNTING: {
    label: "Divisi Accounting",
    desc: "Wajib untuk dokumen BAPP: mencocokkan berita acara dengan pembukuan, nilai terbayar, dan kode biaya sebelum berkas kembali ke Divisi Budget.",
  },
};

export const LANE_FLOW: Array<{ label: string; note: string }> = [
  { label: "Pengaju", note: "menyusun dan mengunggah berkas" },
  { label: "Divisi Budget", note: "verifikasi kelengkapan awal" },
  { label: "Divisi Tax", note: "verifikasi tarif dan status PKP" },
  { label: "Divisi Legal", note: "kontrak · SPK · LOA · Adendum · MOU" },
  { label: "Divisi HRD / GA", note: "khusus pengajuan aset" },
  { label: "Divisi Accounting", note: "khusus dokumen BAPP" },
  { label: "Divisi Budget", note: "rekomendasi dan lembar verifikasi" },
  { label: "CEO Project", note: "Gate 4" },
  { label: "CFO", note: "Gate 5" },
  { label: "CEO 1", note: "Gate 6 · keputusan akhir" },
];

export const LANE_ORDER: Lane[] = ["TAX", "LEGAL", "HRD_GA", "ACCOUNTING"];

export const LANE_SHORT_LABEL: Record<Lane, string> = {
  TAX: "Tax",
  LEGAL: "Legal",
  HRD_GA: "HRD / GA",
  ACCOUNTING: "Accounting",
};
