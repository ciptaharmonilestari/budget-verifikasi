"use client";

import { useState } from "react";
import { Tag } from "@/components/ui/Tag";
import { formatParamValue, U_LABEL, type ParamDef } from "@/lib/parameters";
import { idDate } from "@/lib/format";
import type { Role } from "@/generated/prisma/client";
import {
  ApproveForm, RejectForm, ProposeForm, DirectChangeForm, RevertButton, HistoryList,
  type HistoryEntry,
} from "../ParamRow.client";

export function ParamDetail({
  def, currentValue, pending, history, userRole,
}: {
  def: ParamDef;
  currentValue: string;
  pending: { id: string; proposedValue: string; proposedEffectiveDate: Date; approverRole: Role; proposedByName: string; reason: string | null } | null;
  history: HistoryEntry[];
  userRole: Role;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [changingDirect, setChangingDirect] = useState(false);

  const isOwner = userRole === def.ownerRole;
  const isDecider = pending && userRole === pending.approverRole;
  const isDirectCapable = userRole === "CFO" || userRole === "CEO1";
  const canRevert = history.some((h) => h.kind === "APPROVED" || h.kind === "PERUBAHAN_LANGSUNG");
  const blank = currentValue.trim().toLowerCase() === "belum diisi";

  return (
    <>
      <div className="card">
        <div className="field-label">{def.groupLabel}</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{def.label}</h1>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>{def.ruleId} · {U_LABEL[def.unit]}</div>

        <div style={{ marginTop: 14 }}>
          <div className="field-label">Nilai berlaku</div>
          {blank ? <Tag level="WARN">wajib dilengkapi</Tag> : <span className="num" style={{ fontSize: 20 }}>{formatParamValue(def, currentValue)}</span>}
        </div>

        {pending && (
          <div style={{ marginTop: 14, padding: 12, background: "var(--accent-soft)", borderRadius: "var(--radius-md)" }}>
            <Tag level="INFO">usulan menunggu</Tag>
            <div className="num" style={{ fontSize: 16, marginTop: 6 }}>→ {formatParamValue(def, pending.proposedValue)}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>
              oleh {pending.proposedByName} · berlaku {idDate(pending.proposedEffectiveDate)} · menunggu {pending.approverRole}
            </div>
            {pending.reason && <div style={{ fontSize: 12.5, marginTop: 6, fontStyle: "italic" }}>&ldquo;{pending.reason}&rdquo;</div>}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {isOwner && !pending && !proposing && (
            <button type="button" className="btn btn-sm" onClick={() => setProposing(true)}>Usulkan</button>
          )}
          {isDecider && !rejecting && <ApproveForm proposalId={pending!.id} />}
          {isDecider && !rejecting && (
            <button type="button" className="btn btn-sm btn-danger" onClick={() => setRejecting(true)}>Tolak</button>
          )}
          {isDirectCapable && !changingDirect && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setChangingDirect(true)}>Ubah langsung</button>
          )}
          {canRevert && <RevertButton parameterId={def.id} />}
        </div>

        {proposing && <ProposeForm def={def} onClose={() => setProposing(false)} />}
        {rejecting && pending && <RejectForm proposalId={pending.id} onClose={() => setRejecting(false)} />}
        {changingDirect && <DirectChangeForm def={def} onClose={() => setChangingDirect(false)} />}

        {!isOwner && !isDirectCapable && (
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 12 }}>
            Baca-saja di ponsel — mengusulkan hanya dari desktop. Hanya CFO dan CEO 1 yang dapat menulis dari halaman ini.
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Riwayat</h2>
        <HistoryList history={history} />
      </div>
    </>
  );
}
