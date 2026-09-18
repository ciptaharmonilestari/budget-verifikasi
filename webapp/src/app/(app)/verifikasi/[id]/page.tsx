import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/components/ui/Tag";
import { rupiah, idDateTime } from "@/lib/format";
import { routeGateForValue } from "@/lib/gate-routing";
import { STATUS_LABEL, formKindLabel, DOC_TYPE_LABEL } from "../../_lib/kbt-status";
import { VerifikasiSheet } from "./VerifikasiSheet.client";
import { defaultRuleResults, parseStoredRuleResults, tallyResults } from "./rule-catalog";
import type { Lane, LaneStatus } from "@/generated/prisma/client";
import type { TagLevel } from "@/components/ui/Tag";

const ALL_LANES: Lane[] = ["TAX", "LEGAL", "HRD_GA", "ACCOUNTING"];

const LANE_LABEL: Record<Lane, string> = {
  TAX: "Pajak",
  LEGAL: "Legal",
  HRD_GA: "HRD & GA",
  ACCOUNTING: "Accounting",
};

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

const VERDICT_LABEL: Record<string, string> = {
  CLEAR: "Clear",
  CLEAR_WITH_NOTES: "Clear dengan catatan",
  RETURNED: "Dikembalikan",
  REJECTED: "Ditolak",
  APPROVED: "Disetujui",
  PENDING: "Menunggu",
};

const VERDICT_TAG: Record<string, TagLevel> = {
  CLEAR: "PASS",
  CLEAR_WITH_NOTES: "WARN",
  RETURNED: "FAIL",
  REJECTED: "FAIL",
  APPROVED: "PASS",
  PENDING: "INFO",
};

export default async function VerifikasiDetailPage({ params }: PageProps<"/verifikasi/[id]">) {
  const { id } = await params;
  const user = await requireUser();

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { company: true, project: true, department: true, vendor: true, createdBy: true },
  });
  if (!submission) notFound();

  const [laneRows, latestDecision] = await Promise.all([
    prisma.laneClearance.findMany({ where: { submissionId: id } }),
    prisma.gateDecision.findFirst({
      where: { submissionId: id, gate: 3 },
      orderBy: { decidedAt: "desc" },
      include: { actor: true },
    }),
  ]);

  const laneByLane = new Map(laneRows.map((l) => [l.lane, l]));
  const laneChips = ALL_LANES.map((lane) => {
    const row = laneByLane.get(lane);
    return {
      lane,
      label: LANE_LABEL[lane],
      statusLabel: row ? LANE_STATUS_LABEL[row.status] : "Belum diperlukan",
      tagLevel: row ? LANE_STATUS_TAG[row.status] : ("NA" as TagLevel),
      note: row?.note ?? null,
    };
  });

  const canVerify = user.flags.verify && submission.status === "GATE3_BUDGET_REVIEW";
  const isOwnSubmission = submission.createdById === user.id;

  const initialResults = latestDecision ? parseStoredRuleResults(latestDecision.ruleResults) : defaultRuleResults();
  const route = await routeGateForValue(Number(submission.value));

  const identityRows: Array<[string, React.ReactNode]> = [
    ["Nomor indeks", <span className="num" key="idx">{submission.indexNo}</span>],
    ["Subjek", submission.subject],
    ["Jenis", `${formKindLabel(submission.kind)} · ${DOC_TYPE_LABEL[submission.docType]}`],
    ["Nilai diajukan", <span className="num" key="v">{rupiah(Number(submission.value))}</span>],
    ["PT", submission.company.name],
    ["Proyek", submission.project.name],
    ["Departemen", `${submission.department.name} (${submission.department.code})`],
    ["Kode anggaran", submission.costCode],
    ["Vendor", submission.vendor?.name ?? "—"],
    ["Pengaju", submission.createdBy.name],
    ["Status", STATUS_LABEL[submission.status]],
    ["Dikirim pada", idDateTime(submission.sentAt)],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Link href="/antrean" className="btn btn-ghost btn-sm">← Kembali ke Antrean Pengajuan</Link>
      </div>

      <div>
        <div className="field-label">Gate 3 · §10 lembar verifikasi &amp; rekomendasi</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Lembar Verifikasi &amp; Rekomendasi Anggaran
        </h1>
      </div>

      <div className="card">
        <div className="field-label">A · Identitas pengajuan</div>
        <div className="grid2" style={{ marginTop: 8 }}>
          {identityRows.map(([label, value]) => (
            <div key={label as string} style={{ paddingBottom: 7, borderBottom: "1px solid var(--line)" }}>
              <div className="field-label" style={{ marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div className="field-label" style={{ marginBottom: 0 }}>Klirens lintasan paralel</div>
          <span className="num" style={{ fontSize: 13, color: "var(--ink-3)" }}>{submission.indexNo}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 10, borderTop: "1px solid var(--line)" }}>
          {laneChips.map((l) => (
            <div key={l.lane} style={{ display: "grid", gridTemplateColumns: "minmax(120px,180px) minmax(0,1fr) auto", gap: "8px 16px", alignItems: "baseline", padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>{l.label}</span>
              <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{l.note ?? ""}</span>
              <Tag level={l.tagLevel}>{l.statusLabel}</Tag>
            </div>
          ))}
        </div>
      </div>

      {canVerify ? (
        <VerifikasiSheet
          submissionId={submission.id}
          initialResults={initialResults}
          isOwnSubmission={isOwnSubmission}
          authorityNote={`${route.tierBand} — rute ditentukan nilai pengajuan, bukan nilai transfer setelah potongan.`}
        />
      ) : (
        <div className="card">
          <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>
            Ringkasan untuk keputusan
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "6px 0 0", maxWidth: "76ch" }}>
            Lembar verifikasi lengkap tetap tersimpan pada berkas. Yang ditampilkan di sini hanya pokok yang diperlukan untuk memutuskan.
          </p>
          <div className="grid3" style={{ marginTop: 16 }}>
            <div>
              <div className="field-label">Verdict Gate 3</div>
              {latestDecision ? (
                <Tag level={VERDICT_TAG[latestDecision.verdict] ?? "INFO"}>{VERDICT_LABEL[latestDecision.verdict] ?? latestDecision.verdict}</Tag>
              ) : (
                <Tag level="NA">Belum diverifikasi</Tag>
              )}
            </div>
            <div>
              <div className="field-label">Hasil rule engine</div>
              <div style={{ fontSize: 14 }}>
                {(() => {
                  const results = latestDecision ? parseStoredRuleResults(latestDecision.ruleResults) : defaultRuleResults();
                  const tally = tallyResults(results);
                  return `${tally.pass} pass · ${tally.warn} warn · ${tally.fail} fail`;
                })()}
              </div>
            </div>
            <div>
              <div className="field-label">Diverifikasi oleh</div>
              <div style={{ fontSize: 14 }}>{latestDecision?.actor.name ?? "—"}</div>
            </div>
          </div>
          {latestDecision?.comment && (
            <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--s2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13.5 }}>
              <div className="field-label" style={{ marginBottom: 4 }}>Komentar terakhir</div>
              {latestDecision.comment}
            </div>
          )}
          {!canVerify && submission.status === "GATE3_BUDGET_REVIEW" && !user.flags.verify && (
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 12 }}>
              Peran Anda tidak memiliki kewenangan menjalankan Gate 3 — hanya membaca ringkasan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
