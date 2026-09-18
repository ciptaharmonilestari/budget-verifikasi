"use client";

import { useState, useTransition } from "react";
import { createEmailLinkAction } from "./actions";

export interface EligibleSubmission {
  id: string;
  indexNo: string;
  subject: string;
  currentGate: number;
}

export function CreateLinkForm({ submissions }: { submissions: EligibleSubmission[] }) {
  const [submissionId, setSubmissionId] = useState(submissions[0]?.id ?? "");
  const [gate, setGate] = useState<number>(submissions[0]?.currentGate ?? 4);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  function pickSubmission(id: string) {
    setSubmissionId(id);
    const found = submissions.find((s) => s.id === id);
    if (found) setGate(found.currentGate);
  }

  function submit() {
    setError(null);
    setCreatedToken(null);
    if (!submissionId) return;
    startTransition(async () => {
      const res = await createEmailLinkAction(submissionId, gate);
      if (!res.ok) setError(res.error);
      else setCreatedToken(res.token);
    });
  }

  if (submissions.length === 0) {
    return (
      <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
        Tidak ada berkas yang sedang menunggu keputusan di Gate 4/5/6 untuk dibuatkan tautan.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="field-label" htmlFor="link-submission">Berkas</label>
      <select
        id="link-submission"
        className="select"
        value={submissionId}
        onChange={(e) => pickSubmission(e.target.value)}
        disabled={pending}
      >
        {submissions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.indexNo} — {s.subject} (Gate {s.currentGate})
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="link-gate">Gate</label>
      <select
        id="link-gate"
        className="select"
        value={gate}
        onChange={(e) => setGate(Number(e.target.value))}
        disabled={pending}
      >
        <option value={4}>Gate 4 · CEO Project</option>
        <option value={5}>Gate 5 · CFO</option>
        <option value={6}>Gate 6 · CEO 1</option>
      </select>

      <div>
        <button type="button" className="btn btn-primary" disabled={pending || !submissionId} onClick={submit}>
          Buat tautan
        </button>
      </div>

      {createdToken && (
        <div style={{ padding: "10px 12px", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 8, fontSize: 13.5 }}>
          Tautan dibuat: <span className="num">/email/{createdToken}</span> — berlaku 7 hari, mati setelah dipakai sekali.
        </div>
      )}
      {error && <div style={{ fontSize: 13, color: "var(--bad)" }}>{error}</div>}
    </div>
  );
}
