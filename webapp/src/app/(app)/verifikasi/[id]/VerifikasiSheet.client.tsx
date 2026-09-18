"use client";

import { useState, useTransition } from "react";
import { Tag } from "@/components/ui/Tag";
import {
  VERIFIKASI_RULE_GROUPS,
  SEVERITY_LABEL,
  SEVERITY_TAG_LEVEL,
  computeVerdict,
  tallyResults,
  type RuleResultInput,
  type RuleResultValue,
  type ComputedVerdict,
} from "./rule-catalog";
import { submitVerifikasiAction, type VerifikasiAction } from "./actions";

const RESULT_OPTIONS: RuleResultValue[] = ["PASS", "WARN", "FAIL"];

const VERDICT_BANNER: Record<ComputedVerdict, { tag: "PASS" | "WARN" | "FAIL"; label: string }> = {
  CLEAR: { tag: "PASS", label: "Clear — seluruh aturan memenuhi." },
  CLEAR_WITH_NOTES: { tag: "WARN", label: "Clear dengan catatan — ada aturan Warn yang gagal." },
  LOCKED: { tag: "FAIL", label: "Terkunci — ada aturan pengunci (Block) yang gagal (FR-220)." },
};

type ConfirmKind = Extract<VerifikasiAction, "RETURN" | "REJECT">;

export function VerifikasiSheet({
  submissionId,
  initialResults,
  isOwnSubmission,
  authorityNote,
}: {
  submissionId: string;
  initialResults: RuleResultInput[];
  isOwnSubmission: boolean;
  authorityNote: string;
}) {
  const [results, setResults] = useState<RuleResultInput[]>(initialResults);
  const [noteComment, setNoteComment] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmKind | null>(null);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const verdict = computeVerdict(results);
  const tally = tallyResults(results);
  const locked = verdict === "LOCKED";
  const banner = VERDICT_BANNER[verdict];

  function setResult(code: string, value: RuleResultValue) {
    setResults((prev) => prev.map((r) => (r.code === code ? { ...r, result: value } : r)));
  }

  function submit(action: VerifikasiAction, comment?: string) {
    setError(null);
    startTransition(async () => {
      try {
        await submitVerifikasiAction({ submissionId, ruleResults: results, action, comment });
        setConfirmAction(null);
        setReason("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal mengirim keputusan.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {isOwnSubmission && (
        <div className="card" style={{ borderColor: "var(--bad-line)", background: "var(--bad-soft)" }}>
          <strong style={{ color: "var(--bad)" }}>Anda adalah pengaju berkas ini.</strong>{" "}
          <span style={{ fontSize: 14 }}>
            Sesuai BR-09, akun penginput tidak dapat memverifikasi berkasnya sendiri — sistem akan menolak
            pengiriman keputusan ini. Minta Verifikator Budget lain untuk memprosesnya.
          </span>
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div className="field-label" style={{ marginBottom: 0 }}>B · Hasil verifikasi</div>
          <span className="num" style={{ fontSize: 13, color: "var(--ink-2)" }}>
            {tally.pass} pass · {tally.warn} warn · {tally.fail} fail
          </span>
        </div>

        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line)" }}>
          <Tag level={banner.tag}>{verdict}</Tag>
          <span style={{ marginLeft: 10, fontSize: 13.5, color: "var(--ink-2)" }}>{banner.label}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
          {VERIFIKASI_RULE_GROUPS.map((g) => (
            <details key={g.id} open style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14.5, listStyle: "revert" }}>
                <span className="num" style={{ color: "var(--ink-2)", marginRight: 8, fontSize: 13 }}>{g.id}</span>
                {g.label}
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12, paddingLeft: 4 }}>
                {g.rules.map((rule) => {
                  const current = results.find((r) => r.code === rule.code)?.result ?? "PASS";
                  return (
                    <div
                      key={rule.code}
                      style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "start" }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                          <span className="num" style={{ fontSize: 13 }}>{rule.code}</span>
                          <Tag level={SEVERITY_TAG_LEVEL[rule.severity]}>{SEVERITY_LABEL[rule.severity]}</Tag>
                        </div>
                        <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 2, lineHeight: 1.45 }}>{rule.text}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {RESULT_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            disabled={pending}
                            className={`tag tag-${opt}`}
                            style={{
                              cursor: pending ? "not-allowed" : "pointer",
                              opacity: current === opt ? 1 : 0.35,
                              border: current === opt ? "2px solid var(--ink)" : undefined,
                              font: "inherit",
                            }}
                            onClick={() => setResult(rule.code, opt)}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="field-label">F · Rekomendasi Divisi Budget</div>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "6px 0 0" }}>Kewenangan persetujuan: {authorityNote}</p>

        <label className="field-label" style={{ marginTop: 14 }} htmlFor="verif-note">Catatan untuk lembar verifikasi (opsional)</label>
        <textarea
          id="verif-note"
          className="textarea"
          rows={2}
          value={noteComment}
          onChange={(e) => setNoteComment(e.target.value)}
          disabled={pending}
          placeholder="Catatan yang ikut tersimpan pada keputusan rekomendasi..."
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending || locked || isOwnSubmission}
            onClick={() => submit("RECOMMEND", noteComment.trim() || undefined)}
          >
            Rekomendasikan ke CFO
          </button>
          <button
            type="button"
            className="btn"
            disabled={pending || locked || isOwnSubmission}
            onClick={() => submit("RECOMMEND_NOTES", noteComment.trim() || undefined)}
          >
            Rekomendasikan dengan catatan
          </button>
          {locked && (
            <div style={{ fontSize: 13, color: "var(--bad)" }}>
              Terkunci — ada aturan pengunci (Block) yang gagal (FR-220). Hanya Kembalikan atau Tolak yang tersedia.
            </div>
          )}
          <button
            type="button"
            className="btn"
            disabled={pending}
            onClick={() => setConfirmAction((v) => (v === "RETURN" ? null : "RETURN"))}
          >
            Kembalikan ke pengaju
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() => setConfirmAction((v) => (v === "REJECT" ? null : "REJECT"))}
          >
            Tolak
          </button>
        </div>

        {confirmAction && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="field-label" htmlFor="verif-reason">
              {confirmAction === "RETURN" ? "Alasan pengembalian (wajib)" : "Alasan penolakan (wajib)"}
            </label>
            <textarea
              id="verif-reason"
              className="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={pending}
              placeholder="Sebutkan rule ID yang gagal dan tindakan perbaikan yang diminta..."
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={pending || !reason.trim()}
                onClick={() => submit(confirmAction, reason.trim())}
              >
                Kirim {confirmAction === "RETURN" ? "pengembalian" : "penolakan"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setConfirmAction(null)}>
                Batal
              </button>
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 10, fontSize: 13, color: "var(--bad)" }}>{error}</div>}
      </div>
    </div>
  );
}
