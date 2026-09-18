"use client";

import { useActionState } from "react";
import { createCompanyAction, createProjectAction, type ActionResult } from "./actions";

export function AddCompanyForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createCompanyAction, {});

  return (
    <form action={formAction} className="grid3" style={{ alignItems: "end" }}>
      <label style={{ display: "block" }}>
        <span className="field-label">Kode PT</span>
        <input
          className="input num"
          name="code"
          placeholder="ABC"
          maxLength={5}
          required
          style={{ marginTop: 5, width: "100%", boxSizing: "border-box" }}
        />
      </label>
      <label style={{ display: "block", gridColumn: "span 2" }}>
        <span className="field-label">Nama PT</span>
        <input
          className="input"
          name="name"
          placeholder="PT Nama Lengkap"
          required
          style={{ marginTop: 5, width: "100%", boxSizing: "border-box" }}
        />
      </label>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          Tambah PT
        </button>
        {state.error && <span style={{ color: "var(--bad)", fontSize: 13 }}>{state.error}</span>}
        {state.ok && <span style={{ color: "var(--ok)", fontSize: 13 }}>PT ditambahkan.</span>}
      </div>
    </form>
  );
}

export function AddProjectForm({ companies }: { companies: Array<{ id: string; code: string; name: string }> }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createProjectAction, {});

  return (
    <form
      action={formAction}
      className="grid3"
      style={{ alignItems: "end", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}
    >
      <label style={{ display: "block" }}>
        <span className="field-label">Proyek pada PT</span>
        <select className="select" name="companyId" required style={{ marginTop: 5, width: "100%", boxSizing: "border-box" }}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "block", gridColumn: "span 2" }}>
        <span className="field-label">Nama proyek</span>
        <input
          className="input"
          name="name"
          placeholder="Nama Proyek Baru"
          required
          style={{ marginTop: 5, width: "100%", boxSizing: "border-box" }}
        />
      </label>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          Tambah proyek
        </button>
        {state.error && <span style={{ color: "var(--bad)", fontSize: 13 }}>{state.error}</span>}
        {state.ok && <span style={{ color: "var(--ok)", fontSize: 13 }}>Proyek ditambahkan.</span>}
      </div>
    </form>
  );
}
