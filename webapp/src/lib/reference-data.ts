/**
 * Static business-rule reference data for Kendali Biaya Terpadu.
 *
 * Ported verbatim (not re-invented) from the Claude Design prototype at
 * `project/Kendali Biaya Terpadu.dc.html` (constants GATE_DETAIL, LIFECYCLE,
 * AUTH_EXTRA, RETURN_RULES, PERMS, GEN/C4/GROUPS, TAX_TX, PPH21_BRACKETS,
 * FORM_KINDS, NOTIF_RULES) and project/prd.md. These are fixed business
 * rules the product does not let any role edit at runtime (unlike
 * Settings/Parameters, which is the one editable register — see
 * lib/parameters.ts).
 */

import type { Role } from "@/generated/prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  HEAD_BUDGET: "Head of Budget",
  VERIFIKATOR_BUDGET: "Verifikator Budget",
  ADMIN_BUDGET: "Admin Budget",
  DIV_PAJAK: "Div Pajak",
  PENGAJU: "Staf Pengaju",
  HEAD_DEPARTEMEN: "Head Departemen",
  CEO_PROJECT: "CEO Project",
  CFO: "CFO",
  CEO1: "CEO 1",
};

export type Panel = "BUDGET" | "PENGAJU" | "APPROVER";

export const ROLE_PANEL: Record<Role, Panel> = {
  OWNER: "BUDGET",
  HEAD_BUDGET: "BUDGET",
  VERIFIKATOR_BUDGET: "BUDGET",
  ADMIN_BUDGET: "BUDGET",
  DIV_PAJAK: "BUDGET",
  PENGAJU: "PENGAJU",
  HEAD_DEPARTEMEN: "PENGAJU",
  CEO_PROJECT: "APPROVER",
  CFO: "APPROVER",
  CEO1: "APPROVER",
};

export interface RoleFlags {
  master: boolean;
  verify: boolean;
  input: boolean;
  taxOwner?: boolean;
  approveDept?: boolean;
  gate?: number;
}

export const ROLE_FLAGS: Record<Role, RoleFlags> = {
  OWNER: { master: true, verify: true, input: true },
  HEAD_BUDGET: { master: true, verify: true, input: true },
  VERIFIKATOR_BUDGET: { master: false, verify: true, input: false },
  ADMIN_BUDGET: { master: false, verify: false, input: true },
  DIV_PAJAK: { master: false, verify: false, input: false, taxOwner: true },
  PENGAJU: { master: false, verify: false, input: true },
  HEAD_DEPARTEMEN: { master: false, verify: false, input: false, approveDept: true },
  CEO_PROJECT: { master: false, verify: false, input: false, gate: 4 },
  CFO: { master: false, verify: false, input: false, gate: 5 },
  CEO1: { master: false, verify: false, input: false, gate: 6 },
};

export const PANELS: Array<{ id: Panel; label: string; subtitle: string; desc: string }> = [
  { id: "PENGAJU", label: "Pengaju", subtitle: "Departemen", desc: "Susun berkas, kirim ke antrean, dan pantau statusnya. Head departemen menyetujui lebih dahulu sebelum berkas masuk ke Budget." },
  { id: "BUDGET", label: "Divisi Budget", subtitle: "Verifikasi", desc: "Panel lengkap: rule engine, lembar verifikasi, posisi anggaran, registri komitmen, dan master data." },
  { id: "APPROVER", label: "Penyetuju", subtitle: "CEO Project, CFO & CEO 1", desc: "Tiga gate berurutan setelah Divisi Budget merekomendasikan: CEO Project lebih dahulu, lalu CFO, lalu CEO 1 sebagai keputusan akhir." },
];

