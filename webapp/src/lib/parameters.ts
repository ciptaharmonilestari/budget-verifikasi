/**
 * Settings / Parameter register — the one editable business-rule register.
 * Definitions + starting sample values ported verbatim from SETTINGS +
 * PARAM_META in the prototype (dc.html) and cross-checked against prd.md §7.
 *
 * These ranges are explicitly marked in the UI as PERLU DIKONFIRMASI FINANCE
 * (not yet confirmed by Finance) — see ParameterCard's "belum final" badge.
 */

import type { ParamGroup, ParamUnit, Role } from "@/generated/prisma/client";

export interface ParamDef {
  id: string; // stable slug
  label: string;
  group: ParamGroup;
  groupLabel: string;
  groupNote: string;
  unit: ParamUnit;
  min?: number;
  max?: number;
  suffix?: string;
  ascendingGroup?: string;
  ascendingOrder?: number;
  ownerRole: Role;
  ruleId?: string;
  sampleValue: string;
  sortOrder: number;
}

const slug = (group: string, label: string) =>
  (group + "::" + label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

let order = 0;
function def(
  group: ParamGroup,
  groupLabel: string,
  groupNote: string,
  label: string,
  sampleValue: string,
  ruleId: string | undefined,
  ownerRole: Role,
  meta: { u: ParamUnit; min?: number; max?: number; suffix?: string; asc?: number }
): ParamDef {
  return {
    id: slug(group, label),
    label,
    group,
    groupLabel,
    groupNote,
    unit: meta.u,
    min: meta.min,
    max: meta.max,
    suffix: meta.suffix,
    ascendingGroup: meta.asc ? "tingkat-kewenangan" : undefined,
    ascendingOrder: meta.asc,
    ownerRole,
    ruleId,
    sampleValue,
    sortOrder: order++,
  };
}

const HEAD_BUDGET: Role = "HEAD_BUDGET";
const DIV_PAJAK: Role = "DIV_PAJAK";

export const PARAM_DEFS: ParamDef[] = [
  // Tingkat kewenangan — T-02
  def("TINGKAT_KEWENANGAN", "Tingkat kewenangan", "Rentang nilai dan rute penyetuju — T-02", "Batas tingkat 1", "Rp 50.000.000", "GEN-02", HEAD_BUDGET, { u: "RP", min: 0, max: 1e11, asc: 1 }),
  def("TINGKAT_KEWENANGAN", "Tingkat kewenangan", "Rentang nilai dan rute penyetuju — T-02", "Batas tingkat 2", "Rp 250.000.000", "GEN-02", HEAD_BUDGET, { u: "RP", min: 0, max: 1e11, asc: 2 }),
  def("TINGKAT_KEWENANGAN", "Tingkat kewenangan", "Rentang nilai dan rute penyetuju — T-02", "Batas tingkat 3 — CEO mulai masuk", "Rp 1.000.000.000", "GEN-02", HEAD_BUDGET, { u: "RP", min: 0, max: 1e11, asc: 3 }),
  def("TINGKAT_KEWENANGAN", "Tingkat kewenangan", "Rentang nilai dan rute penyetuju — T-02", "Batas tingkat 4", "Rp 5.000.000.000", "GEN-02", HEAD_BUDGET, { u: "RP", min: 0, max: 1e11, asc: 4 }),
  def("TINGKAT_KEWENANGAN", "Tingkat kewenangan", "Rentang nilai dan rute penyetuju — T-02", "Batas RUPS — BoD / Komisaris", "belum diisi", "GEN-02", HEAD_BUDGET, { u: "RP", min: 0, max: 1e11, asc: 5 }),

  // Tarif pajak — T-05 (Div Pajak only)
  def("TARIF_PAJAK", "Tarif pajak", "Per jenis jasa dan kualifikasi SBU — T-05", "PPN", "11%", "C4-10", DIV_PAJAK, { u: "PCT", min: 0, max: 15 }),
  def("TARIF_PAJAK", "Tarif pajak", "Per jenis jasa dan kualifikasi SBU — T-05", "PPh final jasa konstruksi — SBU K1", "1,75%", "C4-09", DIV_PAJAK, { u: "PCT", min: 0, max: 20 }),
  def("TARIF_PAJAK", "Tarif pajak", "Per jenis jasa dan kualifikasi SBU — T-05", "PPh final jasa konstruksi — SBU K2", "2,65%", "C4-09", DIV_PAJAK, { u: "PCT", min: 0, max: 20 }),
  def("TARIF_PAJAK", "Tarif pajak", "Per jenis jasa dan kualifikasi SBU — T-05", "PPh 23 jasa lain", "2,00%", "C3-10", DIV_PAJAK, { u: "PCT", min: 0, max: 20 }),

  // Ambang kontrak — T-03, T-05
  def("AMBANG_KONTRAK", "Ambang kontrak", "Uang muka, retensi, denda, adendum — T-03, T-05", "Uang muka maksimum", "20% nilai kontrak", "C1-06", HEAD_BUDGET, { u: "PCT", min: 0, max: 30, suffix: " nilai kontrak" }),
  def("AMBANG_KONTRAK", "Ambang kontrak", "Uang muka, retensi, denda, adendum — T-03, T-05", "Jaminan uang muka", "100% nilai uang muka", "C1-06", HEAD_BUDGET, { u: "TEXT" }),
  def("AMBANG_KONTRAK", "Ambang kontrak", "Uang muka, retensi, denda, adendum — T-03, T-05", "Retensi minimum", "5%", "C1-07", HEAD_BUDGET, { u: "PCT", min: 0, max: 10 }),
  def("AMBANG_KONTRAK", "Ambang kontrak", "Uang muka, retensi, denda, adendum — T-03, T-05", "Rate denda keterlambatan", "1‰ per hari", "C1-08", HEAD_BUDGET, { u: "TEXT" }),
  def("AMBANG_KONTRAK", "Ambang kontrak", "Uang muka, retensi, denda, adendum — T-03, T-05", "Plafon denda", "5% nilai kontrak", "C1-08", HEAD_BUDGET, { u: "PCT", min: 0, max: 20, suffix: " nilai kontrak" }),
  def("AMBANG_KONTRAK", "Ambang kontrak", "Uang muka, retensi, denda, adendum — T-03, T-05", "Batas kumulatif adendum", "10% nilai kontrak awal", "C5-05", HEAD_BUDGET, { u: "PCT", min: 0, max: 30, suffix: " nilai kontrak awal" }),

  // Ambang deviasi
  def("AMBANG_DEVIASI", "Ambang deviasi", "Menutup N-04 — sebelumnya setiap pembulatan rupiah ikut kena", "Deviasi terhadap OE/HPS — persen", "2%", "C1-04", HEAD_BUDGET, { u: "PCT", min: 0, max: 20 }),
  def("AMBANG_DEVIASI", "Ambang deviasi", "Menutup N-04 — sebelumnya setiap pembulatan rupiah ikut kena", "Deviasi terhadap OE/HPS — nilai", "Rp 50.000.000", "C1-04", HEAD_BUDGET, { u: "RP", min: 0, max: 1e10 }),
  def("AMBANG_DEVIASI", "Ambang deviasi", "Menutup N-04 — sebelumnya setiap pembulatan rupiah ikut kena", "Deviasi kontrak terhadap plafon LOA", "2% atau Rp 50.000.000", "C2-10", HEAD_BUDGET, { u: "TEXT" }),
  def("AMBANG_DEVIASI", "Ambang deviasi", "Menutup N-04 — sebelumnya setiap pembulatan rupiah ikut kena", "Jendela deteksi pemecahan nilai", "30 hari kalender", "GEN-08", HEAD_BUDGET, { u: "CD", min: 1, max: 180 }),

  // SLA & masa berlaku
  def("SLA_MASA_BERLAKU", "SLA & masa berlaku", "Waktu per gate dan umur instrumen", "SLA Gate 1 — kelengkapan", "1 hari kerja", "FR-221", HEAD_BUDGET, { u: "WD", min: 1, max: 30 }),
  def("SLA_MASA_BERLAKU", "SLA & masa berlaku", "Waktu per gate dan umur instrumen", "SLA Gate 2 — teknis & legal", "2 hari kerja", "FR-221", HEAD_BUDGET, { u: "WD", min: 1, max: 30 }),
  def("SLA_MASA_BERLAKU", "SLA & masa berlaku", "Waktu per gate dan umur instrumen", "SLA Gate 3 — pembayaran", "2 hari kerja", "FR-221", HEAD_BUDGET, { u: "WD", min: 1, max: 30 }),
  def("SLA_MASA_BERLAKU", "SLA & masa berlaku", "Waktu per gate dan umur instrumen", "SLA Gate 3 — kontrak & adendum", "3 hari kerja", "FR-221", HEAD_BUDGET, { u: "WD", min: 1, max: 30 }),
  def("SLA_MASA_BERLAKU", "SLA & masa berlaku", "Waktu per gate dan umur instrumen", "SLA Treasury check", "1 hari kerja", "FR-221", HEAD_BUDGET, { u: "WD", min: 1, max: 30 }),
  def("SLA_MASA_BERLAKU", "SLA & masa berlaku", "Waktu per gate dan umur instrumen", "Masa berlaku LOA", "30 hari kalender", "C2-03", HEAD_BUDGET, { u: "CD", min: 7, max: 180 }),
  def("SLA_MASA_BERLAKU", "SLA & masa berlaku", "Waktu per gate dan umur instrumen", "Masa berlaku tautan email", "7 hari, pengingat H-2", "FR-002c", HEAD_BUDGET, { u: "TEXT" }),
  def("SLA_MASA_BERLAKU", "SLA & masa berlaku", "Waktu per gate dan umur instrumen", "Timeout sesi tanpa aktivitas", "30 menit", "FR-001", HEAD_BUDGET, { u: "MIN", min: 5, max: 120 }),
  def("SLA_MASA_BERLAKU", "SLA & masa berlaku", "Waktu per gate dan umur instrumen", "Maksimum siklus pengembalian", "2 siklus", "FR-221", HEAD_BUDGET, { u: "CYCLE", min: 1, max: 5 }),
];

export const PARAM_BY_ID = new Map(PARAM_DEFS.map((p) => [p.id, p]));

export const U_LABEL: Record<ParamUnit, string> = {
  RP: "rupiah", PCT: "persen", WD: "hari kerja", CD: "hari kalender", MIN: "menit", CYCLE: "siklus", TEXT: "teks bebas",
};

/** Parses a loosely-formatted Indonesian number string ("Rp 1.500.000", "2,65%") to a plain number. */
export function parseParamNumber(raw: string): number | null {
  const t = raw
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = parseFloat(t);
  return Number.isNaN(n) ? null : n;
}

export function formatParamValue(def: ParamDef, raw: string): string {
  if (def.unit === "TEXT") return raw.trim();
  const n = parseParamNumber(raw);
  if (n === null) return raw.trim();
  const num = (x: number) => x.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  switch (def.unit) {
    case "RP": return "Rp " + num(n);
    case "PCT": return num(n) + "%" + (def.suffix ?? "");
    case "WD": return num(n) + " hari kerja";
    case "CD": return num(n) + " hari kalender";
    case "MIN": return num(n) + " menit";
    case "CYCLE": return num(n) + " siklus";
    default: return raw.trim();
  }
}

export function paramRangeHint(def: ParamDef): string {
  if (def.unit === "TEXT" || def.min === undefined || def.max === undefined) return "teks bebas — tidak divalidasi";
  const num = (x: number) => x.toLocaleString("id-ID");
  if (def.unit === "RP") return "Rp " + num(def.min) + " – Rp " + num(def.max);
  if (def.unit === "PCT") return def.min + "% – " + def.max + "%";
  return def.min + " – " + def.max + " " + U_LABEL[def.unit];
}

/** CFO approves by default; escalates to CEO 1 when a rupiah-valued parameter exceeds Rp 5B (mirrors the submission authority matrix). */
export function paramApproverRole(def: ParamDef, raw: string): Role {
  if (def.unit === "RP") {
    const n = parseParamNumber(raw);
    if (n !== null && n > 5e9) return "CEO1";
  }
  return "CFO";
}

export interface ParamValidationContext {
  /** current effective (or proposed) numeric values of every parameter in the same ascendingGroup, keyed by ascendingOrder */
  ascendingValues?: Map<number, number>;
}

export function validateParamValue(def: ParamDef, raw: string, ctx?: ParamValidationContext): string {
  const s = raw.trim();
  if (!s) return "Nilai wajib diisi.";
  if (def.unit === "TEXT") return "";
  const n = parseParamNumber(s);
  if (n === null) return "Masukkan angka.";
  if (def.min !== undefined && def.max !== undefined && (n < def.min || n > def.max)) {
    return "Di luar rentang " + paramRangeHint(def) + ".";
  }
  if (def.ascendingGroup && ctx?.ascendingValues) {
    const order = def.ascendingOrder ?? 0;
    const prev = ctx.ascendingValues.get(order - 1);
    if (prev !== undefined && n <= prev) {
      const prevDef = PARAM_DEFS.find((p) => p.ascendingGroup === def.ascendingGroup && p.ascendingOrder === order - 1);
      return `Harus lebih besar dari ${prevDef?.label ?? "batas sebelumnya"} (${formatParamValue(def, String(prev))}).`;
    }
    const next = ctx.ascendingValues.get(order + 1);
    if (next !== undefined && n >= next) {
      const nextDef = PARAM_DEFS.find((p) => p.ascendingGroup === def.ascendingGroup && p.ascendingOrder === order + 1);
      return `Harus lebih kecil dari ${nextDef?.label ?? "batas berikutnya"} (${formatParamValue(def, String(next))}).`;
    }
  }
  return "";
}

/** Resolves the 5 authority-tier parameter ids (by their ascending order 1-5), for use by the gate-routing engine. */
export function authorityTierIds() {
  const byOrder = (n: number) =>
    PARAM_DEFS.find((p) => p.ascendingGroup === "tingkat-kewenangan" && p.ascendingOrder === n)!.id;
  return {
    tier1: byOrder(1),
    tier2: byOrder(2),
    tier3: byOrder(3),
    tier4: byOrder(4),
    rups: byOrder(5),
  };
}
