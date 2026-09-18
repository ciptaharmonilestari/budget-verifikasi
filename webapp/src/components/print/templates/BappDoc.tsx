import { PrintLetterhead, PrintRule, PrintStamp } from "../PrintLetterhead";
import { SignatureBlock } from "../SignatureBlock";
import { rupiah, idDate, pct, terbilang } from "@/lib/format";
import { paymentLadder } from "@/lib/tax";
import type { PrintCommonData } from "@/lib/print-types";

const WORK_WEIGHTS: Array<[name: string, unit: string, pct: number]> = [
  ["Pekerjaan persiapan & mobilisasi", "ls", 3.5],
  ["Pekerjaan tanah & pondasi", "ttk", 14.0],
  ["Struktur beton bertulang", "m³", 38.5],
  ["Dinding & plesteran", "m²", 12.0],
  ["Atap & waterproofing", "m²", 7.5],
  ["Instalasi MEP kasar", "ls", 10.5],
  ["Arsitektur & finishing", "m²", 14.0],
];

export function BappDoc({ data: d, contract }: { data: PrintCommonData; contract: { value: number; dpPct: number; retensiPct: number } | null }) {
  const contractValue = contract?.value ?? d.value;
  const cumPct = 100; // this claim's cumulative progress — no per-claim progress column in the schema, shown as a full-value claim by default
  const priorPct = 0;

  const ladder = contract
    ? paymentLadder({
        contractValue, priorPct, cumPct: (d.value / contractValue) * 100, dpPct: contract.dpPct, retensiPct: contract.retensiPct,
        overdueDays: 0, tax: { rate: 0, ppn: 0, pph: 0, isFinal: false, basis: "" },
      })
    : null;

  return (
    <div className="om-sheet om-wide">
      <PrintStamp label="DRAF" color="#1b1b1b" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <PrintLetterhead ptName={d.ptName} wordmarkWidth={d.wordmarkWidth} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700 }}>DOKUMEN PEMBAYARAN (BAPP)</h1>
          <div className="om-docno">No. {d.indexNo}</div>
        </div>
        <img className="om-qr" src={d.qrDataUri} alt="QR berkas" width={46} height={46} />
      </div>
      <PrintRule />

      <div className="om-field-grid" style={{ gridTemplateColumns: "120px 1fr 120px 1fr" }}>
        <div>Proyek</div><div>: {d.projectLabel}</div>
        <div>Vendor</div><div>: {d.vendorName || "—"}</div>
        <div>Departemen</div><div>: {d.deptName}</div>
        <div>Tanggal</div><div>: {idDate(d.createdAt)}</div>
        <div>Perihal</div><div>: {d.subject}</div>
        <div>Nilai kontrak</div><div>: {contract ? rupiah(contractValue) : "tanpa kontrak terkait"}</div>
      </div>

      <table className="om-table">
        <thead>
          <tr>
            <th rowSpan={2}>Jenis Pekerjaan</th>
            <th rowSpan={2}>Sat</th>
            <th rowSpan={2} style={{ textAlign: "right" }}>Bobot</th>
            <th rowSpan={2} style={{ textAlign: "right" }}>Nilai Kontrak</th>
            <th colSpan={2}>Fisik (%)</th>
          </tr>
          <tr>
            <th style={{ textAlign: "right" }}>s/d bln lalu</th>
            <th style={{ textAlign: "right" }}>bln ini</th>
          </tr>
        </thead>
        <tbody>
          {WORK_WEIGHTS.map(([name, unit, w]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{unit}</td>
              <td className="num" style={{ textAlign: "right" }}>{pct(w, 1)}</td>
              <td className="num" style={{ textAlign: "right" }}>{rupiah((contractValue * w) / 100)}</td>
              <td className="num" style={{ textAlign: "right" }}>—</td>
              <td className="num" style={{ textAlign: "right" }}>—</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Total</td>
            <td className="num" style={{ textAlign: "right" }}>{rupiah(contractValue)}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>

      {ladder && (
        <table className="om-table">
          <thead>
            <tr><th>Perhitungan Pembayaran</th><th style={{ textAlign: "right" }}>Jumlah</th></tr>
          </thead>
          <tbody>
            <tr><td>Nilai tagihan (gross)</td><td className="num" style={{ textAlign: "right" }}>{rupiah(ladder.gross)}</td></tr>
            <tr><td>Potongan uang muka (recoupment)</td><td className="num" style={{ textAlign: "right" }}>−{rupiah(ladder.recoupDp)}</td></tr>
            <tr><td>Retensi</td><td className="num" style={{ textAlign: "right" }}>−{rupiah(ladder.retensi)}</td></tr>
            <tr><td>Denda keterlambatan</td><td className="num" style={{ textAlign: "right" }}>−{rupiah(ladder.denda)}</td></tr>
          </tbody>
          <tfoot>
            <tr><td>Netto dibayarkan</td><td className="num" style={{ textAlign: "right" }}>{rupiah(ladder.netto)}</td></tr>
          </tfoot>
        </table>
      )}

      <p style={{ fontStyle: "italic", marginBottom: 14 }}>Terbilang: {terbilang(ladder?.netto ?? d.value)}.</p>

      <SignatureBlock columns={d.signatureColumns} />
    </div>
  );
}