// Departments (25) — DEPTS
export const DEPTS: Array<[code: string, name: string, roleNote: string]> = [
  ["ACC", "Accounting", "Pengaju · pemeriksa akrual"], ["ADP", "Admin Project", "Pengaju"],
  ["ADS", "Admin Sales", "Pengaju"], ["ARS", "Arsitek", "Pengaju · verifikasi teknis"],
  ["BGT", "Budget", "Verifikator anggaran · pemilik modul"], ["CSH", "Cashier", "Pelaksana pembayaran"],
  ["CEP", "CEO Project", "Penyetuju akhir"], ["CFO", "CFO", "Penyetuju keuangan"],
  ["COL", "Collection", "Pengaju"], ["CSR", "CSR", "Pengaju"], ["EST", "Estate", "Pengaju"],
  ["FIN", "Finance", "Pelaksana pembayaran · proyeksi kas"], ["FND", "Funding", "Pengaju · pendanaan proyek"],
  ["GA", "GA", "Pengaju"], ["HRD", "HRD", "Pengaju"], ["IT", "IT", "Pengaju"],
  ["LAQ", "Land Acquisition", "Pengaju"], ["LGL", "Legal", "Pengaju · verifikasi legal"],
  ["MKM", "MarCom", "Pengaju"], ["PRZ", "Perijinan", "Pengaju"],
  ["PRC", "Procurement / Purchasing", "Pengaju · pengadaan"], ["PRJ", "Project", "Pengaju · verifikasi progres"],
  ["SLS", "Sales", "Pengaju"], ["SEC", "Secretary", "Pengaju"], ["TAX", "Tax", "Pengaju · pemeriksa pajak"],
];

// PT + Proyek — GROUP
export const GROUP: Array<[code: string, name: string, projects: Array<[string, number]>, locked: boolean]> = [
  ["SBC", "PT Serpong Bangun Cipta", [["Banara", 188], ["BanaraCorner", 24], ["Marchand", 61], ["Mazenta", 41], ["Naraya", 77], ["HeadOffice", 12]], true],
  ["BBH", "PT Bhakti Bangun Harmoni", [["TanglinParc", 184], ["NewtonSprings", 46], ["OrchardRiviera", 31], ["MidRisePhase3", 18], ["MainClubHouse", 9], ["PhaseR2", 4], ["HeadOffice", 7]], true],
  ["BPL", "PT Buana Permai Luhur", [["Sanctuary", 12]], true],
  ["BIA", "PT Bangun Inti Abadi", [["SentulNonJV", 9], ["SentulNonJVDayu", 3]], true],
  ["PAL", "PT Pertiwi Agung Lestari", [["HeadOffice", 8], ["ThemePark", 22]], true],
  ["BIH", "PT Bangun Indah Harmoni", [["ProyekCilejit", 5]], true],
  ["BMM", "PT Bumi Mahardika Makmur", [["ProyekCilejit", 4]], true],
  ["GGN", "PT Gema Griya Insani", [["ProyekCilejit", 2]], true],
  ["GGI", "PT Griya Gardenia Indah", [["EstateMarchand", 6], ["EstateBanaraSerpong", 19], ["EstateMazentaResidence", 7], ["EstateBioDistrict", 14], ["EstateNarayaSerpong", 11]], true],
  ["CHL", "PT Cipta Harmoni Lestari", [["HeadOffice", 309]], true],
  ["HAS", "PT Harmoni Adil Selaras", [["HeadOffice", 4]], true],
  ["SBL", "PT Serpong Bangun Lestari", [["BioDistrict", 317]], true],
  ["SHL", "PT Solohana Harmoni Lestari", [["ProyekLabuanBajo", 3]], true],
  ["GBT", "PT Graha Bumi Tirta", [["ProyekJatake", 2]], true],
  ["CSC", "PT Cipta Selaras Cemerlang", [], true],
  ["GKP", "PT Griya Kirana Propertindo", [], true],
  ["ACH", "PT Agro Cipta Harmoni", [], true],
  ["HIS", "PT Harmoni Indah Sentosa", [], true],
  ["GBH", "PT Griya Bhakti Harmoni", [], true],
  ["SIR", "PT Serpong Indo Raya", [], true],
  ["KKS", "PT Kreasi Kelola Sejahtera", [], true],
  ["BAH", "PT Bali Anugerah Hijau", [], true],
];

