"use client";

import { useActionState, useState } from "react";
import { loginFormAction } from "@/lib/auth-actions";
import { PANELS, DEMO_USERS, ROLE_LABEL, type Panel } from "@/lib/reference-data";

export function LoginForm() {
  const [panel, setPanel] = useState<Panel>("PENGAJU");
  const [state, formAction, pending] = useActionState(loginFormAction, {});

  const demoAccounts = DEMO_USERS.filter((u) => panelOf(u.role) === panel);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <span className="field-label">Pilih ruang kerja</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PANELS.map((p) => {
            const count = DEMO_USERS.filter((u) => panelOf(u.role) === p.id).length;
            const active = panel === p.id;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setPanel(p.id)}
                className="card"
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  padding: 14,
                  borderColor: active ? "var(--accent)" : "var(--line)",
                  background: active ? "var(--accent-soft)" : "var(--surface)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: 14.5 }}>{p.label}</strong>
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{count} akun</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>{p.subtitle}</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <input type="hidden" name="panel" value={panel} />

      <div>
        <label className="field-label" htmlFor="username">Username</label>
        <input className="input" id="username" name="username" autoComplete="username" placeholder="mis. b.nugroho" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" placeholder="KbtDemo#2026" />
      </div>

      {state.error && (
        <div className="tag tag-FAIL" style={{ display: "block", padding: "10px 12px" }}>{state.error}</div>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Memproses…" : "Masuk"}
      </button>

      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
        Password akun demo: <code className="num">KbtDemo#2026</code> untuk seluruh akun. Lima kali gagal mengunci akun (FR-001).
      </div>

      <div>
        <div className="field-label">Akun demo — {PANELS.find((p) => p.id === panel)?.label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {demoAccounts.map((u) => (
            <div key={u.username} className="num" style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--line)" }}>
              <span>{u.username}</span>
              <span style={{ fontFamily: "var(--font-ui)", color: "var(--ink-3)" }}>{ROLE_LABEL[u.role]}</span>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}

function panelOf(role: (typeof DEMO_USERS)[number]["role"]): Panel {
  const map: Record<string, Panel> = {
    OWNER: "BUDGET", HEAD_BUDGET: "BUDGET", VERIFIKATOR_BUDGET: "BUDGET", ADMIN_BUDGET: "BUDGET", DIV_PAJAK: "BUDGET",
    PENGAJU: "PENGAJU", HEAD_DEPARTEMEN: "PENGAJU",
    CEO_PROJECT: "APPROVER", CFO: "APPROVER", CEO1: "APPROVER",
  };
  return map[role];
}
