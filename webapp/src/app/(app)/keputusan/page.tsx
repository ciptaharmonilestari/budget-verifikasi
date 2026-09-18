import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { rupiah } from "@/lib/format";
import { formKindLabel } from "../_lib/kbt-status";
import { parseStoredRuleResults, tallyResults, defaultRuleResults } from "../verifikasi/[id]/rule-catalog";
import { DecisionCard, type DecisionRow } from "./DecisionCard.client";
import type { Lane, LaneStatus, SubmissionStatus } from "@/generated/prisma/client";
import type { TagLevel } from "@/components/ui/Tag";

const ROUTE_STATUS: Record<4 | 5 | 6, SubmissionStatus> = {
  4: "GATE4_CEO_PROJECT",
  5: "GATE5_CFO",
  6: "GATE6_CEO1",
};

const GATE_LABEL: Record<4 | 5 | 6, string> = {
  4: "Gate 4 · CEO Project",
  5: "Gate 5 · CFO",
  6: "Gate 6 · CEO 1",
};

const ALL_LANES: Lane[] = ["TAX", "LEGAL", "HRD_GA", "ACCOUNTING"];
const LANE_LABEL: Record<Lane, string> = { TAX: "Pajak", LEGAL: "Legal", HRD_GA: "HRD & GA", ACCOUNTING: "Accounting" };
const LANE_STATUS_LABEL: Record<LaneStatus, string> = {
  TERVERIFIKASI: "Terverifikasi",
  PERLU_REVISI: "Perlu revisi",
  MENUNGGU: "Menunggu",
  TIDAK_DIPERLUKAN: "Tidak diperlukan",
};
const LANE_STATUS_TAG: Record<LaneStatus, TagLevel> = {
  TERVERIFIKASI: "PASS",
  PERLU_REVISI: "FAIL",
  MENUNGGU: "WARN",
  TIDAK_DIPERLUKAN: "NA",
};
const CLEARED_LANE_STATUSES: LaneStatus[] = ["TERVERIFIKASI", "TIDAK_DIPERLUKAN"];

function ageLabel(updatedAt: Date): string {
  const days = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 86400000));
  if (days === 0) return "kurang dari 1 hari";
  return `${days} hari`;
}

export default async function KeputusanPage() {
  const user = await requireRole("CEO_PROJECT", "CFO", "CEO1");
  const gate = user.flags.gate;

  if (!gate || (gate !== 4 && gate !== 5 && gate !== 6)) {
    return (
      <div className="card">
        <p>Peran Anda tidak terhubung ke gate keputusan manapun.</p>
      </div>
    );
  }

  const status = ROUTE_STATUS[gate];
  // currentGate (not routeGate) marks who the submission is awaiting right
  // now — the chain is sequential (CEO Project → CFO → CEO 1), so a
  // submission routed all the way to Gate 6 still queues at CEO Project's
  // gate 4 first.
  const submissions = await prisma.submission.findMany({
    where: { currentGate: gate, status },
    include: { company: true, project: true, department: true, vendor: true, laneClearances: true },
    orderBy: { updatedAt: "asc" },
  });

  const gate3Decisions = await prisma.gateDecision.findMany({
    where: { submissionId: { in: submissions.map((s) => s.id) }, gate: 3 },
    orderBy: { decidedAt: "desc" },
  });
  const latestGate3ById = new Map<string, (typeof gate3Decisions)[number]>();
  for (const d of gate3Decisions) {
    // gate3Decisions is ordered decidedAt desc, so the first hit per
    // submissionId is the most recent Gate 3 decision.
    if (!latestGate3ById.has(d.submissionId)) latestGate3ById.set(d.submissionId, d);
  }

  const rows: DecisionRow[] = submissions.map((s) => {
    const laneByLane = new Map(s.laneClearances.map((l) => [l.lane, l]));
    const laneChips = ALL_LANES.map((lane) => {
      const row = laneByLane.get(lane);
      return {
        lane,
        label: LANE_LABEL[lane],
        statusLabel: row ? LANE_STATUS_LABEL[row.status] : "Belum diperlukan",
        tagLevel: row ? LANE_STATUS_TAG[row.status] : ("NA" as TagLevel),
      };
    });
    const laneBlocked = s.laneClearances.some((l) => !CLEARED_LANE_STATUSES.includes(l.status));

    const decision = latestGate3ById.get(s.id);
    const ruleResults = decision ? parseStoredRuleResults(decision.ruleResults) : defaultRuleResults();
    const tally = tallyResults(ruleResults);
    const findings = ruleResults.filter((r) => r.result !== "PASS");

    return {
      id: s.id,
      indexNo: s.indexNo,
      subject: s.subject,
      kindLabel: formKindLabel(s.kind),
      value: Number(s.value),
      deptLabel: `${s.department.code} · ${s.department.name}`,
      vendorName: s.vendor?.name ?? "—",
      age: ageLabel(s.updatedAt),
      verdict: decision?.verdict ?? "PENDING",
      findingsSummary:
        findings.length === 0
          ? "Tidak ada temuan. Seluruh aturan memenuhi."
          : `${tally.warn + tally.fail} temuan — ${findings.slice(0, 3).map((f) => f.code).join(", ")}${findings.length > 3 ? ", ..." : ""}`,
      laneChips,
      laneBlocked,
    };
  });

  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
  const blockedCount = rows.filter((r) => r.laneBlocked).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">{GATE_LABEL[gate]}</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Antrean Keputusan
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "62ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Berkas yang sudah direkomendasikan Divisi Budget dan sampai di gate Anda. Setiap baris membawa hasil verifikasi berikut temuannya.
        </p>
      </div>

      <div className="grid3">
        <StatCard label="Menunggu keputusan" value={rows.length} />
        <StatCard label="Nilai total" value={<span className="num">{rupiah(totalValue)}</span>} />
        <StatCard label="Klirens belum lengkap" value={blockedCount} tone={blockedCount > 0 ? "warn" : "ok"} />
      </div>

      {rows.length === 0 && (
        <div style={{ padding: "14px 16px", background: "var(--s2)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14, color: "var(--ink-2)" }}>
          Tidak ada berkas di gate ini saat ini.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row) => (
          <DecisionCard key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