// Budget allocations — ALLOC
export const ALLOC: Array<[allocNo: string, ptCode: string, project: string, costCode: string, name: string, pagu: number, used: number]> = [
  ["ALC-2026-0114", "SBC", "Banara", "STR-02", "Pekerjaan struktur", 42800000000, 28650000000],
  ["ALC-2026-0118", "SBC", "Banara", "MEP-01", "Pekerjaan MEP", 18400000000, 9120000000],
  ["ALC-2026-0121", "SBC", "Marchand", "STR-02", "Pekerjaan struktur", 15200000000, 4380000000],
  ["ALC-2026-0126", "BOR", "Riviera", "LND-03", "Lanskap dan hardscape", 8600000000, 6240000000],
  ["ALC-2026-0131", "BBH", "TanglinParc", "LND-03", "Lanskap dan hardscape", 11250000000, 7810000000],
  ["ALC-2026-0140", "CHL", "Kantor", "GAO-05", "Biaya umum kantor", 2400000000, 1180000000],
  ["ALC-2026-0144", "CHL", "Kantor", "AST-07", "Pengadaan aset", 1750000000, 620000000],
];

// Demo users — USERS / ACCOUNTS (role) / USER_LAST
export const DEMO_USERS: Array<{ username: string; name: string; role: Role; deptCode?: string; lastLogin: string }> = [
  { username: "r.wibowo", name: "Rangga Wibowo", role: "OWNER", lastLogin: "17-09-2026 17:48" },
  { username: "s.hartati", name: "Sri Hartati", role: "HEAD_BUDGET", lastLogin: "18-09-2026 08:12" },
  { username: "d.prasetya", name: "Dimas Prasetya", role: "VERIFIKATOR_BUDGET", lastLogin: "18-09-2026 09:02" },
  { username: "l.anggraini", name: "Lidya Anggraini", role: "ADMIN_BUDGET", lastLogin: "17-09-2026 16:33" },
  { username: "b.nugroho", name: "Bayu Nugroho", role: "PENGAJU", deptCode: "PRJ", lastLogin: "18-09-2026 08:41" },
  { username: "a.kurniawan", name: "Andre Kurniawan", role: "HEAD_DEPARTEMEN", deptCode: "PRJ", lastLogin: "18-09-2026 07:55" },
  { username: "f.maharani", name: "Fitri Maharani", role: "DIV_PAJAK", lastLogin: "18-09-2026 08:00" },
  { username: "r.kusuma", name: "Ratna Kusumawardani", role: "CFO", lastLogin: "17-09-2026 19:20" },
  { username: "j.tanuwijaya", name: "Johannes Tanuwijaya", role: "CEO_PROJECT", lastLogin: "16-09-2026 11:07" },
  { username: "p.raswono", name: "Peter Raswono", role: "CEO1", lastLogin: "15-09-2026 10:14" },
];

// Form kinds — FORM_KINDS. PRD says "sepuluh jenis" but only names 7 concretely
// and the prototype implements exactly these 7 — see final report for this discrepancy.
export const FORM_KINDS: Array<{ code: string; label: string; desc: string; docType: string }> = [
  { code: "PNJ", label: "IOM Penunjukan", desc: "Approval CEO 1 sebelum Legal terbitkan SPK · LOA · Adendum", docType: "DOC-01 / DOC-02 / DOC-05" },
  { code: "BAYAR", label: "IOM Payment (BAPP)", desc: "Berita Acara Pemeriksaan Pekerjaan — panggil kontrak, cek termin & yang sudah dibayar", docType: "DOC-04" },
  { code: "BIAYA", label: "IOM Pengajuan Biaya", desc: "Advance · Reimbursement · Klaim Biaya", docType: "DOC-03" },
  { code: "PTG", label: "Pertanggungjawaban", desc: "Panggil IOM Advance-nya", docType: "DOC-03 · C3-12" },
  { code: "DPH", label: "Pengajuan DPH", desc: "Verifikasi & validasi data unggahan", docType: "DOC-01" },
  { code: "PO", label: "Pengajuan PO", desc: "Tarik dari PR dan DPH — approval otomatis bila DPH sudah disetujui", docType: "DOC-03" },
  { code: "FIN", label: "IOM Finance (Payment Voucher)", desc: "Pengajuan bayar atas PO — data otomatis dari PO", docType: "DOC-03 · PV" },
];

