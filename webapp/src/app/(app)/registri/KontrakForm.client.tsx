"use client";

import { useActionState, useEffect, useState } from "react";
import { createContractAction, type ActionState } from "./actions";

const TIPE_KOMITMEN_OPTIONS = ["SPK / Kontrak", "LOA", "MOU / PHS", "Adendum"];
const KIND_PREFIX: Record<string, string> = { "SPK / Kontrak": "SPK", LOA: "LOA", "MOU / PHS": "MOU", Adendum: "ADD" };

/** Prototype's `noKontrak` field is `auto` — no visible input, just a
 * generated placeholder shown to the user (dc.html KONTRAK_FORM). Since the
 * Contract table's `instrumentNo` is a real, unique, required column, we
 * generate a plausible value client-side (kind prefix + year + a random
 * 3-digit sequence held stable for the life of the form) and submit it via
 * a hidden field under the exact name `createContractAction` expects. */
function useAutoInstrumentNo(tipeKomitmen: string) {
  // Random values must not be computed during the initial render — that
  // would differ between the server-rendered HTML and the client's first
  // render and trigger a hydration mismatch. Generate it only after mount.
  const [seq, setSeq] = useState<string | null>(null);
  useEffect(() => {
    setSeq(String(Math.floor(100 + Math.random() * 900)));
  }, []);
  const year = new Date().getFullYear();
  if (seq === null) return "…";
  return `${KIND_PREFIX[tipeKomitmen] ?? "DOC"}-${year}-${seq}`;
}

export interface ProjectOption {
  id: string;
  label: string;
}
export interface VendorOption {
  id: string;
  name: string;
}

const initialState: ActionState = { ok: false, message: "" };

