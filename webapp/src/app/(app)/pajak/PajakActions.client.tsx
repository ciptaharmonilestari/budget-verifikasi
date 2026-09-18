"use client";

import { useActionState } from "react";
import { validateTaxAction, sendTaxEmailAction, type TaxActionState } from "./actions";

const INITIAL: TaxActionState = { ok: false, message: "" };

/** The two Div Pajak write actions for one queue row — "Sahkan tarif master" and
 * "Kirim verifikasi via email". Wrapped with useActionState so each button's own
 * confirmation (or the generated email-link URL) renders back inline. */
export function PajakActions({ submissionId }: { submissionId: string }) {
  const [validateState, validateAction, validating] = useActionState(validateTaxAction, INITIAL);
  const [emailState, emailAction, emailing] = useActionState(sendTaxEmailAction, INITIAL);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <form action={validateAction}>
          <input type="hidden" name="submissionId" value={submissionId} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={validating}>
            {validating ? "Menyimpan…" : "Sahkan tarif master"}
          </button>
        </form>
        <form action={emailAction}>
          <input type="hidden" name="submissionId" value={submissionId} />
          <button type="submit" className="btn btn-ghost btn-sm" disabled={emailing}>
            {emailing ? "Mengirim…" : "Kirim verifikasi via email"}
          </button>
        </form>
      </div>

      {validateState.message && (
        <div style={{ marginTop: 8, fontSize: 13.5, color: validateState.ok ? "var(--ok)" : "var(--bad)" }}>
          {validateState.message}
        </div>
      )}

      {emailState.message && (
        <div
          style={{
            marginTop: 8,
            padding: "9px 12px",
            background: emailState.ok ? "var(--accent-soft)" : "var(--bad-soft)",
            border: `1px solid ${emailState.ok ? "var(--accent)" : "var(--bad-line)"}`,
            borderRadius: "var(--radius-md)",
            fontSize: 14,
            color: emailState.ok ? "var(--accent-2)" : "var(--bad)",
          }}
        >
          <div>{emailState.message}</div>
          {emailState.url && (
            <div className="num" style={{ marginTop: 4, fontSize: 13, wordBreak: "break-all" }}>
              {emailState.url}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