// Authority tiers — TIERS (display only; live routing thresholds come from
// the "Tingkat kewenangan" parameter group in lib/parameters.ts)
export const TIERS = [
  { band: "≤ Rp 50 juta", max: 5e7, who: "Head Dept + Head Budget" },
  { band: "> 50 juta – 250 juta", max: 25e7, who: "Head Dept + Head Budget + CEO Project" },
  { band: "> 250 juta – 500 juta", max: 5e8, who: "CEO Project (Gate 4)" },
  { band: "> 500 juta – 5 miliar", max: 5e9, who: "CEO Project → CFO (Gate 5)" },
  { band: "> 5 miliar", max: Infinity, who: "CEO Project → CFO → CEO 1 (Gate 6, + BoD bila melewati batas RUPS)" },
];

export const AUTH_EXTRA = [
  "Adendum yang menyebabkan kumulatif melebihi 10% nilai kontrak awal wajib CEO, berapa pun nilainya.",
  "Penunjukan langsung naik satu tingkat kewenangan dari tabel di atas.",
  "Pengajuan di luar anggaran wajib CEO, berapa pun nilainya.",
  "LOA memakai kewenangan yang sama dengan kontrak yang akan diterbitkannya.",
  "Rute ditentukan nilai pengajuan, bukan nilai transfer setelah potongan.",
];

export const RETURN_RULES = [
  "Setiap pengembalian wajib menyebut rule ID yang gagal dan tindakan perbaikan yang diminta.",
  "Maksimum dua siklus pengembalian untuk satu pengajuan. Siklus ketiga dieskalasi ke CFO sebagai isu kepatuhan departemen.",
  "Pengajuan yang melewati SLA di satu gate memicu notifikasi otomatis ke atasan pemegang gate.",
  "Pengajuan mendesak tetap melewati seluruh aturan BLOCK. Yang dipersingkat hanya SLA, bukan kontrolnya.",
];

// Gate detail — GATE_DETAIL
export const GATE_DETAIL: Array<{ gate: string; name: string; owner: string; sla: string; desc: string; output: string; failPath: string }> = [
  { gate: "1", name: "Kelengkapan", owner: "Admin / Document Control", sla: "1 hari", desc: "Mesin lebih dahulu: checklist dinamis, kode anggaran, konsistensi nilai antar dokumen, duplikasi. Admin hanya menangani pengecualian.", output: "Berkas lengkap menurut pohon keputusan SOP", failPath: "DIKEMBALIKAN otomatis dengan daftar kekurangan" },
  { gate: "2", name: "Teknis & Legal", owner: "QS/MK dan Legal, paralel", sla: "2 hari", desc: "QS mengesahkan volume, progres dan harga satuan. Legal memeriksa instrumen kontrak, legalitas vendor dan draft adendum.", output: "Progres dan instrumen disahkan", failPath: "DIKEMBALIKAN bila tidak sah" },
  { gate: "3", name: "Validasi Anggaran", owner: "Divisi Budget", sla: "2 hari bayar / 3 hari kontrak", desc: "Rule engine dijalankan otomatis, WARN direview manual, status ditetapkan dan lembar verifikasi ter-generate.", output: "CLEAR / CLEAR WITH NOTES + lembar verifikasi", failPath: "DIKEMBALIKAN menyebut rule ID yang gagal" },
  { gate: "T", name: "Treasury check", owner: "Finance / Treasury", sla: "1 hari", desc: "Likuiditas dan penjadwalan pembayaran — khusus DOC-04, berjalan setelah Gate 3.", output: "Jadwal bayar ditetapkan", failPath: "Ditahan sampai kas tersedia" },
  { gate: "4", name: "CEO Project", owner: "CEO Project", sla: "—", desc: "Persetujuan proyek atas berkas yang sudah direkomendasikan Divisi Budget. Berada di atas Head Departemen pengaju.", output: "Naik ke Gate 5 · CFO", failPath: "Return atau reject" },
  { gate: "5", name: "CFO", owner: "CFO", sla: "—", desc: "Setujui, setujui bersyarat, kembalikan atau tolak atas dasar lembar verifikasi. Override WARN.", output: "Naik ke Gate 6 bila di atas threshold", failPath: "Return atau reject" },
  { gate: "6", name: "CEO 1", owner: "CEO 1", sla: "—", desc: "Keputusan akhir untuk nilai di atas threshold, adendum kumulatif di atas 10%, dan pengajuan di luar anggaran. Satu-satunya yang dapat override BLOCK.", output: "APPROVED → eksekusi", failPath: "Reject" },
];

