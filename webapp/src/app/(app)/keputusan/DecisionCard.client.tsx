"use client";

import { useState, useTransition } from "react";
import { Tag } from "@/components/ui/Tag";
import { rupiah } from "@/lib/format";
import { decideAction } from "./actions";
import type { GateVerdict, Lane } from "@/generated/prisma/client";
import type { TagLevel } from "@/components/ui/Tag";

const VERDICT_LABEL: Record<GateVerdict, string> = {
  CLEAR: "Clear",
  CLEAR_WITH_NOTES: "Clear dengan catatan",
  RETURNED: "Dikembalikan",
  REJECTED: "Ditolak",
  APPROVED: "Disetujui",
  PENDING: "Menunggu",
};

const VERDICT_TAG: Record<GateVerdict, TagLevel> = {
  CLEAR: "PASS",
  CLEAR_WITH_NOTES: "WARN",
  RETURNED: "FAIL",
  REJECTED: "FAIL",
  APPROVED: "PASS",
  PENDING: "INFO",
};

export interface DecisionRow {
  id: string;
  indexNo: string;
  subject: string;
  kindLabel: string;
  value: number;
  deptLabel: string;
  vendorName: string;
  age: string;
  verdict: GateVerdict;
  findingsSummary: string;
  laneChips: Array<{ lane: Lane; label: string; statusLabel: string; tagLevel: TagLevel }>;
  laneBlocked: boolean;
}

export function DecisionCard({ row }: { row: DecisionRow }) {
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReasonFor, setShowReasonFor] = useState<"RETURN" | "REJECT" | null>(null);

  function submit(decision: "APPROVE" | "RETURN" | "REJECT") {
    setError(null);
    startTransition(async () => {
      const res = await decideAction(row.id, decision, comment.trim() || undefined);
      if (!res.ok) setError(res.error);
      else {
        setShowReasonFor(null);
        setComment("");
      }
    });
  }

  return (
    <div className="card">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "baseline" }}>
            <span className="num" style={{ fontSize: 14 }}>{row.indexNo}</span>
            <span className="num" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{row.kindLabel}</span>
          </div>
          <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 600, fontSize: 16, marginTop: 2 }}>{row.subject}</div>
          <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 3 }}>
            {row.deptLabel} · {row.vendorName} · antre {row.age}
          </div>
          <div style={{ fontSize: 13.5, marginTop: 6, color: "var(--ink-2)" }}>{row.findingsSummary}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
            {row.laneChips.map((c) => (
              <Tag key={c.lane} level={c.tagLevel}>{c.label}: {c.statusLabel}</Tag>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="num" style={{ fontSize: 15 }}>{rupiah(row.value)}</div>
          <div style={{ marginTop: 7 }}>
            <Tag level={VERDICT_TAG[row.verdict]}>{VERDICT_LABEL[row.verdict]}</Tag>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 13, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        <label className="field-label" htmlFor={`comment-${row.id}`}>Komentar (opsional, terbawa pada keputusan)</label>
        <textarea
          id={`comment-${row.id}`}
          className="textarea"
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={pending}
          placeholder="Komentar untuk pengaju dan Divisi Budget..."
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
        {row.laneBlocked ? (
          <span
            title="Klirens lintasan paralel belum lengkap"
            style={{ padding: "9px 16px", border: "1px dashed var(--line-2)", borderRadius: 10, fontSize: 14, color: "var(--ink-3)" }}
          >
            Setujui — terkunci sampai klirens lengkap
          </span>
        ) : (
          <button type="button" className="btn btn-primary" disabled={pending} onClick={() => submit("APPROVE")}>
            Setujui
          </button>
        )}

        <button
          type="button"
          className="btn"
          disabled={pending}
          onClick={() => setShowReasonFor((v) => (v === "RETURN" ? null : "RETURN"))}
        >
          Kembalikan
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={pending}
          onClick={() => setShowReasonFor((v) => (v === "REJECT" ? null : "REJECT"))}
        >
          Tolak
        </button>
      </div>

      {showReasonFor && (
        <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-2)" }}>
          {comment.trim() ? (
            <button
              type="button"
              className="btn btn-sm"
              disabled={pending}
              onClick={() => submit(showReasonFor)}
            >
              Kirim {showReasonFor === "RETURN" ? "pengembalian" : "penolakan"} dengan komentar di atas
            </button>
          ) : (
            <span>Isi kolom komentar di atas sebagai alasan wajib sebelum {showReasonFor === "RETURN" ? "mengembalikan" : "menolak"}.</span>
          )}
        </div>
      )}

      {error && <div style={{ marginTop: 8, fontSize: 13, color: "var(--bad)" }}>{error}</div>}
    </div>
  );
}
