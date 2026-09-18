"use client";

import { useActionState, useMemo, useState } from "react";
import { createSubmissionAction, type ActionResult } from "./actions";
import { FORM_KINDS, TAX_TX } from "@/lib/reference-data";
import { Icon } from "@/components/Icon";

interface CompanyOpt { id: string; code: string; name: string; projects: { id: string; name: string }[] }
interface DeptOpt { id: string; code: string; name: string }
interface VendorOpt { id: string; name: string; npwp: string | null }
interface ContractOpt { id: string; instrumentNo: string; vendorName: string; projectName: string }

export function BuatPengajuanForm({
  companies, departments, vendors, contracts, defaultDari,
}: {
  companies: CompanyOpt[];
  departments: DeptOpt[];
  vendors: VendorOpt[];
  contracts: ContractOpt[];
  defaultDari: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createSubmissionAction, {});
  const [kind, setKind] = useState("BIAYA");
  // Default to the first company that actually has projects — several seeded
  // PTs (holding companies with no active projects yet) have an empty
  // project list, which would otherwise leave the required Proyek select
  // with no options to choose from.
  const [companyId, setCompanyId] = useState(
    (companies.find((c) => c.projects.length > 0) ?? companies[0])?.id ?? ""
  );
  const [useTax, setUseTax] = useState(false);
  const [pnjSubtype, setPnjSubtype] = useState("SPK");

  const company = useMemo(() => companies.find((c) => c.id === companyId), [companies, companyId]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <input type="hidden" name="kind" value={kind} />

      <section className="card">
        <div className="field-label" style={{ marginBottom: 10 }}>Jenis berkas</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
          {FORM_KINDS.map((k) => (
            <button
              key={k.code}
              type="button"
              onClick={() => setKind(k.code)}
              className="card"
              style={{
                textAlign: "left", cursor: "pointer", padding: 12,
                borderColor: kind === k.code ? "var(--accent)" : "var(--line)",
                background: kind === k.code ? "var(--accent-soft)" : "var(--surface)",
              }}
            >
              <strong style={{ fontSize: 13.5 }}>{k.label}</strong>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>{k.docType}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="field-label" style={{ marginBottom: 10 }}>Identitas pengajuan</div>
        <div className="grid2">
          <div>
            <label className="field-label">Perusahaan (PT)</label>
            <select className="select" name="companyDisplay" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Proyek</label>
            <select className="select" name="projectId" required>
              {company?.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Departemen pengaju</label>
            <select className="select" name="departmentId" required>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Cost code / WBS</label>
            <input className="input" name="costCode" required placeholder="mis. STR-02" />
          </div>
          <div>
            <label className="field-label">Perihal / judul berkas</label>
            <input className="input" name="subject" required placeholder="mis. Termin 3 struktur Tower A" />
          </div>
          <div>
            <label className="field-label">Nilai diajukan (Rp)</label>
            <input className="input num" name="value" type="number" min={1} required />
          </div>
        </div>
      </section>

      {kind === "PNJ" && (
        <section className="card">
          <div className="field-label" style={{ marginBottom: 10 }}>Detail IOM Penunjukan</div>
          <div className="grid2">
            <div>
              <label className="field-label">Sub-tipe</label>
              <select className="select" name="pnjSubtype" value={pnjSubtype} onChange={(e) => setPnjSubtype(e.target.value)}>
                <option value="SPK">SPK / Kontrak</option>
                <option value="LOA">Letter of Award</option>
                <option value="ADD">Adendum</option>
              </select>
            </div>
            {pnjSubtype === "LOA" && (
              <div>
                <label className="field-label">Masa berlaku LOA (hari)</label>
                <input className="input" name="masaBerlaku" type="number" defaultValue={30} />
              </div>
            )}
          </div>
        </section>
      )}
      {kind === "BAYAR" && (
        <section className="card">
          <div className="field-label" style={{ marginBottom: 10 }}>Detail IOM Payment (BAPP)</div>
          <div className="grid2">
            <div>
              <label className="field-label">Kontrak</label>
              <select className="select" name="contractId">
                <option value="">— pilih kontrak —</option>
                {contracts.map((c) => <option key={c.id} value={c.id}>{c.instrumentNo} · {c.vendorName} · {c.projectName}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Termin ke-</label>
              <input className="input" name="termin" type="number" min={1} defaultValue={1} />
            </div>
          </div>
        </section>
      )}
      {kind === "BIAYA" && (
        <section className="card">
          <label className="field-label">Tipe biaya</label>
          <select className="select" name="biayaType" style={{ maxWidth: 260 }}>
            <option value="ADV">Advance</option>
            <option value="RMB">Reimbursement</option>
            <option value="KLM">Klaim Biaya</option>
          </select>
        </section>
      )}
      {kind === "PTG" && (
        <section className="card">
          <label className="field-label">Referensi IOM Advance</label>
          <input className="input" name="advanceRef" placeholder="mis. SBL-BioDistrict-100288" />
        </section>
      )}
      {kind === "DPH" && (
        <section className="card">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" name="repeatOrder" /> Repeat order (harga sama seperti DPH sebelumnya)
          </label>
        </section>
      )}
      {kind === "PO" && (
        <section className="card">
          <label className="field-label">Channel pembelian</label>
          <select className="select" name="channel" style={{ maxWidth: 260 }}>
            <option value="OFFLINE">Offline</option>
            <option value="ONLINE">Online</option>
          </select>
        </section>
      )}
      {kind === "FIN" && (
        <section className="card">
          <label className="field-label">Referensi PO</label>
          <input className="input" name="poRef" placeholder="mis. PO-2026-0121" />
        </section>
      )}

      <section className="card">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: useTax ? 12 : 0 }}>
          <input type="checkbox" checked={useTax} onChange={(e) => setUseTax(e.target.checked)} /> Berkas ini melibatkan vendor &amp; perlu verifikasi pajak
        </label>
        {useTax && (
          <div className="grid2">
            <div>
              <label className="field-label">Vendor</label>
              <select className="select" name="vendorId">
                <option value="">— pilih vendor —</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}{v.npwp ? "" : " (tanpa NPWP)"}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Jenis transaksi pajak</label>
              <select className="select" name="taxTxTypeCode">
                {TAX_TX.map((t) => <option key={t.code} value={t.code}>{t.label} — {t.rate}%</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="field-label" style={{ marginBottom: 10 }}>Dokumen pendukung</div>
        {["Invoice/Kuitansi", "Dokumen pendukung", "NPWP vendor"].map((label, i) => (
          <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 6 }}>
            <input type="checkbox" name={`doc_${i}`} /> {label}
          </label>
        ))}
      </section>

      <section className="card">
        <div className="field-label" style={{ marginBottom: 10 }}>Naskah memo</div>
        <div className="grid2">
          <div>
            <label className="field-label">Kepada</label>
            <input className="input" name="kepada" placeholder="mis. Bp. CEO Project" />
          </div>
          <div>
            <label className="field-label">Dari</label>
            <input className="input" name="dari" defaultValue={defaultDari} />
          </div>
          <div>
            <label className="field-label">Tanggal</label>
            <input className="input" name="tanggal" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="field-label">Perihal (kosongkan = ikut judul di atas)</label>
            <input className="input" name="perihal" />
          </div>
        </div>
        <label className="field-label" style={{ marginTop: 10, display: "block" }}>Isi naskah</label>
        <textarea className="textarea" name="isi" rows={4} />
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 8 }}>
          Kolom tanda tangan diterbitkan otomatis dari matriks kewenangan saat berkas dikirim.
        </div>
      </section>

      {state.error && <div className="tag tag-FAIL" style={{ display: "block", padding: "10px 12px" }}>{state.error}</div>}

      <div className="hideNarrow" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          <Icon name="buat" size={16} /> {pending ? "Mengirim…" : "Kirim ke antrean"}
        </button>
      </div>

      {/* Sticky bottom action bar on mobile (≤900px), per PRD §9 long-form pattern. */}
      <div className="onlyNarrow mobileBar" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Nomor indeks terbit saat dikirim</span>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Mengirim…" : "Kirim"}
        </button>
      </div>
    </form>
  );
}