// Lifecycle state machine (19 states) — LIFECYCLE
export const LIFECYCLE: Array<{ tech: string; label: string; meaning: string; next: string; trigger: string; tag: string }> = [
  { tech: "DRAFT", label: "Draf", meaning: "Belum bernomor indeks", next: "SUBMITTED · CANCELLED", trigger: "Pengaju menekan kirim", tag: "N/A" },
  { tech: "SUBMITTED", label: "Diajukan", meaning: "Nomor indeks diterbitkan", next: "DOC_CHECK", trigger: "Otomatis", tag: "N/A" },
  { tech: "DOC_CHECK", label: "Cek kelengkapan", meaning: "Gate 1, pengecualian ditangani Admin", next: "TECH_LEGAL_REVIEW · RETURNED", trigger: "Auto-check checklist", tag: "N/A" },
  { tech: "TECH_LEGAL_REVIEW", label: "Verifikasi teknis & legal", meaning: "Gate 2, QS dan Legal paralel", next: "BUDGET_REVIEW · RETURNED", trigger: "Kedua verifikator selesai", tag: "N/A" },
  { tech: "BUDGET_REVIEW", label: "Verifikasi anggaran", meaning: "Gate 3, rule engine + review manual", next: "RECOMMENDED · RETURNED", trigger: "Divisi Budget menutup lembar", tag: "INFO" },
  { tech: "RETURNED", label: "Dikembalikan", meaning: "Nomor tetap, revisi -R1", next: "SUBMITTED (revisi)", trigger: "Pengaju memperbaiki berkas", tag: "FAIL" },
  { tech: "RECOMMENDED", label: "Direkomendasikan", meaning: "Lembar verifikasi terbit", next: "CEOPRJ_APPROVAL", trigger: "Otomatis", tag: "INFO" },
  { tech: "CEOPRJ_APPROVAL", label: "Menunggu CEO Project", meaning: "Gate 4", next: "CFO_APPROVAL · RETURNED · REJECTED", trigger: "Keputusan CEO Project", tag: "INFO" },
  { tech: "CFO_APPROVAL", label: "Menunggu CFO", meaning: "Gate 5", next: "CEO1_APPROVAL · APPROVED · RETURNED · REJECTED", trigger: "Keputusan CFO", tag: "INFO" },
  { tech: "CEO1_APPROVAL", label: "Menunggu CEO 1", meaning: "Gate 6, bila di atas batas", next: "APPROVED · REJECTED", trigger: "Keputusan CEO 1", tag: "INFO" },
  { tech: "APPROVED", label: "Disetujui", meaning: "Siap dieksekusi", next: "PAYMENT_SCHEDULED · EXECUTED", trigger: "Otomatis per jenis", tag: "PASS" },
  { tech: "PAYMENT_SCHEDULED", label: "Dijadwalkan bayar", meaning: "Khusus DOC-04", next: "PAID", trigger: "Treasury menetapkan jadwal", tag: "PASS" },
  { tech: "PAID", label: "Dibayar", meaning: "Bukti transfer & bukti potong terunggah", next: "CLOSED", trigger: "Komitmen pindah ke realisasi", tag: "PASS" },
  { tech: "EXECUTED", label: "Terbit", meaning: "DOC-01, DOC-02, DOC-05", next: "CLOSED", trigger: "Instrumen ditandatangani", tag: "PASS" },
  { tech: "HELD", label: "Ditahan", meaning: "Khusus DOC-03 tertahan C3-12", next: "BUDGET_REVIEW · CANCELLED", trigger: "Uang muka lama dipertanggungjawabkan", tag: "WARN" },
  { tech: "CLOSED", label: "Selesai", meaning: "Terminal", next: "—", trigger: "Terminal", tag: "N/A" },
  { tech: "REJECTED", label: "Ditolak", meaning: "Terminal", next: "—", trigger: "Terminal", tag: "N/A" },
  { tech: "CANCELLED", label: "Dibatalkan", meaning: "Terminal, tidak pernah dihapus (BR-12)", next: "—", trigger: "Terminal", tag: "N/A" },
  { tech: "EXPIRED", label: "Kedaluwarsa", meaning: "Khusus LOA lewat masa berlaku", next: "—", trigger: "Terminal", tag: "FAIL" },
];

