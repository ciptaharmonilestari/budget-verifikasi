"use client";

import { useMemo, useState } from "react";
import { paymentLadder, type TaxCalc } from "@/lib/payment-ladder";
import { rupiah, pct } from "@/lib/format";

export interface WorkRow {
  name: string;
  unit: string;
  bobotPct: number; // % of total contract value, from the WORKS constant
  bobotRp: number; // contract.value * bobotPct / 100
}

/** Zeroed tax stand-in — this sheet is a BoQ/payment-ladder scratchpad
 * (DOC-04 working paper), not the tax lane. Real PPN/PPh belongs to the
 * Panel Pajak screen, which reads the live rate via `calcTax()`. */
const NO_TAX: TaxCalc = { rate: 0, ppn: 0, pph: 0, isFinal: false, basis: "" };

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/**
 * Scratch calculator — nothing here is persisted. Progres % per baris hidup
 * hanya di state komponen ini (per dc.html: "Kertas kerja ini tidak
 * mengirim apa pun"). Reload halaman akan mengembalikan semua ke 0%.
 */
export function PerhitunganCalculator({
  works,
  contractValue,
  dpPct,
  retensiPct,
  verifikasiHref,
}: {
  works: WorkRow[];
  contractValue: number;
  dpPct: number;
  retensiPct: number;
  verifikasiHref: string | null;
}) {
  const [lalu, setLalu] = useState<number[]>(() => works.map(() => 0));
  const [ini, setIni] = useState<number[]>(() => works.map(() => 0));

  const rows = useMemo(
    () =>
      works.map((w, i) => {
        const laluPct = clampPct(lalu[i] ?? 0);
        const iniPct = clampPct(ini[i] ?? 0);
        const sdIniPct = clampPct(laluPct + iniPct);
        return {
          ...w,
          laluPct,
          iniPct,
          sdIniPct,
          rupiahSdIni: (w.bobotRp * sdIniPct) / 100,
          rupiahIni: (w.bobotRp * iniPct) / 100,
        };
      }),
    [works, lalu, ini],
  );

  const priorPct = rows.reduce((sum, r) => sum + (r.bobotPct * r.laluPct) / 100, 0);
  const cumPct = rows.reduce((sum, r) => sum + (r.bobotPct * r.sdIniPct) / 100, 0);

  const ladder = paymentLadder({
    contractValue,
    priorPct,
    cumPct,
    dpPct,
    retensiPct,
    overdueDays: 0,
    tax: NO_TAX,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 10 }}>
        <table className="tbl" style={{ minWidth: 920 }}>
          <thead>
            <tr>
              <th>Uraian pekerjaan</th>
              <th>Sat</th>
              <th style={{ textAlign: "right" }}>Bobot</th>
              <th style={{ textAlign: "right" }}>Nilai (Rp)</th>
              <th style={{ textAlign: "right", width: 110 }}>s/d bln lalu %</th>
              <th style={{ textAlign: "right", width: 110 }}>Bulan ini %</th>
              <th style={{ textAlign: "right" }}>s/d bulan ini %</th>
              <th style={{ textAlign: "right" }}>Rupiah s/d ini</th>
              <th style={{ textAlign: "right" }}>Rupiah bulan ini</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.unit}</td>
                <td className="num" style={{ textAlign: "right" }}>{pct(r.bobotPct)}</td>
                <td className="num" style={{ textAlign: "right" }}>{rupiah(r.bobotRp)}</td>
                <td>
                  <input
                    className="input num"
                    type="number"
                    min={0}
                    max={100}
                    value={lalu[i] ?? 0}
                    onChange={(e) => setLalu((prev) => prev.map((v, j) => (j === i ? Number(e.target.value) : v)))}
                    style={{ textAlign: "right", padding: "5px 7px" }}
                  />
                </td>
                <td>
                  <input
                    className="input num"
                    type="number"
                    min={0}
                    max={100}
                    value={ini[i] ?? 0}
                    onChange={(e) => setIni((prev) => prev.map((v, j) => (j === i ? Number(e.target.value) : v)))}
                    style={{ textAlign: "right", padding: "5px 7px" }}
                  />
                </td>
                <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{pct(r.sdIniPct)}</td>
                <td className="num" style={{ textAlign: "right" }}>{rupiah(r.rupiahSdIni)}</td>
                <td className="num" style={{ textAlign: "right" }}>{rupiah(r.rupiahIni)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--s2)" }}>
              <td colSpan={2} style={{ fontWeight: 600 }}>Total</td>
              <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{pct(rows.reduce((s, r) => s + r.bobotPct, 0))}</td>
              <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{rupiah(rows.reduce((s, r) => s + r.bobotRp, 0))}</td>
              <td colSpan={2}></td>
              <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{pct(cumPct)}</td>
              <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{rupiah(rows.reduce((s, r) => s + r.rupiahSdIni, 0))}</td>
              <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{rupiah(rows.reduce((s, r) => s + r.rupiahIni, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card">
          <div style={{ fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 10 }}>Perhitungan pembayaran</div>
          <LedgerRow label="Progres s/d bulan lalu (bobot)" value={pct(priorPct)} />
          <LedgerRow label="Progres s/d bulan ini (bobot)" value={pct(cumPct)} />
          <LedgerRow label="Nilai bruto termin ini" value={rupiah(ladder.gross)} strong />
          <LedgerRow label="Pengembalian uang muka" value={`− ${rupiah(ladder.recoupDp)}`} />
          <LedgerRow label="Potongan retensi" value={`− ${rupiah(ladder.retensi)}`} />
          <LedgerRow label="Denda keterlambatan" value={`− ${rupiah(ladder.denda)}`} />
          <LedgerRow label="Netto dibayarkan" value={rupiah(ladder.netto)} strong />
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 10 }}>
            PPN/PPh disetel nol pada lembar ini — kertas kerja ini menghitung BoQ/tangga pembayaran, bukan pajak;
            tarif pajak sesungguhnya ditentukan di Panel Pajak sebelum berkas dikirim.
          </p>
        </div>
        <div className="card">
          <div style={{ fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 10 }}>Lanjutan</div>
          <p style={{ fontSize: 14, color: "var(--ink-2)", maxWidth: "50ch" }}>
            Kertas kerja ini tidak mengirim apa pun — tombol di bawah hanya berpindah layar ke berkas verifikasi
            terkait bila sudah ada.
          </p>
          {verifikasiHref ? (
            <a href={verifikasiHref} className="btn" style={{ marginTop: 12 }}>Buka Lembar Verifikasi</a>
          ) : (
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink-3)" }}>
              Belum ada berkas pengajuan yang tertaut ke kontrak ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LedgerRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)", fontWeight: strong ? 650 : 400 }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <span className="num" style={{ fontSize: 14 }}>{value}</span>
    </div>
  );
}
