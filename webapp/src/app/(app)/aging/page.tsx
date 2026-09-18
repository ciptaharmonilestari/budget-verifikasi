import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PARAM_DEFS, parseParamNumber } from "@/lib/parameters";
import { rupiah } from "@/lib/format";
import { Tag, type TagLevel } from "@/components/ui/Tag";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import type { GuaranteeKind } from "@/generated/prisma/client";

interface AgingRow {
  id: string;
  ref: string;
  who: string;
  value: number;
  age: string;
  tagLevel: TagLevel;
  action: string;
}

const TAG_ORDER: TagLevel[] = ["FAIL", "WARN", "INFO", "PASS", "NA"];

function worstTag(levels: TagLevel[]): TagLevel {
  for (const lvl of TAG_ORDER) if (levels.includes(lvl)) return lvl;
  return "NA";
}

const GUARANTEE_KIND_LABEL: Record<GuaranteeKind, string> = {
  UANG_MUKA: "Jaminan uang muka",
  PELAKSANAAN: "Jaminan pelaksanaan",
  PEMELIHARAAN: "Jaminan pemeliharaan",
};

const columns: DataColumn<AgingRow>[] = [
  { key: "ref", header: "Referensi", core: true, render: (r) => <span className="num">{r.ref}</span> },
  { key: "who", header: "Vendor / proyek", core: true, render: (r) => r.who },
  { key: "value", header: "Nilai", align: "right", render: (r) => <span className="num">{rupiah(r.value)}</span> },
  { key: "age", header: "Umur", align: "right", render: (r) => <span className="num">{r.age}</span> },
  { key: "status", header: "Status", render: (r) => <Tag level={r.tagLevel}>{r.tagLevel}</Tag> },
  { key: "action", header: "Tindakan", render: (r) => <span style={{ color: "var(--ink-2)" }}>{r.action}</span> },
];

