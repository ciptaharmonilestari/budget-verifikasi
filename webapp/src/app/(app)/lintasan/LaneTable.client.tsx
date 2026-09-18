"use client";

import { useMemo, useState } from "react";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { Tag, type TagLevel } from "@/components/ui/Tag";
import { rupiah, idDateTime } from "@/lib/format";
import type { Lane, LaneStatus } from "@/generated/prisma/client";
import { LANE_ORDER, LANE_SHORT_LABEL } from "./lane-kinds";

export interface LaneRow {
  id: string;
  submissionId: string;
  indexNo: string;
  subject: string;
  value: number;
  lane: Lane;
  status: LaneStatus;
  note: string | null;
  updatedByName: string | null;
  updatedAt: Date;
}

const STATUS_TAG: Record<LaneStatus, TagLevel> = {
  TERVERIFIKASI: "PASS",
  PERLU_REVISI: "WARN",
  MENUNGGU: "INFO",
  TIDAK_DIPERLUKAN: "NA",
};

const STATUS_LABEL: Record<LaneStatus, string> = {
  TERVERIFIKASI: "Terverifikasi",
  PERLU_REVISI: "Perlu revisi",
  MENUNGGU: "Menunggu",
  TIDAK_DIPERLUKAN: "Tidak diperlukan",
};

const columns: DataColumn<LaneRow>[] = [
  {
    key: "idx",
    header: "No. indeks",
    core: true,
    render: (r) => (
      <div>
        <div className="num">{r.indexNo}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>{r.subject}</div>
      </div>
    ),
  },
  { key: "value", header: "Nilai", align: "right", render: (r) => <span className="num">{rupiah(r.value)}</span> },
  { key: "lane", header: "Lintasan", core: true, render: (r) => <Tag level="INFO">{LANE_SHORT_LABEL[r.lane]}</Tag> },
  { key: "status", header: "Status", core: true, render: (r) => <Tag level={STATUS_TAG[r.status]}>{STATUS_LABEL[r.status]}</Tag> },
  { key: "note", header: "Catatan", render: (r) => <span style={{ color: "var(--ink-2)" }}>{r.note ?? "—"}</span> },
  {
    key: "updated",
    header: "Pembaruan",
    render: (r) => (
      <div>
        <div style={{ fontSize: 13.5 }}>{r.updatedByName ?? "—"}</div>
        <div className="num" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{idDateTime(r.updatedAt)}</div>
      </div>
    ),
  },
];

/** Client-side tab filter over the already-fetched lane clearance rows. */
export function LaneTable({ rows }: { rows: LaneRow[] }) {
  const [filter, setFilter] = useState<Lane | "ALL">("ALL");

  const filtered = useMemo(() => (filter === "ALL" ? rows : rows.filter((r) => r.lane === filter)), [rows, filter]);

  const tabs: Array<{ id: Lane | "ALL"; label: string }> = [
    { id: "ALL", label: `Semua (${rows.length})` },
    ...LANE_ORDER.map((lane) => ({ id: lane, label: `${LANE_SHORT_LABEL[lane]} (${rows.filter((r) => r.lane === lane).length})` })),
  ];

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn btn-sm ${filter === t.id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} getRowHref={(r) => `/antrean/${r.submissionId}`} emptyLabel="Tidak ada berkas di lintasan ini." />
    </div>
  );
}
