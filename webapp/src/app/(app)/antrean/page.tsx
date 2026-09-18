import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Tag } from "@/components/ui/Tag";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { rupiah } from "@/lib/format";
import { NON_TERMINAL_STATUSES, STATUS_LABEL, formKindLabel } from "../_lib/kbt-status";
import type { TagLevel } from "@/generated/prisma/client";

const TAG_ORDER: TagLevel[] = ["FAIL", "WARN", "INFO", "PASS", "NA"];

type Row = {
  id: string;
  indexNo: string;
  subject: string;
  kind: string;
  value: number;
  currentGate: number;
  status: string;
  tagLevel: TagLevel;
};

export default async function AntreanPage() {
  // requireUser() only — this screen is read/queue-only (no decisions made
  // here), so every authenticated role that has it in nav may view it.
  await requireUser();

  const submissions = await prisma.submission.findMany({
    where: { status: { in: NON_TERMINAL_STATUSES } },
    orderBy: { createdAt: "desc" },
  });

  const tagCounts = new Map<TagLevel, number>();
  for (const s of submissions) tagCounts.set(s.tagLevel, (tagCounts.get(s.tagLevel) ?? 0) + 1);

  const rows: Row[] = submissions.map((s) => ({
    id: s.id,
    indexNo: s.indexNo,
    subject: s.subject,
    kind: formKindLabel(s.kind),
    value: Number(s.value),
    currentGate: s.currentGate,
    status: STATUS_LABEL[s.status],
    tagLevel: s.tagLevel,
  }));

  const columns: DataColumn<Row>[] = [
    {
      key: "indexNo",
      header: "Nomor indeks",
      core: true,
      render: (r) => (
        <>
          <span className="num">{r.indexNo}</span>
          <span style={{ display: "block", fontSize: 13.5, color: "var(--ink-2)" }}>{r.subject}</span>
        </>
      ),
    },
    { key: "kind", header: "Jenis", render: (r) => r.kind },
    {
      key: "value",
      header: "Nilai diajukan",
      align: "right",
      core: true,
      render: (r) => <span className="num">{rupiah(r.value)}</span>,
    },
    { key: "gate", header: "Gate saat ini", render: (r) => <span className="num">Gate {r.currentGate}</span> },
    { key: "status", header: "Status", render: (r) => r.status },
    {
      key: "tagLevel",
      header: "Tag",
      core: true,
      render: (r) => <Tag level={r.tagLevel}>{r.tagLevel}</Tag>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">§6 · Antrean pengajuan</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Antrean Pengajuan
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "62ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Berkas yang belum diputuskan sepenuhnya — dari menunggu Head Departemen sampai gate terakhir sebelum disetujui atau ditolak.
        </p>
      </div>

      <div className="grid3">
        <StatCard label="Total antrean" value={rows.length} />
        {TAG_ORDER.filter((t) => tagCounts.has(t)).map((t) => (
          <StatCard
            key={t}
            label={`Tag ${t}`}
            value={tagCounts.get(t) ?? 0}
            tone={t === "FAIL" ? "bad" : t === "WARN" ? "warn" : t === "PASS" ? "ok" : undefined}
          />
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          getRowHref={(r) => `/antrean/${r.id}`}
          emptyLabel="Tidak ada berkas dalam antrean."
        />
      </div>
      <p style={{ fontSize: 14, color: "var(--ink-2)", maxWidth: "70ch" }}>
        Berkas dicatat Divisi Budget atas nama departemen pengaju. Ketuk baris untuk membuka ringkasan berkas.
      </p>
      <div>
        <Link href="/dasbor" className="btn btn-ghost btn-sm">Kembali ke beranda</Link>
      </div>
    </div>
  );
}
