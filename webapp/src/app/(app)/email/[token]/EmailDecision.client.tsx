"use client";

import { useState, useTransition } from "react";
import { respondEmailApprovalAction } from "./actions";

export function EmailDecision({ token, laneBlocked }: { token: string; laneBlocked: boolean }) {
  const [comment, setComment] = useState("");
  const [showReturnBox, setShowReturnBox] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"APPROVE" | "RETURN" | null>(null);

  function submit(decision: "APPROVE" | "RETURN") {
    setError(null);
    startTransition(async () => {
      const res = await respondEmailApprovalAction(token, decision, comment.trim() || undefined);
      if (!res.ok) setError(res.error);
      else setDone(decision);
    });
  }

  if (done) {
    return (
      <div style={{ padding: "10px 12px", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 8, fontSize: 13.5 }}>
        {done === "APPROVE" ? "Disetujui." : "Dikembalikan."} Tautan ini sudah tidak berlaku lagi.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={pending || laneBlocked}
          onClick={() => submit("APPROVE")}
        >
          Setujui
        </button>
        <button
          type="button"
          className="btn"
          style={{ flex: 1 }}
          disabled={pending}
          onClick={() => setShowReturnBox((v) => !v)}
        >
          Kembalikan
        </button>
      </div>
      {laneBlocked && (
        <div style={{ fontSize: 13, color: "var(--warn)" }}>
          Setujui terkunci — klirens lintasan paralel belum lengkap.
        </div>
      )}

      {showReturnBox && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label className="field-label" htmlFor="email-return-reason">Alasan pengembalian (wajib)</label>
          <textarea
            id="email-return-reason"
            className="textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={pending}
          />
          <button type="button" className="btn btn-danger btn-sm" disabled={pending || !comment.trim()} onClick={() => submit("RETURN")}>
            Kirim pengembalian
          </button>
        </div>
      )}

      <div style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Tautan mati setelah ditekan. Setiap klik mencatat waktu dan pengguna.</div>
      {error && <div style={{ fontSize: 13, color: "var(--bad)" }}>{error}</div>}
    </div>
  );
}
