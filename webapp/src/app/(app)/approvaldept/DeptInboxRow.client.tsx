"use client";

import { useState, useTransition } from "react";
import { Tag } from "@/components/ui/Tag";
import { rupiah } from "@/lib/format";
import { approveDeptAction, returnDeptAction } from "./actions";
import type { TagLevel } from "@/generated/prisma/client";

export interface DeptInboxItem {
  id: string;
  indexNo: string;
  subject: string;
  docTypeLabel: string;
  value: number;
  pengajuName: string;
  uploadedAt: string; // pre-formatted, or ISO — passed formatted from the server page
  note: string;
  needsAttention: boolean;
  tagLevel: TagLevel;
}

export function DeptInboxRow({ item }: { item: DeptInboxItem }) {
  const [pending, startTransition] = useTransition();
  const [showReturnBox, setShowReturnBox] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveDeptAction(item.id);
      if (!res.ok) setError(res.error);
    });
  }

  function handleReturn() {
    setError(null);
    startTransition(async () => {
      const res = await returnDeptAction(item.id, reason);
      if (!res.ok) setError(res.error);
      else {
        setShowReturnBox(false);
        setReason("");
      }
    });
  }

  return (
    <div className="card">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "baseline" }}>
            <span className="num" style={{ fontSize: 14 }}>{item.indexNo}</span>
            <span className="num" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{item.docTypeLabel}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, marginTop: 2 }}>{item.subject}</div>
          <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 3 }}>{item.pengajuName} · {item.uploadedAt}</div>
          {item.note && <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 6, maxWidth: "64ch" }}>{item.note}</div>}
          {item.needsAttention && (
            <div style={{ fontSize: 13, color: "var(--warn)", marginTop: 6, fontWeight: 600 }}>
              Perlu perhatian sebelum diteruskan — sudah pernah direvisi.
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="num" style={{ fontSize: 15 }}>{rupiah(item.value)}</div>
          <div style={{ marginTop: 7 }}><Tag level={item.tagLevel}>Menunggu</Tag></div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 13, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        <button type="button" className="btn btn-primary" disabled={pending} onClick={handleApprove}>
          Setujui &amp; teruskan ke Budget
        </button>
        <button type="button" className="btn" disabled={pending} onClick={() => setShowReturnBox((v) => !v)}>
          Kembalikan ke pengaju
        </button>
      </div>

      {showReturnBox && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <label className="field-label" htmlFor={`reason-${item.id}`}>Alasan pengembalian (wajib)</label>
          <textarea
            id={`reason-${item.id}`}
            className="textarea"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan apa yang perlu diperbaiki pengaju..."
          />
          <div>
            <button type="button" className="btn btn-danger btn-sm" disabled={pending || !reason.trim()} onClick={handleReturn}>
              Kirim pengembalian
            </button>
          </div>
        </div>
      )}

      {error && <div style={{ marginTop: 8, fontSize: 13, color: "var(--bad)" }}>{error}</div>}
    </div>
  );
}