export default async function AgingPage() {
  await requireUser();
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // --- Group 1: LOA belum dikonversi ---------------------------------------
  const loaDef = PARAM_DEFS.find((p) => p.group === "SLA_MASA_BERLAKU" && p.label === "Masa berlaku LOA");
  let loaThresholdDays = 30;
  if (loaDef) {
    const paramValue = await prisma.parameterValue.findUnique({ where: { parameterId: loaDef.id } });
    const parsed = paramValue ? parseParamNumber(paramValue.currentValue) : null;
    if (parsed !== null) loaThresholdDays = parsed;
  }

  const loaContracts = await prisma.contract.findMany({
    where: { kind: "LOA" },
    include: { vendor: true, project: true },
    orderBy: { createdAt: "asc" },
  });

  const loaRows: AgingRow[] = loaContracts.map((c) => {
    const ageDays = Math.floor((now - c.createdAt.getTime()) / DAY);
    const remaining = loaThresholdDays - ageDays;
    let tagLevel: TagLevel;
    let action: string;
    if (remaining < 0) {
      tagLevel = "FAIL";
      action = `EXPIRED — eskalasi otomatis ke CFO (C2-08); sudah melewati masa berlaku ${loaThresholdDays} hari kalender.`;
    } else if (remaining <= 7) {
      tagLevel = "WARN";
      action = `Alert H-7 aktif — segera konversi ke kontrak, sisa ${remaining} hari dari masa berlaku ${loaThresholdDays} hari.`;
    } else {
      tagLevel = "PASS";
      action = `Dalam masa berlaku, sisa ${remaining} hari.`;
    }
    return {
      id: c.id,
      ref: c.instrumentNo,
      who: `${c.vendor.name} · ${c.project.name}`,
      value: Number(c.value),
      age: `${ageDays} hari`,
      tagLevel,
      action,
    };
  });

  // --- Group 2: Retensi belum cair -----------------------------------------
  const retensiSchedules = await prisma.paymentSchedule.findMany({
    where: { label: { contains: "Retensi", mode: "insensitive" }, status: { not: "PAID" } },
    include: { contract: { include: { vendor: true, project: true } } },
  });

  const retensiRows: AgingRow[] = retensiSchedules.map((ps) => {
    const contract = ps.contract;
    const hasEnded = !!contract.endDate && contract.endDate.getTime() < now;
    const overdueDays = hasEnded ? Math.floor((now - contract.endDate!.getTime()) / DAY) : null;
    let tagLevel: TagLevel = "INFO";
    let action = "Tahan sampai BAST II dan masa pemeliharaan selesai (C4-13).";
    let age = "masa pemeliharaan";
    if (overdueDays !== null) {
      tagLevel = overdueDays > 30 ? "FAIL" : "WARN";
      age = `kontrak berakhir ${overdueDays} hari lalu`;
      action = "Kontrak sudah berakhir — retensi wajib segera diproses pencairannya setelah BAST II.";
    } else if (!contract.endDate) {
      age = "berjalan";
      action = "Bertambah setiap termin disetujui.";
    }
    return {
      id: ps.id,
      ref: contract.instrumentNo,
      who: `${contract.vendor.name} · ${contract.project.name}`,
      value: Number(ps.amount),
      age,
      tagLevel,
      action,
    };
  });

  // --- Group 3: Jaminan mendekati kedaluwarsa ------------------------------
  // Guarantee has no stored amount column, so the guaranteed value is derived
  // from the related contract: dpPct for an uang-muka guarantee, retensiPct
  // as the closest available percentage for a pelaksanaan/pemeliharaan bond.
  const guarantees = await prisma.guarantee.findMany({
    include: { contract: { include: { vendor: true } } },
    orderBy: { expiresAt: "asc" },
  });

  const guaranteeRows: AgingRow[] = guarantees.map((g) => {
    const daysLeft = Math.ceil((g.expiresAt.getTime() - now) / DAY);
    const pctBasis = g.kind === "UANG_MUKA" ? Number(g.contract.dpPct) : Number(g.contract.retensiPct);
    const value = (Number(g.contract.value) * pctBasis) / 100;
    let tagLevel: TagLevel;
    let action: string;
    if (daysLeft < 0) {
      tagLevel = "FAIL";
      action = "Sudah kedaluwarsa — proses perpanjangan atau klaim jaminan segera.";
    } else if (daysLeft <= 30) {
      tagLevel = "WARN";
      action = "Minta perpanjangan sebelum termin berikutnya diajukan.";
    } else {
      tagLevel = "PASS";
      action = `Berlaku, sisa ${daysLeft} hari.`;
    }
    return {
      id: g.id,
      ref: g.number,
      who: `${GUARANTEE_KIND_LABEL[g.kind]} · ${g.contract.vendor.name}`,
      value,
      age: daysLeft < 0 ? `H+${Math.abs(daysLeft)}` : `H-${daysLeft}`,
      tagLevel,
      action,
    };
  });

  const groups = [
    { title: "LOA belum dikonversi", en: "Unconverted awards", rows: loaRows },
    { title: "Retensi belum cair", en: "Retention held", rows: retensiRows },
    { title: "Jaminan mendekati kedaluwarsa", en: "Guarantees expiring", rows: guaranteeRows },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">FR-226 · liabilitas tak tercatat</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Aging Monitor
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "66ch", margin: "6px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Tiga sumber liabilitas tak tercatat: LOA yang belum dikonversi, retensi yang belum cair, dan jaminan yang
          mendekati kedaluwarsa.
        </p>
      </div>

      {groups.map((g) => {
        const total = g.rows.reduce((a, r) => a + r.value, 0);
        const worst = worstTag(g.rows.map((r) => r.tagLevel));
        return (
          <div key={g.title} className="card">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "10px 14px" }}>
              <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>
                {g.title}
              </div>
              <div className="field-label">{g.en}</div>
              <Tag level={worst}>{rupiah(total)}</Tag>
            </div>
            <div style={{ marginTop: 12 }}>
              <DataTable
                columns={columns}
                rows={g.rows}
                rowKey={(r) => r.id}
                emptyLabel="Tidak ada berkas pada kelompok ini."
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