// Verification rule catalog — GEN / C4 / GROUPS
export const GEN_RULES: Array<[code: string, text: string, severity: "B" | "W" | "I"]> = [
  ["GEN-01", "Semua dokumen wajib sesuai checklist telah terlampir dan terbaca", "B"],
  ["GEN-02", "Pengaju memiliki kewenangan sesuai matriks kewenangan", "B"],
  ["GEN-03", "Cost code atau WBS terdaftar pada versi anggaran yang berlaku", "B"],
  ["GEN-04", "Proyek aktif dan baseline sudah disetujui BoD melalui Modul 1.8", "B"],
  ["GEN-05", "Vendor terdaftar, tidak blacklist, legalitas belum kedaluwarsa", "B"],
  ["GEN-06", "Tidak ada duplikasi nomor dokumen, invoice, periode, atau scope", "B"],
  ["GEN-07", "Nilai pengajuan konsisten di seluruh dokumen", "B"],
  ["GEN-08", "Tidak terindikasi pemecahan nilai — vendor & baris anggaran sama dalam 30 hari", "W"],
  ["GEN-09", "Tanggal dokumen logis: BA tidak mendahului kontrak, invoice tidak mendahului BA", "W"],
  ["GEN-10", "Bila non-IDR, kurs acuan dicantumkan dan konsisten", "W"],
  ["GEN-11", "Dampak pengajuan terhadap proyeksi kas periode berjalan telah dihitung", "I"],
];

export const C4_RULES: Array<[code: string, text: string, severity: "B" | "W" | "I"]> = [
  ["C4-01", "Kontrak atau SPK aktif dan valid untuk pekerjaan yang ditagih", "B"],
  ["C4-02", "Progres keuangan yang diminta ≤ progres fisik yang disahkan MK", "B"],
  ["C4-03", "Kumulatif dibayar + pengajuan ini ≤ nilai kontrak current", "B"],
  ["C4-04", "Termin yang ditagih sesuai skema termin dalam kontrak", "B"],
  ["C4-05", "Pekerjaan tambah hanya dibayar bila adendum sudah disetujui", "B"],
  ["C4-06", "Recoupment uang muka dipotong proporsional sesuai formula kontrak", "B"],
  ["C4-07", "Retensi dipotong sesuai persentase kontrak", "B"],
  ["C4-08", "Denda dihitung bila BA melewati akhir kontrak tanpa adendum aktif", "B"],
  ["C4-08a", "Pembebasan denda hanya oleh CFO, wajib alasan tertulis tersimpan", "B"],
  ["C4-09", "PPh dipotong sesuai kualifikasi SBU vendor; nilai nol wajib beralasan", "B"],
  ["C4-10", "PPN sesuai faktur pajak valid; nomor faktur dan NPWP cocok master vendor", "B"],
  ["C4-11", "Nomor invoice belum pernah dibayar", "B"],
  ["C4-12", "Rekening tujuan sama dengan rekening terdaftar vendor", "B"],
  ["C4-13", "Pencairan retensi hanya setelah masa pemeliharaan selesai dan ada BAST II", "B"],
  ["C4-14", "Realisasi kumulatif dipetakan ke item BOQ", "W"],
  ["C4-15", "Dampak ke posisi kas periode berjalan", "W"],
  ["C4-16", "Progress gap negatif besar → indikasi klaim menumpuk", "I"],
  ["C5-13", "Gambar perubahan desain dilampirkan lebih dahulu", "B"],
  ["C5-14", "Analisa dampak memuat nilai awal, delta, nilai baru, delta waktu, kumulatif %", "B"],
];

