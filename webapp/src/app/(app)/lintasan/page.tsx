import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LANE_FLOW, LANE_KINDS, LANE_ORDER, LANE_SHORT_LABEL } from "./lane-kinds";
import { LaneTable, type LaneRow } from "./LaneTable.client";

export default async function LintasanPage() {
  await requireUser();

  const clearances = await prisma.laneClearance.findMany({
    include: { submission: true, updatedBy: true },
    orderBy: { updatedAt: "desc" },
  });

  const rows: LaneRow[] = clearances.map((c) => ({
    id: c.id,
    submissionId: c.submissionId,
    indexNo: c.submission.indexNo,
    subject: c.submission.subject,
    value: Number(c.submission.value),
    lane: c.lane,
    status: c.status,
    note: c.note,
    updatedByName: c.updatedBy?.name ?? null,
    updatedAt: c.updatedAt,
  }));

  const laneCounts = LANE_ORDER.map((lane) => {
    const laneRows = clearances.filter((c) => c.lane === lane);
    return {
      lane,
      total: laneRows.length,
      byStatus: {
        TERVERIFIKASI: laneRows.filter((r) => r.status === "TERVERIFIKASI").length,
        PERLU_REVISI: laneRows.filter((r) => r.status === "PERLU_REVISI").length,
        MENUNGGU: laneRows.filter((r) => r.status === "MENUNGGU").length,
        TIDAK_DIPERLUKAN: laneRows.filter((r) => r.status === "TIDAK_DIPERLUKAN").length,
      },
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">Verifikasi paralel · di luar enam gate</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Lintasan Pajak &amp; Legal
        </h1>
        <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: "8px 0 0", maxWidth: "82ch", lineHeight: 1.5 }}>
          Berkas dari pengaju masuk Divisi Budget lebih dahulu, lalu menempuh lintasan pemeriksa yang relevan sebelum
          kembali ke Divisi Budget untuk rekomendasi. Divisi Tax memvalidasi tarif, Divisi Legal menerbitkan nomor
          draft kontrak, SPK, LOA, Adendum, dan MOU, Divisi HRD / GA memeriksa pengajuan aset, dan Divisi Accounting
          mencocokkan dokumen BAPP. Keputusan Gate 4 sampai Gate 6 tidak dapat diambil sebelum lintasan yang relevan
          berstatus selesai.
        </p>
      </div>

      <div className="card">
        <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 17, letterSpacing: "-0.01em", marginBottom: 12 }}>
          Urutan lintasan berkas
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "stretch" }}>
          {LANE_FLOW.map((step, i) => (
            <div
              key={step.label + i}
              style={{
                display: "flex", gap: 10, alignItems: "baseline", padding: "10px 12px",
                background: "var(--s2)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)",
                minWidth: 150, flex: "1 1 150px",
              }}
            >
              <span className="num" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{i + 1}</span>
              <span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>{step.label}</span>
                <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-2)", marginTop: 1 }}>{step.note}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        {laneCounts.map(({ lane, total, byStatus }) => (
          <div key={lane} className="card">
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 17, letterSpacing: "-0.01em" }}>
                {LANE_KINDS[lane].label}
              </div>
              <div className="num" style={{ fontSize: 13, color: "var(--ink-3)" }}>{LANE_SHORT_LABEL[lane]}</div>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "7px 0 0", lineHeight: 1.5 }}>
              {LANE_KINDS[lane].desc}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
              <span className="tag tag-INFO">{total} berkas di lintasan</span>
              {byStatus.TERVERIFIKASI > 0 && <span className="tag tag-PASS">{byStatus.TERVERIFIKASI} terverifikasi</span>}
              {byStatus.PERLU_REVISI > 0 && <span className="tag tag-WARN">{byStatus.PERLU_REVISI} perlu revisi</span>}
              {byStatus.MENUNGGU > 0 && <span className="tag tag-INFO">{byStatus.MENUNGGU} menunggu</span>}
              {byStatus.TIDAK_DIPERLUKAN > 0 && <span className="tag tag-NA">{byStatus.TIDAK_DIPERLUKAN} tidak diperlukan</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 17, letterSpacing: "-0.01em", marginBottom: 4 }}>
          Berkas di lintasan
        </div>
        <LaneTable rows={rows} />
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 10 }}>
          {rows.length} lintasan tercatat di seluruh berkas.
        </div>
      </div>
    </div>
  );
}
