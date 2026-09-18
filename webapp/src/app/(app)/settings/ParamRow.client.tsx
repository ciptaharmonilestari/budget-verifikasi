"use client";

import { useActionState, useState } from "react";
import { Tag } from "@/components/ui/Tag";
import { SlideOver } from "@/components/ui/SlideOver";
import { formatParamValue, paramRangeHint, U_LABEL, type ParamDef } from "@/lib/parameters";
import { idDate, idDateTime } from "@/lib/format";
import type { Role } from "@/generated/prisma/client";
import {
  proposeParameterAction, decideParameterAction, directChangeParameterAction,
  revertParameterAction, type ActionResult,
} from "./actions";

export interface HistoryEntry {
  id: string; kind: string; fromValue: string | null; toValue: string | null;
  byName: string; at: Date; effectiveDate: Date | null; reason: string | null;
}

export interface ParamRowData {
  def: ParamDef;
  currentValue: string;
  effectiveDate: Date;
  blank: boolean;
  pending: {
    id: string; proposedValue: string; proposedEffectiveDate: Date;
    approverRole: Role; proposedByName: string; reason: string | null;
  } | null;
  history: HistoryEntry[];
}

const HISTORY_KIND_LABEL: Record<string, string> = {
  PROPOSED: "Usulan diajukan", APPROVED: "Usulan disetujui", REJECTED: "Usulan ditolak",
  PERUBAHAN_LANGSUNG: "Perubahan langsung", DIKEMBALIKAN: "Dikembalikan",
};

export function ParamRow({ row, userRole }: { row: ParamRowData; userRole: Role }) {
  const { def } = row;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [changingDirect, setChangingDirect] = useState(false);

  const isOwner = userRole === def.ownerRole;
  const isDecider = row.pending && userRole === row.pending.approverRole;
  const isDirectCapable = userRole === "CFO" || userRole === "CEO1";
  const canRevert = row.history.some((h) => h.kind === "APPROVED" || h.kind === "PERUBAHAN_LANGSUNG");

  const displayValue = formatParamValue(def, row.currentValue);

  return (
    <>
      {/* Desktop row */}
      <tr className="rowDesktop">
        <td>
          <div style={{ fontWeight: 600 }}>{def.label}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{def.ruleId} · {U_LABEL[def.unit]}</div>
        </td>
        <td>
          {row.blank ? (
            <Tag level="WARN">wajib dilengkapi</Tag>
          ) : (
            <span className="num">{displayValue}</span>
          )}
          {row.pending && (
            <div style={{ marginTop: 6 }}>
              <Tag level="INFO">usulan menunggu</Tag>
              <div className="num" style={{ fontSize: 13, marginTop: 4 }}>
                → {formatParamValue(def, row.pending.proposedValue)}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                oleh {row.pending.proposedByName} · berlaku {idDate(row.pending.proposedEffectiveDate)} · {row.pending.approverRole}
              </div>
            </div>
          )}
        </td>
        <td style={{ minWidth: 260 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {isOwner && !row.pending && !proposing && (
              <button type="button" className="btn btn-sm" onClick={() => setProposing(true)}>Usulkan</button>
            )}
            {isDecider && !rejecting && (
              <ApproveForm proposalId={row.pending!.id} />
            )}
            {isDecider && !rejecting && (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => setRejecting(true)}>Tolak</button>
            )}
            {isDirectCapable && !changingDirect && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setChangingDirect(true)}>Ubah langsung</button>
            )}
            {canRevert && (
              <RevertButton parameterId={def.id} />
            )}
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setHistoryOpen(true)}>Riwayat ({row.history.length})</button>
          </div>

          {proposing && <ProposeForm def={def} onClose={() => setProposing(false)} />}
          {rejecting && row.pending && <RejectForm proposalId={row.pending.id} onClose={() => setRejecting(false)} />}
          {changingDirect && <DirectChangeForm def={def} onClose={() => setChangingDirect(false)} />}
        </td>
      </tr>

      {/* Mobile summary row */}
      <MobileRow row={row} userRole={userRole} />

      <SlideOver open={historyOpen} onClose={() => setHistoryOpen(false)} title={`Riwayat — ${def.label}`}>
        <HistoryList history={row.history} />
      </SlideOver>
    </>
  );
}

