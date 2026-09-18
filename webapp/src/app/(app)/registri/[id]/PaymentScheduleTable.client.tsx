"use client";

import { useState } from "react";
import { upsertPaymentScheduleAction } from "../actions";
import { rupiah, idDate, pct } from "@/lib/format";
import { Tag } from "@/components/ui/Tag";
import type { PaymentScheduleStatus } from "@/generated/prisma/client";

export interface ScheduleRow {
  id: string;
  label: string;
  amount: number;
  status: PaymentScheduleStatus;
  paidAt: Date | null;
}

const STATUS_TAG: Record<PaymentScheduleStatus, "PASS" | "WARN" | "NA"> = { PAID: "PASS", OPEN: "WARN", PLAN: "NA" };

/**
 * `upsertPaymentScheduleAction` returns void (no ActionState), so this stays
 * a plain <form action={...}> instead of useActionState — Next.js revalidates
 * `/registri/[id]` on success and this component receives fresh `schedules`
 * props. Edit rows are closed manually via "Tutup" rather than auto-closing
 * on save, since there's no client-visible completion signal to key off of.
 */
export function PaymentScheduleTable({
  contractId,
  contractValue,
  schedules,
}: {
  contractId: string;
  contractValue: number;
  schedules: ScheduleRow[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Keterangan termin</th>
              <th style={{ textAlign: "right" }}>Nilai</th>
              <th style={{ textAlign: "right" }}>% dari kontrak</th>
              <th>Status</th>
              <th>Dibayar pada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-3)", padding: 20 }}>
                  Belum ada jadwal pembayaran.
                </td>
              </tr>
            )}
            {schedules.map((s) =>
              editingId === s.id ? (
                <EditRow key={s.id} contractId={contractId} schedule={s} onClose={() => setEditingId(null)} />
              ) : (
                <tr key={s.id}>
                  <td>{s.label}</td>
                  <td className="num" style={{ textAlign: "right" }}>{rupiah(s.amount)}</td>
                  <td className="num" style={{ textAlign: "right" }}>
                    {contractValue > 0 ? pct((s.amount / contractValue) * 100) : "—"}
                  </td>
                  <td><Tag level={STATUS_TAG[s.status]}>{s.status}</Tag></td>
                  <td className="num">{s.paidAt ? idDate(s.paidAt) : "—"}</td>
                  <td>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditingId(s.id)}>Ubah</button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {adding ? (
        <NewRowForm contractId={contractId} onClose={() => setAdding(false)} />
      ) : (
        <button type="button" className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>
          + Tambah termin
        </button>
      )}
    </div>
  );
}

function EditRow({ contractId, schedule, onClose }: { contractId: string; schedule: ScheduleRow; onClose: () => void }) {
  return (
    <tr>
      <td colSpan={6}>
        <form action={upsertPaymentScheduleAction} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", padding: "8px 0" }}>
          <input type="hidden" name="contractId" value={contractId} />
          <input type="hidden" name="id" value={schedule.id} />
          <FormField label="Keterangan">
            <input className="input" name="label" defaultValue={schedule.label} required style={{ minWidth: 200 }} />
          </FormField>
          <FormField label="Nilai (Rp)">
            <input className="input num" type="number" name="amount" min={0} step="any" defaultValue={schedule.amount} required style={{ width: 160 }} />
          </FormField>
          <FormField label="Status">
            <select className="select" name="status" defaultValue={schedule.status} style={{ width: 120 }}>
              <option value="PLAN">PLAN</option>
              <option value="OPEN">OPEN</option>
              <option value="PAID">PAID</option>
            </select>
          </FormField>
          <FormField label="Dibayar pada">
            <input className="input" type="date" name="paidAt" defaultValue={schedule.paidAt ? schedule.paidAt.toISOString().slice(0, 10) : ""} style={{ width: 150 }} />
          </FormField>
          <button type="submit" className="btn btn-sm btn-primary">Simpan</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>Tutup</button>
        </form>
      </td>
    </tr>
  );
}

function NewRowForm({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  return (
    <form
      action={upsertPaymentScheduleAction}
      style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginTop: 12, padding: 12, border: "1px solid var(--line-2)", borderRadius: 10 }}
    >
      <input type="hidden" name="contractId" value={contractId} />
      <FormField label="Keterangan">
        <input className="input" name="label" placeholder="mis. Termin 3 — progres 60%" required style={{ minWidth: 220 }} />
      </FormField>
      <FormField label="Nilai (Rp)">
        <input className="input num" type="number" name="amount" min={0} step="any" required style={{ width: 160 }} />
      </FormField>
      <FormField label="Status">
        <select className="select" name="status" defaultValue="PLAN" style={{ width: 120 }}>
          <option value="PLAN">PLAN</option>
          <option value="OPEN">OPEN</option>
          <option value="PAID">PAID</option>
        </select>
      </FormField>
      <FormField label="Dibayar pada">
        <input className="input" type="date" name="paidAt" style={{ width: 150 }} />
      </FormField>
      <button type="submit" className="btn btn-sm btn-primary">Rekam termin</button>
      <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>Batal</button>
    </form>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span className="field-label" style={{ marginBottom: 3 }}>{label}</span>
      {children}
    </label>
  );
}