export function KontrakForm({
  projectOptions,
  vendorOptions,
}: {
  projectOptions: ProjectOption[];
  vendorOptions: VendorOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createContractAction, initialState);
  const [tipeKomitmen, setTipeKomitmen] = useState(TIPE_KOMITMEN_OPTIONS[0]);
  const [vendorMode, setVendorMode] = useState<"existing" | "baru">(vendorOptions.length > 0 ? "existing" : "baru");
  const instrumentNo = useAutoInstrumentNo(tipeKomitmen);

  return (
    <section className="card">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>Input Perjanjian / Kontrak</div>
        <div className="num" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{instrumentNo}</div>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "6px 0 0", maxWidth: "70ch" }}>
        Nomor instrumen akan dibuat otomatis saat disimpan. Lengkapi kelima bagian di bawah sesuai naskah kontrak.
      </p>

      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
        <input type="hidden" name="instrumentNo" value={instrumentNo} />

        <Fieldset title="Ringkasan kontrak">
          <SelectRow label="Proyek" name="projectId" required>
            <option value="">— pilih proyek —</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </SelectRow>
          <TextRow label="Cost code" name="costCode" placeholder="mis. STR-02" required />
          <FieldRow label="No. kontrak">
            <div style={{ padding: "6px 9px", background: "var(--s3)", border: "1px dashed var(--line-2)", borderRadius: 4, fontSize: 13.5, color: "var(--ink-2)" }}>
              akan dibuat otomatis <span className="num">({instrumentNo})</span>
            </div>
          </FieldRow>
          <DateRow label="Tanggal kontrak" name="tglKontrak" />
          <SelectRow label="Tipe kontrak" name="tipeKontrak" defaultValue="Annual Year">
            <option>Annual Year</option>
            <option>Multi Year</option>
          </SelectRow>
          <SelectRow
            label="Tipe komitmen"
            name="tipeKomitmen"
            value={tipeKomitmen}
            onChange={(e) => setTipeKomitmen(e.target.value)}
          >
            {TIPE_KOMITMEN_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </SelectRow>
          <TextRow label="Kegiatan kerja" name="kegiatan" placeholder="mis. Pekerjaan struktur Tower A" />
          <SelectRow label="Jenis kegiatan kerja" name="jenisKegiatan" defaultValue="Jasa konstruksi">
            <option>Jasa konstruksi</option>
            <option>Jasa lain</option>
            <option>Pengadaan barang</option>
            <option>Sewa</option>
          </SelectRow>
          <NumberRow label="Nilai kontrak (Rp)" name="nilaiKontrak" required min={0} />
          <SelectRow label="Mata uang" name="mataUang" defaultValue="IDR">
            <option>IDR</option>
            <option>USD</option>
            <option>SGD</option>
          </SelectRow>
          <NumberRow label="Nilai kurs" name="kurs" min={0} defaultValue={0} />
          <AreaRow label="Uraian / risalah kontrak" name="uraian" />
        </Fieldset>

        <Fieldset title="Mitra / vendor">
          <FieldRow label="Sumber mitra">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <label style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 13.5 }}>
                <input type="radio" checked={vendorMode === "existing"} onChange={() => setVendorMode("existing")} disabled={vendorOptions.length === 0} />
                Vendor terdaftar
              </label>
              <label style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 13.5 }}>
                <input type="radio" checked={vendorMode === "baru"} onChange={() => setVendorMode("baru")} />
                Mitra baru
              </label>
            </div>
          </FieldRow>
          {vendorMode === "existing" ? (
            <SelectRow label="Nama mitra" name="vendorId">
              <option value="">— pilih vendor —</option>
              {vendorOptions.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </SelectRow>
          ) : (
            <>
              <TextRow label="Nama mitra" name="mitraBaru" placeholder="mis. PT Wijaya Struktur Prima" />
              <SelectRow label="Tipe supplier" name="tipeSupplier" defaultValue="Penyedia barang dan jasa">
                <option>Penyedia barang dan jasa</option>
                <option>Penyedia jasa</option>
                <option>Penyedia barang</option>
              </SelectRow>
              <TextRow label="NPWP" name="npwp" placeholder="21.118.472.6-041.000" />
              <TextRow label="Nama bank" name="bank" />
              <TextRow label="No. rekening" name="rek" />
              <AreaRow label="Alamat mitra" name="alamat" />
            </>
          )}
        </Fieldset>

        <Fieldset title="Jangka waktu & adendum">
          <DateRow label="Tgl mulai kontrak" name="tglMulai" />
          <DateRow label="Tgl berakhir kontrak" name="tglSelesai" />
          <NumberRow label="Jangka waktu pelaksanaan (hari)" name="jwPelaksanaan" min={0} />
          <NumberRow label="Jangka waktu pemeliharaan (hari)" name="jwPemeliharaan" min={0} />
          <TextRow label="Nomor adendum" name="noAdendum" />
          <DateRow label="Tgl adendum" name="tglAdendum" />
          <DateRow label="Tgl putus kontrak" name="tglPutus" />
          <AreaRow label="Alasan putus" name="alasanPutus" />
        </Fieldset>

        <Fieldset title="Uang muka, retensi & jaminan">
          <NumberRow label="Nilai uang muka (Rp)" name="nilaiUm" min={0} defaultValue={0} />
          <NumberRow label="DP (% dari nilai kontrak)" name="dpPct" min={0} max={100} defaultValue={0} />
          <NumberRow label="Retensi (% dari nilai kontrak)" name="retensiPct" min={0} max={100} defaultValue={0} />
          <SelectRow label="Cara pembayaran" name="caraBayar" defaultValue="Bertahap (termin)">
            <option>Bertahap (termin)</option>
            <option>Sekali bayar</option>
            <option>Progres bulanan</option>
          </SelectRow>
          <SelectRow label="Cara pengembalian uang muka" name="caraKembaliUm" defaultValue="Proporsional per termin">
            <option>Proporsional per termin</option>
            <option>Sekali potong</option>
            <option>Lainnya</option>
          </SelectRow>
          <TextRow label="Bank / asuransi penjamin UM" name="penjaminUm" />
          <TextRow label="Nomor surat jaminan UM" name="noJaminanUm" />
          <DateRow label="Masa berlaku jaminan UM" name="masaJaminanUm" />
          <SelectRow label="Cara pemotongan retensi" name="potonganRetensi" defaultValue="5% per termin">
            <option>5% per termin</option>
            <option>5% pada termin akhir</option>
            <option>Tanpa retensi</option>
          </SelectRow>
          <AreaRow label="Ketentuan sanksi" name="sanksi" placeholder="Denda 1 per mil per hari keterlambatan, maksimal 5 persen dari nilai kontrak." />
        </Fieldset>

        <Fieldset title="Penanda tangan & hasil">
          <TextRow label="Penanda tangan internal" name="ttdInternal" />
          <TextRow label="Penanda tangan mitra" name="ttdMitra" />
          <TextRow label="Jenis hasil" name="jenisHasil" />
          <NumberRow label="Upah tenaga kerja (Rp)" name="upah" min={0} defaultValue={0} />
          <TextRow label="Per satuan" name="perSatuan" placeholder="pcs / hari / jam" />
        </Fieldset>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 4 }}>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan kontrak"}
          </button>
          <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
            Kontrak masuk registri berstatus Aktif begitu disimpan.
          </span>
        </div>
        {!state.ok && state.message && (
          <div style={{ padding: "9px 12px", background: "var(--bad-soft)", border: "1px solid var(--bad-line)", borderRadius: 10, fontSize: 13.5, color: "var(--bad)" }}>
            {state.message}
          </div>
        )}
      </form>
    </section>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset style={{ margin: 0, padding: "14px 16px 16px", border: "1px solid var(--line-2)", borderRadius: 10 }}>
      <legend style={{ padding: "0 7px", fontWeight: 600, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)" }}>
        {title}
      </legend>
      <div className="grid2">{children}</div>
    </fieldset>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function TextRow({ label, name, placeholder, required }: { label: string; name: string; placeholder?: string; required?: boolean }) {
  return (
    <FieldRow label={label}>
      <input className="input" type="text" name={name} placeholder={placeholder} required={required} />
    </FieldRow>
  );
}

function NumberRow({
  label, name, min, max, defaultValue, required,
}: { label: string; name: string; min?: number; max?: number; defaultValue?: number; required?: boolean }) {
  return (
    <FieldRow label={label}>
      <input className="input num" type="number" name={name} min={min} max={max} step="any" defaultValue={defaultValue} required={required} />
    </FieldRow>
  );
}

function DateRow({ label, name }: { label: string; name: string }) {
  return (
    <FieldRow label={label}>
      <input className="input" type="date" name={name} />
    </FieldRow>
  );
}

function AreaRow({ label, name, placeholder }: { label: string; name: string; placeholder?: string }) {
  return (
    <label style={{ display: "block", gridColumn: "1 / -1" }}>
      <span className="field-label">{label}</span>
      <textarea className="textarea" name={name} rows={3} placeholder={placeholder} />
    </label>
  );
}

function SelectRow({
  label, name, children, defaultValue, value, onChange, required,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
}) {
  return (
    <FieldRow label={label}>
      <select className="select" name={name} defaultValue={value === undefined ? defaultValue : undefined} value={value} onChange={onChange} required={required}>
        {children}
      </select>
    </FieldRow>
  );
}