function MobileRow({ row, userRole }: { row: ParamRowData; userRole: Role }) {
  const { def } = row;
  const canWriteMobile = userRole === "CFO" || userRole === "CEO1";
  return (
    <tr className="rowMobile" data-tappable={canWriteMobile ? "" : undefined}>
      <td colSpan={3}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{def.label}</div>
            <div className="num" style={{ fontSize: 13, marginTop: 2 }}>
              {row.blank ? <Tag level="WARN">wajib dilengkapi</Tag> : formatParamValue(def, row.currentValue)}
            </div>
            {row.pending && <div style={{ marginTop: 4 }}><Tag level="INFO">usulan menunggu</Tag></div>}
          </div>
          {canWriteMobile ? (
            <a href={`/settings/${def.id}`} className="btn btn-sm">Ubah</a>
          ) : (
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", maxWidth: 140, textAlign: "right" }}>
              Baca-saja di ponsel — mengusulkan dari desktop
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

export function ApproveForm({ proposalId }: { proposalId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(decideParameterAction, {});
  return (
    <form action={formAction} style={{ display: "inline" }}>
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="decision" value="APPROVE" />
      <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>Setujui</button>
      {state.error && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 4 }}>{state.error}</div>}
    </form>
  );
}

export function RejectForm({ proposalId, onClose }: { proposalId: string; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(decideParameterAction, {});
  return (
    <form action={formAction} className="card" style={{ marginTop: 8, padding: 12 }}>
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="decision" value="REJECT" />
      <label className="field-label">Alasan penolakan (wajib)</label>
      <textarea className="textarea" name="reason" rows={2} required />
      {state.error && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 4 }}>{state.error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" className="btn btn-sm btn-danger" disabled={pending}>Kirim penolakan</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>Batal</button>
      </div>
    </form>
  );
}

export function ProposeForm({ def, onClose }: { def: ParamDef; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(proposeParameterAction, {});
  return (
    <form action={formAction} className="card" style={{ marginTop: 8, padding: 12 }}>
      <input type="hidden" name="parameterId" value={def.id} />
      <label className="field-label">Nilai baru ({paramRangeHint(def)})</label>
      <input className="input" name="newValue" required defaultValue={def.sampleValue} />
      <label className="field-label" style={{ marginTop: 8 }}>Tanggal mulai berlaku</label>
      <input className="input" name="effectiveDate" type="date" required />
      <label className="field-label" style={{ marginTop: 8 }}>Dasar usulan (wajib)</label>
      <textarea className="textarea" name="reason" rows={2} required />
      {state.error && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 4 }}>{state.error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>Simpan usulan</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>Batal</button>
      </div>
    </form>
  );
}

export function DirectChangeForm({ def, onClose }: { def: ParamDef; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(directChangeParameterAction, {});
  return (
    <form action={formAction} className="card" style={{ marginTop: 8, padding: 12, borderColor: "var(--warn-line)" }}>
      <input type="hidden" name="parameterId" value={def.id} />
      <div style={{ fontSize: 12.5, color: "var(--warn)", marginBottom: 6 }}>Perubahan langsung — tercatat di riwayat, tanpa usulan.</div>
      <label className="field-label">Nilai baru ({paramRangeHint(def)})</label>
      <input className="input" name="newValue" required defaultValue={def.sampleValue} />
      <label className="field-label" style={{ marginTop: 8 }}>Alasan (wajib)</label>
      <textarea className="textarea" name="reason" rows={2} required />
      {state.error && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 4 }}>{state.error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>Simpan perubahan</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>Batal</button>
      </div>
    </form>
  );
}

export function RevertButton({ parameterId }: { parameterId: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-sm btn-ghost"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await revertParameterAction(parameterId);
        setPending(false);
      }}
    >
      Kembalikan
    </button>
  );
}

export function HistoryList({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return <div style={{ color: "var(--ink-3)", fontSize: 13.5 }}>Belum ada riwayat.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {history.map((h) => (
        <div key={h.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong style={{ fontSize: 13.5 }}>{HISTORY_KIND_LABEL[h.kind] ?? h.kind}</strong>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{idDateTime(h.at)}</span>
          </div>
          <div className="num" style={{ fontSize: 13, marginTop: 4 }}>
            {h.fromValue ?? "—"} → {h.toValue ?? "—"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>
            {h.byName}{h.effectiveDate ? ` · berlaku ${idDate(h.effectiveDate)}` : ""}
          </div>
          {h.reason && <div style={{ fontSize: 12.5, marginTop: 4, fontStyle: "italic" }}>&ldquo;{h.reason}&rdquo;</div>}
        </div>
      ))}
    </div>
  );
}
