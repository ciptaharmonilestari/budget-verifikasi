"use client";

import { useActionState, useState } from "react";
import { createDepartmentAction, toggleDepartmentActiveAction, type ActionResult } from "./actions";

// Matches the fixed "Peran di alur" option set from the design prototype's
// add-department form (dc.html ~2228-2234) — new entries pick one of these,
// even though the 25 seeded departments carry richer free-text roleNotes.
const ROLE_NOTE_OPTIONS = [
  "Pengaju",
  "Pengaju · verifikasi teknis",
  "Pelaksana pembayaran",
  "Verifikator anggaran",
  "Penyetuju",
];

export function AddDepartmentForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createDepartmentAction, {});

  return (
    <form action={formAction} className="grid3" style={{ alignItems: "end" }}>
      <label style={{ display: "block" }}>
        <span className="field-label">Kode</span>
        <input
          className="input num"
          name="code"
          placeholder="ABC"
          maxLength={5}
          required
          style={{ marginTop: 5, width: "100%", boxSizing: "border-box" }}
        />
      </label>
      <label style={{ display: "block" }}>
        <span className="field-label">Nama departemen</span>
        <input
          className="input"
          name="name"
          placeholder="Nama Departemen"
          required
          style={{ marginTop: 5, width: "100%", boxSizing: "border-box" }}
        />
      </label>
      <label style={{ display: "block" }}>
        <span className="field-label">Peran di alur</span>
        <select className="select" name="roleNote" defaultValue={ROLE_NOTE_OPTIONS[0]} style={{ marginTop: 5, width: "100%", boxSizing: "border-box" }}>
          {ROLE_NOTE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          Tambah
        </button>
        {state.error && <span style={{ color: "var(--bad)", fontSize: 13 }}>{state.error}</span>}
        {state.ok && <span style={{ color: "var(--ok)", fontSize: 13 }}>Departemen ditambahkan.</span>}
      </div>
    </form>
  );
}

export function ToggleActiveButton({ id, active }: { id: string; active: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        className={`btn btn-sm${active ? " btn-danger" : " btn-primary"}`}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const res = await toggleDepartmentActiveAction(id);
          if (res.error) setError(res.error);
          setPending(false);
        }}
      >
        {active ? "Nonaktifkan" : "Aktifkan"}
      </button>
      {error && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}
