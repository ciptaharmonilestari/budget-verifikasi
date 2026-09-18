"use client";

import { useActionState, useMemo, useState } from "react";
import { moveAllocationAction, type MoveActionState } from "./actions";

export interface FileOption {
  id: string;
  label: string;
  allocationId: string;
  fromLabel: string;
}
export interface AllocOption {
  id: string;
  label: string;
}

const initialState: MoveActionState = { ok: false, message: "" };

export function MoveAllocationForm({ files, allocations }: { files: FileOption[]; allocations: AllocOption[] }) {
  const [state, formAction, pending] = useActionState<MoveActionState, FormData>(moveAllocationAction, initialState);
  const [fileId, setFileId] = useState(files[0]?.id ?? "");

  const fromLabel = useMemo(() => files.find((f) => f.id === fileId)?.fromLabel ?? "—", [files, fileId]);

  if (files.length === 0) {
    return (
      <div style={{ color: "var(--ink-3)", fontSize: 13.5 }}>
        Belum ada berkas dengan alokasi terpasang yang bisa dipindahkan.
      </div>
    );
  }

  return (
    <form action={formAction}>
      <div className="grid2" style={{ gap: "12px 20px" }}>
        <label style={{ display: "block" }}>
          <span className="field-label">Nomor indeks berkas</span>
          <select className="select" name="submissionId" value={fileId} onChange={(e) => setFileId(e.target.value)}>
            {files.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "block" }}>
          <span className="field-label">Alokasi asal</span>
          <div className="num" style={{ padding: "9px 12px", background: "var(--s2)", border: "1px dashed var(--line-2)", borderRadius: 8, fontSize: 13.5, color: "var(--ink-2)" }}>
            {fromLabel}
          </div>
        </label>
        <label style={{ display: "block" }}>
          <span className="field-label">Alokasi tujuan</span>
          <select className="select" name="toAllocId" required defaultValue="">
            <option value="" disabled>— pilih alokasi tujuan —</option>
            {allocations.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "block" }}>
          <span className="field-label">Alasan pemindahan</span>
          <input className="input" type="text" name="reason" required placeholder="mis. salah cost code — masuk MEP, bukan struktur" />
        </label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Memindahkan…" : "Pindahkan & beri tahu pengaju"}
        </button>
      </div>
      {state.message && (
        <div
          style={{
            marginTop: 12,
            padding: "9px 12px",
            borderRadius: 8,
            fontSize: 13.5,
            background: state.ok ? "var(--ok-soft)" : "var(--bad-soft)",
            border: `1px solid ${state.ok ? "var(--ok-line)" : "var(--bad-line)"}`,
            color: state.ok ? "var(--ok)" : "var(--bad)",
          }}
        >
          {state.message}
        </div>
      )}
    </form>
  );
}
