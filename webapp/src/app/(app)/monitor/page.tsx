import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Tag } from "@/components/ui/Tag";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { rupiah, idDateTime } from "@/lib/format";
import { STATUS_LABEL, STATUS_HOLDER, DOC_TYPE_LABEL, NON_TERMINAL_STATUSES } from "../_lib/kbt-status";
import type { TagLevel } from "@/generated/prisma/client";

type Row = {
  id: string;
  indexNo: string;
  docType: string;
  subject: string;
  value: number;
  status: string;
  holder: string;
  revisionCount: number;
  pendingReasonText: string;
  updatedAt: Date;
  sentBy: string;
  inputBy: string;
  tagLevel: TagLevel;
};

export default async function MonitorPage() {
  // Divisi Budget ops-wide tracker — view-only, requireUser() is enough.
  await requireUser();

  const submissions = await prisma.submission.findMany({
    include: {
      createdBy: true,
      gateDecisions: { orderBy: { decidedAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows: Row[] = submissions.map((s) => ({
    id: s.id,
    indexNo: s.indexNo,
    docType: DOC_TYPE_LABEL[s.docType],
    subject: s.subject,
    value: Number(s.value),
    status: STATUS_LABEL[s.status],
    holder: STATUS_HOLDER[s.status],
    revisionCount: s.revisionCount,
    // No dedicated "pending reason" field on Submission — best-effort from
    // the most recent gate decision's comment (e.g. why it was returned).
    pendingReasonText: s.gateDecisions[0]?.comment ?? "",
    updatedAt: s.updatedAt,
    // The prototype tracks a separate "sender" vs "inputter" user; the
    // schema only stores one createdById, so both columns collapse to the
    // same person here (see report for this simplification).
    sentBy: s.createdBy.username,
    inputBy: s.createdBy.username,
    tagLevel: s.tagLevel,
  }));

  const totalCount = rows.length;
  const runningCount = submissions.filter((s) => NON_TERMINAL_STATUSES.includes(s.status)).length;
  const returnedCount = submissions.filter((s) => s.status === "RETURNED").length;
  const doneCount = submissions.filter((s) => s.status === "PAID" || s.status === "APPROVED").length;

  const columns: DataColumn<Row>[] = [
    {
      key: "indexNo",
      header: "No. indeks",
      core: true,
      render: (r) => (
        <>
          <span className="num">{r.indexNo}</span>
          <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)" }}>{r.docType}</span>
        </>
      ),
    },
    { key: "subject", header: "Perihal", core: true, render: (r) => r.subject },
    { key: "value", header: "Nilai", align: "right", render: (r) => <span className="num">{rupiah(r.value)}</span> },
    {
      key: "status",
      header: "Status & pemegang",
      render: (r) => (
        <>
          <Tag level={r.tagLevel}>{r.status}</Tag>
          <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-2)", marginTop: 4 }}>{r.holder}</span>
        </>
      ),
    },
    { key: "revisi", header: "Revisi", render: (r) => <span className="num">{r.revisionCount}</span> },
    {
      key: "comment",
      header: "Komentar / alasan pending",
      render: (r) => <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{r.pendingReasonText || "—"}</span>,
    },
    {
      key: "when",
      header: "Unggahan terakhir",
      render: (r) => (
        <>
          <span className="num" style={{ fontSize: 12.5 }}>{idDateTime(r.updatedAt)}</span>
          <span style={{ display: "block", color: "var(--ink-2)", marginTop: 3, fontSize: 12.5 }}>kirim {r.sentBy}</span>
          <span style={{ display: "block", color: "var(--ink-2)", fontSize: 12.5 }}>input {r.inputBy}</span>
        </>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">Divisi Budget · pemantauan</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Monitoring Berkas
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "64ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Satu baris per nomor indeks: status berjalan dan pemegang berkas, jumlah revisi, alasan pending, dan waktu unggah terakhir.
        </p>
      </div>

      <div className="grid3">
        <StatCard label="Total berkas" value={totalCount} />
        <StatCard label="Sedang berjalan" value={runningCount} />
        <StatCard label="Dikembalikan" value={returnedCount} tone={returnedCount > 0 ? "warn" : "ok"} />
        <StatCard label="Selesai" value={doneCount} tone="ok" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} getRowHref={(r) => `/antrean/${r.id}`} emptyLabel="Tidak ada berkas." />
      </div>

      <div>
        <Link href="/dasbor" className="btn btn-ghost btn-sm">Kembali ke beranda</Link>
      </div>
    </div>
  );
}