export const RULE_GROUPS: Array<[id: string, label: string, codes: string[]]> = [
  ["1", "Kelengkapan data pengajuan", ["GEN-02", "GEN-07"]],
  ["2", "Kelengkapan dokumen", ["GEN-01"]],
  ["3", "Status kontrak & komitmen", ["C4-01", "C4-03", "C4-04", "GEN-03", "GEN-04", "GEN-05", "GEN-08", "GEN-10"]],
  ["4", "Prestasi & progres fisik", ["C4-02", "C4-14", "GEN-09", "C4-16"]],
  ["5", "Adendum, jangka waktu & denda", ["C4-05", "C4-08", "C4-08a", "C5-13", "C5-14"]],
  ["6", "Validasi angka, pajak & rekening", ["C4-06", "C4-07", "C4-09", "C4-10", "C4-11", "C4-12", "C4-13", "GEN-06", "C4-15", "GEN-11"]],
];

// Tax transaction types — TAX_TX
export const TAX_TX: Array<{ code: string; label: string; rate: number; basis: string; isFinal: boolean }> = [
  { code: "JASA_KONSTRUKSI_KECIL", label: "Jasa konstruksi — kualifikasi kecil", rate: 1.75, basis: "PPh 4(2) final", isFinal: true },
  { code: "JASA_KONSTRUKSI_BESAR", label: "Jasa konstruksi — menengah / besar", rate: 2.65, basis: "PPh 4(2) final", isFinal: true },
  { code: "JASA_KONSTRUKSI_NONSERT", label: "Jasa konstruksi — tanpa sertifikasi", rate: 4, basis: "PPh 4(2) final", isFinal: true },
  { code: "JASA_LAIN", label: "Jasa lain", rate: 2, basis: "PPh 23", isFinal: false },
  { code: "SEWA_TANAH", label: "Sewa tanah / bangunan", rate: 10, basis: "PPh 4(2) final", isFinal: true },
  { code: "BARANG", label: "Pembelian barang dalam negeri", rate: 0, basis: "tanpa pemotongan PPh", isFinal: false },
  { code: "IMPOR_API", label: "Pembelian barang impor — ber-API", rate: 2.5, basis: "PPh 22 impor", isFinal: false },
  { code: "IMPOR_NONAPI", label: "Pembelian barang impor — non-API", rate: 7.5, basis: "PPh 22 impor", isFinal: false },
  { code: "ORANG_PRIBADI", label: "Jasa orang pribadi", rate: 2.5, basis: "PPh 21 progresif", isFinal: false },
];

export const PPH21_BRACKETS: Array<[ceiling: number, rate: number]> = [
  [60e6, 5], [190e6, 15], [250e6, 25], [500e6, 30], [Infinity, 35],
];

export function pph21(dpp: number): number {
  let left = Math.max(0, dpp);
  let tax = 0;
  for (const [ceiling, rate] of PPH21_BRACKETS) {
    const slice = Math.min(left, ceiling);
    tax += (slice * rate) / 100;
    left -= slice;
    if (left <= 0) break;
  }
  return tax;
}

// 11 standard project cost items (% of total budget) — COSTS
export const COST_ITEMS: Array<{ name: string; pct: number }> = [
  { name: "Land Cost", pct: 21.5 }, { name: "Infrastructure Cost", pct: 13.5 }, { name: "Built-Up Cost", pct: 33.0 },
  { name: "Professional Fees", pct: 3.0 }, { name: "Authority Cost", pct: 2.5 }, { name: "Overhead Project", pct: 4.0 },
  { name: "Overhead Cost", pct: 3.5 }, { name: "Estate Management", pct: 2.0 }, { name: "Marketing Cost", pct: 8.0 },
  { name: "Sales Commission", pct: 5.5 }, { name: "Financing Charge", pct: 3.5 },
];

export const NOTIF_RULES: Array<[trigger: string, target: string, timing: string]> = [
  ["Status pengajuan berubah", "Departemen pengaju", "Email, seketika — termasuk alasan bila dikembalikan (FR-011)"],
  ["SLA gate terlampaui", "Atasan pemegang gate", "Email, sekali sehari pukul 08:00"],
  ["Umur LOA", "Divisi Budget dan CFO", "H-7 dan H+0 masa berlaku (C2-08)"],
  ["Jaminan & retensi", "Divisi Budget", "H-30 dan H-7 sebelum kedaluwarsa"],
  ["Tautan persetujuan", "Penerima tautan", "Saat dikirim, pengingat H-2, mati pada H+7"],
  ["Siklus return ke-3", "CFO", "Seketika, sebagai isu kepatuhan departemen (§9.6)"],
];

export const PERMS: Array<[capability: string, roles: Role[]]> = [
  ["Master data — departemen, PT, proyek", ["OWNER", "HEAD_BUDGET"]],
  ["Master pengguna & peran", ["OWNER"]],
  ["Input berkas dan lampiran", ["OWNER", "HEAD_BUDGET", "ADMIN_BUDGET"]],
  ["Menjalankan Gate 3 dan rule engine", ["OWNER", "HEAD_BUDGET", "VERIFIKATOR_BUDGET"]],
  ["Menerbitkan lembar verifikasi & rekomendasi", ["OWNER", "HEAD_BUDGET", "VERIFIKATOR_BUDGET"]],
  ["Mengubah ambang batas dan tarif (jalur langsung)", ["CFO", "CEO1"]],
  ["Ekspor paket audit", ["OWNER", "HEAD_BUDGET", "VERIFIKATOR_BUDGET", "ADMIN_BUDGET"]],
  ["Menyunting log aktivitas", []],
];

// Nav sets per workspace (screen ids match app/(app)/<id> routes)
export const NAV_BUDGET = [
  "dasbor", "antrean", "verifikasi", "email", "dept", "pt", "alokasi", "perhitungan",
  "posisi", "registri", "monitor", "aging", "pajak", "lintasan", "gates", "lifecycle",
  "authority", "log", "notifikasi", "users", "settings", "fondasi",
];
export const NAV_PENGAJU = ["dasbor", "buat", "berkas", "perhitungan", "approvaldept", "gates", "log"];
export const NAV_APPROVER = ["dasbor", "keputusan", "verifikasi", "posisi", "aging", "authority", "settings", "log"];

export const SCREEN_LABEL: Record<string, string> = {
  dasbor: "Beranda", antrean: "Antrean Pengajuan", buat: "Buat Pengajuan", verifikasi: "Lembar Verifikasi",
  email: "Review lewat Email", dept: "Master Departemen", pt: "Master PT & Proyek", log: "Log Aktivitas",
  berkas: "Berkas Saya", approvaldept: "Persetujuan Departemen", keputusan: "Antrean Keputusan",
  perhitungan: "Lembar Perhitungan", posisi: "Posisi Anggaran", registri: "Registri Commitment",
  pajak: "Panel Pajak", aging: "Aging Monitor", alokasi: "Master Alokasi Budget",
  lintasan: "Lintasan Pajak & Legal", gates: "Alur Enam Gate", lifecycle: "Status Lifecycle",
  authority: "Matriks Kewenangan", monitor: "Monitoring Berkas", notifikasi: "Notifications",
  users: "User Management", settings: "Settings", fondasi: "Fondasi Desain",
};

export function navForRole(role: Role): string[] {
  const panel = ROLE_PANEL[role];
  const flags = ROLE_FLAGS[role];
  if (panel === "PENGAJU") {
    return flags.approveDept ? NAV_PENGAJU : NAV_PENGAJU.filter((s) => s !== "approvaldept");
  }
  if (panel === "APPROVER") return NAV_APPROVER;
  return NAV_BUDGET;
}
